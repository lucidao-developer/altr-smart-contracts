<h2 align="center">Altr Marketplace</h3>

<div align="center">

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](/LICENSE)

</div>

<p align="center"> Collection of smart contracts, scripts and tests for the management of the Altr Marketplace platform.
    <br> 
</p>

---

### Setup

This repository uses Docker Compose to work properly.
Prior to conducting any action, you must start the **test_lucidao_marketplace_smart_contracts container**.

Follow these instructions to setup the repository for testing and deploying the Altr contracts:

- Install docker and docker-compose:
  https://docs.docker.com/compose/install/

- Start the application by running:

```
  $ cd docker/
  $ docker-compose -f docker-compose.yml up --build -d
```

### Testing

- Run a bash instance in the container:

```
    $ docker exec -it test_lucidao_marketplace_smart_contracts bash
```

- Prepare the contracts and run the tests from inside the container:

```
    $ npx hardhat typechain
    $ npm run test --silent
```

### Development

Setup the development environment by following these instructions:

- Create an enviroment file named **.env.development**:

```
    $ touch .env.development
```

- and fill it with the following enviroment variables:

  - Add a **Mnemonic** (only first address will be used)

    ```
        MNEMONIC=""
    ```

  - Add a **Polygonscan Api Key**

    ```
        POLYGONSCAN_API_KEY=""
    ```

- Run the container:

```
    $ docker-compose -f docker-compose.development.yml up --build -d
```

- To deploy a contract, run the associated script:

```
    $ npx hardhat run scripts/{deployScriptName}.ts
```

### Integrations

The Altr Marketplace integrates with the [0x v4 NFT Protocol](https://docs.0x.org/nft-support/docs/introduction) and the [SwapSDK Hosted Orderbook](https://docs.swapsdk.xyz/) to provide a secure environment for managing non-custodial NFT listings.

### Documentation

The Altr Marketplace smart contracts ecosystem governs the issuance, sale and trade of NFTs representing the sole-ownership (ERC-721) or co-ownership (ERC-1155) of real-world luxury objects
and the physical retrieval of said objects in exchange for the corresponding NFT.

The ecosystem is comprised of multiple interconnected smart contracts, its general overview is described by the following diagram:

| ![Altr Marketplace Use Case Diagram](https://storage.lucidao.com/51d374ec-06bd-4bc4-b296-40513052fbe0-bucket/lcd-marketplace-diagrams/use-case-diagram-v2.jpg) |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|                                                    <b>Altr Marketplace Smart Contracts Use Case Diagram</b>                                                    |

| ![Nft Collection Factory Activity Diagram](https://storage.lucidao.com/51d374ec-06bd-4bc4-b296-40513052fbe0-bucket/lcd-marketplace-diagrams/nft-collection-factory-activity-diagram-v2.jpg) |
| :-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|                                                               <b>Altr Marketplace Nft Collection Factory Activity Diagram</b>                                                               |

| ![Nft Collection Activity Diagram](https://storage.lucidao.com/51d374ec-06bd-4bc4-b296-40513052fbe0-bucket/lcd-marketplace-diagrams/nft-collection-activity-diagram-v2.jpg) |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|                                                           <b>Altr Marketplace Nft Collection Activity Diagram</b>                                                           |

| ![Nft Collateral Retriever Activity Diagram](https://storage.lucidao.com/51d374ec-06bd-4bc4-b296-40513052fbe0-bucket/lcd-marketplace-diagrams/collateral-retriever-activity-diagram-v2.jpg) |
| :-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|                                                              <b>Altr Marketplace Nft Collateral Retriever Activity Diagram</b>                                                              |

| ![License Manager Activity Diagram](https://storage.lucidao.com/51d374ec-06bd-4bc4-b296-40513052fbe0-bucket/lcd-marketplace-diagrams/license-manager-activity-diagram-v2.jpg) |
| :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|                                                           <b>Altr Marketplace License Manager Activity Diagram</b>                                                            |

| ![Fee Manager Activity Diagram](https://storage.lucidao.com/51d374ec-06bd-4bc4-b296-40513052fbe0-bucket/lcd-marketplace-diagrams/fee-manager-activity-diagram-v2.jpg) |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|                                                         <b>Altr Marketplace Fee Manager Activity Diagram</b>                                                          |

| ![Fractions Activity Diagram](https://storage.lucidao.com/51d374ec-06bd-4bc4-b296-40513052fbe0-bucket/lcd-marketplace-diagrams/fractions-activity-diagram.jpg) |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|                                                       <b>Altr Marketplace Fractions Activity Diagram</b>                                                       |

| ![Fractions Sale Activity Diagram](https://storage.lucidao.com/51d374ec-06bd-4bc4-b296-40513052fbe0-bucket/lcd-marketplace-diagrams/fractions-sale-activity-diagram.jpg) |
| :----------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|                                                         <b>Altr Marketplace Fractions Sale Activity Diagram</b>                                                          |

| ![Fractions Buyout Activity Diagram](https://storage.lucidao.com/51d374ec-06bd-4bc4-b296-40513052fbe0-bucket/lcd-marketplace-diagrams/fractions-buyout-activity-diagram.jpg) |
| :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|                                                          <b>Altr Marketplace Fractions Buyout Activity Diagram</b>                                                           |

| ![Allow List Activity Diagram](https://storage.lucidao.com/51d374ec-06bd-4bc4-b296-40513052fbe0-bucket/lcd-marketplace-diagrams/allow-list-activity-diagram.jpg) |
| :--------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|                                                       <b>Altr Marketplace Allow List Activity Diagram</b>                                                        |

| ![Trade Checker Activity Diagram](https://storage.lucidao.com/51d374ec-06bd-4bc4-b296-40513052fbe0-bucket/lcd-marketplace-diagrams/trade-checker-activity-diagram.jpg) |
| :--------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|                                                         <b>Altr Marketplace Trade Checker Activity Diagram</b>                                                         |

| ![Token Splitter Activity Diagram](https://storage.lucidao.com/51d374ec-06bd-4bc4-b296-40513052fbe0-bucket/lcd-marketplace-diagrams/token-splitter-activity-diagram.jpg) |
| :----------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|                                                                  <b>Token Splitter Activity Diagram</b>                                                                  |

| ![Timed Token Splitter Activity Diagram](https://storage.lucidao.com/51d374ec-06bd-4bc4-b296-40513052fbe0-bucket/lcd-marketplace-diagrams/timed-token-splitter-activity-diagram.jpg) |
| :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|                                                                     <b>Timed Token Splitter Activity Diagram</b>                                                                     |
