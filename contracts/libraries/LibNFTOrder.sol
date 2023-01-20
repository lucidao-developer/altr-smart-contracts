// SPDX-License-Identifier: Apache-2.0
/*

  Copyright 2021 ZeroEx Intl.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

*/

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "../interfaces/IPropertyValidator.sol";

/// @dev A library for common NFT order operations.
library LibNFTOrder {
	enum TradeDirection {
		SELL_NFT,
		BUY_NFT
	}

	struct Property {
		IPropertyValidator propertyValidator;
		bytes propertyData;
	}

	struct Fee {
		address recipient;
		uint256 amount;
		bytes feeData;
	}

	struct ERC721Order {
		TradeDirection direction;
		address maker;
		address taker;
		uint256 expiry;
		uint256 nonce;
		IERC20 erc20Token;
		uint256 erc20TokenAmount;
		Fee[] fees;
		IERC721 erc721Token;
		uint256 erc721TokenId;
		Property[] erc721TokenProperties;
	}

	struct ERC1155Order {
		TradeDirection direction;
		address maker;
		address taker;
		uint256 expiry;
		uint256 nonce;
		IERC20 erc20Token;
		uint256 erc20TokenAmount;
		Fee[] fees;
		IERC1155 erc1155Token;
		uint256 erc1155TokenId;
		Property[] erc1155TokenProperties;
		uint128 erc1155TokenAmount;
	}
}
