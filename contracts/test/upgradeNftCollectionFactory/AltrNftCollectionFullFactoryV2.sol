// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "./AltrNftCollectionV2.sol";
import "../../interfaces/INftCollectionFullFactory.sol";

/**
 * @title AltrNftCollectionFullFactory
 * @notice Factory contract for creating full-feature AltrNftCollection contracts
 * @dev Inherits from INftCollectionFullFactory and ERC165 for interface support checks
 */
contract AltrNftCollectionFullFactoryV2 is INftCollectionFullFactory, ERC165, Ownable {
	/**
	 * @notice Creates a new AltrNftCollection contract with specified parameters
	 * @dev This function deploys a new AltrNftCollection contract and returns its address
	 * @param name The name of the new NFT collection
	 * @param symbol The symbol of the new NFT collection
	 * @param oracleAddress Address of the oracle for the new NFT collection
	 * @param vaultManagerAddress Address of the vault manager for the new NFT collection
	 * @param adminAddress Address to set as the admin of the new NFT collection
	 * @param nftReserveAddress Address of the NFT reserve for the new NFT collection
	 * @param minGracePeriod Minimum grace period for the new NFT collection in seconds
	 * @param insolvencyGracePeriod Insolvency grace period for the new NFT collection in seconds
	 * @param freeVaultServicePeriod Free vault service period for the new NFT collection in seconds
	 * @return The address of the newly created AltrNftCollection contract
	 */
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
	) external onlyOwner returns (address) {
		AltrNftCollectionV2 collection = new AltrNftCollectionV2(
			name,
			symbol,
			oracleAddress,
			vaultManagerAddress,
			adminAddress,
			nftReserveAddress,
			minGracePeriod,
			insolvencyGracePeriod,
			freeVaultServicePeriod
		);
		return address(collection);
	}

	/**
	 * @dev Function to check if the contract implements the required interface
	 * @param interfaceId bytes4 The interface identifier
	 * @return bool Returns true if the contract implements the interface, false otherwise
	 */
	function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
		return interfaceId == type(INftCollectionFullFactory).interfaceId || super.supportsInterface(interfaceId);
	}
}
