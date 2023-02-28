// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./interfaces/IAllowList.sol";
import "./TimedTokenSplitter.sol";
import "./interfaces/IFeeManager.sol";

/**
 * @title AltrFractionsSale
 * @author Lucidao Developer
 * @dev Contract that manages fractional ownership of ERC721/1155 tokens through sales.
 * It has a built in access control that allow only specific roles to perform certain actions.
 * It also has a built in reentrancy guard to prevent reentrancy attacks.
 * The contract also has a tiered pricing mechanism where the price limits and the corresponding fractions are set in the constructor.
 * The contract also has a mechanism for setting a protocol fee, governance treasury and a allowlist.
 * @dev The contract implements ERC721Holder and ERC1155Holder for holding ERC721 and ERC1155 token respectively
 * The contract implements Initializable to set a referece to Buyout contract only once.
 * It also implements IFractionsSale for creating and managing fractional ownership of tokens through sales.
 */
contract AltrFractionsSale is AccessControl, ReentrancyGuard, ERC721Holder, ERC1155Holder, Initializable, IFractionsSale {
	using Counters for Counters.Counter;
	using SafeERC20 for IERC20;
	using ERC165Checker for address;
	using EnumerableMap for EnumerableMap.UintToUintMap;

	bytes32 public constant SALE_ISSUER_ROLE = keccak256("SALE_ISSUER_ROLE");
	bytes32 public constant BURN_MANAGER_ROLE = keccak256("BURN_MANAGER_ROLE");
	uint256 public constant MIN_OPENING_GAP = 86400; // ONE DAY

	/**
	 * @dev The address of the AltrFractions contract instance
	 */
	IFractions public immutable altrFractions;
	/**
	 * @dev The address of the IAllowList contract instance
	 */
	IAllowList public allowList;

	/**
	 * @dev The address of the AltrFractionsBuyout contract
	 */
	address public altrFractionsBuyout;

	/**
	 * @dev The AltrFeeManager contract.
	 */
	IFeeManager public feeManager;

	Counters.Counter private _salesCounter;

	mapping(uint256 => FractionsSale) private fractionsSales;

	EnumerableMap.UintToUintMap private tiers;

	/**
	 * @dev Emitted when a new fractions sale is created
	 * @param saleId The ID of the sale
	 * @param fractionsSale The struct containing details of the Fractions sale
	 */
	event NewFractionsSale(uint256 indexed saleId, FractionsSale fractionsSale);
	/**
	 * @dev Emitted when someone purchases fractions
	 * @param saleId The ID of the sale
	 * @param beneficiary The address of the beneficiary who purchased the fractions
	 * @param fractionsAmount The amount of fractions purchased
	 */
	event FractionsPurchased(uint256 indexed saleId, address indexed beneficiary, uint256 fractionsAmount);
	/**
	 * @dev Emitted when a sale issuer withdraws fractions that were kept
	 * @param saleId The ID of the sale
	 * @param beneficiary The address of the beneficiary who withdrew the fractions
	 * @param amount The amount of fractions withdrawn
	 */
	event FractionsKeptWithdrawn(uint256 indexed saleId, address indexed beneficiary, uint256 amount);
	/**
	 * @dev Emitted when an NFT is withdrawn from a failed sale
	 * @param saleId The ID of the sale
	 * @param beneficiary The address of the beneficiary who withdrew the NFT
	 * @param nftCollection The address of the NFT collection from which the NFT was withdrawn
	 * @param nftId The ID of the withdrawn NFT
	 */
	event FailedSaleNftWithdrawn(uint256 indexed saleId, address indexed beneficiary, address indexed nftCollection, uint256 nftId);
	/**
	 * @dev Emitted when the fraction amount tiers are set
	 * @param priceLimits The array of price limits for the tiers
	 * @param fractionsAmounts The array of fractions amounts for the tiers
	 */
	event TiersSet(uint256[] priceLimits, uint256[] fractionsAmounts);
	/**
	 * @dev Emitted when the allow list is set
	 * @param allowList The address of the new allow list contract
	 */
	event AllowListSet(address allowList);
	/**
	 * @dev Emitted when the fractions buyout address is set
	 * @param fractionsBuyout The address of the new fractions buyout contract
	 */
	event FractionsBuyoutAddressSet(address fractionsBuyout);
	/**
	 * @dev Emitted when the fee manager is set
	 * @param feeManager The new fee manager contract address
	 */
	event FeeManagerSet(address feeManager);

	/**
	 * @dev Modifier that allows a function to only be executed when the sale is open
	 * @param saleId ID of the sale
	 */
	modifier onlyWhileSaleOpen(uint256 saleId) {
		require(isSaleOpen(saleId), "AltrFractionsSale: sale not open");
		_;
	}
	/**
	 * @dev Modifier that allows a function to only be executed when the sale is closed
	 * @param saleId ID of the sale
	 */
	modifier onlyIfSaleClosed(uint256 saleId) {
		require(isSaleClosed(saleId), "AltrFractionsSale: sale not finished yet");
		_;
	}

	/**
	 * @dev Constructor to initialize the AltrFractionsSale contract
	 * @param _altrFractions The address of the IFractions contract to be used in the sale
	 * @param _feeManager Address of the feeManager contract that manages the sale fee
	 * @param _allowList The address of the contract that will hold the allowlist
	 * @param _priceLimits Array of price limits for the different tiers of the sale
	 * @param _fractionsAmounts Array of fractions amounts for the different tiers of the sale
	 */
	constructor(IFractions _altrFractions, address _feeManager, address _allowList, uint256[] memory _priceLimits, uint256[] memory _fractionsAmounts) {
		require(address(_altrFractions) != address(0), "AltrFractionsSale: cannot be null address");

		altrFractions = _altrFractions;
		_setFeeManager(_feeManager);
		_setAllowList(_allowList);
		_setTiers(_priceLimits, _fractionsAmounts);

		_grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
	}

	/**
	 * @dev Creates a new fraction sale.
	 * @dev It deploys a new contract that manages the buyTokens(if the sale will succeed it will pay the seller, if not refund the buyers)
	 * @param nftCollection The ERC721 contract that holds the NFT to be sold
	 * @param nftId The ID of the NFT to be sold
	 * @param buyToken The ERC20 token that will be used to purchase fractions
	 * @param openingTime The timestamp when the sale will open
	 * @param closingTime The timestamp when the sale will close
	 * @param totalPrice The total price of the NFT being sold
	 * @param minFractionsKept The minimum number of fractions that the initiator will keep
	 * @param saleMinFractions The minimum number of fractions that must be sold for the sale to be successful
	 * @notice If the sale reach the saleMinFractions but does not run out of fractions the sale initiator can keep more fractions than the minimum
	 */
	function setupSale(
		IERC721 nftCollection,
		uint256 nftId,
		IERC20 buyToken,
		uint256 openingTime,
		uint256 closingTime,
		uint256 totalPrice,
		uint256 minFractionsKept,
		uint256 saleMinFractions
	) external nonReentrant onlyRole(SALE_ISSUER_ROLE) {
		require(closingTime > openingTime + MIN_OPENING_GAP, "AltrFractionsSale: closing time must be greater than opening time plus min opening time period");
		require(openingTime > block.timestamp, "AltrFractionsSale: opening time cannot be in the past");
		require(address(nftCollection) != address(0), "AltrFractionsSale: cannot be null address");
		require(address(buyToken) != address(0), "AltrFractionsSale: cannot be null address");
		require(totalPrice > 0, "AltrFractionsSale: fraction price must be above 0");
		require(saleMinFractions > 0, "AltrFractionsSale: sale min fractions must be above 0");

		uint256 fractionsAmount = getFractionsAmountByPrice(totalPrice);

		require(fractionsAmount > minFractionsKept, "AltrFractionsSale: cannot keep more fractions than issued");
		require(fractionsAmount >= saleMinFractions, "AltrFractionsSale: cannot sell more fractions than issued");

		uint256 currentSaleId = _salesCounter.current();

		TimedTokenSplitter buyTokenManager = new TimedTokenSplitter(
			address(this),
			currentSaleId,
			buyToken,
			altrFractions,
			0,
			feeManager.governanceTreasury(),
			feeManager.saleFee(),
			msg.sender
		);

		altrFractions.grantRole(BURN_MANAGER_ROLE, address(buyTokenManager));
		_salesCounter.increment();

		FractionsSale memory fractionsSale = FractionsSale({
			initiator: msg.sender,
			buyTokenManager: address(buyTokenManager),
			nftCollection: nftCollection,
			nftId: nftId,
			buyToken: buyToken,
			openingTime: openingTime,
			closingTime: closingTime,
			fractionPrice: totalPrice / fractionsAmount,
			fractionsAmount: fractionsAmount,
			minFractionsKept: minFractionsKept,
			fractionsSold: minFractionsKept,
			saleMinFractions: saleMinFractions
		});

		fractionsSales[currentSaleId] = fractionsSale;

		altrFractions.setClosingTimeForTokenSale(currentSaleId, closingTime);

		nftCollection.safeTransferFrom(msg.sender, address(this), nftId);
		nftCollection.setApprovalForAll(altrFractionsBuyout, true);
		altrFractions.mint(address(this), currentSaleId, fractionsAmount, "");

		emit NewFractionsSale(currentSaleId, fractionsSale);
	}

	/**
	 * @dev Allows a user to buy fractions from a sale
	 * @param saleId ID of the sale from which to buy fractions
	 * @param amount Number of fractions to buy
	 * @notice The sale must be open
	 * @notice The user's address must be allowed by the allowlist
	 * @notice There must be enough fractions available for sale
	 * @notice The user must send enough funds to cover the cost of the fractions
	 */
	function buyFractions(uint256 saleId, uint256 amount) external nonReentrant onlyWhileSaleOpen(saleId) {
		require(allowList.isAddressAllowed(msg.sender), "AltrFractionsSale: address not allowed");
		FractionsSale storage fractionsSale = fractionsSales[saleId];
		fractionsSale.fractionsSold += amount;
		require(fractionsSale.fractionsSold <= fractionsSale.fractionsAmount, "AltrFractionsSale: not enough fractions available");

		fractionsSale.buyToken.safeTransferFrom(msg.sender, fractionsSale.buyTokenManager, (amount * fractionsSale.fractionPrice));
		altrFractions.safeTransferFrom(address(this), msg.sender, saleId, amount, "");

		emit FractionsPurchased(saleId, msg.sender, amount);
	}

	/**
	 * @notice Allows the initiator of the sale to withdraw the fractions kept from the sale
	 * @dev The initiator can withdraw the fractions kept after the sale is closed and successful
	 * @param saleId ID of the sale from which the fractions kept will be withdrawn
	 */
	function withdrawFractionsKept(uint256 saleId) external onlyIfSaleClosed(saleId) {
		FractionsSale memory fractionsSale = fractionsSales[saleId];

		require(fractionsSale.initiator == msg.sender, "AltrFractionsSale: must be sale initiator");
		require(fractionsSale.fractionsSold >= fractionsSale.saleMinFractions, "AltrFractionsSale: sale unsuccessful");
		uint256 fractionsKept = altrFractions.balanceOf(address(this), saleId);
		if (fractionsKept > 0) {
			altrFractions.safeTransferFrom(address(this), msg.sender, saleId, fractionsKept, "");
		}

		emit FractionsKeptWithdrawn(saleId, msg.sender, fractionsKept);
	}

	/**
	 * @dev Allows the initiator of the sale to withdraw the NFT that was put up for sale,
	 * in case the sale was not successful and the minimum fractions were not sold.
	 * @param saleId The ID of the sale from which to withdraw the NFT.
	 */
	function withdrawFailedSaleNft(uint256 saleId) external onlyIfSaleClosed(saleId) {
		FractionsSale memory fractionsSale = fractionsSales[saleId];

		require(fractionsSale.initiator == msg.sender, "AltrFractionsSale: must be sale initiator");
		require(fractionsSale.fractionsSold < fractionsSale.saleMinFractions, "AltrFractionsSale: can't trade nft back");

		fractionsSale.nftCollection.safeTransferFrom(address(this), msg.sender, fractionsSale.nftId);

		emit FailedSaleNftWithdrawn(saleId, msg.sender, address(fractionsSale.nftCollection), fractionsSale.nftId);
	}

	/**
	 * @dev Allows the contract owner to set the allowList address.
	 * @param _allowList The new allowList address.
	 */
	function setAllowList(address _allowList) external onlyRole(DEFAULT_ADMIN_ROLE) {
		_setAllowList(_allowList);

		emit AllowListSet(_allowList);
	}

	/**
	 * @dev Allows the contract owner to set the tiers for the sale.
	 * @param priceLimits The price limits for the tiers.
	 * @param fractionsAmounts The fractions amounts for the tiers.
	 */
	function setTiers(uint256[] memory priceLimits, uint256[] memory fractionsAmounts) external onlyRole(DEFAULT_ADMIN_ROLE) {
		_setTiers(priceLimits, fractionsAmounts);

		emit TiersSet(priceLimits, fractionsAmounts);
	}

	/**
	 * @dev Function that sets the address of buyout contract for the fractions
	 * @param fractionsBuyoutAddress address of the buyout contract
	 */
	function setFractionsBuyout(address fractionsBuyoutAddress) external initializer onlyRole(DEFAULT_ADMIN_ROLE) {
		require(fractionsBuyoutAddress != address(0), "AltrFractionsSale: cannot be null address");
		altrFractionsBuyout = fractionsBuyoutAddress;

		emit FractionsBuyoutAddressSet(fractionsBuyoutAddress);
	}

	/**
	 *  @dev Sets the address of the fee manager.
	 * @param _feeManager The address of the fee manager.
	 */
	function setFeeManager(address _feeManager) external onlyRole(DEFAULT_ADMIN_ROLE) {
		_setFeeManager(_feeManager);

		emit FeeManagerSet(_feeManager);
	}

	/**
	 * @dev Function that gets the sale details of the fraction sale by its saleId
	 * @param saleId saleId of the fraction sale
	 * @return Returns the FractionsSale memory struct
	 */
	function getFractionsSale(uint256 saleId) external view returns (FractionsSale memory) {
		return fractionsSales[saleId];
	}

	/**
	 * @dev This function is called when an ERC721 token is received by the contract
	 * @param operator The address that called the function (i.e. the ERC721 smart contract)
	 * @param from The address that sent the token
	 * @param tokenId The id of the token being received
	 * @param data Additional data with the transaction
	 * @return bytes4 The function signature of the successful call
	 * @notice This function throws an error if the operator is not the contract address.
	 */
	function onERC721Received(address operator, address from, uint256 tokenId, bytes memory data) public override returns (bytes4) {
		require(operator == address(this), "AltrFractionsSale: cannot directly send ERC721 tokens");
		return super.onERC721Received(operator, from, tokenId, data);
	}

	/**
	 * @dev This function is called when an ERC1155 token is received by the contract
	 * @param operator The address that called the function (i.e. the ERC1155 smart contract)
	 * @param from The address that sent the token
	 * @param tokenId The id of the token being received
	 * @param amount The amount of tokens being received
	 * @param data Additional data with the transaction
	 * @return bytes4 The function signature of the successful call
	 * @notice This function throws an error if the operator is not the contract address.
	 */
	function onERC1155Received(address operator, address from, uint256 tokenId, uint256 amount, bytes memory data) public override returns (bytes4) {
		require(operator == address(this), "AltrFractionsSale: cannot directly send ERC1155 tokens");
		return super.onERC1155Received(operator, from, tokenId, amount, data);
	}

	/**
	 * @dev Check if a sale is closed
	 * @param saleId ID of the sale
	 * @return true if the sale is closed, otherwise false
	 */
	function isSaleClosed(uint256 saleId) public view returns (bool) {
		FractionsSale memory fractionsSale = fractionsSales[saleId];
		return block.timestamp > fractionsSale.closingTime || fractionsSale.fractionsSold == fractionsSale.fractionsAmount;
	}

	/**
	 * @dev Check if a sale is open
	 * @param saleId ID of the sale
	 * @return true if the sale is open, otherwise false
	 */

	function isSaleOpen(uint256 saleId) public view returns (bool) {
		FractionsSale memory fractionsSale = fractionsSales[saleId];
		return
			block.timestamp >= fractionsSale.openingTime &&
			block.timestamp <= fractionsSale.closingTime &&
			fractionsSale.fractionsSold < fractionsSale.fractionsAmount;
	}

	/**
	 * @dev Check if a sale is successful
	 * @param saleId ID of the sale
	 * @return true if the sale is successful, otherwise false
	 */
	function isSaleSuccessful(uint256 saleId) public view returns (bool) {
		return fractionsSales[saleId].fractionsSold >= fractionsSales[saleId].saleMinFractions;
	}

	/**
	 * @dev function to check if the contract support a given interface.
	 * @param interfaceId The interface id of the interface to check.
	 * @return true if the interface is supported, false otherwise.
	 */
	function supportsInterface(bytes4 interfaceId) public view override(AccessControl, ERC1155Receiver) returns (bool) {
		return interfaceId == type(IFractionsSale).interfaceId || super.supportsInterface(interfaceId);
	}

	/**
	 * @dev function to get the current sales counter.
	 * @return The current sales counter.
	 */
	function salesCounter() public view returns (uint256) {
		return _salesCounter.current();
	}

	/**
	 * @dev Returns the amount of fractions an nft can be divided into at a given price.
	 * @param price The price point to check the amount of fractions for.
	 * @return uint256 The amount of fractions an nft can be divided into at a given price.
	 */
	function getFractionsAmountByPrice(uint256 price) public view returns (uint256) {
		for (uint256 i = 1; i < tiers.length(); i++) {
			(uint256 lowerBound, uint256 fractionsAmount) = tiers.at(i - 1);
			(uint256 upperBound, ) = tiers.at(i);
			if (price > lowerBound && price <= upperBound) {
				return fractionsAmount;
			}
		}
		(, uint256 maxAmount) = tiers.at(tiers.length() - 1);
		return maxAmount;
	}

	/**
	 * @dev  set the address of the contract that implements the IAllowList interface as the allowlist for the current contract.
	 * @param _allowList address of the contract that implements the IAllowList interface.
	 */
	function _setAllowList(address _allowList) internal {
		require(_allowList != address(0), "AltrFractionsSale: cannot be null address");
		require(_allowList.supportsInterface(type(IAllowList).interfaceId), "AltrFractionsSale: does not support IAllowList interface");
		allowList = IAllowList(_allowList);
	}

	/**
	 * @dev sets the feeManager address. Only callable by contracts's admin role.
	 * @param _feeManager The address of the fee manager contract.
	 */
	function _setFeeManager(address _feeManager) internal {
		require(_feeManager != address(0), "AltrFractionsBuyout: cannot be null address");
		require(_feeManager.supportsInterface(type(IFeeManager).interfaceId), "AltrFractionsBuyout: does not support IFeeManager interface");

		feeManager = IFeeManager(_feeManager);
	}

	/**
	 * @dev  set the tiers for the current contract.
	 * @param priceLimits array of price limits for the tiers.
	 * @param fractionsAmounts array of fractions amounts for the tiers.
	 */
	function _setTiers(uint256[] memory priceLimits, uint256[] memory fractionsAmounts) internal {
		require(priceLimits.length == fractionsAmounts.length, "AltrFractionsSale: cannot map array of different size");
		require(priceLimits[0] == 0, "AltrFractionsSale: price limits array must start with 0");
		for (uint256 i; i < priceLimits.length; i++) {
			bool success = tiers.set(priceLimits[i], fractionsAmounts[i]);
			require(success, "AltrFractionsSale: tiers setting fails");
		}
	}
}
