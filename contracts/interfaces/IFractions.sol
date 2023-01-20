// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

interface IFractions is IERC1155 {
	function mint(address to, uint256 tokenId, uint256 amount, bytes memory data) external;

	function burn(address account, uint256 id, uint256 amount) external;

	function operatorBurn(address account, uint256 id, uint256 amount) external;

	function setBuyoutStatus(uint256 tokenId) external;

	function setClosingTimeForTokenSale(uint256 tokenId, uint256 closingTime) external;

	function grantRole(bytes32 role, address account) external;
}
