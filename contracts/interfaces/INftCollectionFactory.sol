// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface INftCollectionFactory {
	function isAKnownCollection(address collectionAddress) external view returns (bool);
}
