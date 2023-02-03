//SPDX-License-Identifier: MIT
pragma solidity ^0.6.5;
pragma experimental ABIEncoderV2;

import "@0x/contracts-zero-ex/contracts/src/features/nft_orders/ERC721OrdersFeature.sol";

contract AltrERC721OrdersFeature is ERC721OrdersFeature {
	constructor(address zeroExAddress, IEtherTokenV06 weth) public ERC721OrdersFeature(zeroExAddress, weth) {}
}
