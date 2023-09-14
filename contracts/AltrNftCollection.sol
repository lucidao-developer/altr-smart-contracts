// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interfaces/INftCollectionVaultService.sol";

/**
 * @title AltrNftCollection
 * @author Lucidao Developer
 * @dev Contract for minting and managing ERC-721 Non-Fungible Tokens (NFTs) in the context of a ownership certificate for a real object stored in a physical vault.
 * It allows for the minting of NFTs, setting of token URI, managing the NFTs' minting and vault service roles, and handling of a NFTs' seizure.
 * It also keeps track of token Ids, the free vault service period, the minimum and the insolvency grace periods.
 * It emits events when vault service deadline is set, insolvency grace period is set, token is seized, token is received, and free vault service period is set.
 * @dev This contract inherits from ERC721URIStorage, ERC721Enumerable, ERC721Burnable, AccessControl, ReentrancyGuard and INftCollectionVaultService contracts.
 * @dev The contract is controlled by a admin, an oracle, and a vault manager.
 */
contract AltrNftCollection is ERC721URIStorage, ERC721Enumerable, ERC721Burnable, AccessControl, ReentrancyGuard, INftCollectionVaultService {
	using Counters for Counters.Counter;

	bytes32 public constant MINTER_ROLE_MANAGER = keccak256("MINTER_ROLE_MANAGER");
	bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
	bytes32 public constant VAULT_MANAGER_ROLE = keccak256("VAULT_MANAGER_ROLE");

	/**
	 * @dev The address of the oracle contract which manages the token's collateral
	 */
	address public immutable oracleAddress;
	/**
	 * @dev The address of the reserve contract where the NFTs are stored
	 */
	address public immutable nftReserveAddress;

	/**
	 * @dev Minimum grace period for the insolvency of a token
	 */
	uint256 public immutable minGracePeriod;
	/**
	 * @dev The grace period for the insolvency of a token, this can be set by the owner
	 */
	uint256 public insolvencyGracePeriod;
	/**
	 * @dev The free period for the vault service, this can be set by the owner
	 */
	uint256 public freeVaultServicePeriod;

	Counters.Counter private _tokenIdCounter;
	mapping(uint256 => uint256) private _vaultServiceDeadline;

	/**
	 * @notice Emits when the deadline for the vault service is set
	 * @param tokenId The ID of the token
	 * @param deadline The deadline for the vault service
	 */
	event VaultServiceDeadlineSet(uint256 indexed tokenId, uint256 deadline);
	/**
	 * @notice Emits when the insolvency grace period is set
	 * @param insolvencyGracePeriod The grace period for the insolvency
	 */
	event InsolvencyGracePeriodSet(uint256 indexed insolvencyGracePeriod);
	/**
	 * @notice Emits when the token is seized
	 * @param tokenId The ID of the token
	 */
	event Seize(uint256 indexed tokenId);
	/**
	 * @notice Emits when the free vault service period is set
	 * @param freeVaultServicePeriod The free vault service period
	 */
	event FreeVaultServicePeriod(uint256 freeVaultServicePeriod);

	/**
	 * @dev Constructor function that initializes the AltrNftCollection contract
	 * @param name_ The name of the token
	 * @param symbol_ The symbol of the token
	 * @param oracleAddress_ The address of the oracle contract
	 * @param vaultManagerAddress_ The address of the vault manager
	 * @param adminAddress_ The address of the admin
	 * @param nftReserveAddress_ The address of the NFT reserve contract
	 * @param minGracePeriod_ The minimum grace period for vault service
	 * @param insolvencyGracePeriod_ The insolvency grace period for vault service
	 * @param freeVaultServicePeriod_ The free period for the vault service
	 */
	constructor(
		string memory name_,
		string memory symbol_,
		address oracleAddress_,
		address vaultManagerAddress_,
		address adminAddress_,
		address nftReserveAddress_,
		uint256 minGracePeriod_,
		uint256 insolvencyGracePeriod_,
		uint256 freeVaultServicePeriod_
	) ERC721(name_, symbol_) {
		require(
			oracleAddress_ != address(0) && vaultManagerAddress_ != address(0) && adminAddress_ != address(0) && nftReserveAddress_ != address(0),
			"AltrNftCollection: cannot be null address"
		);
		require(insolvencyGracePeriod_ >= minGracePeriod_, "AltrNftCollection: grace period too short");

		oracleAddress = oracleAddress_;
		nftReserveAddress = nftReserveAddress_;
		minGracePeriod = minGracePeriod_;
		insolvencyGracePeriod = insolvencyGracePeriod_;
		freeVaultServicePeriod = freeVaultServicePeriod_;
		_setRoleAdmin(MINTER_ROLE, MINTER_ROLE_MANAGER);
		_grantRole(DEFAULT_ADMIN_ROLE, adminAddress_);
		_grantRole(MINTER_ROLE_MANAGER, adminAddress_);
		_grantRole(MINTER_ROLE_MANAGER, oracleAddress_);
		_grantRole(MINTER_ROLE, oracleAddress_);
		_grantRole(VAULT_MANAGER_ROLE, vaultManagerAddress_);

		_tokenIdCounter.increment();
	}

	/**
	 * @dev Allows the admin to seize an NFT and transfer it to the NFT reserve address
	 * @param tokenId The tokenId of the NFT that is being seized
	 */
	function seize(uint256 tokenId) external onlyRole(DEFAULT_ADMIN_ROLE) {
		require(block.timestamp > _vaultServiceDeadline[tokenId] + insolvencyGracePeriod, "AltrNftCollection: cannot seize token");
		address tokenOwner = ownerOf(tokenId);

		emit Seize(tokenId);

		_safeTransfer(tokenOwner, nftReserveAddress, tokenId, "");
	}

	/**
	 * @dev Allows the vault manager role to set a new deadline for vault service
	 * @param tokenId The tokenId of the NFT for which the deadline is being set
	 * @param deadline The new deadline for vault service
	 */
	function setVaultServiceDeadline(uint256 tokenId, uint256 deadline) external onlyRole(VAULT_MANAGER_ROLE) {
		require((deadline > _vaultServiceDeadline[tokenId] && deadline > block.timestamp), "AltrNftCollection: new deadline is lower than the current one");
		_setVaultServiceDeadline(tokenId, deadline);
	}

	/**
	 * @dev Allows the admin role to set a new insolvency grace period
	 * @param insolvencyGracePeriod_ The new insolvency grace period
	 */
	function setInsolvencyGracePeriod(uint256 insolvencyGracePeriod_) external onlyRole(DEFAULT_ADMIN_ROLE) {
		require(insolvencyGracePeriod_ >= minGracePeriod, "AltrNftCollection: grace period too short");
		insolvencyGracePeriod = insolvencyGracePeriod_;
		emit InsolvencyGracePeriodSet(insolvencyGracePeriod_);
	}

	/**
	 * @dev Allows the admin role to set a new free vault service period
	 * @param freeVaultServicePeriod_ The new free vault service period
	 */
	function setFreeVaultServicePeriod(uint256 freeVaultServicePeriod_) external onlyRole(DEFAULT_ADMIN_ROLE) {
		freeVaultServicePeriod = freeVaultServicePeriod_;
		emit FreeVaultServicePeriod(freeVaultServicePeriod_);
	}

	/**
	 * @dev Allows the minter role to mint a new NFT, assigns the tokenURI and sets the deadline for vault service
	 * @param uri The URI of the NFT that is being minted
	 */
	function safeMint(string memory uri) external nonReentrant onlyRole(MINTER_ROLE) {
		uint256 tokenId = _tokenIdCounter.current();
		_tokenIdCounter.increment();
		_safeMint(oracleAddress, tokenId);
		_setTokenURI(tokenId, uri);
		_setVaultServiceDeadline(tokenId, block.timestamp + freeVaultServicePeriod);
	}

	/**
	 * @dev Allows anyone to get the deadline for vault service for a specific NFT
	 * @param tokenId The tokenId of the NFT for which the deadline is being retrieved
	 * @return deadline The deadline for vault service
	 */
	function getVaultServiceDeadline(uint256 tokenId) external view returns (uint256 deadline) {
		return _vaultServiceDeadline[tokenId];
	}

	/**
	 * @dev Allows anyone to get the URI of a specific NFT
	 * @param tokenId The tokenId of the NFT for which the URI is being retrieved
	 * @return The URI of the NFT
	 */
	function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
		return super.tokenURI(tokenId);
	}

	/**
	 * @dev Allows anyone to check if the contract supports an interface
	 * @param interfaceId The interfaceId being checked for support
	 * @return True if the contract supports the interface, false otherwise
	 */
	function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage, ERC721Enumerable, AccessControl) returns (bool) {
		return interfaceId == type(INftCollectionVaultService).interfaceId || super.supportsInterface(interfaceId);
	}

	/**
	 * @dev internal function that is executed before a token transfer
	 * @param from The current owner of the token
	 * @param to The address to which the token is being transferred
	 * @param tokenId The tokenId of the NFT that is being transferred
	 * @param batchSize The number of tokens being transferred in the batch
	 */
	function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize) internal virtual override(ERC721, ERC721Enumerable) {
		super._beforeTokenTransfer(from, to, tokenId, batchSize);
	}

	/**
	 * @dev internal function that burns a token
	 * @param tokenId The tokenId of the NFT that is being burned
	 */
	function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
		super._burn(tokenId);
	}

	/**
	 * @dev internal function that sets the deadline for vault service for a specific NFT
	 * @param tokenId The tokenId of the NFT for which the deadline is being set
	 * @param deadline The deadline for vault service
	 */
	function _setVaultServiceDeadline(uint256 tokenId, uint256 deadline) internal {
		_vaultServiceDeadline[tokenId] = deadline;
		emit VaultServiceDeadlineSet(tokenId, deadline);
	}

	/**
	 * @dev internal pure function that returns the base URI for the NFTs
	 * @return the base URI
	 */
	function _baseURI() internal pure override returns (string memory) {
		return "ipfs://";
	}
}
