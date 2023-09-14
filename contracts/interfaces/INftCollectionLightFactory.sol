// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface INftCollectionLightFactory {
	function create(string calldata name, string calldata symbol, address oracle, address admin) external returns (address);
}
