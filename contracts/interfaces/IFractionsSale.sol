// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IFractionsSale {
	struct FractionsSale {
		address initiator;
		address buyTokenManager;
		IERC721 nftCollection;
		uint256 nftId;
		IERC20 buyToken;
		uint256 openingTime;
		uint256 closingTime;
		uint256 fractionPrice;
		uint256 fractionsAmount;
		uint256 minFractionsKept;
		uint256 fractionsSold;
		uint256 saleMinFractions;
	}

	function isSaleClosed(uint256 saleId) external view returns (bool);

	function isSaleSuccessful(uint256 saleId) external view returns (bool);

	function getFractionsSale(uint256 saleId) external view returns (FractionsSale memory);
}
