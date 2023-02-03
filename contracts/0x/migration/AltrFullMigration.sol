// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.6.5;
pragma experimental ABIEncoderV2;

import "@0x/contracts-zero-ex/contracts/src/migrations/FullMigration.sol";

contract AltrFullMigration is FullMigration {
	constructor(address payable initializeCaller_) public FullMigration(initializeCaller_) {}
}
