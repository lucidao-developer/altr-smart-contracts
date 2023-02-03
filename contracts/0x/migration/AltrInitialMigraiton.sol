// SPDX-License-Identifier: MIT
pragma solidity ^0.6.5;
pragma experimental ABIEncoderV2;

import "@0x/contracts-zero-ex/contracts/src/migrations/InitialMigration.sol";

contract AltrInitialMigration is InitialMigration {
	constructor(address initializeCaller_) public InitialMigration(initializeCaller_) {}
}
