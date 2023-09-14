// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface INftCollectionFullFactory {
	function create(
		string calldata name,
		string calldata symbol,
		address oracleAddress,
		address vaultManagerAddress,
		address adminAddress,
		address nftReserveAddress,
		uint256 minGracePeriod,
		uint256 insolvencyGracePeriod,
		uint256 freeVaultServicePeriod
	) external returns (address);
}
