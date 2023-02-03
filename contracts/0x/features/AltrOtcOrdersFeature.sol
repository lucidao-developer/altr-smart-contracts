// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.6.5;
pragma experimental ABIEncoderV2;

import "@0x/contracts-zero-ex/contracts/src/features/OtcOrdersFeature.sol";

contract AltrOtcOrdersFeature is OtcOrdersFeature {
	constructor(address zeroExAddress, IEtherTokenV06 weth) public OtcOrdersFeature(zeroExAddress, weth) {}
}
