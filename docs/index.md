# Solidity API

## AltrFeeManager

_This contract facilitates management of fees for all the taxed processes of the Altr protocol._

### SaleInfo

```solidity
struct SaleInfo {
  bool isRedemptionFeePaid;
  uint256 firstSalePrice;
  address redemptionFeeTokenAddress;
}
```

### TRADE_CHECKER_ROLE

```solidity
bytes32 TRADE_CHECKER_ROLE
```

### MAX_REDEMPTION_FEE

```solidity
uint256 MAX_REDEMPTION_FEE
```

_The MAX_REDEMPTION_FEE is a constant variable that holds the maximum fee that can be charged for redemption of the physical assets represented by the NFTs_

### userDiscount

```solidity
mapping(address => bool) userDiscount
```

_The userDiscount mapping allows an owner to specify a discount for certain users when they redeem an NFT_

### salesInfo

```solidity
mapping(address => mapping(uint256 => struct AltrFeeManager.SaleInfo)) salesInfo
```

_The salesInfo mapping stores the information needed for every nft saled by our platform_

### governanceTreasury

```solidity
address governanceTreasury
```

_The governanceTreasury variable holds the address of the Lucidao governance treasury_

### licenseManager

```solidity
address licenseManager
```

_The licenseManager variable holds the address of the license manager contract_

### redemptionFee

```solidity
uint256 redemptionFee
```

_The redemptionFee variable holds the percentage of the first sale price to be paid as fee that is charged for redemption of the physical assets represented by the NFTs._

### buyoutFee

```solidity
uint256 buyoutFee
```

_The protocol fee for fractions buyouts_

### saleFee

```solidity
uint256 saleFee
```

_The protocol fee for fractions sales_

### FeeReceived

```solidity
event FeeReceived(address tokenAddress, uint256 amount, bytes feeData)
```

_The FeeReceived event is emitted when a fee is received_

#### Parameters

| Name         | Type    | Description                                         |
| ------------ | ------- | --------------------------------------------------- |
| tokenAddress | address | The address of the token that the fee was paid with |
| amount       | uint256 | The amount of the fee                               |
| feeData      | bytes   | Additional data about the fee                       |

### RebateReceived

```solidity
event RebateReceived(address receiver, address tokenAddress, uint256 amount, bytes feeData)
```

_The RebateReceived event is emitted when a rebate is received by a user_

#### Parameters

| Name         | Type    | Description                                            |
| ------------ | ------- | ------------------------------------------------------ |
| receiver     | address | The address of the user that received the rebate       |
| tokenAddress | address | The address of the token that the rebate was paid with |
| amount       | uint256 | The amount of the rebate                               |
| feeData      | bytes   | Additional data about the rebate                       |

### GovernanceTreasuryChanged

```solidity
event GovernanceTreasuryChanged(address governanceTreasury)
```

_The GovernanceTreasuryChanged event is emitted when the governance treasury address is changed_

#### Parameters

| Name               | Type    | Description                                |
| ------------------ | ------- | ------------------------------------------ |
| governanceTreasury | address | The new address of the governance treasury |

### LicenseManagerChanged

```solidity
event LicenseManagerChanged(address licenseManager)
```

_The LicenseManagerChanged event is emitted when the license manager address is changed_

#### Parameters

| Name           | Type    | Description                                     |
| -------------- | ------- | ----------------------------------------------- |
| licenseManager | address | The new address of the license manager contract |

### Received

```solidity
event Received(address sender, uint256 amount)
```

_The Received event is emitted when Ether is received by the contract_

#### Parameters

| Name   | Type    | Description                     |
| ------ | ------- | ------------------------------- |
| sender | address | The address that sent the Ether |
| amount | uint256 | The amount of Ether received    |

### RedemptionFeePaid

```solidity
event RedemptionFeePaid(address nftCollection, uint256 tokenId, address sender, uint256 fee)
```

_The RedemptionFeePaid event is emitted when a redemption fee is paid for a specific NFT_

#### Parameters

| Name          | Type    | Description                                               |
| ------------- | ------- | --------------------------------------------------------- |
| nftCollection | address | The address of the NFT collection that the NFT belongs to |
| tokenId       | uint256 | The ID of the NFT for which the redemption fee was paid   |
| sender        | address | The address of the user that paid the redemption fee      |
| fee           | uint256 | The amount of the redemption fee                          |

### RedemptionFeeSet

```solidity
event RedemptionFeeSet(uint256 redemptionFee)
```

_The RedemptionFeeSet event is emitted when the redemption fee is set_

#### Parameters

| Name          | Type    | Description                   |
| ------------- | ------- | ----------------------------- |
| redemptionFee | uint256 | The new redemption fee amount |

### SaleInfoSet

```solidity
event SaleInfoSet(address nftCollection, uint256 tokenId, address redemptionFeeTokenAddress, uint256 price)
```

_The SaleInfoSet event is emitted when the sale info is set_

#### Parameters

| Name                      | Type    | Description                                |
| ------------------------- | ------- | ------------------------------------------ |
| nftCollection             | address | The address of the nft collection contract |
| tokenId                   | uint256 | The token id of the nft collection         |
| redemptionFeeTokenAddress | address | The new redemption fee token address       |
| price                     | uint256 | The price of the first sale of the token   |

### BuyoutFeeSet

```solidity
event BuyoutFeeSet(uint256 buyoutFee)
```

_Emitted when the fractions buyout fee is set_

#### Parameters

| Name      | Type    | Description                  |
| --------- | ------- | ---------------------------- |
| buyoutFee | uint256 | The new fractions buyout fee |

### SaleFeeSet

```solidity
event SaleFeeSet(uint256 saleFee)
```

_Emitted when the fractions sale fee is set_

#### Parameters

| Name    | Type    | Description                |
| ------- | ------- | -------------------------- |
| saleFee | uint256 | The new fractions sale fee |

### feeChecker

```solidity
modifier feeChecker(uint256 fee)
```

_check that fee is included in boundaries_

#### Parameters

| Name | Type    | Description      |
| ---- | ------- | ---------------- |
| fee  | uint256 | The fee to check |

### constructor

```solidity
constructor() public
```

### receive

```solidity
receive() external payable
```

_The receive function allows the contract to receive Ether_

### receiveZeroExFeeCallback

```solidity
function receiveZeroExFeeCallback(address tokenAddress, uint256 amount, bytes feeData) external returns (bytes4 success)
```

_The receiveZeroExFeeCallback function handles the callback from 0x protocol
when the order is filled and fees are paid._

#### Parameters

| Name         | Type    | Description                                         |
| ------------ | ------- | --------------------------------------------------- |
| tokenAddress | address | The address of the token that the fee was paid with |
| amount       | uint256 | The amount of the fee                               |
| feeData      | bytes   | Additional data about the fee                       |

#### Return Values

| Name    | Type   | Description |
| ------- | ------ | ----------- |
| success | bytes4 | bytes4      |

### setGovernanceTreasury

```solidity
function setGovernanceTreasury(address governanceTreasury_) external
```

_The setGovernanceTreasury function allows the owner to set the governance treasury address_

#### Parameters

| Name                 | Type    | Description                         |
| -------------------- | ------- | ----------------------------------- |
| governanceTreasury\_ | address | The new governance treasury address |

### setLicenseManager

```solidity
function setLicenseManager(address licenseManager_) external
```

_The setLicenseManager function allows the owner to set the address of the license manager contract_

#### Parameters

| Name             | Type    | Description                                     |
| ---------------- | ------- | ----------------------------------------------- |
| licenseManager\_ | address | The new address of the license manager contract |

### setRedemptionFee

```solidity
function setRedemptionFee(uint256 redemptionFee_) external
```

_The setRedemptionFee function allows the owner to set the amount of the redemption fee_

#### Parameters

| Name            | Type    | Description                          |
| --------------- | ------- | ------------------------------------ |
| redemptionFee\_ | uint256 | The new amount of the redemption fee |

### setSaleInfo

```solidity
function setSaleInfo(address nftCollection, uint256 tokenId, address redemptionFeeTokenAddress, uint256 price) external
```

_The setRedemptionFeeTokenAddress function allows the sale contract to set the address of the token that will be used to pay the redemption fee_

#### Parameters

| Name                      | Type    | Description                                 |
| ------------------------- | ------- | ------------------------------------------- |
| nftCollection             | address | The address of the nft collection contract  |
| tokenId                   | uint256 | The token id of the nft collection          |
| redemptionFeeTokenAddress | address | The new address of the redemption fee token |
| price                     | uint256 | The first price of sale                     |

### payRedemptionFee

```solidity
function payRedemptionFee(address nftCollection, uint256 tokenId) external
```

_The payRedemptionFee function allows a user to pay the redemption fee for a specific NFT_

#### Parameters

| Name          | Type    | Description                                                  |
| ------------- | ------- | ------------------------------------------------------------ |
| nftCollection | address | The address of the NFT collection that the NFT belongs to    |
| tokenId       | uint256 | The ID of the NFT for which the redemption fee is being paid |

### setBuyoutFee

```solidity
function setBuyoutFee(uint256 _buyoutFee) external
```

_Allows an admin to set the protocol fee for the buyout of fractions_

#### Parameters

| Name        | Type    | Description          |
| ----------- | ------- | -------------------- |
| \_buyoutFee | uint256 | The new protocol fee |

### setSaleFee

```solidity
function setSaleFee(uint256 _saleFee) external
```

_Allows an admin to set the protocol fee for the sale of fractions_

#### Parameters

| Name      | Type    | Description          |
| --------- | ------- | -------------------- |
| \_saleFee | uint256 | The new protocol fee |

### initialize

```solidity
function initialize(address governanceTreasury_, address licenseManager_, uint256 redemptionFee_, uint256 buyoutFee_, uint256 saleFee_) external
```

_The initialize function allows the contract owner to set the governance treasury address, license manager address and redemption fee_

#### Parameters

| Name                 | Type    | Description                                 |
| -------------------- | ------- | ------------------------------------------- |
| governanceTreasury\_ | address | The address of the governance treasury      |
| licenseManager\_     | address | The address of the license manager contract |
| redemptionFee\_      | uint256 | The amount of the redemption fee            |
| buyoutFee\_          | uint256 |                                             |
| saleFee\_            | uint256 |                                             |

### isRedemptionFeePaid

```solidity
function isRedemptionFeePaid(address nftCollection, uint256 tokenId) external view returns (bool feePaid)
```

_The isRedemptionFeePaid function returns whether or not the redemption fee has been paid for a specific NFT_

#### Parameters

| Name          | Type    | Description                                                 |
| ------------- | ------- | ----------------------------------------------------------- |
| nftCollection | address | The address of the NFT collection that the NFT belongs to   |
| tokenId       | uint256 | The ID of the NFT for which the fee status is being checked |

#### Return Values

| Name    | Type | Description                                                                                |
| ------- | ---- | ------------------------------------------------------------------------------------------ |
| feePaid | bool | A boolean indicating whether or not the redemption fee has been paid for the specified NFT |

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_The supportsInterface function allows to check if this contract implement a specific interface._

#### Parameters

| Name        | Type   | Description              |
| ----------- | ------ | ------------------------ |
| interfaceId | bytes4 | the interfaceId to check |

#### Return Values

| Name | Type | Description                                                                         |
| ---- | ---- | ----------------------------------------------------------------------------------- |
| [0]  | bool | bool a boolean indicating whether this contract implement the specified interfaceId |

### \_transferEth

```solidity
function _transferEth(address payable recipient, uint256 amount) internal
```

_The \_transferEth function allows to transfer eth to a specific recipient_

#### Parameters

| Name      | Type            | Description                   |
| --------- | --------------- | ----------------------------- |
| recipient | address payable | The address of the recipient  |
| amount    | uint256         | The amount of eth to transfer |

### \_setGovernanceTreasury

```solidity
function _setGovernanceTreasury(address governanceTreasury_) internal
```

_The \_setGovernanceTreasury function allows to set the governanceTreasury address_

#### Parameters

| Name                 | Type    | Description                        |
| -------------------- | ------- | ---------------------------------- |
| governanceTreasury\_ | address | The new governanceTreasury address |

### \_setLicenseManager

```solidity
function _setLicenseManager(address licenseManager_) internal
```

_The \_setLicenseManager function allows to set the licenseManager address_

#### Parameters

| Name             | Type    | Description                    |
| ---------------- | ------- | ------------------------------ |
| licenseManager\_ | address | The new licenseManager address |

### \_setRedemptionFee

```solidity
function _setRedemptionFee(uint256 redemptionFee_) internal
```

_The \_setRedemptionFee function allows to set the redemptionFee_

#### Parameters

| Name            | Type    | Description           |
| --------------- | ------- | --------------------- |
| redemptionFee\_ | uint256 | The new redemptionFee |

### \_setRedemptionFeeTokenAddress

```solidity
function _setRedemptionFeeTokenAddress(address nftCollection, uint256 tokenId, address redemptionFeeTokenAddress_) internal
```

_The \_setRedemptionFeeTokenAddress function allows to set the redemptionFeeTokenAddress_

#### Parameters

| Name                        | Type    | Description                                |
| --------------------------- | ------- | ------------------------------------------ |
| nftCollection               | address | The address of the nft collection contract |
| tokenId                     | uint256 | The token id of the nft collection         |
| redemptionFeeTokenAddress\_ | address | The new redemptionFeeTokenAddress          |

### \_\_AltrFeeManager_init

```solidity
function __AltrFeeManager_init(address governanceTreasury_, address licenseManager_, uint256 redemptionFee_, uint256 buyoutFee_, uint256 saleFee_) internal
```

### \_\_AltrFeeManager_init_unchained

```solidity
function __AltrFeeManager_init_unchained(address governanceTreasury_, address licenseManager_, uint256 redemptionFee_, uint256 buyoutFee_, uint256 saleFee_) internal
```

### \_setBuyoutFee

```solidity
function _setBuyoutFee(uint256 _buyoutFee) internal
```

_Sets the protocol fee for the buyout of fractions_

#### Parameters

| Name        | Type    | Description                                      |
| ----------- | ------- | ------------------------------------------------ |
| \_buyoutFee | uint256 | The new protocol fee for the buyout of fractions |

### \_setSaleFee

```solidity
function _setSaleFee(uint256 _saleFee) internal
```

_Sets the protocol fee for the sale of fractions_

#### Parameters

| Name      | Type    | Description                                    |
| --------- | ------- | ---------------------------------------------- |
| \_saleFee | uint256 | The new protocol fee for the sale of fractions |

## AltrFractionsBuyout

_This contract allows for the buyout of fractional token sales on the Altr platform._

### Buyout

```solidity
struct Buyout {
  address initiator;
  uint256 fractionSaleId;
  address buyoutTokenManager;
  contract IERC20 buyoutToken;
  uint256 buyoutPrice;
  uint256 openingTime;
  uint256 closingTime;
  bool isSuccessful;
}
```

### BURN_MANAGER_ROLE

```solidity
bytes32 BURN_MANAGER_ROLE
```

_BURN_MANAGER_ROLE is the role assigned to the address that can call the burn function_

### altrFractions

```solidity
contract IFractions altrFractions
```

_The AltrFractions contract_

### altrFractionsSale

```solidity
contract IFractionsSale altrFractionsSale
```

_The AltrFractionsSale contract_

### buyoutMinFractions

```solidity
uint256 buyoutMinFractions
```

_The minimum number of fractions required to initiate a buyout_

### feeManager

```solidity
contract IFeeManager feeManager
```

_The AltrFeeManager contract._

### buyoutOpenTimePeriod

```solidity
uint256 buyoutOpenTimePeriod
```

_The duration of the buyout open period in seconds_

### buyouts

```solidity
mapping(uint256 => struct AltrFractionsBuyout.Buyout) buyouts
```

### BuyoutRequested

```solidity
event BuyoutRequested(uint256 saleId, address initiator, uint256 buyoutId)
```

_Emitted when a buyout request is made_

#### Parameters

| Name      | Type    | Description                     |
| --------- | ------- | ------------------------------- |
| saleId    | uint256 | ID of the sale                  |
| initiator | address | Address of the buyout initiator |
| buyoutId  | uint256 | ID of the buyout                |

### BuyoutParamsSet

```solidity
event BuyoutParamsSet(uint256 buyoutId, struct AltrFractionsBuyout.Buyout buyout)
```

_Emitted when the buyout parameters are set_

#### Parameters

| Name     | Type                              | Description                                    |
| -------- | --------------------------------- | ---------------------------------------------- |
| buyoutId | uint256                           | ID of the buyout                               |
| buyout   | struct AltrFractionsBuyout.Buyout | Buyout struct containing the buyout parameters |

### BuyoutExecuted

```solidity
event BuyoutExecuted(uint256 buyoutId, address executor, uint256 boughtOutFractions, uint256 buyoutAmount)
```

_Emitted when a buyout is executed_

#### Parameters

| Name               | Type    | Description                    |
| ------------------ | ------- | ------------------------------ |
| buyoutId           | uint256 | ID of the buyout               |
| executor           | address | Address of the buyout executor |
| boughtOutFractions | uint256 | Amount of fractions bought out |
| buyoutAmount       | uint256 | Amount paid for the buyout     |

### ProtocolFeeSet

```solidity
event ProtocolFeeSet(uint256 protocolFee)
```

_Emitted when the protocol fee is set_

#### Parameters

| Name        | Type    | Description                   |
| ----------- | ------- | ----------------------------- |
| protocolFee | uint256 | The value of the protocol fee |

### BuyoutMinFractionsSet

```solidity
event BuyoutMinFractionsSet(uint256 buyoutMinFractions)
```

_Emitted when the minimum fractions required for a buyout is set_

#### Parameters

| Name               | Type    | Description                                              |
| ------------------ | ------- | -------------------------------------------------------- |
| buyoutMinFractions | uint256 | The value of the minimum fractions required for a buyout |

### BuyoutOpenTimePeriodSet

```solidity
event BuyoutOpenTimePeriodSet(uint256 buyoutOpenTimePeriod)
```

_Emitted when the time period for a buyout to be open is set_

#### Parameters

| Name                 | Type    | Description                             |
| -------------------- | ------- | --------------------------------------- |
| buyoutOpenTimePeriod | uint256 | The time period for a buyout to be open |

### FeeManagerSet

```solidity
event FeeManagerSet(address feeManager)
```

_Emitted when the fee manager is set_

#### Parameters

| Name       | Type    | Description                          |
| ---------- | ------- | ------------------------------------ |
| feeManager | address | The new fee manager contract address |

### onlyIfSaleClosed

```solidity
modifier onlyIfSaleClosed(uint256 saleId)
```

_Rejects calls if the specified sale is not closed yet_

#### Parameters

| Name   | Type    | Description       |
| ------ | ------- | ----------------- |
| saleId | uint256 | The sale to check |

### onlyBeforeBuyoutOpen

```solidity
modifier onlyBeforeBuyoutOpen(uint256 buyoutId)
```

_Rejects calls if the specified buyout has already started_

#### Parameters

| Name     | Type    | Description         |
| -------- | ------- | ------------------- |
| buyoutId | uint256 | The buyout to check |

### onlyWhileBuyoutOpen

```solidity
modifier onlyWhileBuyoutOpen(uint256 buyoutId)
```

_Rejects calls if the specified buyout is not open yet_

#### Parameters

| Name     | Type    | Description         |
| -------- | ------- | ------------------- |
| buyoutId | uint256 | The buyout to check |

### constructor

```solidity
constructor(contract IFractions _altrFractions, contract IFractionsSale _altrFractionsSale, address _feeManager, uint256 _buyoutMinFractions, uint256 _buyoutOpenTimePeriod) public
```

_Constructor function to initialize the AltrFractionsBuyout contract_

#### Parameters

| Name                   | Type                    | Description                                                                             |
| ---------------------- | ----------------------- | --------------------------------------------------------------------------------------- |
| \_altrFractions        | contract IFractions     | Address of the IFractions contract that holds the token fractions                       |
| \_altrFractionsSale    | contract IFractionsSale | Address of the IFractionsSale contract that holds the information of the fractions sale |
| \_feeManager           | address                 | Address of the feeManager contract that manages the buyout fee                          |
| \_buyoutMinFractions   | uint256                 | Minimum fractions required for a sale to be boughtOut                                   |
| \_buyoutOpenTimePeriod | uint256                 | Time duration for the buyout to be open                                                 |

### requestBuyout

```solidity
function requestBuyout(uint256 saleId) external
```

_Initiates a buyout request for a sale_

#### Parameters

| Name   | Type    | Description              |
| ------ | ------- | ------------------------ |
| saleId | uint256 | The sale to be boughtOut |

### setBuyoutParams

```solidity
function setBuyoutParams(uint256 buyoutId, uint256 buyoutPrice) external
```

_Sets the parameters for a buyout request_

#### Parameters

| Name        | Type    | Description                          |
| ----------- | ------- | ------------------------------------ |
| buyoutId    | uint256 | The buyout to set the parameters for |
| buyoutPrice | uint256 | The price for buyout the tokens      |

### buyoutUnsupervised

```solidity
function buyoutUnsupervised(uint256 saleId) external
```

Only 100% fractions holder can execute this function

_Executes a buyout request for 100% fractions holder_

#### Parameters

| Name   | Type    | Description                  |
| ------ | ------- | ---------------------------- |
| saleId | uint256 | The ID of the sale to buyout |

### executeBuyout

```solidity
function executeBuyout(uint256 buyoutId) external
```

This function can only be executed after a buyout has been requested and the buyout params have been set

_Executes a buyout request_

#### Parameters

| Name     | Type    | Description               |
| -------- | ------- | ------------------------- |
| buyoutId | uint256 | The buyout to be executed |

### setBuyoutMinFractions

```solidity
function setBuyoutMinFractions(uint256 _buyoutMinFractions) external
```

_Set the minimum number of fractions required to initiate a buyout_

#### Parameters

| Name                 | Type    | Description                                         |
| -------------------- | ------- | --------------------------------------------------- |
| \_buyoutMinFractions | uint256 | The minimum number of fractions required for buyout |

### setBuyoutOpenTimePeriod

```solidity
function setBuyoutOpenTimePeriod(uint256 _buyoutOpenTimePeriod) external
```

_Sets the time period for buyout to be open_

#### Parameters

| Name                   | Type    | Description                               |
| ---------------------- | ------- | ----------------------------------------- |
| \_buyoutOpenTimePeriod | uint256 | The new time period for buyout to be open |

### setFeeManager

```solidity
function setFeeManager(address _feeManager) external
```

@dev Sets the address of the fee manager

#### Parameters

| Name         | Type    | Description                    |
| ------------ | ------- | ------------------------------ |
| \_feeManager | address | The address of the fee manager |

### isBeforeBuyoutOpen

```solidity
function isBeforeBuyoutOpen(uint256 buyoutId) public view returns (bool)
```

_Returns true if the buyout has not yet started_

#### Parameters

| Name     | Type    | Description          |
| -------- | ------- | -------------------- |
| buyoutId | uint256 | The id of the buyout |

#### Return Values

| Name | Type | Description                                             |
| ---- | ---- | ------------------------------------------------------- |
| [0]  | bool | true if the buyout has not yet started, otherwise false |

### isBuyoutOpen

```solidity
function isBuyoutOpen(uint256 buyoutId) public view returns (bool)
```

_Check if the buyout with the given id is still open_

#### Parameters

| Name     | Type    | Description                   |
| -------- | ------- | ----------------------------- |
| buyoutId | uint256 | The id of the buyout to check |

#### Return Values

| Name | Type | Description                                 |
| ---- | ---- | ------------------------------------------- |
| [0]  | bool | true if the buyout is open, false otherwise |

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view returns (bool)
```

_Check whether the contract implements a specific interface_

#### Parameters

| Name        | Type   | Description                                 |
| ----------- | ------ | ------------------------------------------- |
| interfaceId | bytes4 | The interface identifier, as a 4-byte value |

#### Return Values

| Name | Type | Description                                                    |
| ---- | ---- | -------------------------------------------------------------- |
| [0]  | bool | true if the contract implements the interface, false otherwise |

### canDoBuyout

```solidity
function canDoBuyout(address buyoutInitiator, uint256 saleId) public view returns (bool)
```

_Determine if the buyout initiator has enough fractions to perform a buyout_

#### Parameters

| Name            | Type    | Description                         |
| --------------- | ------- | ----------------------------------- |
| buyoutInitiator | address | the address of the buyout initiator |
| saleId          | uint256 | the ID of the sale                  |

#### Return Values

| Name | Type | Description                                                |
| ---- | ---- | ---------------------------------------------------------- |
| [0]  | bool | boolean indicating if the buyout initiator can do a buyout |

### buyoutsCounter

```solidity
function buyoutsCounter() public view returns (uint256)
```

_returns the current number of buyouts_

#### Return Values

| Name | Type    | Description                       |
| ---- | ------- | --------------------------------- |
| [0]  | uint256 | uint256 current number of buyouts |

### \_setBuyoutMinFractions

```solidity
function _setBuyoutMinFractions(uint256 _buyoutMinFractions) internal
```

_sets the minimum number of fractions required for buyout_

#### Parameters

| Name                 | Type    | Description                                            |
| -------------------- | ------- | ------------------------------------------------------ |
| \_buyoutMinFractions | uint256 | The minimum number of fractions that can be bought out |

### \_setFeeManager

```solidity
function _setFeeManager(address _feeManager) internal
```

_sets the feeManager address. Only callable by contracts's admin role_

#### Parameters

| Name         | Type    | Description                             |
| ------------ | ------- | --------------------------------------- |
| \_feeManager | address | The address of the fee manager contract |

### \_setBuyoutOpenTimePeriod

```solidity
function _setBuyoutOpenTimePeriod(uint256 _buyoutOpenTimePeriod) internal
```

_sets the time period during which a buyout can be executed_

#### Parameters

| Name                   | Type    | Description                                           |
| ---------------------- | ------- | ----------------------------------------------------- |
| \_buyoutOpenTimePeriod | uint256 | The time period during which a buyout can be executed |

## AltrFractionsSale

_Contract that manages fractional ownership of ERC721/1155 tokens through sales.
It has a built in access control that allow only specific roles to perform certain actions.
It also has a built in reentrancy guard to prevent reentrancy attacks.
The contract also has a tiered pricing mechanism where the price limits and the corresponding fractions are set in the constructor.
The contract also has a mechanism for setting a protocol fee, governance treasury and a allowlist.
The contract implements ERC721Holder and ERC1155Holder for holding ERC721 and ERC1155 token respectively
The contract implements Initializable to set a referece to Buyout contract only once.
It also implements IFractionsSale for creating and managing fractional ownership of tokens through sales._

### SALE_ISSUER_ROLE

```solidity
bytes32 SALE_ISSUER_ROLE
```

### BURN_MANAGER_ROLE

```solidity
bytes32 BURN_MANAGER_ROLE
```

### altrFractions

```solidity
contract IFractions altrFractions
```

_The address of the AltrFractions contract instance_

### allowList

```solidity
contract IAllowList allowList
```

_The address of the IAllowList contract instance_

### altrFractionsBuyout

```solidity
address altrFractionsBuyout
```

_The address of the AltrFractionsBuyout contract_

### feeManager

```solidity
contract IFeeManager feeManager
```

_The AltrFeeManager contract._

### NewFractionsSale

```solidity
event NewFractionsSale(uint256 saleId, struct IFractionsSale.FractionsSale fractionsSale)
```

_Emitted when a new fractions sale is created_

#### Parameters

| Name          | Type                                | Description                                         |
| ------------- | ----------------------------------- | --------------------------------------------------- |
| saleId        | uint256                             | The ID of the sale                                  |
| fractionsSale | struct IFractionsSale.FractionsSale | The struct containing details of the Fractions sale |

### FractionsPurchased

```solidity
event FractionsPurchased(uint256 saleId, address beneficiary, uint256 fractionsAmount)
```

_Emitted when someone purchases fractions_

#### Parameters

| Name            | Type    | Description                                                |
| --------------- | ------- | ---------------------------------------------------------- |
| saleId          | uint256 | The ID of the sale                                         |
| beneficiary     | address | The address of the beneficiary who purchased the fractions |
| fractionsAmount | uint256 | The amount of fractions purchased                          |

### FractionsKeptWithdrawn

```solidity
event FractionsKeptWithdrawn(uint256 saleId, address beneficiary, uint256 amount)
```

_Emitted when a sale issuer withdraws fractions that were kept_

#### Parameters

| Name        | Type    | Description                                               |
| ----------- | ------- | --------------------------------------------------------- |
| saleId      | uint256 | The ID of the sale                                        |
| beneficiary | address | The address of the beneficiary who withdrew the fractions |
| amount      | uint256 | The amount of fractions withdrawn                         |

### FailedSaleNftWithdrawn

```solidity
event FailedSaleNftWithdrawn(uint256 saleId, address beneficiary, address nftCollection, uint256 nftId)
```

_Emitted when an NFT is withdrawn from a failed sale_

#### Parameters

| Name          | Type    | Description                                                        |
| ------------- | ------- | ------------------------------------------------------------------ |
| saleId        | uint256 | The ID of the sale                                                 |
| beneficiary   | address | The address of the beneficiary who withdrew the NFT                |
| nftCollection | address | The address of the NFT collection from which the NFT was withdrawn |
| nftId         | uint256 | The ID of the withdrawn NFT                                        |

### TiersSet

```solidity
event TiersSet(uint256[] priceLimits, uint256[] fractionsAmounts)
```

_Emitted when the fraction amount tiers are set_

#### Parameters

| Name             | Type      | Description                                  |
| ---------------- | --------- | -------------------------------------------- |
| priceLimits      | uint256[] | The array of price limits for the tiers      |
| fractionsAmounts | uint256[] | The array of fractions amounts for the tiers |

### AllowListSet

```solidity
event AllowListSet(address allowList)
```

_Emitted when the allow list is set_

#### Parameters

| Name      | Type    | Description                                |
| --------- | ------- | ------------------------------------------ |
| allowList | address | The address of the new allow list contract |

### FractionsBuyoutAddressSet

```solidity
event FractionsBuyoutAddressSet(address fractionsBuyout)
```

_Emitted when the fractions buyout address is set_

#### Parameters

| Name            | Type    | Description                                      |
| --------------- | ------- | ------------------------------------------------ |
| fractionsBuyout | address | The address of the new fractions buyout contract |

### FeeManagerSet

```solidity
event FeeManagerSet(address feeManager)
```

_Emitted when the fee manager is set_

#### Parameters

| Name       | Type    | Description                          |
| ---------- | ------- | ------------------------------------ |
| feeManager | address | The new fee manager contract address |

### onlyWhileSaleOpen

```solidity
modifier onlyWhileSaleOpen(uint256 saleId)
```

_Modifier that allows a function to only be executed when the sale is open_

#### Parameters

| Name   | Type    | Description    |
| ------ | ------- | -------------- |
| saleId | uint256 | ID of the sale |

### onlyIfSaleClosed

```solidity
modifier onlyIfSaleClosed(uint256 saleId)
```

_Modifier that allows a function to only be executed when the sale is closed_

#### Parameters

| Name   | Type    | Description    |
| ------ | ------- | -------------- |
| saleId | uint256 | ID of the sale |

### constructor

```solidity
constructor(contract IFractions _altrFractions, address _feeManager, address _allowList, uint256[] _priceLimits, uint256[] _fractionsAmounts) public
```

_Constructor to initialize the AltrFractionsSale contract_

#### Parameters

| Name               | Type                | Description                                                    |
| ------------------ | ------------------- | -------------------------------------------------------------- |
| \_altrFractions    | contract IFractions | The address of the IFractions contract to be used in the sale  |
| \_feeManager       | address             | Address of the feeManager contract that manages the sale fee   |
| \_allowList        | address             | The address of the contract that will hold the allowlist       |
| \_priceLimits      | uint256[]           | Array of price limits for the different tiers of the sale      |
| \_fractionsAmounts | uint256[]           | Array of fractions amounts for the different tiers of the sale |

### setupSale

```solidity
function setupSale(contract IERC721 nftCollection, uint256 nftId, contract IERC20 buyToken, uint256 openingTime, uint256 closingTime, uint256 totalPrice, uint256 minFractionsKept, uint256 saleMinFractions) external
```

If the sale reach the saleMinFractions but does not run out of fractions the sale initiator can keep more fractions than the minimum

_Creates a new fraction sale.
It deploys a new contract that manages the buyTokens(if the sale will succeed it will pay the seller, if not refund the buyers)_

#### Parameters

| Name             | Type             | Description                                                                     |
| ---------------- | ---------------- | ------------------------------------------------------------------------------- |
| nftCollection    | contract IERC721 | The ERC721 contract that holds the NFT to be sold                               |
| nftId            | uint256          | The ID of the NFT to be sold                                                    |
| buyToken         | contract IERC20  | The ERC20 token that will be used to purchase fractions                         |
| openingTime      | uint256          | The timestamp when the sale will open                                           |
| closingTime      | uint256          | The timestamp when the sale will close                                          |
| totalPrice       | uint256          | The total price of the NFT being sold                                           |
| minFractionsKept | uint256          | The minimum number of fractions that the initiator will keep                    |
| saleMinFractions | uint256          | The minimum number of fractions that must be sold for the sale to be successful |

### buyFractions

```solidity
function buyFractions(uint256 saleId, uint256 amount) external
```

The sale must be open
The user's address must be allowed by the allowlist
There must be enough fractions available for sale
The user must send enough funds to cover the cost of the fractions

_Allows a user to buy fractions from a sale_

#### Parameters

| Name   | Type    | Description                                |
| ------ | ------- | ------------------------------------------ |
| saleId | uint256 | ID of the sale from which to buy fractions |
| amount | uint256 | Number of fractions to buy                 |

### withdrawFractionsKept

```solidity
function withdrawFractionsKept(uint256 saleId) external
```

Allows the initiator of the sale to withdraw the fractions kept from the sale

_The initiator can withdraw the fractions kept after the sale is closed and successful_

#### Parameters

| Name   | Type    | Description                                                    |
| ------ | ------- | -------------------------------------------------------------- |
| saleId | uint256 | ID of the sale from which the fractions kept will be withdrawn |

### withdrawFailedSaleNft

```solidity
function withdrawFailedSaleNft(uint256 saleId) external
```

_Allows the initiator of the sale to withdraw the NFT that was put up for sale,
in case the sale was not successful and the minimum fractions were not sold._

#### Parameters

| Name   | Type    | Description                                        |
| ------ | ------- | -------------------------------------------------- |
| saleId | uint256 | The ID of the sale from which to withdraw the NFT. |

### setAllowList

```solidity
function setAllowList(address _allowList) external
```

_Allows the contract owner to set the allowList address._

#### Parameters

| Name        | Type    | Description                |
| ----------- | ------- | -------------------------- |
| \_allowList | address | The new allowList address. |

### setTiers

```solidity
function setTiers(uint256[] priceLimits, uint256[] fractionsAmounts) external
```

_Allows the contract owner to set the tiers for the sale._

#### Parameters

| Name             | Type      | Description                          |
| ---------------- | --------- | ------------------------------------ |
| priceLimits      | uint256[] | The price limits for the tiers.      |
| fractionsAmounts | uint256[] | The fractions amounts for the tiers. |

### setFractionsBuyout

```solidity
function setFractionsBuyout(address fractionsBuyoutAddress) external
```

_Function that sets the address of buyout contract for the fractions_

#### Parameters

| Name                   | Type    | Description                    |
| ---------------------- | ------- | ------------------------------ |
| fractionsBuyoutAddress | address | address of the buyout contract |

### setFeeManager

```solidity
function setFeeManager(address _feeManager) external
```

@dev Sets the address of the fee manager.

#### Parameters

| Name         | Type    | Description                     |
| ------------ | ------- | ------------------------------- |
| \_feeManager | address | The address of the fee manager. |

### getFractionsSale

```solidity
function getFractionsSale(uint256 saleId) external view returns (struct IFractionsSale.FractionsSale)
```

_Function that gets the sale details of the fraction sale by its saleId_

#### Parameters

| Name   | Type    | Description                 |
| ------ | ------- | --------------------------- |
| saleId | uint256 | saleId of the fraction sale |

#### Return Values

| Name | Type                                | Description                             |
| ---- | ----------------------------------- | --------------------------------------- |
| [0]  | struct IFractionsSale.FractionsSale | Returns the FractionsSale memory struct |

### onERC721Received

```solidity
function onERC721Received(address operator, address from, uint256 tokenId, bytes data) public returns (bytes4)
```

This function throws an error if the operator is not the contract address.

_This function is called when an ERC721 token is received by the contract_

#### Parameters

| Name     | Type    | Description                                                           |
| -------- | ------- | --------------------------------------------------------------------- |
| operator | address | The address that called the function (i.e. the ERC721 smart contract) |
| from     | address | The address that sent the token                                       |
| tokenId  | uint256 | The id of the token being received                                    |
| data     | bytes   | Additional data with the transaction                                  |

#### Return Values

| Name | Type   | Description                                          |
| ---- | ------ | ---------------------------------------------------- |
| [0]  | bytes4 | bytes4 The function signature of the successful call |

### onERC1155Received

```solidity
function onERC1155Received(address operator, address from, uint256 tokenId, uint256 amount, bytes data) public returns (bytes4)
```

This function throws an error if the operator is not the contract address.

_This function is called when an ERC1155 token is received by the contract_

#### Parameters

| Name     | Type    | Description                                                            |
| -------- | ------- | ---------------------------------------------------------------------- |
| operator | address | The address that called the function (i.e. the ERC1155 smart contract) |
| from     | address | The address that sent the token                                        |
| tokenId  | uint256 | The id of the token being received                                     |
| amount   | uint256 | The amount of tokens being received                                    |
| data     | bytes   | Additional data with the transaction                                   |

#### Return Values

| Name | Type   | Description                                          |
| ---- | ------ | ---------------------------------------------------- |
| [0]  | bytes4 | bytes4 The function signature of the successful call |

### isSaleClosed

```solidity
function isSaleClosed(uint256 saleId) public view returns (bool)
```

_Check if a sale is closed_

#### Parameters

| Name   | Type    | Description    |
| ------ | ------- | -------------- |
| saleId | uint256 | ID of the sale |

#### Return Values

| Name | Type | Description                                 |
| ---- | ---- | ------------------------------------------- |
| [0]  | bool | true if the sale is closed, otherwise false |

### isSaleOpen

```solidity
function isSaleOpen(uint256 saleId) public view returns (bool)
```

_Check if a sale is open_

#### Parameters

| Name   | Type    | Description    |
| ------ | ------- | -------------- |
| saleId | uint256 | ID of the sale |

#### Return Values

| Name | Type | Description                               |
| ---- | ---- | ----------------------------------------- |
| [0]  | bool | true if the sale is open, otherwise false |

### isSaleSuccessful

```solidity
function isSaleSuccessful(uint256 saleId) public view returns (bool)
```

_Check if a sale is successful_

#### Parameters

| Name   | Type    | Description    |
| ------ | ------- | -------------- |
| saleId | uint256 | ID of the sale |

#### Return Values

| Name | Type | Description                                     |
| ---- | ---- | ----------------------------------------------- |
| [0]  | bool | true if the sale is successful, otherwise false |

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view returns (bool)
```

_function to check if the contract support a given interface._

#### Parameters

| Name        | Type   | Description                                 |
| ----------- | ------ | ------------------------------------------- |
| interfaceId | bytes4 | The interface id of the interface to check. |

#### Return Values

| Name | Type | Description                                          |
| ---- | ---- | ---------------------------------------------------- |
| [0]  | bool | true if the interface is supported, false otherwise. |

### salesCounter

```solidity
function salesCounter() public view returns (uint256)
```

_function to get the current sales counter._

#### Return Values

| Name | Type    | Description                |
| ---- | ------- | -------------------------- |
| [0]  | uint256 | The current sales counter. |

### getFractionsAmountByPrice

```solidity
function getFractionsAmountByPrice(uint256 price) public view returns (uint256)
```

_Returns the amount of fractions an nft can be divided into at a given price._

#### Parameters

| Name  | Type    | Description                                           |
| ----- | ------- | ----------------------------------------------------- |
| price | uint256 | The price point to check the amount of fractions for. |

#### Return Values

| Name | Type    | Description                                                                  |
| ---- | ------- | ---------------------------------------------------------------------------- |
| [0]  | uint256 | uint256 The amount of fractions an nft can be divided into at a given price. |

### \_setAllowList

```solidity
function _setAllowList(address _allowList) internal
```

_set the address of the contract that implements the IAllowList interface as the allowlist for the current contract._

#### Parameters

| Name        | Type    | Description                                                       |
| ----------- | ------- | ----------------------------------------------------------------- |
| \_allowList | address | address of the contract that implements the IAllowList interface. |

### \_setFeeManager

```solidity
function _setFeeManager(address _feeManager) internal
```

_sets the feeManager address. Only callable by contracts's admin role._

#### Parameters

| Name         | Type    | Description                              |
| ------------ | ------- | ---------------------------------------- |
| \_feeManager | address | The address of the fee manager contract. |

### \_setTiers

```solidity
function _setTiers(uint256[] priceLimits, uint256[] fractionsAmounts) internal
```

_set the tiers for the current contract._

#### Parameters

| Name             | Type      | Description                               |
| ---------------- | --------- | ----------------------------------------- |
| priceLimits      | uint256[] | array of price limits for the tiers.      |
| fractionsAmounts | uint256[] | array of fractions amounts for the tiers. |

## AltrNftCollateralRetriever

_This contract allows Minters to burn NFTs to retrieve te physical assets represented by the NFTs from vault, and allows the owner to change the factory for the NFT collections and the fee manager_

### nftCollectionFactory

```solidity
address nftCollectionFactory
```

_Address of the NFT collection factory contract._

### feeManager

```solidity
address feeManager
```

_Address of the fee manager contract._

### MINTER_ROLE

```solidity
bytes32 MINTER_ROLE
```

_Constant bytes32 representing the minter role, keccak256("MINTER_ROLE")._

### NftBurned

```solidity
event NftBurned(address collectionAddress, address oracleAddress, uint256 tokenId)
```

#### Parameters

| Name              | Type    | Description                                       |
| ----------------- | ------- | ------------------------------------------------- |
| collectionAddress | address | the address of the contract where the NFT belongs |
| oracleAddress     | address | the address of the oracle that is burning the NFT |
| tokenId           | uint256 | the unique identifier of the NFT being burned     |

### RedeemRequest

```solidity
event RedeemRequest(address collectionAddress, address from, address operator, uint256 tokenId)
```

#### Parameters

| Name              | Type    | Description                                             |
| ----------------- | ------- | ------------------------------------------------------- |
| collectionAddress | address | the address of the contract where the NFT belongs       |
| from              | address | the address of the account redeeming the NFT            |
| operator          | address | the address of the operator handling the redeem request |
| tokenId           | uint256 | the unique identifier of the NFT being redeemed         |

### NftCollectionFactoryChanged

```solidity
event NftCollectionFactoryChanged(address nftCollectionFactory)
```

#### Parameters

| Name                 | Type    | Description                                   |
| -------------------- | ------- | --------------------------------------------- |
| nftCollectionFactory | address | the new address of the NFT collection factory |

### FeeManagerChanged

```solidity
event FeeManagerChanged(address feeManager)
```

#### Parameters

| Name       | Type    | Description                        |
| ---------- | ------- | ---------------------------------- |
| feeManager | address | the new address of the fee manager |

### onlyMinter

```solidity
modifier onlyMinter(address nftContract)
```

_This modifier allows only Minters to burn the NFTs_

### constructor

```solidity
constructor() public
```

### burnNft

```solidity
function burnNft(address nftContract, uint256 tokenId) external
```

_Burns the NFT_

#### Parameters

| Name        | Type    | Description                                              |
| ----------- | ------- | -------------------------------------------------------- |
| nftContract | address | The address of the NFT contract where the token belongs. |
| tokenId     | uint256 | The tokenId of the NFT.                                  |

### setNftCollectionFactory

```solidity
function setNftCollectionFactory(address nftCollectionFactory_) external
```

_Changes the factory for the NFT collections._

#### Parameters

| Name                   | Type    | Description                            |
| ---------------------- | ------- | -------------------------------------- |
| nftCollectionFactory\_ | address | Address of the NFT collection factory. |

### setFeeManager

```solidity
function setFeeManager(address feeManager_) external
```

_This function is used to set the address of the fee manager_

#### Parameters

| Name         | Type    | Description                    |
| ------------ | ------- | ------------------------------ |
| feeManager\_ | address | the address of the fee manager |

### initialize

```solidity
function initialize(address nftCollectionFactory_, address feeManager_) external
```

_This function is used to initialize the contract_

#### Parameters

| Name                   | Type    | Description                               |
| ---------------------- | ------- | ----------------------------------------- |
| nftCollectionFactory\_ | address | the address of the NFT collection factory |
| feeManager\_           | address | the address of the fee manager            |

### onERC721Received

```solidity
function onERC721Received(address operator, address from, uint256 tokenId, bytes data) public returns (bytes4)
```

_This function is triggered when an ERC721 token is received. This function ensures that the token is being received from a known collection, that the deadline of the vault service is still valid and that the redemption fee has been paid before redeeming the token._

#### Parameters

| Name     | Type    | Description                                         |
| -------- | ------- | --------------------------------------------------- |
| operator | address | The address of the person who executed the transfer |
| from     | address | The address of the person who sent the ERC721 token |
| tokenId  | uint256 | The token ID of the received ERC721 token           |
| data     | bytes   | Additional data with no specified format            |

### \_setNftCollectionFactory

```solidity
function _setNftCollectionFactory(address nftCollectionFactory_) internal
```

_Sets the address of the NFT collection factory contract._

#### Parameters

| Name                   | Type    | Description                                         |
| ---------------------- | ------- | --------------------------------------------------- |
| nftCollectionFactory\_ | address | The address of the NFT collection factory contract. |

### \_setFeeManager

```solidity
function _setFeeManager(address feeManager_) internal
```

_Sets the address of the fee manager contract._

#### Parameters

| Name         | Type    | Description                              |
| ------------ | ------- | ---------------------------------------- |
| feeManager\_ | address | The address of the fee manager contract. |

### \_\_AltrNftCollateralRetriever_init

```solidity
function __AltrNftCollateralRetriever_init(address nftCollectionFactory_, address feeManager_) internal
```

_Initializes the AltrNftCollateralRetriever contract._

#### Parameters

| Name                   | Type    | Description                                         |
| ---------------------- | ------- | --------------------------------------------------- |
| nftCollectionFactory\_ | address | The address of the NFT collection factory contract. |
| feeManager\_           | address | The address of the fee manager contract.            |

### \_\_AltrNftCollateralRetriever_init_unchained

```solidity
function __AltrNftCollateralRetriever_init_unchained(address nftCollectionFactory_, address feeManager_) internal
```

_Initializes the AltrNftCollateralRetriever contract without calling the internal chainable init functions._

#### Parameters

| Name                   | Type    | Description                                         |
| ---------------------- | ------- | --------------------------------------------------- |
| nftCollectionFactory\_ | address | The address of the NFT collection factory contract. |
| feeManager\_           | address | The address of the fee manager contract.            |

## AltrNftCollection

_Contract for minting and managing ERC-721 Non-Fungible Tokens (NFTs) in the context of a ownership certificate for a real object stored in a physical vault.
It allows for the minting of NFTs, setting of token URI, managing the NFTs' minting and vault service roles, and handling of a NFTs' seizure.
It also keeps track of token Ids, the free vault service period, the minimum and the insolvency grace periods.
It emits events when vault service deadline is set, insolvency grace period is set, token is seized, token is received, and free vault service period is set.
This contract inherits from ERC721URIStorage, ERC721Enumerable, ERC721Burnable, AccessControl, ReentrancyGuard and INftCollectionVaultService contracts.
The contract is controlled by a admin, an oracle, and a vault manager._

### MINTER_ROLE_MANAGER

```solidity
bytes32 MINTER_ROLE_MANAGER
```

### MINTER_ROLE

```solidity
bytes32 MINTER_ROLE
```

### VAULT_MANAGER_ROLE

```solidity
bytes32 VAULT_MANAGER_ROLE
```

### oracleAddress

```solidity
address oracleAddress
```

_The address of the oracle contract which manages the token's collateral_

### nftReserveAddress

```solidity
address nftReserveAddress
```

_The address of the reserve contract where the NFTs are stored_

### minGracePeriod

```solidity
uint256 minGracePeriod
```

_Minimum grace period for the insolvency of a token_

### insolvencyGracePeriod

```solidity
uint256 insolvencyGracePeriod
```

_The grace period for the insolvency of a token, this can be set by the owner_

### freeVaultServicePeriod

```solidity
uint256 freeVaultServicePeriod
```

_The free period for the vault service, this can be set by the owner_

### VaultServiceDeadlineSet

```solidity
event VaultServiceDeadlineSet(uint256 tokenId, uint256 deadline)
```

Emits when the deadline for the vault service is set

#### Parameters

| Name     | Type    | Description                        |
| -------- | ------- | ---------------------------------- |
| tokenId  | uint256 | The ID of the token                |
| deadline | uint256 | The deadline for the vault service |

### InsolvencyGracePeriodSet

```solidity
event InsolvencyGracePeriodSet(uint256 insolvencyGracePeriod)
```

Emits when the insolvency grace period is set

#### Parameters

| Name                  | Type    | Description                         |
| --------------------- | ------- | ----------------------------------- |
| insolvencyGracePeriod | uint256 | The grace period for the insolvency |

### Seize

```solidity
event Seize(uint256 tokenId)
```

Emits when the token is seized

#### Parameters

| Name    | Type    | Description         |
| ------- | ------- | ------------------- |
| tokenId | uint256 | The ID of the token |

### NftReceived

```solidity
event NftReceived(address collectionAddress, address from, address operator, uint256 tokenId)
```

Emits when an NFT is received

#### Parameters

| Name              | Type    | Description                   |
| ----------------- | ------- | ----------------------------- |
| collectionAddress | address | The address of the collection |
| from              | address | The address of the sender     |
| operator          | address | The address of the operator   |
| tokenId           | uint256 | The ID of the token           |

### FreeVaultServicePeriod

```solidity
event FreeVaultServicePeriod(uint256 freeVaultServicePeriod)
```

Emits when the free vault service period is set

#### Parameters

| Name                   | Type    | Description                   |
| ---------------------- | ------- | ----------------------------- |
| freeVaultServicePeriod | uint256 | The free vault service period |

### constructor

```solidity
constructor(string name_, string symbol_, address oracleAddress_, address vaultManagerAddress_, address adminAddress_, address nftReserveAddress_, uint256 minGracePeriod_, uint256 insolvencyGracePeriod_, uint256 freeVaultServicePeriod_) public
```

_Constructor function that initializes the AltrNftCollection contract_

#### Parameters

| Name                     | Type    | Description                                   |
| ------------------------ | ------- | --------------------------------------------- |
| name\_                   | string  | The name of the token                         |
| symbol\_                 | string  | The symbol of the token                       |
| oracleAddress\_          | address | The address of the oracle contract            |
| vaultManagerAddress\_    | address | The address of the vault manager              |
| adminAddress\_           | address | The address of the admin                      |
| nftReserveAddress\_      | address | The address of the NFT reserve contract       |
| minGracePeriod\_         | uint256 | The minimum grace period for vault service    |
| insolvencyGracePeriod\_  | uint256 | The insolvency grace period for vault service |
| freeVaultServicePeriod\_ | uint256 | The free period for the vault service         |

### seize

```solidity
function seize(uint256 tokenId) external
```

_Allows the admin to seize an NFT and transfer it to the NFT reserve address_

#### Parameters

| Name    | Type    | Description                                 |
| ------- | ------- | ------------------------------------------- |
| tokenId | uint256 | The tokenId of the NFT that is being seized |

### setVaultServiceDeadline

```solidity
function setVaultServiceDeadline(uint256 tokenId, uint256 deadline) external
```

_Allows the vault manager role to set a new deadline for vault service_

#### Parameters

| Name     | Type    | Description                                                |
| -------- | ------- | ---------------------------------------------------------- |
| tokenId  | uint256 | The tokenId of the NFT for which the deadline is being set |
| deadline | uint256 | The new deadline for vault service                         |

### setInsolvencyGracePeriod

```solidity
function setInsolvencyGracePeriod(uint256 insolvencyGracePeriod_) external
```

_Allows the admin role to set a new insolvency grace period_

#### Parameters

| Name                    | Type    | Description                     |
| ----------------------- | ------- | ------------------------------- |
| insolvencyGracePeriod\_ | uint256 | The new insolvency grace period |

### setFreeVaultServicePeriod

```solidity
function setFreeVaultServicePeriod(uint256 freeVaultServicePeriod_) external
```

_Allows the admin role to set a new free vault service period_

#### Parameters

| Name                     | Type    | Description                       |
| ------------------------ | ------- | --------------------------------- |
| freeVaultServicePeriod\_ | uint256 | The new free vault service period |

### safeMint

```solidity
function safeMint(string uri) external
```

_Allows the minter role to mint a new NFT, assigns the tokenURI and sets the deadline for vault service_

#### Parameters

| Name | Type   | Description                             |
| ---- | ------ | --------------------------------------- |
| uri  | string | The URI of the NFT that is being minted |

### getVaultServiceDeadline

```solidity
function getVaultServiceDeadline(uint256 tokenId) external view returns (uint256 deadline)
```

_Allows anyone to get the deadline for vault service for a specific NFT_

#### Parameters

| Name    | Type    | Description                                                      |
| ------- | ------- | ---------------------------------------------------------------- |
| tokenId | uint256 | The tokenId of the NFT for which the deadline is being retrieved |

#### Return Values

| Name     | Type    | Description                    |
| -------- | ------- | ------------------------------ |
| deadline | uint256 | The deadline for vault service |

### tokenURI

```solidity
function tokenURI(uint256 tokenId) public view returns (string)
```

_Allows anyone to get the URI of a specific NFT_

#### Parameters

| Name    | Type    | Description                                                 |
| ------- | ------- | ----------------------------------------------------------- |
| tokenId | uint256 | The tokenId of the NFT for which the URI is being retrieved |

#### Return Values

| Name | Type   | Description        |
| ---- | ------ | ------------------ |
| [0]  | string | The URI of the NFT |

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view returns (bool)
```

_Allows anyone to check if the contract supports an interface_

#### Parameters

| Name        | Type   | Description                               |
| ----------- | ------ | ----------------------------------------- |
| interfaceId | bytes4 | The interfaceId being checked for support |

#### Return Values

| Name | Type | Description                                                  |
| ---- | ---- | ------------------------------------------------------------ |
| [0]  | bool | True if the contract supports the interface, false otherwise |

### \_beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize) internal virtual
```

_internal function that is executed before a token transfer_

#### Parameters

| Name      | Type    | Description                                         |
| --------- | ------- | --------------------------------------------------- |
| from      | address | The current owner of the token                      |
| to        | address | The address to which the token is being transferred |
| tokenId   | uint256 | The tokenId of the NFT that is being transferred    |
| batchSize | uint256 | The number of tokens being transferred in the batch |

### \_burn

```solidity
function _burn(uint256 tokenId) internal
```

_internal function that burns a token_

#### Parameters

| Name    | Type    | Description                                 |
| ------- | ------- | ------------------------------------------- |
| tokenId | uint256 | The tokenId of the NFT that is being burned |

### \_setVaultServiceDeadline

```solidity
function _setVaultServiceDeadline(uint256 tokenId, uint256 deadline) internal
```

_internal function that sets the deadline for vault service for a specific NFT_

#### Parameters

| Name     | Type    | Description                                                |
| -------- | ------- | ---------------------------------------------------------- |
| tokenId  | uint256 | The tokenId of the NFT for which the deadline is being set |
| deadline | uint256 | The deadline for vault service                             |

### \_baseURI

```solidity
function _baseURI() internal pure returns (string)
```

_internal pure function that returns the base URI for the NFTs_

#### Return Values

| Name | Type   | Description  |
| ---- | ------ | ------------ |
| [0]  | string | the base URI |

## AltrNftCollectionFactory

_Contract for generating Altr NFT collections_

### CreatedContract

```solidity
struct CreatedContract {
  contract AltrNftCollection collection;
  string symbol;
  string name;
  address oracle;
  bytes1 tokenVersion;
}
```

### createdContracts

```solidity
struct AltrNftCollectionFactory.CreatedContract[] createdContracts
```

_Array that contains information about all the AltrNftCollection contracts created by this factory_

### licenseManager

```solidity
address licenseManager
```

_Address of the license manager contract_

### nftReserveAddress

```solidity
address nftReserveAddress
```

_Address of the nft reserve contract_

### tokenVersion

```solidity
bytes1 tokenVersion
```

_Token version of the NFTs_

### CollectionCreated

```solidity
event CollectionCreated(address contractAddress, string collectionName, string collectionSymbol, address collectionOracle)
```

_Emits when a new NFT collection is created_

#### Parameters

| Name             | Type    | Description                                          |
| ---------------- | ------- | ---------------------------------------------------- |
| contractAddress  | address | address of the newly created NFT collection contract |
| collectionName   | string  | name of the NFT collection                           |
| collectionSymbol | string  | symbol of the NFT collection                         |
| collectionOracle | address | oracle address for the NFT collection                |

### LicenseManagerChanged

```solidity
event LicenseManagerChanged(address licenseManager)
```

_Emits when the license manager address is changed_

#### Parameters

| Name           | Type    | Description                 |
| -------------- | ------- | --------------------------- |
| licenseManager | address | new license manager address |

### NftReserveAddressChanged

```solidity
event NftReserveAddressChanged(address nftReserveAddress)
```

_Emits when the nft reserve address is changed_

#### Parameters

| Name              | Type    | Description             |
| ----------------- | ------- | ----------------------- |
| nftReserveAddress | address | new nft reserve address |

### constructor

```solidity
constructor() public
```

### createCollection

```solidity
function createCollection(string name, string symbol, address oracle, address vaultManager, uint256 minGracePeriod, uint256 insolvencyGracePeriod, uint256 freeVaultServicePeriod) external
```

A new collection contract is created

_This function creates a new collection contract with the given name, symbol, oracle, vault manager, and grace periods_

#### Parameters

| Name                   | Type    | Description                                               |
| ---------------------- | ------- | --------------------------------------------------------- |
| name                   | string  | name of the new collection contract                       |
| symbol                 | string  | symbol of the new collection contract                     |
| oracle                 | address | oracle address for the new collection contract            |
| vaultManager           | address | vault manager address for the new collection contract     |
| minGracePeriod         | uint256 | minimum grace period for the new collection contract      |
| insolvencyGracePeriod  | uint256 | insolvency grace period for the new collection contract   |
| freeVaultServicePeriod | uint256 | free vault service period for the new collection contract |

### setLicenseManager

```solidity
function setLicenseManager(address licenseManager_) external
```

_This function updates the contract's license manager address_

#### Parameters

| Name             | Type    | Description                        |
| ---------------- | ------- | ---------------------------------- |
| licenseManager\_ | address | address of the new license manager |

### setNftReserveAddress

```solidity
function setNftReserveAddress(address nftReserveAddress_) external
```

_This function updates the contract's NFT Reserve address_

#### Parameters

| Name                | Type    | Description                    |
| ------------------- | ------- | ------------------------------ |
| nftReserveAddress\_ | address | address of the new NFT Reserve |

### initialize

```solidity
function initialize(address licenseManager_, address nftReserveAddress_) external
```

_This function initializes the contract's fields with the given values_

#### Parameters

| Name                | Type    | Description                    |
| ------------------- | ------- | ------------------------------ |
| licenseManager\_    | address | address of the license manager |
| nftReserveAddress\_ | address | address of the NFT Reserve     |

### isAKnownCollection

```solidity
function isAKnownCollection(address collectionAddress) external view returns (bool)
```

_This function checks if a given address is a known collection contract address_

#### Parameters

| Name              | Type    | Description                        |
| ----------------- | ------- | ---------------------------------- |
| collectionAddress | address | address of the collection contract |

#### Return Values

| Name | Type | Description                                                                               |
| ---- | ---- | ----------------------------------------------------------------------------------------- |
| [0]  | bool | Returns true if the given address is a known collection contract, returns false otherwise |

### createdContractCount

```solidity
function createdContractCount() external view returns (uint256)
```

_This function gets the number of created collection contracts_

#### Return Values

| Name | Type    | Description                                    |
| ---- | ------- | ---------------------------------------------- |
| [0]  | uint256 | Returns number of created collection contracts |

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view returns (bool)
```

_Function to check if the contract implements the required interface_

#### Parameters

| Name        | Type   | Description                     |
| ----------- | ------ | ------------------------------- |
| interfaceId | bytes4 | bytes4 The interface identifier |

#### Return Values

| Name | Type | Description                                                                 |
| ---- | ---- | --------------------------------------------------------------------------- |
| [0]  | bool | bool Returns true if the contract implements the interface, false otherwise |

### \_\_AltrNftCollectionFactory_init

```solidity
function __AltrNftCollectionFactory_init(address licenseManager_, address nftReserveAddress_) internal
```

_Initializer function for the contract, which is called only once_

#### Parameters

| Name                | Type    | Description                                         |
| ------------------- | ------- | --------------------------------------------------- |
| licenseManager\_    | address | address The address of the license manager contract |
| nftReserveAddress\_ | address | address The address of the NFT reserve contract     |

### \_\_AltrNftCollectionFactory_init_unchained

```solidity
function __AltrNftCollectionFactory_init_unchained(address licenseManager_, address nftReserveAddress_) internal
```

_Internal function for initializing the contract, that is called only once_

#### Parameters

| Name                | Type    | Description                                         |
| ------------------- | ------- | --------------------------------------------------- |
| licenseManager\_    | address | address The address of the license manager contract |
| nftReserveAddress\_ | address | address The address of the NFT reserve contract     |

### \_setLicenseManager

```solidity
function _setLicenseManager(address licenseManager_) internal
```

_Internal function to set the address of the license manager contract_

#### Parameters

| Name             | Type    | Description                                         |
| ---------------- | ------- | --------------------------------------------------- |
| licenseManager\_ | address | address The address of the license manager contract |

### \_setNftReserveAddress

```solidity
function _setNftReserveAddress(address nftReserveAddress_) internal
```

_Internal function to set the address of the NFT reserve contract_

#### Parameters

| Name                | Type    | Description                                     |
| ------------------- | ------- | ----------------------------------------------- |
| nftReserveAddress\_ | address | address The address of the NFT reserve contract |

## AltrTradeChecker

_Contract that acts as a trade checker for initial ERC721 token sales on 0x. It verifies that the buyer is in the Altr allowlist
before allowing the trade to proceed._

### zeroExContract

```solidity
contract IZeroEx zeroExContract
```

_variable to store the address of the IZeroEx smart contract_

### allowList

```solidity
contract IAllowList allowList
```

_variable to store the address of the IAllowList smart contract_

### feeManager

```solidity
contract IFeeManager feeManager
```

@dev

### onlyAllowListed

```solidity
modifier onlyAllowListed()
```

_Modifier that only allows allowlisted addresses to execute a function._

### constructor

```solidity
constructor(address payable _zeroExContract, address _allowList, address _feeManager) public
```

_Constructor function that initializes the AltrTradeChecker contract_

#### Parameters

| Name             | Type            | Description                                             |
| ---------------- | --------------- | ------------------------------------------------------- |
| \_zeroExContract | address payable | Address of the 0x contract to interact with             |
| \_allowList      | address         | Address of the contract that manages the Altr allowlist |
| \_feeManager     | address         |                                                         |

### buyERC721

```solidity
function buyERC721(struct LibNFTOrder.ERC721Order sellOrder, struct LibSignature.Signature signature, bytes callbackData) external payable
```

_Allows the caller to buy an ERC721 token from a 0x sell order_

#### Parameters

| Name         | Type                           | Description                                          |
| ------------ | ------------------------------ | ---------------------------------------------------- |
| sellOrder    | struct LibNFTOrder.ERC721Order | The sell order                                       |
| signature    | struct LibSignature.Signature  | Signature of the sell order, signed by the seller    |
| callbackData | bytes                          | Data to pass through to the trade execution callback |

## TimedTokenSplitter

_Contract used to manage the tokens used to purchase Altr fractions._

### saleContract

```solidity
contract IFractionsSale saleContract
```

_A reference to the sale contract that is being used to manage the sale of the fractions_

### saleId

```solidity
uint256 saleId
```

_The ID of the sale that is being managed by this contract_

### governanceTreasury

```solidity
address governanceTreasury
```

_The address of the governance treasury that will receive the protocol fee from the sale of the fractions_

### protocolFee

```solidity
uint256 protocolFee
```

_The amount of the protocol fee that will be taken from the sale of the fractions_

### seller

```solidity
address seller
```

_The address of the seller who is selling the fractions_

### TokensSellerReleased

```solidity
event TokensSellerReleased(address seller, contract IFractionsSale saleContract, uint256 saleId, uint256 sellerAmount)
```

_Emits when tokens seller is released_

#### Parameters

| Name         | Type                    | Description                                |
| ------------ | ----------------------- | ------------------------------------------ |
| seller       | address                 | The address of the seller                  |
| saleContract | contract IFractionsSale | Address of the sale contract               |
| saleId       | uint256                 | Identifier of the sale                     |
| sellerAmount | uint256                 | The amount that was released to the seller |

### onlyIfSaleClosed

```solidity
modifier onlyIfSaleClosed()
```

_Modifier that checks if the sale of the contract has closed or not
If the sale is not closed, the function calling this modifier will revert with the error message "TimedTokenSplitter: sale not finished yet"_

### onlyFailedSale

```solidity
modifier onlyFailedSale()
```

_Modifier that checks if the sale of the contract has failed or not
If the sale is successful, the function calling this modifier will revert with the error message "TimedTokenSplitter: sale did not fail"_

### onlySuccessfulSale

```solidity
modifier onlySuccessfulSale()
```

_Modifier that checks if the sale of the contract has been successful or not
If the sale is unsuccessful, the function calling this modifier will revert with the error message "TimedTokenSplitter: sale unsuccessful"_

### constructor

```solidity
constructor(address saleContract_, uint256 saleId_, contract IERC20 redemptionToken_, contract IFractions token_, uint256 tokenPrice_, address governanceTreasury_, uint256 protocolFee_, address seller_) public
```

_TimedTokenSplitter contract constructor.
Initializes the contract with the sale contract address, the sale id, the token to redeem, the token that represents the fractional ownership, the token price, the governance treasury address, the protocol fee, and the seller address_

#### Parameters

| Name                 | Type                | Description                                        |
| -------------------- | ------------------- | -------------------------------------------------- |
| saleContract\_       | address             | address of the sale contract                       |
| saleId\_             | uint256             | the id of the sale                                 |
| redemptionToken\_    | contract IERC20     | the token to redeem                                |
| token\_              | contract IFractions | the token that represents the fractional ownership |
| tokenPrice\_         | uint256             | the price of the token                             |
| governanceTreasury\_ | address             | the address of the governance treasury             |
| protocolFee\_        | uint256             | the percentage of fee taken from the token amount  |
| seller\_             | address             | the address of the seller                          |

### releaseSeller

```solidity
function releaseSeller() public
```

This function can only be called after the sale is closed and was successful
this function will transfer protocolFee/10000 of the amount to the governanceTreasury and the rest to the seller

_Function to release the seller's token from the contract_

### release

```solidity
function release(address[] users) public
```

This function can only be called after the sale is closed and was unsuccessful

_Function to release the user's token from the contract_

#### Parameters

| Name  | Type      | Description                                                       |
| ----- | --------- | ----------------------------------------------------------------- |
| users | address[] | address[] calldata of the users that we want to release the token |

## TokenSplitter

_Contract for managing tokens used to buyout Altr fractions._

### redemptionToken

```solidity
contract IERC20 redemptionToken
```

_The ERC-20 token that users need to provide to redeem the fractions_

### token

```solidity
contract IFractions token
```

_The fractional token that users will redeem_

### tokenPrice

```solidity
uint256 tokenPrice
```

_The price of each fraction token in redemption tokens_

### tokenId

```solidity
uint256 tokenId
```

_The ID of the NFT that corresponds to this token redemption_

### TokensReleased

```solidity
event TokensReleased(address[] users, contract IERC20 redemptionToken, contract IFractions token, uint256 tokenId, uint256[] amounts, uint256 fractionsPrice)
```

_Event emitted when the tokens are released to the users_

#### Parameters

| Name            | Type                | Description                                                               |
| --------------- | ------------------- | ------------------------------------------------------------------------- |
| users           | address[]           | array of addresses of the users that receive the tokens                   |
| redemptionToken | contract IERC20     | The address of the token used for redemption                              |
| token           | contract IFractions | The address of the token contract that holds the fractions being redeemed |
| tokenId         | uint256             | The id of the token that represents the fractions being redeemed          |
| amounts         | uint256[]           | The amounts of fractions being redeemed                                   |
| fractionsPrice  | uint256             | The price of each fraction being redeemed                                 |

### constructor

```solidity
constructor(contract IERC20 redemptionToken_, contract IFractions token_, uint256 tokenId_, uint256 tokenPrice_) public
```

_Create the TokenSplitter instance and set the token instances_

#### Parameters

| Name              | Type                | Description                           |
| ----------------- | ------------------- | ------------------------------------- |
| redemptionToken\_ | contract IERC20     | The ERC20 token for redemption        |
| token\_           | contract IFractions | The token to be split                 |
| tokenId\_         | uint256             | Token Id for the token to be split    |
| tokenPrice\_      | uint256             | The price of the token for redemption |

### release

```solidity
function release(address[] users) public virtual
```

_Release the tokens, by burning the token in token contract and transfer the redemption token to the user_

#### Parameters

| Name  | Type      | Description                                            |
| ----- | --------- | ------------------------------------------------------ |
| users | address[] | The array of users' addresses to release the tokens to |

## AltrAllowList

_This contract is used to manage an allowlist of addresses
that are allowed to interact with the Altr sale contracts.
contract Inherit AccessControl and IAllowList
This contract defines a role for managing the allowlist, and it defines
functions for allowing and disallowing addresses, as well as a function
for checking if an address is allowed._

### LIST_MANAGER_ROLE

```solidity
bytes32 LIST_MANAGER_ROLE
```

_role name for allowlist manager_

### AddressesAllowed

```solidity
event AddressesAllowed(address[] addresses)
```

_event emitted when addresses are added to the allowlist_

### AddressesDisallowed

```solidity
event AddressesDisallowed(address[] addresses)
```

_event emitted when addresses are removed from the allowlist_

### constructor

```solidity
constructor() public
```

_constructor grant the msg.sender both DEFAULT_ADMIN_ROLE and LIST_MANAGER_ROLE_

### allowAddresses

```solidity
function allowAddresses(address[] addresses) external
```

_function to allow addresses_

#### Parameters

| Name      | Type      | Description                      |
| --------- | --------- | -------------------------------- |
| addresses | address[] | array of addresses to be allowed |

### disallowAddresses

```solidity
function disallowAddresses(address[] addresses) external
```

_function to disallow addresses_

#### Parameters

| Name      | Type      | Description                         |
| --------- | --------- | ----------------------------------- |
| addresses | address[] | array of addresses to be disallowed |

### isAddressAllowed

```solidity
function isAddressAllowed(address user) external view returns (bool)
```

_function to check if an address is allowed_

#### Parameters

| Name | Type    | Description                  |
| ---- | ------- | ---------------------------- |
| user | address | address of the user to check |

#### Return Values

| Name | Type | Description                                          |
| ---- | ---- | ---------------------------------------------------- |
| [0]  | bool | bool value indicating whether the address is allowed |

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_function to check if a interface is supported_

#### Parameters

| Name        | Type   | Description                |
| ----------- | ------ | -------------------------- |
| interfaceId | bytes4 | bytes4 id of the interface |

#### Return Values

| Name | Type | Description                                              |
| ---- | ---- | -------------------------------------------------------- |
| [0]  | bool | bool value indicating whether the interface is supported |

### \_setAddressesStatus

```solidity
function _setAddressesStatus(address[] addresses, bool status) internal
```

_internal function to set the status of addresses_

#### Parameters

| Name      | Type      | Description                                           |
| --------- | --------- | ----------------------------------------------------- |
| addresses | address[] | array of addresses                                    |
| status    | bool      | status to set, true for allowed, false for disallowed |

## AltrFractions

Contract that implements the ERC1155, ERC165, ERC165Checker, ERC1155Burnable, ERC1155Supply, AccessControl, Initializable and IFractions interfaces

_Contract that implements the ERC1155, ERC165, ERC165Checker, ERC1155Burnable, ERC1155Supply, AccessControl, Initializable and IFractions interfaces,
and maintains the state of Buyout, TokenSaleStatus, AltrFractionsSale, ClosingTimeForTokenSale._

### TokenSaleStatus

```solidity
enum TokenSaleStatus {
  OPEN,
  FAILED,
  SUCCESSFUL
}
```

### altrFractionsSale

```solidity
contract IFractionsSale altrFractionsSale
```

_The AltrFractionsSale contract_

### BURN_MANAGER_ROLE

```solidity
bytes32 BURN_MANAGER_ROLE
```

_BURN_MANAGER_ROLE is the role assigned to the address that can call the operatorBurn function_

### isTokenIdBoughtOut

```solidity
mapping(uint256 => bool) isTokenIdBoughtOut
```

_isTokenIdBoughtOut map store the current buyout status of a token_

### tokenSaleStatus

```solidity
mapping(uint256 => enum AltrFractions.TokenSaleStatus) tokenSaleStatus
```

_tokenSaleStatus map store the current sale status of a token_

### closingTimeForTokenSale

```solidity
mapping(uint256 => uint256) closingTimeForTokenSale
```

_closingTimeForTokenSale map store the closing time for a token sale_

### BuyoutStatusSet

```solidity
event BuyoutStatusSet(uint256 tokenId, bool status)
```

#### Parameters

| Name    | Type    | Description                                 |
| ------- | ------- | ------------------------------------------- |
| tokenId | uint256 | The token ID of the token sale              |
| status  | bool    | The status of the buyout for the token sale |

### TokenSaleStatusSet

```solidity
event TokenSaleStatusSet(uint256 tokenId, enum AltrFractions.TokenSaleStatus status)
```

#### Parameters

| Name    | Type                               | Description                    |
| ------- | ---------------------------------- | ------------------------------ |
| tokenId | uint256                            | The token ID of the token sale |
| status  | enum AltrFractions.TokenSaleStatus | The status of the token sale   |

### ContractSaleSet

```solidity
event ContractSaleSet(contract IFractionsSale altrFractionsSale)
```

#### Parameters

| Name              | Type                    | Description                                   |
| ----------------- | ----------------------- | --------------------------------------------- |
| altrFractionsSale | contract IFractionsSale | The address of the altrFractionsSale contract |

### ClosingTimeForTokenSaleSet

```solidity
event ClosingTimeForTokenSaleSet(uint256 tokenId, uint256 closingTime)
```

#### Parameters

| Name        | Type    | Description                        |
| ----------- | ------- | ---------------------------------- |
| tokenId     | uint256 | The token ID of the token sale     |
| closingTime | uint256 | The closing time of the token sale |

### OperatorBurn

```solidity
event OperatorBurn(address operator, address account, uint256 id, uint256 amount)
```

#### Parameters

| Name     | Type    | Description                               |
| -------- | ------- | ----------------------------------------- |
| operator | address | The operator address                      |
| account  | address | The address of the owner of the fractions |
| id       | uint256 | The token ID                              |
| amount   | uint256 | The burn amount                           |

### constructor

```solidity
constructor(string uri_) public
```

_Constructor that creates an ERC1155 contract with the specified uri_ and grants the msg.sender the DEFAULT*ADMIN_ROLE*

#### Parameters

| Name  | Type   | Description                     |
| ----- | ------ | ------------------------------- |
| uri\_ | string | The URI of the ERC1155 contract |

### setUri

```solidity
function setUri(string uri_) external
```

_The setUri function allows the contract owner to set the URI of the ERC1155 token_

#### Parameters

| Name  | Type   | Description                  |
| ----- | ------ | ---------------------------- |
| uri\_ | string | The URI of the ERC1155 token |

### setContractSale

```solidity
function setContractSale(address contractSale_) external
```

This function can set the contractSale only once

_The setContractSale function allows the contract owner to set the contract sale of the token_

#### Parameters

| Name           | Type    | Description                      |
| -------------- | ------- | -------------------------------- |
| contractSale\_ | address | The address of the contract sale |

### setBuyoutStatus

```solidity
function setBuyoutStatus(uint256 tokenId) external
```

_The setBuyoutStatus function allows the contract owner to set the buyout status of a specific tokenId_

#### Parameters

| Name    | Type    | Description                                                  |
| ------- | ------- | ------------------------------------------------------------ |
| tokenId | uint256 | The ID of the token for which the buyout status is being set |

### setClosingTimeForTokenSale

```solidity
function setClosingTimeForTokenSale(uint256 tokenId, uint256 closingTime) external
```

_The setClosingTimeForTokenSale function allows the contract owner to set the closing time for a specific tokenId sale_

#### Parameters

| Name        | Type    | Description                                                 |
| ----------- | ------- | ----------------------------------------------------------- |
| tokenId     | uint256 | The ID of the token for which the closing time is being set |
| closingTime | uint256 | The closing time for the token sale                         |

### mint

```solidity
function mint(address to, uint256 tokenId, uint256 amount, bytes data) external
```

_The mint function allows the contract owner to mint new tokens_

#### Parameters

| Name    | Type    | Description                                                    |
| ------- | ------- | -------------------------------------------------------------- |
| to      | address | The address of the account that the tokens are being minted to |
| tokenId | uint256 | The ID of the token being minted                               |
| amount  | uint256 | The amount of tokens being minted                              |
| data    | bytes   | Additional data associated with the minting of the tokens      |

### operatorBurn

```solidity
function operatorBurn(address account, uint256 id, uint256 amount) external
```

_The operatorBurn function allows a contract operator to burn specific tokens from a specific address_

#### Parameters

| Name    | Type    | Description                                        |
| ------- | ------- | -------------------------------------------------- |
| account | address | The address from which the tokens are being burned |
| id      | uint256 | The ID of the token being burned                   |
| amount  | uint256 | The amount of tokens being burned                  |

### burn

```solidity
function burn(address account, uint256 id, uint256 amount) public
```

_The burn function allows the contract owner to burn specific tokens from a specific address_

#### Parameters

| Name    | Type    | Description                                        |
| ------- | ------- | -------------------------------------------------- |
| account | address | The address from which the tokens are being burned |
| id      | uint256 | The ID of the token being burned                   |
| amount  | uint256 | The amount of tokens being burned                  |

### grantRole

```solidity
function grantRole(bytes32 role, address account) public
```

_The grantRole function grants a specific role to a specific account_

#### Parameters

| Name    | Type    | Description                                                   |
| ------- | ------- | ------------------------------------------------------------- |
| role    | bytes32 | The bytes32 of the role being granted                         |
| account | address | The address of the account to which the role is being granted |

### testTokenTransferability

```solidity
function testTokenTransferability(uint256 tokenId, address operator, address to) public
```

_Check if the tokenId can be transferred by the operator.
If the sale of tokenId has closed, it will check if the tokenId is bought out,
if so, only the operator has the BURN_MANAGER_ROLE or DEFAULT_ADMIN_ROLE can transfer it,
if the token sale has failed, only the operator has BURN_MANAGER_ROLE can transfer it.
if the token sale has not closed yet, it will update the status of the token sale and check again._

#### Parameters

| Name     | Type    | Description                                         |
| -------- | ------- | --------------------------------------------------- |
| tokenId  | uint256 | the tokenId to check                                |
| operator | address | the operator that wants to transfer the token       |
| to       | address | the address to which the token is being transferred |

### uri

```solidity
function uri(uint256 id) public view returns (string)
```

_Returns the URI of a specific token ID_

#### Parameters

| Name | Type    | Description  |
| ---- | ------- | ------------ |
| id   | uint256 | The token ID |

#### Return Values

| Name | Type   | Description             |
| ---- | ------ | ----------------------- |
| [0]  | string | The URI of the token ID |

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view returns (bool)
```

_The supportsInterface function allows to check if the contract implements an interface_

#### Parameters

| Name        | Type   | Description                        |
| ----------- | ------ | ---------------------------------- |
| interfaceId | bytes4 | bytes4 identifier of the interface |

#### Return Values

| Name | Type | Description                                                           |
| ---- | ---- | --------------------------------------------------------------------- |
| [0]  | bool | boolean indicating whether the contract supports the interface or not |

### updateTokenSaleStatus

```solidity
function updateTokenSaleStatus(uint256 tokenId) internal
```

_the updateTokenSaleStatus function sets the status of the token sale to failed or successful_

#### Parameters

| Name    | Type    | Description |
| ------- | ------- | ----------- |
| tokenId | uint256 | The tokenId |

### \_beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address operator, address from, address to, uint256[] ids, uint256[] amounts, bytes data) internal
```

_Internal function that is called before a transfer of tokens
It calls the parent implementation of before transfer and call testTokenTransferability for every tokenId_

#### Parameters

| Name     | Type      | Description                                           |
| -------- | --------- | ----------------------------------------------------- |
| operator | address   | The address that wants to transfer the token          |
| from     | address   | The address from which the token is being transferred |
| to       | address   | The address to which the token is being transferred   |
| ids      | uint256[] | The tokenIds of the token being transferred           |
| amounts  | uint256[] | The amounts of the tokens being transferred           |
| data     | bytes     | Additional data                                       |

### isTokenSaleClosed

```solidity
function isTokenSaleClosed(uint256 tokenId) internal view returns (bool)
```

_Check if the token sale for a given token ID has closed_

#### Parameters

| Name    | Type    | Description              |
| ------- | ------- | ------------------------ |
| tokenId | uint256 | the token ID of interest |

#### Return Values

| Name | Type | Description                       |
| ---- | ---- | --------------------------------- |
| [0]  | bool | whether the token sale has closed |

## AltrLicenseManager

_This contract serves as a license manager for a software system. It allows for the owner to set
discounts for individual users and track conventions for each oracle. It also allows for the owner to
set the staking service and staked tokens required for oracle eligibility._

### conventions

```solidity
mapping(address => uint256) conventions
```

_mapping to store conventions for each oracle_

### MIN_DISCOUNT

```solidity
uint256 MIN_DISCOUNT
```

_constant variable to define minimum discount_

### MAX_DISCOUNT

```solidity
uint256 MAX_DISCOUNT
```

_constant variable to define maximum discount_

### stakingService

```solidity
address stakingService
```

_staking service address_

### stakingServicePid

```solidity
uint256 stakingServicePid
```

_staking service pool id_

### stakedTokensForOracleEligibility

```solidity
uint256 stakedTokensForOracleEligibility
```

_staked tokens for oracle eligibility_

### DiscountSet

```solidity
event DiscountSet(address user, uint256 discount)
```

_Event emitted when a user's discount is set_

#### Parameters

| Name     | Type    | Description                                     |
| -------- | ------- | ----------------------------------------------- |
| user     | address | Address of the user whose discount is being set |
| discount | uint256 | The discount being set for the user             |

### StakingServiceSet

```solidity
event StakingServiceSet(address stakingService, uint256 stakingServicePid)
```

_Event emitted when the staking service address is set_

#### Parameters

| Name              | Type    | Description                        |
| ----------------- | ------- | ---------------------------------- |
| stakingService    | address | Address of the staking service     |
| stakingServicePid | uint256 | The pool id of the staking service |

### StakingServicePidSet

```solidity
event StakingServicePidSet(uint256 pid)
```

_Event emitted when the staking service pool id is set_

#### Parameters

| Name | Type    | Description                        |
| ---- | ------- | ---------------------------------- |
| pid  | uint256 | The pool id of the staking service |

### StakedTokensForOracleEligibilitySet

```solidity
event StakedTokensForOracleEligibilitySet(uint256 amount)
```

_Event emitted when the amount of staked tokens required for oracle eligibility is set_

#### Parameters

| Name   | Type    | Description                                                 |
| ------ | ------- | ----------------------------------------------------------- |
| amount | uint256 | The amount of staked tokens required for oracle eligibility |

### constructor

```solidity
constructor(address stakingService_, uint256 stakingServicePid_, uint256 _stakedTokensForOracleEligibility) public
```

_Constructor to initialize the staking service and staked tokens for oracle eligibility._

#### Parameters

| Name                               | Type    | Description                                           |
| ---------------------------------- | ------- | ----------------------------------------------------- |
| stakingService\_                   | address | The address of the staking service.                   |
| stakingServicePid\_                | uint256 | The pool id of the staking service.                   |
| \_stakedTokensForOracleEligibility | uint256 | The number of tokens required for oracle eligibility. |

### setDiscount

```solidity
function setDiscount(address user, uint256 discount) external
```

_Allows the owner of the contract to set a discount for a given user_

#### Parameters

| Name     | Type    | Description                                            |
| -------- | ------- | ------------------------------------------------------ |
| user     | address | Address of the user for which the discount will be set |
| discount | uint256 | Amount of the discount for the user (in percents)      |

### setStakingService

```solidity
function setStakingService(address stakingService_, uint256 pid_) external
```

_Allows the owner of the contract to set the staking service_

#### Parameters

| Name             | Type    | Description                    |
| ---------------- | ------- | ------------------------------ |
| stakingService\_ | address | address of the staking service |
| pid\_            | uint256 | pool id of the staking service |

### setStakedTokensForOracleEligibility

```solidity
function setStakedTokensForOracleEligibility(uint256 amount) external
```

_Allows the owner of the contract to set the required staked tokens for an oracle to be qualified_

#### Parameters

| Name   | Type    | Description                     |
| ------ | ------- | ------------------------------- |
| amount | uint256 | minimum amount of staked tokens |

### getDiscount

```solidity
function getDiscount(address user) external view returns (uint256)
```

_returns the discount for a given user_

#### Parameters

| Name | Type    | Description                                                  |
| ---- | ------- | ------------------------------------------------------------ |
| user | address | Address of the user for which the discount will be retrieved |

#### Return Values

| Name | Type    | Description                                                |
| ---- | ------- | ---------------------------------------------------------- |
| [0]  | uint256 | discount Amount of the discount for the user (in percents) |

### isAQualifiedOracle

```solidity
function isAQualifiedOracle(address oracle) external view virtual returns (bool)
```

_returns true if the oracle has the minimum required staked tokens_

#### Parameters

| Name   | Type    | Description           |
| ------ | ------- | --------------------- |
| oracle | address | address of the oracle |

#### Return Values

| Name | Type | Description                                  |
| ---- | ---- | -------------------------------------------- |
| [0]  | bool | bool returns true if the oracle is qualified |

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view returns (bool)
```

_Check if a given address supports the ILicenseManager interface_

#### Parameters

| Name        | Type   | Description                               |
| ----------- | ------ | ----------------------------------------- |
| interfaceId | bytes4 | 4 bytes long ID of the interface to check |

#### Return Values

| Name | Type | Description                                               |
| ---- | ---- | --------------------------------------------------------- |
| [0]  | bool | bool returns true if the address implements the interface |

### \_setStakingService

```solidity
function _setStakingService(address stakingService_, uint256 pid_) internal
```

_This function is responsible for setting the staking service for AltrLicenseManager. The address passed as an argument must not be a null address and must support the IStakingService interface_

#### Parameters

| Name             | Type    | Description                                                            |
| ---------------- | ------- | ---------------------------------------------------------------------- |
| stakingService\_ | address | the address of the contract implementing the IStakingService interface |
| pid\_            | uint256 | the pool id of the staking service                                     |

## LucidaoGovernanceNftReserve

_Contract that acts as the Lucidao reserve for ERC721 and ERC1155 tokens. It verifies that the operator has the approval for the token
before allowing the transfer to proceed._

### NftReceived

```solidity
event NftReceived(address collectionAddress, address from, address operator, uint256 tokenId, uint256 amount)
```

_Emits when a ERC721 or ERC1155 tokens have been received and processed by the smart contract_

#### Parameters

| Name              | Type    | Description                                                             |
| ----------------- | ------- | ----------------------------------------------------------------------- |
| collectionAddress | address | The address of the ERC721 or ERC1155 contract that this token belong to |
| from              | address | Address from which the token came from                                  |
| operator          | address | Address of the operator that received the token                         |
| tokenId           | uint256 | ID of the token that was received                                       |
| amount            | uint256 | number of tokens that was received                                      |

### NftBatchReceived

```solidity
event NftBatchReceived(address collectionAddress, address from, address operator, uint256[] tokenId, uint256[] amount)
```

_Emits when a batch of ERC1155 tokens have been received and processed by the smart contract_

#### Parameters

| Name              | Type      | Description                                                   |
| ----------------- | --------- | ------------------------------------------------------------- |
| collectionAddress | address   | The address of the ERC1155 contract that this token belong to |
| from              | address   | Address from which the tokens came from                       |
| operator          | address   | Address of the operator that received the tokens              |
| tokenId           | uint256[] | An array of token ids that were received                      |
| amount            | uint256[] | An array of the amount of tokens that were received           |

### receive

```solidity
receive() external payable
```

### approveERC721

```solidity
function approveERC721(address nftContract, address to, uint256 tokenId) external
```

_Approves another address to transfer the given token ID_

#### Parameters

| Name        | Type    | Description                                   |
| ----------- | ------- | --------------------------------------------- |
| nftContract | address | The address of the ERC721 contract to approve |
| to          | address | Address to be approved for the given token ID |
| tokenId     | uint256 | ID of the token to be approved                |

### approveERC1155

```solidity
function approveERC1155(address nftContract, address to) external
```

_Approves another address to transfer all ERC1155 tokens belonging to this smart contract_

#### Parameters

| Name        | Type    | Description                                    |
| ----------- | ------- | ---------------------------------------------- |
| nftContract | address | The address of the ERC1155 contract to approve |
| to          | address | Address to be approved                         |

### onERC721Received

```solidity
function onERC721Received(address operator, address from, uint256 tokenId, bytes data) public returns (bytes4)
```

_Function called by the ERC721-compliant smart contract when an ERC721 token is received.
This function verifies that the caller is an ERC721 contract and that the operator has the approval for the token.
Then it calls the super function and emit an event of NftReceived_

#### Parameters

| Name     | Type    | Description                                                                 |
| -------- | ------- | --------------------------------------------------------------------------- |
| operator | address | The address that call the onERC721Received function in the smart contract   |
| from     | address | The address from which the token is received                                |
| tokenId  | uint256 | The id of the received token                                                |
| data     | bytes   | Additional data with no specified format, sent by the ERC721 smart contract |

#### Return Values

| Name | Type   | Description                                                        |
| ---- | ------ | ------------------------------------------------------------------ |
| [0]  | bytes4 | The bytes4 identifier of the function that the super function call |

### onERC1155Received

```solidity
function onERC1155Received(address operator, address from, uint256 tokenId, uint256 amount, bytes data) public returns (bytes4)
```

_Function called by the ERC1155-compliant smart contract when an ERC1155 token is received.
This function verifies that the caller is an ERC1155 contract and that the operator has the approval for the token.
Then it calls the super function and emit an event of NftReceived_

#### Parameters

| Name     | Type    | Description                                                                  |
| -------- | ------- | ---------------------------------------------------------------------------- |
| operator | address | The address that call the onERC1155Received function in the smart contract   |
| from     | address | The address from which the token is received                                 |
| tokenId  | uint256 | The id of the received token                                                 |
| amount   | uint256 | The amount of token received                                                 |
| data     | bytes   | Additional data with no specified format, sent by the ERC1155 smart contract |

#### Return Values

| Name | Type   | Description                                                        |
| ---- | ------ | ------------------------------------------------------------------ |
| [0]  | bytes4 | The bytes4 identifier of the function that the super function call |

### onERC1155BatchReceived

```solidity
function onERC1155BatchReceived(address operator, address from, uint256[] ids, uint256[] values, bytes data) public returns (bytes4)
```

_Handle batch of ERC1155 tokens being received_

#### Parameters

| Name     | Type      | Description                               |
| -------- | --------- | ----------------------------------------- |
| operator | address   | address that called safeBatchTransferFrom |
| from     | address   | address that originally owned the NFTs    |
| ids      | uint256[] | array of token IDs                        |
| values   | uint256[] | array of amounts                          |
| data     | bytes     | data passed to safeBatchTransferFrom      |

#### Return Values

| Name | Type   | Description                                            |
| ---- | ------ | ------------------------------------------------------ |
| [0]  | bytes4 | bytes4 value of the function call's success or failure |

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view returns (bool)
```

_Function to check if the contract implements the required interface_

#### Parameters

| Name        | Type   | Description                     |
| ----------- | ------ | ------------------------------- |
| interfaceId | bytes4 | bytes4 The interface identifier |

#### Return Values

| Name | Type | Description                                                                 |
| ---- | ---- | --------------------------------------------------------------------------- |
| [0]  | bool | bool Returns true if the contract implements the interface, false otherwise |
