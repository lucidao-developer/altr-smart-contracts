// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./interfaces/IFractions.sol";
import "./interfaces/IFractionsSale.sol";

/**
 * @title AltrFractions
 * @author Lucidao Developer
 * @notice Contract that implements the ERC1155, ERC165, ERC165Checker, ERC1155Burnable, ERC1155Supply, AccessControl, Initializable and IFractions interfaces
 * @dev Contract that implements the ERC1155, ERC165, ERC165Checker, ERC1155Burnable, ERC1155Supply, AccessControl, Initializable and IFractions interfaces,
 * and maintains the state of Buyout, TokenSaleStatus, AltrFractionsSale, ClosingTimeForTokenSale.
 */

contract AltrFractions is AccessControl, ERC1155Burnable, ERC1155Supply, IFractions, Initializable {
	using Strings for uint256;
	using ERC165Checker for address;
	/**
	 * @dev Enum representing the possible states of a token sale
	 * OPEN: the token sale is currently open and accepting purchases
	 * FAILED: the token sale did not reach its goal and did not execute
	 * SUCCESSFUL: the token sale has reached its goal and executed successfully
	 */
	enum TokenSaleStatus {
		OPEN,
		FAILED,
		SUCCESSFUL
	}
	/**
	 * @dev The AltrFractionsSale contract
	 */
	IFractionsSale public altrFractionsSale;
	/**
	 * @dev BURN_MANAGER_ROLE is the role assigned to the address that can call the operatorBurn function
	 */
	bytes32 public constant BURN_MANAGER_ROLE = keccak256("BURN_MANAGER_ROLE");
	/**
	 * @dev isTokenIdBoughtOut map store the current buyout status of a token
	 */
	mapping(uint256 => bool) public isTokenIdBoughtOut;
	/**
	 * @dev tokenSaleStatus map store the current sale status of a token
	 */
	mapping(uint256 => TokenSaleStatus) public tokenSaleStatus;
	/**
	 * @dev closingTimeForTokenSale map store the closing time for a token sale
	 */
	mapping(uint256 => uint256) public closingTimeForTokenSale;

	/**
	 * @param tokenId The token ID of the token sale
	 * @param status The status of the buyout for the token sale
	 */
	event BuyoutStatusSet(uint256 indexed tokenId, bool status);
	/**
	 * @param tokenId The token ID of the token sale
	 * @param status The status of the token sale
	 */
	event TokenSaleStatusSet(uint256 indexed tokenId, TokenSaleStatus status);
	/**
	 * @param altrFractionsSale The address of the altrFractionsSale contract
	 */
	event ContractSaleSet(IFractionsSale altrFractionsSale);
	/**
	 * @param tokenId The token ID of the token sale
	 * @param closingTime The closing time of the token sale
	 */
	event ClosingTimeForTokenSaleSet(uint256 indexed tokenId, uint256 closingTime);
	/**
	 * @param operator The operator address
	 * @param account The address of the owner of the fractions
	 * @param id The token ID
	 * @param amount The burn amount
	 */
	event OperatorBurn(address indexed operator, address indexed account, uint256 id, uint256 amount);

	/**
	 * @dev Constructor that creates an ERC1155 contract with the specified uri_ and grants the msg.sender the DEFAULT_ADMIN_ROLE
	 * @param uri_ The URI of the ERC1155 contract
	 */
	constructor(string memory uri_) ERC1155(uri_) {
		_grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
	}

	/**
	 * @dev The setUri function allows the contract owner to set the URI of the ERC1155 token
	 * @param uri_ The URI of the ERC1155 token
	 */
	function setUri(string memory uri_) external onlyRole(DEFAULT_ADMIN_ROLE) {
		_setURI(uri_);
	}

	/**
	 * @dev The setContractSale function allows the contract owner to set the contract sale of the token
	 * @param contractSale_ The address of the contract sale
	 * @notice This function can set the contractSale only once
	 */
	function setContractSale(address contractSale_) external initializer onlyRole(DEFAULT_ADMIN_ROLE) {
		require(contractSale_ != address(0), "AltrFractions: cannot be null address");
		require(contractSale_.supportsInterface(type(IFractionsSale).interfaceId), "AltrFractions: does not support IFractionsSale interface");
		altrFractionsSale = IFractionsSale(contractSale_);

		emit ContractSaleSet(altrFractionsSale);
	}

	/**
	 * @dev The setBuyoutStatus function allows the contract owner to set the buyout status of a specific tokenId
	 * @param tokenId The ID of the token for which the buyout status is being set
	 */
	function setBuyoutStatus(uint256 tokenId) external onlyRole(DEFAULT_ADMIN_ROLE) {
		isTokenIdBoughtOut[tokenId] = true;

		emit BuyoutStatusSet(tokenId, true);
	}

	/**
	 * @dev The setClosingTimeForTokenSale function allows the contract owner to set the closing time for a specific tokenId sale
	 * @param tokenId The ID of the token for which the closing time is being set
	 * @param closingTime The closing time for the token sale
	 */
	function setClosingTimeForTokenSale(uint256 tokenId, uint256 closingTime) external onlyRole(DEFAULT_ADMIN_ROLE) {
		require(closingTime > block.timestamp, "AltrFractions: closing time cannot be set in the past");
		closingTimeForTokenSale[tokenId] = closingTime;

		emit ClosingTimeForTokenSaleSet(tokenId, closingTime);
	}

	/**
	 * @dev The mint function allows the contract owner to mint new tokens
	 * @param to The address of the account that the tokens are being minted to
	 * @param tokenId The ID of the token being minted
	 * @param amount The amount of tokens being minted
	 * @param data Additional data associated with the minting of the tokens
	 */
	function mint(address to, uint256 tokenId, uint256 amount, bytes memory data) external onlyRole(DEFAULT_ADMIN_ROLE) {
		_mint(to, tokenId, amount, data);
	}

	/**
	 * @dev The operatorBurn function allows a contract operator to burn specific tokens from a specific address
	 * @param account The address from which the tokens are being burned
	 * @param id The ID of the token being burned
	 * @param amount The amount of tokens being burned
	 */
	function operatorBurn(address account, uint256 id, uint256 amount) external onlyRole(BURN_MANAGER_ROLE) {
		_burn(account, id, amount);

		emit OperatorBurn(msg.sender, account, id, amount);
	}

	/**
	 * @dev The burn function allows the contract owner to burn specific tokens from a specific address
	 * @param account The address from which the tokens are being burned
	 * @param id The ID of the token being burned
	 * @param amount The amount of tokens being burned
	 */
	function burn(address account, uint256 id, uint256 amount) public override(IFractions, ERC1155Burnable) {
		super.burn(account, id, amount);
	}

	/**
	 * @dev The grantRole function grants a specific role to a specific account
	 * @param role The bytes32 of the role being granted
	 * @param account The address of the account to which the role is being granted
	 */
	function grantRole(bytes32 role, address account) public override(IFractions, AccessControl) {
		super.grantRole(role, account);
	}

	/**
	 * @dev Check if the tokenId can be transferred by the operator.
	 * If the sale of tokenId has closed, it will check if the tokenId is bought out,
	 * if so, only the operator has the BURN_MANAGER_ROLE or DEFAULT_ADMIN_ROLE can transfer it,
	 * if the token sale has failed, only the operator has BURN_MANAGER_ROLE can transfer it.
	 * if the token sale has not closed yet, it will update the status of the token sale and check again.
	 *
	 * @param tokenId the tokenId to check
	 * @param operator the operator that wants to transfer the token
	 * @param to the address to which the token is being transferred
	 */
	function testTokenTransferability(uint256 tokenId, address operator, address to) public {
		if (isTokenSaleClosed(tokenId)) {
			if (tokenSaleStatus[tokenId] == TokenSaleStatus.SUCCESSFUL) {
				require(
					!isTokenIdBoughtOut[tokenId] || hasRole(DEFAULT_ADMIN_ROLE, operator) || (hasRole(BURN_MANAGER_ROLE, operator) && to == address(0)),
					"AltrFractions: cannot transfer bought out token id"
				);
			} else if (tokenSaleStatus[tokenId] == TokenSaleStatus.FAILED) {
				require(hasRole(BURN_MANAGER_ROLE, operator) && to == address(0), "AltrFractions: cannot trade token whose sale failed");
			} else {
				updateTokenSaleStatus(tokenId);
				testTokenTransferability(tokenId, operator, to);
			}
		}
	}

	/**
	 * @dev Returns the URI of a specific token ID
	 * @param id The token ID
	 * @return The URI of the token ID
	 */
	function uri(uint256 id) public view override returns (string memory) {
		require(exists(id), "AltrFractions: non existent token");
		return string(abi.encodePacked(super.uri(id), id.toString()));
	}

	/**
	 * @dev The supportsInterface function allows to check if the contract implements an interface
	 * @param interfaceId bytes4 identifier of the interface
	 * @return boolean indicating whether the contract supports the interface or not
	 */
	function supportsInterface(bytes4 interfaceId) public view override(AccessControl, ERC1155, IERC165) returns (bool) {
		return interfaceId == type(IFractions).interfaceId || super.supportsInterface(interfaceId);
	}

	/**
	 * @dev the updateTokenSaleStatus function sets the status of the token sale to failed or successful
	 * @param tokenId The tokenId
	 */
	function updateTokenSaleStatus(uint256 tokenId) internal {
		bool isSaleSuccessful = altrFractionsSale.isSaleSuccessful(tokenId);
		if (isSaleSuccessful) {
			tokenSaleStatus[tokenId] = TokenSaleStatus.SUCCESSFUL;
		} else {
			tokenSaleStatus[tokenId] = TokenSaleStatus.FAILED;
		}
	}

	/**
	 * @dev Internal function that is called before a transfer of tokens
	 * @dev It calls the parent implementation of before transfer and call testTokenTransferability for every tokenId
	 * @param operator The address that wants to transfer the token
	 * @param from The address from which the token is being transferred
	 * @param to The address to which the token is being transferred
	 * @param ids The tokenIds of the token being transferred
	 * @param amounts The amounts of the tokens being transferred
	 * @param data Additional data
	 */
	function _beforeTokenTransfer(
		address operator,
		address from,
		address to,
		uint256[] memory ids,
		uint256[] memory amounts,
		bytes memory data
	) internal override(ERC1155, ERC1155Supply) {
		super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
		for (uint256 i = 0; i < ids.length; ++i) {
			uint256 id = ids[i];
			testTokenTransferability(id, operator, to);
		}
	}

	/**
	 * @dev Check if the token sale for a given token ID has closed
	 * @param tokenId the token ID of interest
	 * @return whether the token sale has closed
	 */
	function isTokenSaleClosed(uint256 tokenId) internal view returns (bool) {
		if (closingTimeForTokenSale[tokenId] == 0) {
			return false;
		}
		return block.timestamp > closingTimeForTokenSale[tokenId];
	}
}
