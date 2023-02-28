// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./TokenSplitter.sol";
import "./interfaces/IFractionsSale.sol";

/**
 * @title TimedTokenSplitter
 * @author Lucidao Developer
 * @dev Contract used to manage the tokens used to purchase Altr fractions.
 */
contract TimedTokenSplitter is TokenSplitter {
	using SafeERC20 for IERC20;

	uint256 private constant _DENOMINATOR = 10000;
	bool private releaseStarted = false;
	/**
	 * @dev A reference to the sale contract that is being used to manage the sale of the fractions
	 */
	IFractionsSale public immutable saleContract;
	/**
	 * @dev The ID of the sale that is being managed by this contract
	 */
	uint256 public immutable saleId;
	/**
	 * @dev The address of the governance treasury that will receive the protocol fee from the sale of the fractions
	 */
	address public immutable governanceTreasury;
	/**
	 * @dev The amount of the protocol fee that will be taken from the sale of the fractions
	 */
	uint256 public immutable protocolFee;
	/**
	 * @dev The address of the seller who is selling the fractions
	 */
	address public immutable seller;
	/**
	 * @dev Emits when tokens seller is released
	 * @param seller The address of the seller
	 * @param saleContract Address of the sale contract
	 * @param saleId Identifier of the sale
	 * @param sellerAmount The amount that was released to the seller
	 */
	event TokensSellerReleased(address seller, IFractionsSale saleContract, uint256 saleId, uint256 sellerAmount);

	/**
	 * @dev Modifier that checks if the sale of the contract has closed or not
	 * If the sale is not closed, the function calling this modifier will revert with the error message "TimedTokenSplitter: sale not finished yet"
	 */
	modifier onlyIfSaleClosed() {
		require(saleContract.isSaleClosed(saleId), "TimedTokenSplitter: sale not finished yet");
		_;
	}
	/**
	 * @dev Modifier that checks if the sale of the contract has failed or not
	 * If the sale is successful, the function calling this modifier will revert with the error message "TimedTokenSplitter: sale did not fail"
	 */
	modifier onlyFailedSale() {
		require(!saleContract.isSaleSuccessful(saleId), "TimedTokenSplitter: sale did not fail");
		_;
	}
	/**
	 * @dev Modifier that checks if the sale of the contract has been successful or not
	 * If the sale is unsuccessful, the function calling this modifier will revert with the error message "TimedTokenSplitter: sale unsuccessful"
	 */
	modifier onlySuccessfulSale() {
		require(saleContract.isSaleSuccessful(saleId), "TimedTokenSplitter: sale unsuccessful");
		_;
	}

	/**
	 * @dev TimedTokenSplitter contract constructor.
	 * Initializes the contract with the sale contract address, the sale id, the token to redeem, the token that represents the fractional ownership, the token price, the governance treasury address, the protocol fee, and the seller address
	 * @param saleContract_ address of the sale contract
	 * @param saleId_ the id of the sale
	 * @param redemptionToken_ the token to redeem
	 * @param token_ the token that represents the fractional ownership
	 * @param fractionsIssued the amount of fractions issued
	 * @param governanceTreasury_ the address of the governance treasury
	 * @param protocolFee_ the percentage of fee taken from the token amount
	 * @param seller_ the address of the seller
	 */

	constructor(
		address saleContract_,
		uint256 saleId_,
		IERC20 redemptionToken_,
		IFractions token_,
		uint256 fractionsIssued,
		address governanceTreasury_,
		uint256 protocolFee_,
		address seller_
	) TokenSplitter(redemptionToken_, token_, saleId_, fractionsIssued) {
		saleContract = IFractionsSale(saleContract_);
		saleId = saleId_;
		governanceTreasury = governanceTreasury_;
		protocolFee = protocolFee_;
		seller = seller_;
	}

	/**
	 * @dev Function to release the seller's token from the contract
	 * @notice This function can only be called after the sale is closed and was successful
	 * @notice this function will transfer protocolFee/10000 of the amount to the governanceTreasury and the rest to the seller
	 */
	function releaseSeller() public onlyIfSaleClosed onlySuccessfulSale {
		uint256 amount = redemptionToken.balanceOf(address(this));
		uint256 protocolFeeAmount = (amount * protocolFee) / _DENOMINATOR;
		uint256 sellerAmount = amount - protocolFeeAmount;

		redemptionToken.safeTransfer(governanceTreasury, protocolFeeAmount);
		redemptionToken.safeTransfer(seller, sellerAmount);

		emit TokensSellerReleased(seller, saleContract, saleId, sellerAmount);
	}

	/**
	 * @dev Function to release the user's token from the contract
	 * @param users address[] calldata of the users that we want to release the token
	 * @notice This function can only be called after the sale is closed and was unsuccessful
	 */
	function release(address[] calldata users) public override(TokenSplitter) onlyIfSaleClosed onlyFailedSale {
		if (!releaseStarted) {
			releaseStarted = true;
			fractionsToBuyout = saleContract.getFractionsSale(saleId).fractionsSold;
		}
		super.release(users);
	}
}
