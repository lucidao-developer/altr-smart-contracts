import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-contract-sizer";
import "hardhat-gas-reporter";
import { HardhatUserConfig, task } from "hardhat/config";
import "solidity-docgen";

import { isTest, myDotenvConfig, onMumbaiChain, onPolygonMainnetChain } from "./scripts/utilities";

myDotenvConfig();

const chainIds = {
    hardhat: 31337,
    polygonTestnet: 80001,
    polygonMainnet: 137,
};

let mnemonic: string;

if (!process.env.MNEMONIC) {
    throw new Error("Please set your MNEMONIC in the .env file");
} else {
    mnemonic = process.env.MNEMONIC;
}

let polygonscanApiKey = "";

if ((onMumbaiChain() || onPolygonMainnetChain()) && process.env.POLYGONSCAN_API_KEY && !isTest()) {
    polygonscanApiKey = process.env.POLYGONSCAN_API_KEY;
}

const config: HardhatUserConfig = {
    solidity: {
        compilers: [
            {
                version: "0.6.5",
            },
            {
                version: "0.8.17",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
    },
    contractSizer: {
        alphaSort: true,
        disambiguatePaths: false,
        runOnCompile: process.env.CONTRACT_SIZER ? true : false,
        strict: true,
    },
    gasReporter: {
        enabled: process.env.GAS_REPORTER ? true : false,
        gasPriceApi: "https://api.polygonscan.com/api?module=proxy&action=eth_gasPrice",
        coinmarketcap: process.env.COIN_MARKET_CAP_API_KEY,
        token: "MATIC",
        currency: "USD",
    },
    docgen: {
        exclude: ["test", "libraries", "interfaces"],
    },
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            accounts: {
                mnemonic: mnemonic,
                accountsBalance: "90000000000000000000000",
                count: 10,
            },
            chainId: chainIds.hardhat,
            gas: 950000000,
            blockGasLimit: 950000000,
            allowUnlimitedContractSize: true,
        },
        polygonTestnet: {
            url: "https://rpc-mumbai.maticvigil.com/",
            chainId: chainIds.polygonTestnet,
            accounts: { mnemonic: mnemonic },
        },
        polygonMainnet: {
            url: "https://polygon-rpc.com/",
            chainId: chainIds.polygonMainnet,
            accounts: { mnemonic: mnemonic },
            gasMultiplier: 3,
            gas: 3000000,
        },
    },
    etherscan: {
        apiKey: {
            polygon: polygonscanApiKey,
            polygonMumbai: polygonscanApiKey,
        },
    },
};

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
    const accounts = await hre.ethers.getSigners();

    for (const account of accounts) {
        console.log(account.address);
    }
});

task("polygonscan", "validate smart contract on polygonscan", async (args, hre) => {
    const [deployer] = await hre.ethers.getSigners();
    console.log(`Deploying account: ${deployer.address}`);

    await hre.run("verify: verify", {
        address: deployer.address,
    });
});

console.log(`Contracts Path: ${config.paths ? config.paths.sources : "contracts"}`);
export default config;
