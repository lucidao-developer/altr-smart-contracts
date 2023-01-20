// SPDX-License-Identifier: Apache-2.0
/*

  Copyright 2021 ZeroEx Intl.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

*/

pragma solidity ^0.8.17;

import "../libraries/LibNFTOrder.sol";
import "../libraries/LibSignature.sol";

/// @dev Feature for interacting with ERC1155 orders.
interface IERC1155OrdersFeature {
	/// @dev Sells an ERC1155 asset to fill the given order.
	/// @param buyOrder The ERC1155 buy order.
	/// @param signature The order signature from the maker.
	/// @param erc1155TokenId The ID of the ERC1155 asset being
	///        sold. If the given order specifies properties,
	///        the asset must satisfy those properties. Otherwise,
	///        it must equal the tokenId in the order.
	/// @param erc1155SellAmount The amount of the ERC1155 asset
	///        to sell.
	/// @param unwrapNativeToken If this parameter is true and the
	///        ERC20 token of the order is e.g. WETH, unwraps the
	///        token before transferring it to the taker.
	/// @param callbackData If this parameter is non-zero, invokes
	///        `zeroExERC1155OrderCallback` on `msg.sender` after
	///        the ERC20 tokens have been transferred to `msg.sender`
	///        but before transferring the ERC1155 asset to the buyer.
	function sellERC1155(
		LibNFTOrder.ERC1155Order calldata buyOrder,
		LibSignature.Signature calldata signature,
		uint256 erc1155TokenId,
		uint128 erc1155SellAmount,
		bool unwrapNativeToken,
		bytes calldata callbackData
	) external;

	/// @dev Buys an ERC1155 asset by filling the given order.
	/// @param sellOrder The ERC1155 sell order.
	/// @param signature The order signature.
	/// @param erc1155BuyAmount The amount of the ERC1155 asset
	///        to buy.
	/// @param callbackData If this parameter is non-zero, invokes
	///        `zeroExERC1155OrderCallback` on `msg.sender` after
	///        the ERC1155 asset has been transferred to `msg.sender`
	///        but before transferring the ERC20 tokens to the seller.
	///        Native tokens acquired during the callback can be used
	///        to fill the order.
	function buyERC1155(
		LibNFTOrder.ERC1155Order calldata sellOrder,
		LibSignature.Signature calldata signature,
		uint128 erc1155BuyAmount,
		bytes calldata callbackData
	) external payable;

	/// @dev Buys multiple ERC1155 assets by filling the
	///      given orders.
	/// @param sellOrders The ERC1155 sell orders.
	/// @param signatures The order signatures.
	/// @param erc1155TokenAmounts The amounts of the ERC1155 assets
	///        to buy for each order.
	/// @param callbackData The data (if any) to pass to the taker
	///        callback for each order. Refer to the `callbackData`
	///        parameter to for `buyERC1155`.
	/// @param revertIfIncomplete If true, reverts if this
	///        function fails to fill any individual order.
	/// @return successes An array of booleans corresponding to whether
	///         each order in `orders` was successfully filled.
	function batchBuyERC1155s(
		LibNFTOrder.ERC1155Order[] calldata sellOrders,
		LibSignature.Signature[] calldata signatures,
		uint128[] calldata erc1155TokenAmounts,
		bytes[] calldata callbackData,
		bool revertIfIncomplete
	) external payable returns (bool[] memory successes);
}
