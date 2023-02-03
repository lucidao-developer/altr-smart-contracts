// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.6.5;
pragma experimental ABIEncoderV2;

import "@0x/contracts-zero-ex/contracts/src/features/MetaTransactionsFeature.sol";

contract AltrMetaTransactionsFeature is MetaTransactionsFeature {
	constructor(address zeroExAddress) public MetaTransactionsFeature(zeroExAddress) {}
}
