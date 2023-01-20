// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface INftReserve {
	function approveERC721(address nftContract, address to, uint256 tokenId) external;

	function approveERC1155(address nftContract, address to) external;

	function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4);

	function onERC1155Received(address operator, address from, uint256 tokenId, uint256 amount, bytes calldata data) external returns (bytes4);

	function onERC1155BatchReceived(address operator, address from, uint256[] memory ids, uint256[] memory values, bytes memory data) external returns (bytes4);
}
