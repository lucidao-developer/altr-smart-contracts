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

/// @dev Feature for interacting with ERC721 orders.
interface IERC721OrdersFeature {
	/// @dev Sells an ERC721 asset to fill the given order.
	/// @param buyOrder The ERC721 buy order.
	/// @param signature The order signature from the maker.
	/// @param erc721TokenId The ID of the ERC721 asset being
	///        sold. If the given order specifies properties,
	///        the asset must satisfy those properties. Otherwise,
	///        it must equal the tokenId in the order.
	/// @param unwrapNativeToken If this parameter is true and the
	///        ERC20 token of the order is e.g. WETH, unwraps the
	///        token before transferring it to the taker.
	/// @param callbackData If this parameter is non-zero, invokes
	///        `zeroExERC721OrderCallback` on `msg.sender` after
	///        the ERC20 tokens have been transferred to `msg.sender`
	///        but before transferring the ERC721 asset to the buyer.
	function sellERC721(
		LibNFTOrder.ERC721Order calldata buyOrder,
		LibSignature.Signature calldata signature,
		uint256 erc721TokenId,
		bool unwrapNativeToken,
		bytes calldata callbackData
	) external;

	/// @dev Buys an ERC721 asset by filling the given order.
	/// @param sellOrder The ERC721 sell order.
	/// @param signature The order signature.
	/// @param callbackData If this parameter is non-zero, invokes
	///        `zeroExERC721OrderCallback` on `msg.sender` after
	///        the ERC721 asset has been transferred to `msg.sender`
	///        but before transferring the ERC20 tokens to the seller.
	///        Native tokens acquired during the callback can be used
	///        to fill the order.
	function buyERC721(LibNFTOrder.ERC721Order calldata sellOrder, LibSignature.Signature calldata signature, bytes calldata callbackData) external payable;

	/// @dev Buys multiple ERC721 assets by filling the
	///      given orders.
	/// @param sellOrders The ERC721 sell orders.
	/// @param signatures The order signatures.
	/// @param callbackData The data (if any) to pass to the taker
	///        callback for each order. Refer to the `callbackData`
	///        parameter to for `buyERC721`.
	/// @param revertIfIncomplete If true, reverts if this
	///        function fails to fill any individual order.
	/// @return successes An array of booleans corresponding to whether
	///         each order in `orders` was successfully filled.
	function batchBuyERC721s(
		LibNFTOrder.ERC721Order[] calldata sellOrders,
		LibSignature.Signature[] calldata signatures,
		bytes[] calldata callbackData,
		bool revertIfIncomplete
	) external payable returns (bool[] memory successes);

	/// @dev Matches a pair of complementary orders that have
	///      a non-negative spread. Each order is filled at
	///      their respective price, and the matcher receives
	///      a profit denominated in the ERC20 token.
	/// @param sellOrder Order selling an ERC721 asset.
	/// @param buyOrder Order buying an ERC721 asset.
	/// @param sellOrderSignature Signature for the sell order.
	/// @param buyOrderSignature Signature for the buy order.
	/// @return profit The amount of profit earned by the caller
	///         of this function (denominated in the ERC20 token
	///         of the matched orders).
	function matchERC721Orders(
		LibNFTOrder.ERC721Order calldata sellOrder,
		LibNFTOrder.ERC721Order calldata buyOrder,
		LibSignature.Signature calldata sellOrderSignature,
		LibSignature.Signature calldata buyOrderSignature
	) external returns (uint256 profit);

	/// @dev Matches pairs of complementary orders that have
	///      non-negative spreads. Each order is filled at
	///      their respective price, and the matcher receives
	///      a profit denominated in the ERC20 token.
	/// @param sellOrders Orders selling ERC721 assets.
	/// @param buyOrders Orders buying ERC721 assets.
	/// @param sellOrderSignatures Signatures for the sell orders.
	/// @param buyOrderSignatures Signatures for the buy orders.
	/// @return profits The amount of profit earned by the caller
	///         of this function for each pair of matched orders
	///         (denominated in the ERC20 token of the order pair).
	/// @return successes An array of booleans corresponding to
	///         whether each pair of orders was successfully matched.
	function batchMatchERC721Orders(
		LibNFTOrder.ERC721Order[] calldata sellOrders,
		LibNFTOrder.ERC721Order[] calldata buyOrders,
		LibSignature.Signature[] calldata sellOrderSignatures,
		LibSignature.Signature[] calldata buyOrderSignatures
	) external returns (uint256[] memory profits, bool[] memory successes);
}
