// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IFractions.sol";

/**
 * @title TokenSplitter
 * @author Lucidao Developer
 * @dev Contract for managing tokens used to buyout Altr fractions.
 */
contract TokenSplitter {
	using SafeERC20 for IERC20;
	/**
	 * @dev The ERC-20 token that users need to provide to redeem the fractions
	 */
	IERC20 public immutable redemptionToken;
	/**
	 * @dev The fractional token that users will redeem
	 */
	IFractions public immutable token;
	/**
	 * @dev The price of each fraction token in redemption tokens
	 */
	uint256 public immutable tokenPrice;
	/**
	 * @dev The ID of the NFT that corresponds to this token redemption
	 */
	uint256 public immutable tokenId;

	/**
	 * @dev Event emitted when the tokens are released to the users
	 * @param users array of addresses of the users that receive the tokens
	 * @param redemptionToken The address of the token used for redemption
	 * @param token The address of the token contract that holds the fractions being redeemed
	 * @param tokenId The id of the token that represents the fractions being redeemed
	 * @param amounts The amounts of fractions being redeemed
	 * @param fractionsPrice The price of each fraction being redeemed
	 */
	event TokensReleased(address[] users, IERC20 indexed redemptionToken, IFractions indexed token, uint256 tokenId, uint256[] amounts, uint256 fractionsPrice);

	/**
	 * @dev Create the TokenSplitter instance and set the token instances
	 * @param redemptionToken_ The ERC20 token for redemption
	 * @param token_ The token to be split
	 * @param tokenId_ Token Id for the token to be split
	 * @param tokenPrice_ The price of the token for redemption
	 */
	constructor(IERC20 redemptionToken_, IFractions token_, uint256 tokenId_, uint256 tokenPrice_) {
		redemptionToken = redemptionToken_;
		token = token_;
		tokenId = tokenId_;
		tokenPrice = tokenPrice_;
	}

	/**
	 * @dev Release the tokens, by burning the token in token contract and transfer the redemption token to the user
	 * @param users The array of users' addresses to release the tokens to
	 */
	function release(address[] calldata users) public virtual {
		uint256[] memory amounts = new uint256[](users.length);
		uint256 fractionsPrice;
		for (uint256 i; i < users.length; i++) {
			amounts[i] = token.balanceOf(users[i], tokenId);
			fractionsPrice = tokenPrice * amounts[i];

			token.operatorBurn(users[i], tokenId, amounts[i]);
			redemptionToken.safeTransfer(users[i], fractionsPrice);
		}
		emit TokensReleased(users, redemptionToken, token, tokenId, amounts, tokenPrice);
	}
}
