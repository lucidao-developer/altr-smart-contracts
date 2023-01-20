// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../../interfaces/INftCollectionVaultService.sol";
import "../../AltrNftCollection.sol";

contract AltrNftCollectionV2 is AltrNftCollection {
	uint256 public immutable sellDeadline;

	constructor(
		string memory name,
		string memory symbol,
		address oracleAddress,
		address vaultManagerAddress,
		address adminAddress,
		address nftReserveAddress,
		uint256 minGracePeriod,
		uint256 insolvencyGracePeriod,
		uint256 freeVaultServicePeriod,
		uint256 _sellDeadline
	)
		AltrNftCollection(
			name,
			symbol,
			oracleAddress,
			vaultManagerAddress,
			adminAddress,
			nftReserveAddress,
			minGracePeriod,
			insolvencyGracePeriod,
			freeVaultServicePeriod
		)
	{
		sellDeadline = _sellDeadline;
	}

	function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize) internal override {
		super._beforeTokenTransfer(from, to, tokenId, batchSize);
		if (hasRole(MINTER_ROLE, from)) {
			require(block.timestamp <= sellDeadline, "Sell ended");
		}
	}
}
