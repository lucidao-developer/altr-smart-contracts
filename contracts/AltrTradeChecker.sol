// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import "./libraries/LibNFTOrder.sol";
import "./libraries/LibSignature.sol";
import "./interfaces/IZeroEx.sol";
import "./interfaces/IAllowList.sol";
import "./interfaces/IFeeManager.sol";

/**
 * @title AltrTradeChecker
 * @author Lucidao Developer
 * @dev Contract that acts as a trade checker for initial ERC721 token sales on 0x. It verifies that the buyer is in the Altr allowlist
 * before allowing the trade to proceed.
 */
contract AltrTradeChecker is ERC721Holder {
	using ERC165Checker for address;

	/**
	 * @dev variable to store the address of the IZeroEx smart contract
	 */
	IZeroEx public immutable zeroExContract;

	/**
	 * @dev variable to store the address of the IAllowList smart contract
	 */
	IAllowList public immutable allowList;

	/**
	 * @dev
	 */
	IFeeManager public immutable feeManager;

	/**
	 * @dev Modifier that only allows allowlisted addresses to execute a function.
	 */

	modifier onlyAllowListed() {
		require(allowList.isAddressAllowed(msg.sender), "AltrTradeChecker: address not allowed");
		_;
	}

	/**
	 * @dev Constructor function that initializes the AltrTradeChecker contract
	 * @param _zeroExContract Address of the 0x contract to interact with
	 * @param _allowList Address of the contract that manages the Altr allowlist
	 */

	constructor(address payable _zeroExContract, address _allowList, address _feeManager) {
		require(_zeroExContract != address(0) && _allowList != address(0), "AltrTradeChecker: cannot be null address");
		require(_allowList.supportsInterface(type(IAllowList).interfaceId), "AltrTradeChecker: does not support IAllowList interface");
		require(_feeManager.supportsInterface(type(IFeeManager).interfaceId), "AltrTradeChecker: does not support IFeeManager interface");

		allowList = IAllowList(_allowList);
		zeroExContract = IZeroEx(_zeroExContract);
		feeManager = IFeeManager(_feeManager);
	}

	/**
	 * @dev Allows the caller to buy an ERC721 token from a 0x sell order
	 * @param sellOrder The sell order
	 * @param signature Signature of the sell order, signed by the seller
	 * @param callbackData Data to pass through to the trade execution callback
	 */

	function buyERC721(
		LibNFTOrder.ERC721Order calldata sellOrder,
		LibSignature.Signature calldata signature,
		bytes calldata callbackData
	) external payable onlyAllowListed {
		feeManager.setSaleInfo(address(sellOrder.erc721Token), sellOrder.erc721TokenId, address(sellOrder.erc20Token), sellOrder.erc20TokenAmount);
		sellOrder.erc20Token.transferFrom(msg.sender, address(this), sellOrder.erc20TokenAmount);
		sellOrder.erc20Token.approve(address(zeroExContract), sellOrder.erc20TokenAmount);
		zeroExContract.buyERC721(sellOrder, signature, callbackData);
		sellOrder.erc721Token.safeTransferFrom(address(this), msg.sender, sellOrder.erc721TokenId);
	}
}
