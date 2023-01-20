// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "./interfaces/INftReserve.sol";

/**
 * @title LucidaoGovernanceNftReserve
 * @author Lucidao Developer
 * @dev Contract that acts as the Lucidao reserve for ERC721 and ERC1155 tokens. It verifies that the operator has the approval for the token
 * before allowing the transfer to proceed.
 */

contract LucidaoGovernanceNftReserve is ERC721Holder, ERC1155Holder, Ownable, INftReserve {
	/**
	 * @dev Emits when a ERC721 or ERC1155 tokens have been received and processed by the smart contract
	 * @param collectionAddress The address of the ERC721 or ERC1155 contract that this token belong to
	 * @param from Address from which the token came from
	 * @param operator Address of the operator that received the token
	 * @param tokenId ID of the token that was received
	 * @param amount number of tokens that was received
	 */
	event NftReceived(address indexed collectionAddress, address indexed from, address operator, uint256 tokenId, uint256 amount);
	/**
	 * @dev Emits when a batch of ERC1155 tokens have been received and processed by the smart contract
	 * @param collectionAddress The address of the ERC1155 contract that this token belong to
	 * @param from Address from which the tokens came from
	 * @param operator Address of the operator that received the tokens
	 * @param tokenId An array of token ids that were received
	 * @param amount An array of the amount of tokens that were received
	 */
	event NftBatchReceived(address indexed collectionAddress, address indexed from, address operator, uint256[] tokenId, uint256[] amount);

	receive() external payable {
		revert("LucidaoGovernanceNftReserve: cannot receive Eth");
	}

	/**
	 * @dev Approves another address to transfer the given token ID
	 * @param nftContract The address of the ERC721 contract to approve
	 * @param to Address to be approved for the given token ID
	 * @param tokenId ID of the token to be approved
	 */
	function approveERC721(address nftContract, address to, uint256 tokenId) external override onlyOwner {
		IERC721(nftContract).approve(to, tokenId);
	}

	/**
	 * @dev Approves another address to transfer all ERC1155 tokens belonging to this smart contract
	 * @param nftContract The address of the ERC1155 contract to approve
	 * @param to Address to be approved
	 */
	function approveERC1155(address nftContract, address to) external override onlyOwner {
		IERC1155(nftContract).setApprovalForAll(to, true);
	}

	/**
	 * @dev Function called by the ERC721-compliant smart contract when an ERC721 token is received.
	 * This function verifies that the caller is an ERC721 contract and that the operator has the approval for the token.
	 * Then it calls the super function and emit an event of NftReceived
	 * @param operator The address that call the onERC721Received function in the smart contract
	 * @param from The address from which the token is received
	 * @param tokenId The id of the received token
	 * @param data Additional data with no specified format, sent by the ERC721 smart contract
	 * @return The bytes4 identifier of the function that the super function call
	 */
	function onERC721Received(address operator, address from, uint256 tokenId, bytes memory data) public override(ERC721Holder, INftReserve) returns (bytes4) {
		bytes4 result = super.onERC721Received(operator, from, tokenId, data);
		emit NftReceived(msg.sender, from, operator, tokenId, 1);
		return result;
	}

	/**
	 * @dev Function called by the ERC1155-compliant smart contract when an ERC1155 token is received.
	 * This function verifies that the caller is an ERC1155 contract and that the operator has the approval for the token.
	 * Then it calls the super function and emit an event of NftReceived
	 * @param operator The address that call the onERC1155Received function in the smart contract
	 * @param from The address from which the token is received
	 * @param tokenId The id of the received token
	 * @param amount The amount of token received
	 * @param data Additional data with no specified format, sent by the ERC1155 smart contract
	 * @return The bytes4 identifier of the function that the super function call
	 */
	function onERC1155Received(
		address operator,
		address from,
		uint256 tokenId,
		uint256 amount,
		bytes memory data
	) public override(ERC1155Holder, INftReserve) returns (bytes4) {
		bytes4 result = super.onERC1155Received(operator, from, tokenId, amount, data);
		emit NftReceived(msg.sender, from, operator, tokenId, amount);
		return result;
	}

	/**
	 * @dev Handle batch of ERC1155 tokens being received
	 * @param operator address that called safeBatchTransferFrom
	 * @param from address that originally owned the NFTs
	 * @param ids array of token IDs
	 * @param values array of amounts
	 * @param data data passed to safeBatchTransferFrom
	 * @return bytes4 value of the function call's success or failure
	 */
	function onERC1155BatchReceived(
		address operator,
		address from,
		uint256[] memory ids,
		uint256[] memory values,
		bytes memory data
	) public override(ERC1155Holder, INftReserve) returns (bytes4) {
		bytes4 result = super.onERC1155BatchReceived(operator, from, ids, values, data);
		emit NftBatchReceived(msg.sender, from, operator, ids, values);
		return result;
	}

	/**
	 * @dev Function to check if the contract implements the required interface
	 * @param interfaceId bytes4 The interface identifier
	 * @return bool Returns true if the contract implements the interface, false otherwise
	 */
	function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
		return interfaceId == type(INftReserve).interfaceId || super.supportsInterface(interfaceId);
	}
}
