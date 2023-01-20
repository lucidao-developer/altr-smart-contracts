// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./AltrNftCollateralRetriever1stImpl.sol";

contract AltrNftCollateralRetrieverV3 is AltrNftCollateralRetriever1stImpl {
	function migration(address signer) external {
		require(address(0) == owner(), "Owner already initialized!");
		_transferOwnership(signer);
	}

	function updateCollectionFactory(address newCollectionFactory) public onlyOwner {
		nftCollectionFactory = newCollectionFactory;
	}
}
