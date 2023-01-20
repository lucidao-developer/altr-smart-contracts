// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface INftCollectionVaultService {
	function setVaultServiceDeadline(uint256 tokenId, uint256 deadline) external;

	function getVaultServiceDeadline(uint256 tokenId) external view returns (uint256 deadline);
}
