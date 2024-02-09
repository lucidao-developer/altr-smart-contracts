// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "./interfaces/INftCollectionFactory.sol";
import "./interfaces/IPriceIndex.sol";

/**
 * @title AltrPriceIndex
 * @dev This contract serves as a price index oracle for NFTs.
 * It allows admin to set a factory for NFT collections and register different collections to the index.
 * It also stores and manages valuations for each NFT.
 */
contract AltrPriceIndex is AccessControl, IPriceIndex {
	using ERC165Checker for address;

	/**
	 * @dev role name for valuation expert
	 */
	bytes32 public constant VALUATION_EXPERT_ROLE = keccak256("VALUATION_EXPERT_ROLE");

	/**
	 * @notice Address of the NFT Collection Factory contract
	 */
	INftCollectionFactory public nftCollectionFactory;

	/**
	 * @notice Mapping of NFT collection address to its corresponding oracle role identifier
	 */
	mapping(address => bytes32) public collectionToOracle;

	/**
	 * @notice Mapping of NFT collection address and token ID to its valuation
	 */
	mapping(address => mapping(uint256 => Valuation)) public lastValuations;

	/**
	 * @notice Event emitted when a new NFT collection is registered
	 */
	event CollectionRegistered(address collectionAddress, bytes32 oracleRole);

	/**
	 * @notice Event emitted when a new valuation is added for an NFT
	 */
	event ValuationAdded(address collectionAddress, uint256 nftId, Valuation lastValuation);

	/**
	 * @notice Event emitted when the NftCollectionFactory address is set
	 */
	event NftCollectionFactorySet(address newNftCollectionFactory);

	/**
	 * @dev check if the collection is already registered on the contract
	 * @param collectionAddress address of the collection to check
	 */
	modifier isRegisteredCollection(address collectionAddress) {
		require(collectionToOracle[collectionAddress] != 0x00, "AltrPriceIndex: must be registered collection");
		_;
	}

	/**
	 * @dev Constructor function that initializes the contract.
	 * @param _nftCollectionFactory The address of the NFT Collection Factory.
	 */
	constructor(address _nftCollectionFactory) {
		_grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

		_setNftCollectionFactory(_nftCollectionFactory);
	}

	/**
	 * @dev Sets the address of the NFT Collection Factory.
	 * @notice Can only be called by an account with the DEFAULT_ADMIN_ROLE.
	 * @param newNftCollectionFactory The address of the new NFT Collection Factory.
	 */
	function setNftCollectionFactory(address newNftCollectionFactory) external onlyRole(DEFAULT_ADMIN_ROLE) {
		_setNftCollectionFactory(newNftCollectionFactory);

		emit NftCollectionFactorySet(newNftCollectionFactory);
	}

	/**
	 * @dev Registers a new NFT collection to the index.
	 * @notice Can only be called by an account with the DEFAULT_ADMIN_ROLE.
	 * @param collectionAddress The address of the NFT collection.
	 * @param oracleRole The role identifier for the oracle of the collection.
	 */
	function registerCollection(address collectionAddress, bytes32 oracleRole) external onlyRole(DEFAULT_ADMIN_ROLE) {
		require(nftCollectionFactory.isAKnownCollection(collectionAddress), "AltrPriceIndex: unknown collection");

		collectionToOracle[collectionAddress] = oracleRole;

		emit CollectionRegistered(collectionAddress, oracleRole);
	}

	/**
	 * @dev Adds a new valuation for an NFT.
	 * @notice Can only be called by an account with the corresponding oracle role for the NFT collection.
	 * @param collectionAddress The address of the NFT collection.
	 * @param nftId The ID of the NFT.
	 * @param timestamp The timestamp of the valuation.
	 * @param price The price of the NFT.
	 * @param ltv The Loan-to-Value ratio.
	 */
	function addValuation(
		address collectionAddress,
		uint256 nftId,
		uint256 timestamp,
		uint256 price,
		uint256 ltv
	) external isRegisteredCollection(collectionAddress) onlyRole(collectionToOracle[collectionAddress]) {
		require(timestamp < block.timestamp, "AltrPriceIndex: cannot set future valuations");
		Valuation storage lastValuation = lastValuations[collectionAddress][nftId];
		require(timestamp > lastValuation.timestamp, "AltrPriceIndex: new timestamp must come after the last one");

		lastValuation.price = price;
		lastValuation.timestamp = timestamp;
		lastValuation.ltv = ltv;

		emit ValuationAdded(collectionAddress, nftId, lastValuation);
	}

	/**
	 * @dev Retrieves the valuation for a given NFT.
	 * @param nftCollection The address of the NFT collection.
	 * @param tokenId The ID of the NFT.
	 * @return valuation The latest valuation for the NFT.
	 */
	function getValuation(address nftCollection, uint256 tokenId) external view returns (Valuation memory valuation) {
		return lastValuations[nftCollection][tokenId];
	}

	/**
	 * @dev Checks if the contract supports an interface.
	 * @param interfaceId The interface to check for.
	 * @return True if the interface is supported, false otherwise.
	 */
	function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
		return interfaceId == type(IPriceIndex).interfaceId || super.supportsInterface(interfaceId);
	}

	/**
	 * @dev Internal function to set the NFT Collection Factory.
	 * @param newNftCollectionFactory The address of the new NFT Collection Factory.
	 */
	function _setNftCollectionFactory(address newNftCollectionFactory) internal {
		require(newNftCollectionFactory != address(0), "AltrPriceIndex: cannot be null address");
		require(
			newNftCollectionFactory.supportsInterface(type(INftCollectionFactory).interfaceId),
			"AltrPriceIndex: does not support INftCollectionFactory interface"
		);

		nftCollectionFactory = INftCollectionFactory(newNftCollectionFactory);
	}
}
