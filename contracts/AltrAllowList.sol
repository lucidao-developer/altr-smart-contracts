// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IAllowList.sol";

/**
 * @title AltrAllowList
 * @author Lucidao Developer
 * @dev This contract is used to manage an allowlist of addresses
 * that are allowed to interact with the Altr sale contracts.
 * @dev contract Inherit AccessControl and IAllowList
 * @dev This contract defines a role for managing the allowlist, and it defines
 * functions for allowing and disallowing addresses, as well as a function
 * for checking if an address is allowed.
 */
contract AltrAllowList is AccessControl, IAllowList {
	/**
	 * @dev role name for allowlist manager
	 */
	bytes32 public constant LIST_MANAGER_ROLE = keccak256("LIST_MANAGER_ROLE");

	/**
	 * @dev mapping of addresses to whether they are allowed or not
	 */
	mapping(address => bool) private _isAddressAllowed;

	/**
	 * @dev event emitted when addresses are added to the allowlist
	 */
	event AddressesAllowed(address[] addresses);
	/**
	 * @dev event emitted when addresses are removed from the allowlist
	 */
	event AddressesDisallowed(address[] addresses);

	/**
	 * @dev constructor grant the msg.sender both DEFAULT_ADMIN_ROLE and LIST_MANAGER_ROLE
	 */
	constructor() {
		_grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
		_grantRole(LIST_MANAGER_ROLE, msg.sender);
	}

	/**
	 * @dev function to allow addresses
	 * @param addresses array of addresses to be allowed
	 */
	function allowAddresses(address[] calldata addresses) external onlyRole(LIST_MANAGER_ROLE) {
		_setAddressesStatus(addresses, true);

		emit AddressesAllowed(addresses);
	}

	/**
	 * @dev function to disallow addresses
	 * @param addresses array of addresses to be disallowed
	 */
	function disallowAddresses(address[] calldata addresses) external onlyRole(LIST_MANAGER_ROLE) {
		_setAddressesStatus(addresses, false);

		emit AddressesDisallowed(addresses);
	}

	/**
	 * @dev function to check if an address is allowed
	 * @param user address of the user to check
	 * @return bool value indicating whether the address is allowed
	 */
	function isAddressAllowed(address user) external view returns (bool) {
		return _isAddressAllowed[user];
	}

	/**
	 * @dev function to check if a interface is supported
	 * @param interfaceId bytes4 id of the interface
	 * @return bool value indicating whether the interface is supported
	 */
	function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
		return interfaceId == type(IAllowList).interfaceId || super.supportsInterface(interfaceId);
	}

	/**
	 * @dev internal function to set the status of addresses
	 * @param addresses array of addresses
	 * @param status status to set, true for allowed, false for disallowed
	 */
	function _setAddressesStatus(address[] calldata addresses, bool status) internal {
		for (uint256 i = 0; i < addresses.length; i++) {
			_isAddressAllowed[addresses[i]] = status;
		}
	}
}

