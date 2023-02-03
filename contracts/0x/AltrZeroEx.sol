// SPDX-License-Identifier: MIT
pragma solidity ^0.6.5;

import "@0x/contracts-zero-ex/contracts/src/ZeroEx.sol";

contract AltrZeroEx is ZeroEx {
	constructor(address bootstrapper) public ZeroEx(bootstrapper) {}
}
