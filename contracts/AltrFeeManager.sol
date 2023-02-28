// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165CheckerUpgradeable.sol";
import "./interfaces/IFeeManager.sol";
import "./interfaces/ILicenseManager.sol";

/**
 * @title AltrFeeManager
 * @author Lucidao Developer
 * @dev This contract facilitates management of fees for all the taxed processes of the Altr protocol.
 */
contract AltrFeeManager is AccessControlUpgradeable, IFeeManager {
	using SafeERC20Upgradeable for IERC20Upgradeable;
	using ERC165CheckerUpgradeable for address;

	struct SaleInfo {
		bool isRedemptionFeePaid;
		uint256 firstSalePrice;
		address redemptionFeeTokenAddress;
	}

	bytes4 private constant FEE_CALLBACK_MAGIC_BYTES = this.receiveZeroExFeeCallback.selector;
	uint256 private constant _MIN_FEE = 50;
	uint256 private constant _MAX_FEE = 1000;
	uint256 private constant _DENOMINATOR = 10000;

	bytes32 public constant TRADE_CHECKER_ROLE = keccak256("TRADE_CHECKER_ROLE");
	/**
	 * @dev The MAX_REDEMPTION_FEE is a constant variable that holds the maximum fee that can be charged for redemption of the physical assets represented by the NFTs
	 */
	uint256 public constant MAX_REDEMPTION_FEE = 1000;

	/**
	 * @dev The userDiscount mapping allows an owner to specify a discount for certain users when they redeem an NFT
	 */
	mapping(address => bool) public userDiscount;
	/**
	 * @dev The salesInfo mapping stores the information needed for every nft saled by our platform
	 */
	mapping(address => mapping(uint256 => SaleInfo)) public salesInfo;

	/**
	 * @dev The governanceTreasury variable holds the address of the Lucidao governance treasury
	 */
	address public governanceTreasury;
	/**
	 * @dev The licenseManager variable holds the address of the license manager contract
	 */
	address public licenseManager;
	/**
	 * @dev The redemptionFee variable holds the percentage of the first sale price to be paid as fee that is charged for redemption of the physical assets represented by the NFTs.
	 */
	uint256 public redemptionFee;
	/**
	 * @dev The protocol fee for fractions buyouts
	 */
	uint256 public buyoutFee;
	/**
	 * @dev The protocol fee for fractions sales
	 */
	uint256 public saleFee;
	/**
	 * @dev The FeeReceived event is emitted when a fee is received
	 * @param tokenAddress The address of the token that the fee was paid with
	 * @param amount The amount of the fee
	 * @param feeData Additional data about the fee
	 */
	event FeeReceived(address indexed tokenAddress, uint256 amount, bytes feeData);
	/**
	 * @dev The RebateReceived event is emitted when a rebate is received by a user
	 * @param receiver The address of the user that received the rebate
	 * @param tokenAddress The address of the token that the rebate was paid with
	 * @param amount The amount of the rebate
	 * @param feeData Additional data about the rebate
	 */
	event RebateReceived(address indexed receiver, address indexed tokenAddress, uint256 amount, bytes feeData);
	/**
	 * @dev The GovernanceTreasuryChanged event is emitted when the governance treasury address is changed
	 * @param governanceTreasury The new address of the governance treasury
	 */
	event GovernanceTreasuryChanged(address indexed governanceTreasury);
	/**
	 * @dev The LicenseManagerChanged event is emitted when the license manager address is changed
	 * @param licenseManager The new address of the license manager contract
	 */
	event LicenseManagerChanged(address indexed licenseManager);
	/**
	 * @dev The RedemptionFeePaid event is emitted when a redemption fee is paid for a specific NFT
	 * @param nftCollection The address of the NFT collection that the NFT belongs to
	 * @param tokenId The ID of the NFT for which the redemption fee was paid
	 * @param sender The address of the user that paid the redemption fee
	 * @param fee The amount of the redemption fee
	 */
	event RedemptionFeePaid(address indexed nftCollection, uint256 indexed tokenId, address indexed sender, uint256 fee);
	/**
	 * @dev The RedemptionFeeSet event is emitted when the redemption fee is set
	 * @param redemptionFee The new redemption fee amount
	 */
	event RedemptionFeeSet(uint256 redemptionFee);
	/**
	 * @dev The SaleInfoSet event is emitted when the sale info is set
	 * @param redemptionFeeTokenAddress The new redemption fee token address
	 * @param nftCollection The address of the nft collection contract
	 * @param tokenId The token id of the nft collection
	 * @param price The price of the first sale of the token
	 */
	event SaleInfoSet(address indexed nftCollection, uint256 indexed tokenId, address indexed redemptionFeeTokenAddress, uint256 price);
	/**
	 * @dev Emitted when the fractions buyout fee is set
	 * @param buyoutFee The new fractions buyout fee
	 */
	event BuyoutFeeSet(uint256 buyoutFee);
	/**
	 * @dev Emitted when the fractions sale fee is set
	 * @param saleFee The new fractions sale fee
	 */
	event SaleFeeSet(uint256 saleFee);
	/**
	 * @dev check that fee is included in boundaries
	 * @param fee The fee to check
	 */
	modifier feeChecker(uint256 fee) {
		require(fee >= _MIN_FEE && fee <= _MAX_FEE, "AltrFeeManager: protocol fee exceeds boundaries");
		_;
	}

	/**
	 * @dev The constructor initializes the contract and sets the initial values for some of the variables
	 */
	/// @custom:oz-upgrades-unsafe-allow constructor
	constructor() {
		_disableInitializers();
	}

	/**
	 * @dev The receiveZeroExFeeCallback function handles the callback from 0x protocol
	 *  when the order is filled and fees are paid.
	 * @param tokenAddress The address of the token that the fee was paid with
	 * @param amount The amount of the fee
	 * @param feeData Additional data about the fee
	 * @return success bytes4
	 */
	function receiveZeroExFeeCallback(address tokenAddress, uint256 amount, bytes calldata feeData) external override returns (bytes4 success) {
		uint256 finalAmount = amount;
		uint256 discount = ILicenseManager(licenseManager).getDiscount(tx.origin);

		if (discount > 0) {
			uint256 rebateAmount = (amount * discount) / 10000;
			finalAmount = amount - rebateAmount;
			IERC20Upgradeable(tokenAddress).safeTransfer(tx.origin, rebateAmount);

			emit RebateReceived(tx.origin, tokenAddress, rebateAmount, feeData);
		}

		IERC20Upgradeable(tokenAddress).safeTransfer(governanceTreasury, finalAmount);
		emit FeeReceived(tokenAddress, finalAmount, feeData);

		return FEE_CALLBACK_MAGIC_BYTES;
	}

	/**
	 * @dev The setGovernanceTreasury function allows the owner to set the governance treasury address
	 * @param governanceTreasury_ The new governance treasury address
	 */
	function setGovernanceTreasury(address governanceTreasury_) external onlyRole(DEFAULT_ADMIN_ROLE) {
		_setGovernanceTreasury(governanceTreasury_);
		emit GovernanceTreasuryChanged(governanceTreasury_);
	}

	/**
	 * @dev The setLicenseManager function allows the owner to set the address of the license manager contract
	 * @param licenseManager_ The new address of the license manager contract
	 */
	function setLicenseManager(address licenseManager_) external onlyRole(DEFAULT_ADMIN_ROLE) {
		_setLicenseManager(licenseManager_);
		emit LicenseManagerChanged(licenseManager_);
	}

	/**
	 * @dev The setRedemptionFee function allows the owner to set the amount of the redemption fee
	 * @param redemptionFee_ The new amount of the redemption fee
	 */
	function setRedemptionFee(uint256 redemptionFee_) external onlyRole(DEFAULT_ADMIN_ROLE) {
		_setRedemptionFee(redemptionFee_);
		emit RedemptionFeeSet(redemptionFee_);
	}

	/**
	 * @dev The setRedemptionFeeTokenAddress function allows the sale contract to set the address of the token that will be used to pay the redemption fee
	 * @param redemptionFeeTokenAddress The new address of the redemption fee token
	 * @param nftCollection The address of the nft collection contract
	 * @param tokenId The token id of the nft collection
	 * @param price The first price of sale
	 */
	function setSaleInfo(address nftCollection, uint256 tokenId, address redemptionFeeTokenAddress, uint256 price) external onlyRole(TRADE_CHECKER_ROLE) {
		SaleInfo storage saleInfo = salesInfo[nftCollection][tokenId];
		require(saleInfo.redemptionFeeTokenAddress == address(0), "AltrFeeManager: redempiton fee token address already set");
		require(saleInfo.firstSalePrice == 0, "AltrFeeManager: first sale price already set");

		_setRedemptionFeeTokenAddress(nftCollection, tokenId, redemptionFeeTokenAddress);
		saleInfo.firstSalePrice = price;
		emit SaleInfoSet(nftCollection, tokenId, redemptionFeeTokenAddress, price);
	}

	/**
	 * @dev The payRedemptionFee function allows a user to pay the redemption fee for a specific NFT
	 * @param nftCollection The address of the NFT collection that the NFT belongs to
	 * @param tokenId The ID of the NFT for which the redemption fee is being paid
	 */
	function payRedemptionFee(address nftCollection, uint256 tokenId) external {
		salesInfo[nftCollection][tokenId].isRedemptionFeePaid = true;

		address redemptionFeeToken = salesInfo[nftCollection][tokenId].redemptionFeeTokenAddress;
		uint256 feeAmount = (salesInfo[nftCollection][tokenId].firstSalePrice * redemptionFee) / _DENOMINATOR;

		emit FeeReceived(redemptionFeeToken, feeAmount, "0x");
		emit RedemptionFeePaid(nftCollection, tokenId, msg.sender, feeAmount);

		IERC20Upgradeable(redemptionFeeToken).safeTransferFrom(msg.sender, governanceTreasury, feeAmount);
	}

	/**
	 * @dev Allows an admin to set the protocol fee for the buyout of fractions
	 * @param _buyoutFee The new protocol fee
	 */
	function setBuyoutFee(uint256 _buyoutFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
		_setBuyoutFee(_buyoutFee);

		emit BuyoutFeeSet(_buyoutFee);
	}

	/**
	 * @dev Allows an admin to set the protocol fee for the sale of fractions
	 * @param _saleFee The new protocol fee
	 */
	function setSaleFee(uint256 _saleFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
		_setSaleFee(_saleFee);

		emit SaleFeeSet(_saleFee);
	}

	/**
	 * @dev The initialize function allows the contract owner to set the governance treasury address, license manager address and redemption fee
	 * @param governanceTreasury_ The address of the governance treasury
	 * @param licenseManager_ The address of the license manager contract
	 * @param redemptionFee_ The amount of the redemption fee
	 */
	function initialize(
		address governanceTreasury_,
		address licenseManager_,
		uint256 redemptionFee_,
		uint256 buyoutFee_,
		uint256 saleFee_
	) external initializer {
		__AltrFeeManager_init(governanceTreasury_, licenseManager_, redemptionFee_, buyoutFee_, saleFee_);
	}

	/**
	 * @dev The isRedemptionFeePaid function returns whether or not the redemption fee has been paid for a specific NFT
	 * @param nftCollection The address of the NFT collection that the NFT belongs to
	 * @param tokenId The ID of the NFT for which the fee status is being checked
	 * @return feePaid A boolean indicating whether or not the redemption fee has been paid for the specified NFT
	 */
	function isRedemptionFeePaid(address nftCollection, uint256 tokenId) external view returns (bool feePaid) {
		if (redemptionFee == 0) {
			return true;
		}
		return salesInfo[nftCollection][tokenId].isRedemptionFeePaid;
	}

	/**
	 * @dev The supportsInterface function allows to check if this contract implement a specific interface.
	 * @param interfaceId the interfaceId to check
	 * @return bool a boolean indicating whether this contract implement the specified interfaceId
	 */
	function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
		return interfaceId == type(IFeeManager).interfaceId || super.supportsInterface(interfaceId);
	}

	/**
	 * @dev The _setGovernanceTreasury function allows to set the governanceTreasury address
	 * @param governanceTreasury_ The new governanceTreasury address
	 */
	function _setGovernanceTreasury(address governanceTreasury_) internal {
		require(governanceTreasury_ != address(0), "AltrFeeManager: cannot be null address");
		governanceTreasury = governanceTreasury_;
	}

	/**
	 * @dev The _setLicenseManager function allows to set the licenseManager address
	 * @param licenseManager_ The new licenseManager address
	 */
	function _setLicenseManager(address licenseManager_) internal {
		require(licenseManager_ != address(0), "AltrFeeManager: cannot be null address");
		require(licenseManager_.supportsInterface(type(ILicenseManager).interfaceId), "AltrFeeManager: does not support ILicenseManager interface");
		licenseManager = licenseManager_;
	}

	/**
	 * @dev The _setRedemptionFee function allows to set the redemptionFee
	 * @param redemptionFee_ The new redemptionFee
	 */
	function _setRedemptionFee(uint256 redemptionFee_) internal {
		require(redemptionFee_ <= MAX_REDEMPTION_FEE, "AltrFeeManager: redemption fee too high");
		redemptionFee = redemptionFee_;
	}

	/**
	 * @dev The _setRedemptionFeeTokenAddress function allows to set the redemptionFeeTokenAddress
	 * @param redemptionFeeTokenAddress_ The new redemptionFeeTokenAddress
	 * @param nftCollection The address of the nft collection contract
	 * @param tokenId The token id of the nft collection
	 */
	function _setRedemptionFeeTokenAddress(address nftCollection, uint256 tokenId, address redemptionFeeTokenAddress_) internal {
		require(redemptionFeeTokenAddress_ != address(0), "AltrFeeManager: cannot be null address");
		salesInfo[nftCollection][tokenId].redemptionFeeTokenAddress = redemptionFeeTokenAddress_;
	}

	function __AltrFeeManager_init(
		address governanceTreasury_,
		address licenseManager_,
		uint256 redemptionFee_,
		uint256 buyoutFee_,
		uint256 saleFee_
	) internal onlyInitializing {
		_setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
		__AltrFeeManager_init_unchained(governanceTreasury_, licenseManager_, redemptionFee_, buyoutFee_, saleFee_);
	}

	function __AltrFeeManager_init_unchained(
		address governanceTreasury_,
		address licenseManager_,
		uint256 redemptionFee_,
		uint256 buyoutFee_,
		uint256 saleFee_
	) internal onlyInitializing {
		_setGovernanceTreasury(governanceTreasury_);
		_setLicenseManager(licenseManager_);
		_setRedemptionFee(redemptionFee_);
		_setBuyoutFee(buyoutFee_);
		_setSaleFee(saleFee_);
	}

	/**
	 * @dev Sets the protocol fee for the buyout of fractions
	 * @param _buyoutFee The new protocol fee for the buyout of fractions
	 */
	function _setBuyoutFee(uint256 _buyoutFee) internal feeChecker(_buyoutFee) {
		buyoutFee = _buyoutFee;
	}

	/**
	 * @dev Sets the protocol fee for the sale of fractions
	 * @param _saleFee The new protocol fee for the sale of fractions
	 */
	function _setSaleFee(uint256 _saleFee) internal feeChecker(_saleFee) {
		saleFee = _saleFee;
	}
}
