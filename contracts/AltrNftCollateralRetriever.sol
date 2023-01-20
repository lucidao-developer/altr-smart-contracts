// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol";
import "@openzeppelin/contracts/access/IAccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165CheckerUpgradeable.sol";
import "./AltrNftCollectionFactory.sol";
import "./interfaces/INftCollectionFactory.sol";
import "./interfaces/INftCollectionVaultService.sol";
import "./interfaces/IFeeManager.sol";

/**
 * @title AltrNftCollateralRetriever
 * @author Lucidao Developer
 * @dev This contract allows Minters to burn NFTs to retrieve te physical assets represented by the NFTs from vault, and allows the owner to change the factory for the NFT collections and the fee manager
 */
contract AltrNftCollateralRetriever is ERC721HolderUpgradeable, OwnableUpgradeable {
	using ERC165CheckerUpgradeable for address;

	/**
	 * @dev Address of the NFT collection factory contract.
	 */
	address public nftCollectionFactory;

	/**
	 * @dev Address of the fee manager contract.
	 */
	address public feeManager;

	/**
	 * @dev Constant bytes32 representing the minter role, keccak256("MINTER_ROLE").
	 */
	bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

	/**
	 * @param collectionAddress the address of the contract where the NFT belongs
	 * @param oracleAddress the address of the oracle that is burning the NFT
	 * @param tokenId the unique identifier of the NFT being burned
	 */
	event NftBurned(address indexed collectionAddress, address indexed oracleAddress, uint256 tokenId);

	/**
	 * @param collectionAddress the address of the contract where the NFT belongs
	 * @param from the address of the account redeeming the NFT
	 * @param operator the address of the operator handling the redeem request
	 * @param tokenId the unique identifier of the NFT being redeemed
	 */
	event RedeemRequest(address indexed collectionAddress, address indexed from, address operator, uint256 tokenId);

	/**
	 * @param nftCollectionFactory the new address of the NFT collection factory
	 */
	event NftCollectionFactoryChanged(address indexed nftCollectionFactory);

	/**
	 * @param feeManager the new address of the fee manager
	 */
	event FeeManagerChanged(address indexed feeManager);

	/**
	 * @dev This modifier allows only Minters to burn the NFTs
	 */
	modifier onlyMinter(address nftContract) {
		require(IAccessControl(nftContract).hasRole(MINTER_ROLE, _msgSender()), "AltrNftCollateralRetriever: only Minter can burn NFT");
		_;
	}

	/**
	 * @dev Constructor function
	 */
	/// @custom:oz-upgrades-unsafe-allow constructor
	constructor() {
		_disableInitializers();
	}

	/**
	 * @dev  Burns the NFT
	 * @param nftContract The address of the NFT contract where the token belongs.
	 * @param tokenId The tokenId of the NFT.
	 */
	function burnNft(address nftContract, uint256 tokenId) external onlyMinter(nftContract) {
		require(AltrNftCollectionFactory(nftCollectionFactory).isAKnownCollection(nftContract), "AltrNftCollateralRetriever: unknown collection");

		emit NftBurned(nftContract, _msgSender(), tokenId);

		ERC721Burnable(nftContract).burn(tokenId);
	}

	/**
	 * @dev Changes the factory for the NFT collections.
	 * @param nftCollectionFactory_ Address of the NFT collection factory.
	 */

	function setNftCollectionFactory(address nftCollectionFactory_) external onlyOwner {
		_setNftCollectionFactory(nftCollectionFactory_);

		emit NftCollectionFactoryChanged(nftCollectionFactory_);
	}

	/**
	 * @dev This function is used to set the address of the fee manager
	 * @param feeManager_ the address of the fee manager
	 */
	function setFeeManager(address feeManager_) external onlyOwner {
		_setFeeManager(feeManager_);

		emit FeeManagerChanged(feeManager_);
	}

	/**
	 * @dev This function is used to initialize the contract
	 * @param nftCollectionFactory_ the address of the NFT collection factory
	 * @param feeManager_ the address of the fee manager
	 */
	function initialize(address nftCollectionFactory_, address feeManager_) external initializer {
		__AltrNftCollateralRetriever_init(nftCollectionFactory_, feeManager_);
	}

	/**
	 * @dev This function is triggered when an ERC721 token is received. This function ensures that the token is being received from a known collection, that the deadline of the vault service is still valid and that the redemption fee has been paid before redeeming the token.
	 * @param operator The address of the person who executed the transfer
	 * @param from The address of the person who sent the ERC721 token
	 * @param tokenId The token ID of the received ERC721 token
	 * @param data Additional data with no specified format
	 */
	function onERC721Received(address operator, address from, uint256 tokenId, bytes memory data) public override returns (bytes4) {
		require(AltrNftCollectionFactory(nftCollectionFactory).isAKnownCollection(msg.sender), "AltrNftCollateralRetriever: unknown collection");
		uint256 deadline = INftCollectionVaultService(msg.sender).getVaultServiceDeadline(tokenId);
		require(deadline > block.timestamp, "AltrNftCollateralRetriever: vault service expired");
		require(IFeeManager(feeManager).isRedemptionFeePaid(msg.sender, tokenId), "AltrNftCollateralRetriever: platform fee has not been paid");

		bytes4 result = super.onERC721Received(operator, from, tokenId, data);

		emit RedeemRequest(msg.sender, from, operator, tokenId);

		return result;
	}

	/**
	 * @dev Sets the address of the NFT collection factory contract.
	 * @param nftCollectionFactory_ The address of the NFT collection factory contract.
	 */
	function _setNftCollectionFactory(address nftCollectionFactory_) internal {
		require(nftCollectionFactory_ != address(0), "AltrNftCollateralRetriever: cannot be null address");
		require(
			nftCollectionFactory_.supportsInterface(type(INftCollectionFactory).interfaceId),
			"AltrNftCollateralRetriever: does not support INftCollectionFactory interface"
		);
		nftCollectionFactory = nftCollectionFactory_;
	}

	/**
	 * @dev Sets the address of the fee manager contract.
	 * @param feeManager_ The address of the fee manager contract.
	 */
	function _setFeeManager(address feeManager_) internal {
		require(feeManager_ != address(0), "AltrNftCollateralRetriever: cannot be null address");
		require(feeManager_.supportsInterface(type(IFeeManager).interfaceId), "AltrNftCollateralRetriever: does not support IFeeManager interface");
		feeManager = feeManager_;
	}

	/**
	 * @dev Initializes the AltrNftCollateralRetriever contract.
	 * @param nftCollectionFactory_ The address of the NFT collection factory contract.
	 * @param feeManager_ The address of the fee manager contract.
	 */
	function __AltrNftCollateralRetriever_init(address nftCollectionFactory_, address feeManager_) internal initializer {
		__Context_init();
		__Ownable_init();
		__ERC721Holder_init();
		__AltrNftCollateralRetriever_init_unchained(nftCollectionFactory_, feeManager_);
	}

	/**
	 * @dev Initializes the AltrNftCollateralRetriever contract without calling the internal chainable init functions.
	 * @param nftCollectionFactory_ The address of the NFT collection factory contract.
	 * @param feeManager_ The address of the fee manager contract.
	 */
	function __AltrNftCollateralRetriever_init_unchained(address nftCollectionFactory_, address feeManager_) internal initializer {
		_setNftCollectionFactory(nftCollectionFactory_);
		_setFeeManager(feeManager_);
	}
}
