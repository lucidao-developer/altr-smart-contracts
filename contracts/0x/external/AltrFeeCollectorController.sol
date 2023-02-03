pragma solidity ^0.6.5;

import "@0x/contracts-zero-ex/contracts/src/external/FeeCollectorController.sol";

contract AltrFeeCollectorController is FeeCollectorController {
	constructor(IEtherTokenV06 weth, IStaking staking) public FeeCollectorController(weth, staking) {}
}
