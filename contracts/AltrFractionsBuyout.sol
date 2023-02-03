// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import "./TimedTokenSplitter.sol";
import "./interfaces/IFeeManager.sol";

/**
 * @title AltrFractionsBuyout
 * @author Lucidao Developer
 * @dev This contract allows for the buyout of fractional token sales on the Altr platform.
 */
contract AltrFractionsBuyout is AccessControl, ReentrancyGuard {
	using Counters for Counters.Counter;
	using SafeERC20 for IERC20;
	using ERC165Checker for address;

	/**
	 * @dev The struct for a buyout, containing the initiator, fraction sale ID, buyout token manager, buyout token, buyout price, opening and closing time, and success status
	 */
	struct Buyout {
		address initiator;
		uint256 fractionSaleId;
		address buyoutTokenManager;
		IERC20 buyoutToken;
		uint256 buyoutPrice;
		uint256 openingTime;
		uint256 closingTime;
		uint256 fractionsToBuyout;
		bool isSuccessful;
	}
	/**
	 * @dev BURN_MANAGER_ROLE is the role assigned to the address that can call the burn function
	 */
	bytes32 public constant BURN_MANAGER_ROLE = keccak256("BURN_MANAGER_ROLE");

	/**
	 * @dev The AltrFractions contract
	 */
	IFractions public immutable altrFractions;
	/**
	 * @dev The AltrFractionsSale contract
	 */
	IFractionsSale public immutable altrFractionsSale;

	/**
	 * @dev The minimum number of fractions required to initiate a buyout
	 */
	uint256 public buyoutMinFractions;

	/**
	 * @dev The AltrFeeManager contract.
	 */
	IFeeManager public feeManager;

	/**
	 * @dev The duration of the buyout open period in seconds
	 */
	uint256 public buyoutOpenTimePeriod;

	uint256 private constant _MIN_BUYOUT_OPEN_TIME_PERIOD = 86400; //ONE DAY

	uint256 private constant _MIN_FRACTIONS = 2000;
	uint256 private constant _MAX_FRACTIONS = 6000;
	uint256 private constant _DENOMINATOR = 10000;

	Counters.Counter private _buyoutsCounter;

	mapping(uint256 => Buyout) public buyouts;

	/**
	 * @dev Emitted when a buyout request is made
	 * @param saleId ID of the sale
	 * @param initiator Address of the buyout initiator
	 * @param buyoutId ID of the buyout
	 */
	event BuyoutRequested(uint256 indexed saleId, address indexed initiator, uint256 indexed buyoutId);
	/**
	 * @dev Emitted when the buyout parameters are set
	 * @param buyoutId ID of the buyout
	 * @param buyout Buyout struct containing the buyout parameters
	 */
	event BuyoutParamsSet(uint256 indexed buyoutId, Buyout buyout);
	/**
	 * @dev Emitted when a buyout is executed
	 * @param buyoutId ID of the buyout
	 * @param executor Address of the buyout executor
	 * @param boughtOutFractions Amount of fractions bought out
	 * @param buyoutAmount Amount paid for the buyout
	 */
	event BuyoutExecuted(uint256 indexed buyoutId, address indexed executor, uint256 boughtOutFractions, uint256 buyoutAmount);
	/**
	 * @dev Emitted when the minimum fractions required for a buyout is set
	 * @param buyoutMinFractions The value of the minimum fractions required for a buyout
	 */
	event BuyoutMinFractionsSet(uint256 buyoutMinFractions);
	/**
	 * @dev Emitted when the time period for a buyout to be open is set
	 * @param buyoutOpenTimePeriod The time period for a buyout to be open
	 */
	event BuyoutOpenTimePeriodSet(uint256 buyoutOpenTimePeriod);
	/**
	 * @dev Emitted when the fee manager is set
	 * @param feeManager The new fee manager contract address
	 */
	event FeeManagerSet(address feeManager);

	/**
	 * @dev Rejects calls if the specified sale is not closed yet
	 * @param saleId The sale to check
	 */
	modifier onlyIfSaleClosed(uint256 saleId) {
		require(altrFractionsSale.isSaleClosed(saleId), "AltrFractionsBuyout: sale not finished yet");
		_;
	}
	/**
	 * @dev Rejects calls if the specified buyout has already started
	 * @param buyoutId The buyout to check
	 */
	modifier onlyBeforeBuyoutOpen(uint256 buyoutId) {
		require(isBeforeBuyoutOpen(buyoutId), "AltrFractionsBuyout: buyout already started");
		_;
	}
	/**
	 * @dev Rejects calls if the specified buyout is not open yet
	 * @param buyoutId The buyout to check
	 */
	modifier onlyWhileBuyoutOpen(uint256 buyoutId) {
		require(isBuyoutOpen(buyoutId), "AltrFractionsBuyout: buyout not open");
		_;
	}

	/**
	 * @dev Constructor function to initialize the AltrFractionsBuyout contract
	 * @param _altrFractions Address of the IFractions contract that holds the token fractions
	 * @param _altrFractionsSale Address of the IFractionsSale contract that holds the information of the fractions sale
	 * @param _feeManager Address of the feeManager contract that manages the buyout fee
	 * @param _buyoutMinFractions Minimum fractions required for a sale to be boughtOut
	 * @param _buyoutOpenTimePeriod Time duration for the buyout to be open
	 */
	constructor(IFractions _altrFractions, IFractionsSale _altrFractionsSale, address _feeManager, uint256 _buyoutMinFractions, uint256 _buyoutOpenTimePeriod) {
		require(address(_altrFractions) != address(0) && address(_altrFractionsSale) != address(0), "AltrFractionsBuyout: cannot be null address");

		altrFractions = _altrFractions;
		altrFractionsSale = _altrFractionsSale;
		_setBuyoutMinFractions(_buyoutMinFractions);
		_setBuyoutOpenTimePeriod(_buyoutOpenTimePeriod);
		_setFeeManager(_feeManager);

		_grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
	}

	/**
	 * @dev Initiates a buyout request for a sale
	 * @param saleId The sale to be boughtOut
	 */
	function requestBuyout(uint256 saleId) external nonReentrant onlyIfSaleClosed(saleId) {
		IFractionsSale.FractionsSale memory fractionsSale = altrFractionsSale.getFractionsSale(saleId);
		require(fractionsSale.fractionsSold >= fractionsSale.saleMinFractions, "AltrFractionsBuyout: sale unsuccessful");
		require(canDoBuyout(msg.sender, saleId), "AltrFractionsBuyout: not enough fractions");

		uint256 currentBuyoutId = _buyoutsCounter.current();
		_buyoutsCounter.increment();

		buyouts[currentBuyoutId] = Buyout({
			initiator: msg.sender,
			fractionSaleId: saleId,
			buyoutTokenManager: address(0),
			buyoutToken: fractionsSale.buyToken,
			buyoutPrice: 0,
			openingTime: 0,
			closingTime: 0,
			fractionsToBuyout: 0,
			isSuccessful: false
		});

		emit BuyoutRequested(saleId, msg.sender, currentBuyoutId);
	}

	/**
	 * @dev Sets the parameters for a buyout request
	 * @param buyoutId The buyout to set the parameters for
	 * @param buyoutPrice The price for buyout the tokens
	 */
	function setBuyoutParams(uint256 buyoutId, uint256 buyoutPrice) external onlyRole(DEFAULT_ADMIN_ROLE) onlyBeforeBuyoutOpen(buyoutId) {
		require(_buyoutsCounter.current() > buyoutId, "AltrFractionsBuyout: invalid buyout id");
		Buyout storage buyout = buyouts[buyoutId];
		buyout.openingTime = block.timestamp;
		buyout.closingTime = block.timestamp + buyoutOpenTimePeriod;
		buyout.buyoutPrice = buyoutPrice;

		emit BuyoutParamsSet(buyoutId, buyout);
	}

	/**
	 * @dev Executes a buyout request for 100% fractions holder
	 * @param saleId The ID of the sale to buyout
	 * @notice Only 100% fractions holder can execute this function
	 */
	function buyoutUnsupervised(uint256 saleId) external nonReentrant onlyIfSaleClosed(saleId) {
		IFractionsSale.FractionsSale memory fractionsSale = altrFractionsSale.getFractionsSale(saleId);
		uint256 fractionsBalance = altrFractions.balanceOf(msg.sender, saleId);
		require(fractionsBalance == fractionsSale.fractionsSold, "AltrFractionsBuyout: not enough fractions");
		require(fractionsSale.fractionsSold >= fractionsSale.saleMinFractions, "AltrFractionsBuyout: sale unsuccessful");

		uint256 currentBuyoutId = _buyoutsCounter.current();
		_buyoutsCounter.increment();

		buyouts[currentBuyoutId] = Buyout({
			initiator: msg.sender,
			fractionSaleId: saleId,
			buyoutTokenManager: address(0),
			buyoutToken: fractionsSale.buyToken,
			buyoutPrice: 0,
			openingTime: block.timestamp,
			closingTime: block.timestamp,
			fractionsToBuyout: 0,
			isSuccessful: true
		});

		altrFractions.burn(msg.sender, saleId, fractionsBalance);
		altrFractions.setBuyoutStatus(saleId);

		fractionsSale.nftCollection.approve(msg.sender, fractionsSale.nftId);

		uint256 firstSalePrice = fractionsSale.fractionPrice * fractionsSale.fractionsAmount;

		feeManager.setSaleInfo(address(fractionsSale.nftCollection), fractionsSale.nftId, address(fractionsSale.buyToken), firstSalePrice);

		emit BuyoutExecuted(currentBuyoutId, msg.sender, fractionsBalance, 0);
	}

	/**
	 * @dev Executes a buyout request
	 * @param buyoutId The buyout to be executed
	 * @notice This function can only be executed after a buyout has been requested and the buyout params have been set
	 */
	function executeBuyout(uint256 buyoutId) external onlyWhileBuyoutOpen(buyoutId) {
		Buyout storage buyout = buyouts[buyoutId];
		require(buyout.initiator == msg.sender, "AltrFractionsBuyout: must be buyout initiator");

		IFractionsSale.FractionsSale memory fractionsSale = altrFractionsSale.getFractionsSale(buyout.fractionSaleId);
		uint256 fractionsBalance = altrFractions.balanceOf(msg.sender, buyout.fractionSaleId);

		require(canDoBuyout(msg.sender, buyout.fractionSaleId), "AltrFractionsBuyout: not enough fractions");

		uint256 fractionsToBuyout = fractionsSale.fractionsSold - fractionsBalance;
		uint256 buyoutAmount = buyout.buyoutPrice * fractionsToBuyout;
		uint256 protocolFeeAmount = (buyoutAmount * feeManager.buyoutFee()) / _DENOMINATOR;

		buyout.fractionsToBuyout = fractionsToBuyout;
		buyout.isSuccessful = true;

		altrFractions.burn(msg.sender, buyout.fractionSaleId, fractionsBalance);
		altrFractions.setBuyoutStatus(buyout.fractionSaleId);

		address buyoutTokenManager = address(new TokenSplitter(buyout.buyoutToken, altrFractions, buyout.fractionSaleId, fractionsToBuyout));
		buyout.buyoutTokenManager = buyoutTokenManager;

		buyout.buyoutToken.safeTransferFrom(msg.sender, feeManager.governanceTreasury(), protocolFeeAmount);
		buyout.buyoutToken.safeTransferFrom(msg.sender, buyoutTokenManager, buyoutAmount);

		altrFractions.grantRole(BURN_MANAGER_ROLE, buyoutTokenManager);
		fractionsSale.nftCollection.approve(msg.sender, fractionsSale.nftId);

		uint256 firstSalePrice = fractionsSale.fractionPrice * fractionsSale.fractionsAmount;

		feeManager.setSaleInfo(address(fractionsSale.nftCollection), fractionsSale.nftId, address(fractionsSale.buyToken), firstSalePrice);

		emit BuyoutExecuted(buyoutId, msg.sender, fractionsBalance, buyoutAmount);
	}

	/**
	 * @dev Set the minimum number of fractions required to initiate a buyout
	 * @param _buyoutMinFractions The minimum number of fractions required for buyout
	 */
	function setBuyoutMinFractions(uint256 _buyoutMinFractions) external onlyRole(DEFAULT_ADMIN_ROLE) {
		_setBuyoutMinFractions(_buyoutMinFractions);

		emit BuyoutMinFractionsSet(_buyoutMinFractions);
	}

	/**
	 * @dev Sets the time period for buyout to be open
	 * @param _buyoutOpenTimePeriod The new time period for buyout to be open
	 */
	function setBuyoutOpenTimePeriod(uint256 _buyoutOpenTimePeriod) external onlyRole(DEFAULT_ADMIN_ROLE) {
		_setBuyoutOpenTimePeriod(_buyoutOpenTimePeriod);

		emit BuyoutOpenTimePeriodSet(_buyoutOpenTimePeriod);
	}

	/**
	 *  @dev Sets the address of the fee manager
	 * @param _feeManager The address of the fee manager
	 */
	function setFeeManager(address _feeManager) external onlyRole(DEFAULT_ADMIN_ROLE) {
		_setFeeManager(_feeManager);

		emit FeeManagerSet(_feeManager);
	}

	/**
	 * @dev Returns true if the buyout has not yet started
	 * @param buyoutId The id of the buyout
	 * @return true if the buyout has not yet started, otherwise false
	 */
	function isBeforeBuyoutOpen(uint256 buyoutId) public view returns (bool) {
		return buyouts[buyoutId].openingTime == 0;
	}

	/**
	 * @dev Check if the buyout with the given id is still open
	 * @param buyoutId The id of the buyout to check
	 * @return true if the buyout is open, false otherwise
	 */
	function isBuyoutOpen(uint256 buyoutId) public view returns (bool) {
		Buyout memory buyout = buyouts[buyoutId];
		return block.timestamp >= buyout.openingTime && block.timestamp <= buyout.closingTime && !buyout.isSuccessful;
	}

	/**
	 * @dev Check whether the contract implements a specific interface
	 * @param interfaceId The interface identifier, as a 4-byte value
	 * @return true if the contract implements the interface, false otherwise
	 */
	function supportsInterface(bytes4 interfaceId) public view override(AccessControl) returns (bool) {
		return super.supportsInterface(interfaceId);
	}

	/**
	 * @dev Determine if the buyout initiator has enough fractions to perform a buyout
	 * @param buyoutInitiator the address of the buyout initiator
	 * @param saleId the ID of the sale
	 * @return boolean indicating if the buyout initiator can do a buyout
	 */
	function canDoBuyout(address buyoutInitiator, uint256 saleId) public view returns (bool) {
		uint256 fractionsSold = altrFractionsSale.getFractionsSale(saleId).fractionsSold;
		uint256 minFractionsAmount = fractionsSold - ((fractionsSold * buyoutMinFractions) / _DENOMINATOR);
		uint256 fractionsBalance = altrFractions.balanceOf(buyoutInitiator, saleId);
		return fractionsBalance > minFractionsAmount;
	}

	/**
	 * @dev returns the current number of buyouts
	 * @return uint256 current number of buyouts
	 */
	function buyoutsCounter() public view returns (uint256) {
		return _buyoutsCounter.current();
	}

	/**
	 * @dev sets the minimum number of fractions required for buyout
	 *@param _buyoutMinFractions The minimum number of fractions that can be bought out
	 */
	function _setBuyoutMinFractions(uint256 _buyoutMinFractions) internal {
		require(_buyoutMinFractions >= _MIN_FRACTIONS && _buyoutMinFractions <= _MAX_FRACTIONS, "AltrFractionsBuyout: buyout min fractions exceed boundaries");

		buyoutMinFractions = _buyoutMinFractions;
	}

	/**
	 * @dev sets the feeManager address. Only callable by contracts's admin role
	 * @param _feeManager The address of the fee manager contract
	 */
	function _setFeeManager(address _feeManager) internal {
		require(_feeManager != address(0), "AltrFractionsBuyout: cannot be null address");
		require(_feeManager.supportsInterface(type(IFeeManager).interfaceId), "AltrFractionsBuyout: does not support IFeeManager interface");

		feeManager = IFeeManager(_feeManager);
	}

	/**
	 * @dev sets the time period during which a buyout can be executed
	 * @param _buyoutOpenTimePeriod The time period during which a buyout can be executed
	 */
	function _setBuyoutOpenTimePeriod(uint256 _buyoutOpenTimePeriod) internal {
		require(_buyoutOpenTimePeriod > _MIN_BUYOUT_OPEN_TIME_PERIOD, "AltrFractionsBuyout: open time period cannot be less than minimum");

		buyoutOpenTimePeriod = _buyoutOpenTimePeriod;
	}
}
