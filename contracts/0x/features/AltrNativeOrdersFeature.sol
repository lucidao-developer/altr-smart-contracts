//SPDX-License-Identifier: MIT
pragma solidity ^0.6.5;
pragma experimental ABIEncoderV2;

import "@0x/contracts-zero-ex/contracts/src/features/NativeOrdersFeature.sol";

contract AltrNativeOrdersFeature is NativeOrdersFeature {
	constructor(
		address zeroExAddress,
		IEtherTokenV06 weth,
		IStaking staking,
		FeeCollectorController feeCollectorController,
		uint32 protocolFeeMultiplier
	) public NativeOrdersFeature(zeroExAddress, weth, staking, feeCollectorController, protocolFeeMultiplier) {}
}
