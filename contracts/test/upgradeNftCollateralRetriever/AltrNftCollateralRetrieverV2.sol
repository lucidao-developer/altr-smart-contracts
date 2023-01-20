// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol";
import "@openzeppelin/contracts/access/IAccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165CheckerUpgradeable.sol";
import "../../AltrNftCollectionFactory.sol";
import "../../interfaces/INftCollectionFactory.sol";
import "../../interfaces/INftCollectionVaultService.sol";
import "../../interfaces/IFeeManager.sol";

contract AltrNftCollateralRetrieverV2 is ERC721HolderUpgradeable, OwnableUpgradeable {
	using ERC165CheckerUpgradeable for address;

	address public nftCollectionFactory;
	address public feeManager;

	string private newString;

	bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

	event NftBurned(address indexed collectionAddress, address indexed oracleAddress, uint256 tokenId);
	event RedeemRequest(address indexed collectionAddress, address indexed from, address operator, uint256 tokenId);
	event NftCollectionFactoryChanged(address indexed nftCollectionFactory);
	event FeeManagerChanged(address indexed feeManager);

	modifier onlyMinter(address nftContract) {
		require(IAccessControl(nftContract).hasRole(MINTER_ROLE, _msgSender()), "AltrNftCollateralRetriever: only Minter can burn NFT");
		_;
	}

	/// @custom:oz-upgrades-unsafe-allow constructor
	constructor() {
		_disableInitializers();
	}

	function burnNft(address nftContract, uint256 tokenId) external onlyMinter(nftContract) {
		require(AltrNftCollectionFactory(nftCollectionFactory).isAKnownCollection(nftContract), "AltrNftCollateralRetriever: unknown collection");
		ERC721Burnable(nftContract).burn(tokenId);

		emit NftBurned(nftContract, _msgSender(), tokenId);
	}

	function setNftCollectionFactory(address _nftCollectionFactory) external onlyOwner {
		_setNftCollectionFactory(_nftCollectionFactory);

		emit NftCollectionFactoryChanged(_nftCollectionFactory);
	}

	function setFeeManager(address _feeManager) external onlyOwner {
		_setFeeManager(_feeManager);

		emit FeeManagerChanged(_feeManager);
	}

	function getNewString() external view returns (string memory) {
		return newString;
	}

	function setNewString() external {
		require(keccak256(bytes(newString)) == keccak256(bytes("")), "AltrNftCollateralRetriever: newString already set");
		newString = "This is the upgrade!";
	}

	function onERC721Received(address operator, address from, uint256 tokenId, bytes memory data) public override returns (bytes4) {
		require(AltrNftCollectionFactory(nftCollectionFactory).isAKnownCollection(msg.sender), "AltrNftCollateralRetriever: unknown collection");
		uint256 deadline = INftCollectionVaultService(msg.sender).getVaultServiceDeadline(tokenId);
		require(deadline == 0 || deadline > block.timestamp, "AltrNftCollateralRetriever: vault service expired");
		require(IFeeManager(feeManager).isRedemptionFeePaid(msg.sender, tokenId), "AltrNftCollateralRetriever: platform fee has not been paid");

		bytes4 result = super.onERC721Received(operator, from, tokenId, data);

		emit RedeemRequest(msg.sender, from, operator, tokenId);

		return result;
	}

	function _setNftCollectionFactory(address _nftCollectionFactory) internal {
		require(_nftCollectionFactory != address(0), "AltrNftCollateralRetriever: cannot be null address");
		require(
			_nftCollectionFactory.supportsInterface(type(INftCollectionFactory).interfaceId),
			"AltrNftCollateralRetriever: does not support INftCollectionFactory interface"
		);
		nftCollectionFactory = _nftCollectionFactory;
	}

	function _setFeeManager(address _feeManager) internal {
		require(_feeManager != address(0), "AltrNftCollateralRetriever: cannot be null address");
		require(_feeManager.supportsInterface(type(IFeeManager).interfaceId), "AltrNftCollateralRetriever: does not support IFeeManager interface");
		feeManager = _feeManager;
	}
}
