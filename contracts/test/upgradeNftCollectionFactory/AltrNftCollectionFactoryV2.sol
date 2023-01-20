// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165CheckerUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import "./AltrNftCollectionV2.sol";
import "../../interfaces/ILicenseManager.sol";
import "../../interfaces/INftReserve.sol";
import "../../interfaces/INftCollectionFactory.sol";

//Estendere ERC721 con struct prezzo, costo di custodia e periodo di validità
//Il costi delle fee avviene sempre al transfer (quando avviene il calcolo). Invocazione su license manager?
//ricontrollare logiche burn (_isApprovedOrOwner) - marketplace è operator? setApprovalForAll è listing?

contract AltrNftCollectionFactoryV2 is ERC165Upgradeable, OwnableUpgradeable, INftCollectionFactory {
	using ERC165CheckerUpgradeable for address;
	using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;

	struct CreatedContract {
		AltrNftCollectionV2 collection;
		string symbol;
		string name;
		address oracle;
		bytes1 tokenVersion;
	}

	EnumerableSetUpgradeable.AddressSet private _collectionAddressSet;
	CreatedContract[] public createdContracts;
	address public licenseManager;
	address public nftReserveAddress;
	bytes1 public tokenVersion;

	event CollectionCreated(address indexed contractAddress, string collectionName, string collectionSymbol, address collectionOracle);
	event LicenseManagerChanged(address indexed licenseManager);
	event NftReserveAddressChanged(address indexed nftReserveAddress);

	function migration() external {
		tokenVersion = "2";
	}

	function createCollection(
		string memory name,
		string memory symbol,
		address oracle,
		address vaultManagerAddress,
		uint256 minGracePeriod,
		uint256 insolvencyGracePeriod,
		uint256 freeVaultServicePeriod,
		uint256 sellDeadline
	) external onlyOwner {
		require(oracle != address(0), "Invalid Oracle");
		require(insolvencyGracePeriod >= minGracePeriod, "grace period too short");

		require(ILicenseManager(licenseManager).isAQualifiedOracle(oracle), "requirements to become oracle not met");

		AltrNftCollectionV2 collection = new AltrNftCollectionV2(
			name,
			symbol,
			oracle,
			vaultManagerAddress,
			msg.sender,
			nftReserveAddress,
			minGracePeriod,
			insolvencyGracePeriod,
			freeVaultServicePeriod,
			sellDeadline
		);

		CreatedContract memory newContract = CreatedContract(collection, symbol, name, oracle, tokenVersion);

		createdContracts.push(newContract);
		_collectionAddressSet.add(address(collection));

		emit CollectionCreated(address(collection), name, symbol, oracle);
	}

	function setLicenseManager(address _licenseManager) external onlyOwner {
		require(_licenseManager != address(0), "cannot be null address");
		licenseManager = _licenseManager;
		emit LicenseManagerChanged(_licenseManager);
	}

	function setNftReserveAddress(address _nftReserveAddress) external onlyOwner {
		require(_nftReserveAddress != address(0), "cannot be null address");
		nftReserveAddress = _nftReserveAddress;
		emit NftReserveAddressChanged(_nftReserveAddress);
	}

	function isAKnownCollection(address collectionAddress) external view returns (bool) {
		return _collectionAddressSet.contains(collectionAddress);
	}

	function createdContractCount() external view returns (uint256) {
		return _collectionAddressSet.length();
	}

	function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
		return interfaceId == type(INftCollectionFactory).interfaceId || super.supportsInterface(interfaceId);
	}

	function initialize(address _licenseManager, address _nftReserveAddress) public initializer {
		__AltrNftCollectionFactory_init(_licenseManager, _nftReserveAddress);
	}

	function __AltrNftCollectionFactory_init(address _licenseManager, address _nftReserveAddress) internal onlyInitializing {
		__Ownable_init();
		__AltrNftCollectionFactory_init_unchained(_licenseManager, _nftReserveAddress);
	}

	function __AltrNftCollectionFactory_init_unchained(address _licenseManager, address _nftReserveAddress) internal onlyInitializing {
		_setLicenseManager(_licenseManager);
		_setNftReserveAddress(_nftReserveAddress);
		tokenVersion = "2";
	}

	function _setLicenseManager(address _licenseManager) internal {
		require(_licenseManager != address(0), "AltrNftCollectionFactory: cannot be null address");
		require(_licenseManager.supportsInterface(type(ILicenseManager).interfaceId), "AltrNftCollectionFactory: does not support ILicenseManager interface");
		licenseManager = _licenseManager;
	}

	function _setNftReserveAddress(address _nftReserveAddress) internal {
		require(_nftReserveAddress != address(0), "AltrNftCollectionFactory: cannot be null address");
		require(_nftReserveAddress.supportsInterface(type(INftReserve).interfaceId), "AltrNftCollectionFactory: does not support INftReserve interface");
		nftReserveAddress = _nftReserveAddress;
	}
}
