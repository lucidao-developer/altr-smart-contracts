// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165CheckerUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import "./AltrNftCollection.sol";
import "./interfaces/ILicenseManager.sol";
import "./interfaces/INftReserve.sol";
import "./interfaces/INftCollectionFactory.sol";

/**
 * @title AltrNftCollectionFactory
 * @author Lucidao Developer
 * @dev Contract for generating Altr NFT collections
 */
contract AltrNftCollectionFactory is ERC165Upgradeable, OwnableUpgradeable, INftCollectionFactory {
	using ERC165CheckerUpgradeable for address;
	using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;

	/**
	 * @dev Struct that contains information about an AltrNftCollection contract created by this factory
	 * @param collection address of the AltrNftCollection contract
	 * @param symbol symbol of the AltrNftCollection
	 * @param name name of the AltrNftCollection
	 * @param oracle address of the oracle used by the AltrNftCollection
	 * @param tokenVersion version of the token
	 */
	struct CreatedContract {
		AltrNftCollection collection;
		string symbol;
		string name;
		address oracle;
		bytes1 tokenVersion;
	}

	/**
	 * @dev Set of addresses of created AltrNftCollection contracts
	 */
	EnumerableSetUpgradeable.AddressSet private _collectionAddressSet;

	/**
	 * @dev Array that contains information about all the AltrNftCollection contracts created by this factory
	 */
	CreatedContract[] public createdContracts;

	/**
	 * @dev Address of the license manager contract
	 */
	address public licenseManager;

	/**
	 * @dev Address of the nft reserve contract
	 */
	address public nftReserveAddress;

	/**
	 * @dev Token version of the NFTs
	 */
	bytes1 public tokenVersion;

	/**
	 * @dev Emits when a new NFT collection is created
	 * @param contractAddress address of the newly created NFT collection contract
	 * @param collectionName name of the NFT collection
	 * @param collectionSymbol symbol of the NFT collection
	 * @param collectionOracle oracle address for the NFT collection
	 */
	event CollectionCreated(address indexed contractAddress, string collectionName, string collectionSymbol, address collectionOracle);

	/**
	 * @dev Emits when the license manager address is changed
	 * @param licenseManager new license manager address
	 */
	event LicenseManagerChanged(address indexed licenseManager);

	/**
	 * @dev Emits when the nft reserve address is changed
	 * @param nftReserveAddress new nft reserve address
	 */
	event NftReserveAddressChanged(address indexed nftReserveAddress);

	/// @custom:oz-upgrades-unsafe-allow constructor
	constructor() {
		_disableInitializers();
	}

	/**
	 * @dev This function creates a new collection contract with the given name, symbol, oracle, vault manager, and grace periods
	 * @param name name of the new collection contract
	 * @param symbol symbol of the new collection contract
	 * @param oracle oracle address for the new collection contract
	 * @param vaultManager vault manager address for the new collection contract
	 * @param minGracePeriod minimum grace period for the new collection contract
	 * @param insolvencyGracePeriod insolvency grace period for the new collection contract
	 * @param freeVaultServicePeriod free vault service period for the new collection contract
	 * @notice A new collection contract is created
	 */
	function createCollection(
		string memory name,
		string memory symbol,
		address oracle,
		address vaultManager,
		uint256 minGracePeriod,
		uint256 insolvencyGracePeriod,
		uint256 freeVaultServicePeriod
	) external onlyOwner {
		require(oracle != address(0) && vaultManager != address(0), "AltrNftCollectionFactory: cannot be null address");
		require(insolvencyGracePeriod >= minGracePeriod, "AltrNftCollectionFactory: grace period too short");
		require(
			ILicenseManager(licenseManager).isAQualifiedOracle(oracle) && ILicenseManager(licenseManager).isAQualifiedOracle(vaultManager),
			"AltrNftCollectionFactory: requirements to become oracle not met"
		);

		AltrNftCollection collection = new AltrNftCollection(
			name,
			symbol,
			oracle,
			vaultManager,
			msg.sender,
			nftReserveAddress,
			minGracePeriod,
			insolvencyGracePeriod,
			freeVaultServicePeriod
		);

		CreatedContract memory newContract = CreatedContract(collection, symbol, name, oracle, tokenVersion);

		createdContracts.push(newContract);
		_collectionAddressSet.add(address(collection));

		emit CollectionCreated(address(collection), name, symbol, oracle);
	}

	/**
	 * @dev This function updates the contract's license manager address
	 * @param licenseManager_ address of the new license manager
	 */
	function setLicenseManager(address licenseManager_) external onlyOwner {
		_setLicenseManager(licenseManager_);
		emit LicenseManagerChanged(licenseManager_);
	}

	/**
	 * @dev This function updates the contract's NFT Reserve address
	 * @param nftReserveAddress_ address of the new NFT Reserve
	 */
	function setNftReserveAddress(address nftReserveAddress_) external onlyOwner {
		_setNftReserveAddress(nftReserveAddress_);
		emit NftReserveAddressChanged(nftReserveAddress_);
	}

	/**
	 * @dev This function initializes the contract's fields with the given values
	 * @param nftReserveAddress_ address of the NFT Reserve
	 * @param licenseManager_ address of the license manager
	 */
	function initialize(address licenseManager_, address nftReserveAddress_) external initializer {
		__AltrNftCollectionFactory_init(licenseManager_, nftReserveAddress_);
	}

	/**
	 * @dev This function checks if a given address is a known collection contract address
	 * @param collectionAddress address of the collection contract
	 * @return Returns true if the given address is a known collection contract, returns false otherwise
	 */
	function isAKnownCollection(address collectionAddress) external view returns (bool) {
		return _collectionAddressSet.contains(collectionAddress);
	}

	/**
	 * @dev This function gets the number of created collection contracts
	 * @return Returns number of created collection contracts
	 */
	function createdContractCount() external view returns (uint256) {
		return _collectionAddressSet.length();
	}

	/**
	 * @dev Function to check if the contract implements the required interface
	 * @param interfaceId bytes4 The interface identifier
	 * @return bool Returns true if the contract implements the interface, false otherwise
	 */
	function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
		return interfaceId == type(INftCollectionFactory).interfaceId || super.supportsInterface(interfaceId);
	}

	/**
	 * @dev Initializer function for the contract, which is called only once
	 * @param licenseManager_ address The address of the license manager contract
	 * @param nftReserveAddress_ address The address of the NFT reserve contract
	 */
	function __AltrNftCollectionFactory_init(address licenseManager_, address nftReserveAddress_) internal onlyInitializing {
		__Ownable_init();
		__AltrNftCollectionFactory_init_unchained(licenseManager_, nftReserveAddress_);
	}

	/**
	 * @dev Internal function for initializing the contract, that is called only once
	 * @param licenseManager_ address The address of the license manager contract
	 * @param nftReserveAddress_ address The address of the NFT reserve contract
	 */
	function __AltrNftCollectionFactory_init_unchained(address licenseManager_, address nftReserveAddress_) internal onlyInitializing {
		_setLicenseManager(licenseManager_);
		_setNftReserveAddress(nftReserveAddress_);
		tokenVersion = "1";
	}

	/**
	 * @dev Internal function to set the address of the license manager contract
	 * @param licenseManager_ address The address of the license manager contract
	 */
	function _setLicenseManager(address licenseManager_) internal {
		require(licenseManager_ != address(0), "AltrNftCollectionFactory: cannot be null address");
		require(licenseManager_.supportsInterface(type(ILicenseManager).interfaceId), "AltrNftCollectionFactory: does not support ILicenseManager interface");
		licenseManager = licenseManager_;
	}

	/**
	 * @dev Internal function to set the address of the NFT reserve contract
	 * @param nftReserveAddress_ address The address of the NFT reserve contract
	 */
	function _setNftReserveAddress(address nftReserveAddress_) internal {
		require(nftReserveAddress_ != address(0), "AltrNftCollectionFactory: cannot be null address");
		require(nftReserveAddress_.supportsInterface(type(INftReserve).interfaceId), "AltrNftCollectionFactory: does not support INftReserve interface");
		nftReserveAddress = nftReserveAddress_;
	}
}
