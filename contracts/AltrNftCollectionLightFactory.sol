// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "./AltrNftCollectionLight.sol";
import "./interfaces/INftCollectionLightFactory.sol";

/**
 * @title AltrNftCollectionLightFactory
 * @author Lucidao Developer
 * @notice Factory contract for creating light digitisation certificates from AltrNftCollection contracts
 * @dev Inherits from INftCollectionLightFactory and ERC165 for interface support checks
 */
contract AltrNftCollectionLightFactory is INftCollectionLightFactory, ERC165, Ownable {
	/**
	 * @notice Creates a new AltrNftCollectionLight contract
	 * @dev This function deploys a new AltrNftCollectionLight contract and returns its address
	 * @param name The name of the new NFT collection
	 * @param symbol The symbol of the new NFT collection
	 * @param oracle The address of the oracle to be used in the new NFT collection
	 * @param admin The address to be set as the admin of the new NFT collection
	 * @return The address of the newly created AltrNftCollectionLight contract
	 */
	function create(string calldata name, string calldata symbol, address oracle, address admin) external onlyOwner returns (address) {
		AltrNftCollectionLight collection = new AltrNftCollectionLight(name, symbol, oracle, admin);
		return address(collection);
	}

	/**
	 * @dev Function to check if the contract implements the required interface
	 * @param interfaceId bytes4 The interface identifier
	 * @return bool Returns true if the contract implements the interface, false otherwise
	 */
	function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
		return interfaceId == type(INftCollectionLightFactory).interfaceId || super.supportsInterface(interfaceId);
	}
}
