import { ethers, upgrades } from "hardhat";
import { AltrNftCollectionFactoryV2 } from "../typechain-types";
import { getOrDeployNftCollectionFullFactory, getOrDeployNftCollectionLightFactory } from "./deployFunctions";
import { verifyProxiedContractImplementation } from "../scripts/deployFunctions";
import { nftCollectionFactoryAddress } from "../config/config";

// Remember to add AltrNftCollectionFactoryAddress to .env file
async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying contracts with the account: ${deployer.address} on Network: ${process.env.HARDHAT_NETWORK}`);
    console.log(`Account balance: ${(await deployer.getBalance()).toString()}`);

    console.log(nftCollectionFactoryAddress);

    const AltrNftCollectionFactory = await ethers.getContractFactory("AltrNftCollectionFactory");
    const AltrNftCollectionFactoryV2 = await ethers.getContractFactory("AltrNftCollectionFactoryV2");
    await upgrades.validateUpgrade(AltrNftCollectionFactory, AltrNftCollectionFactoryV2);
    console.log("upgrade validated");

    const nftCollectionFullFactory = await getOrDeployNftCollectionFullFactory(nftCollectionFactoryAddress!);
    const nftCollectionLightFactory = await getOrDeployNftCollectionLightFactory(nftCollectionFactoryAddress!);

    const altrNftCollectionFactoryV2 = (await upgrades.upgradeProxy(nftCollectionFactoryAddress!, AltrNftCollectionFactoryV2, {
        call: { fn: "migrate", args: [nftCollectionFullFactory.address, nftCollectionLightFactory.address] },
    })) as AltrNftCollectionFactoryV2;

    console.log(`Nft collection factory at address: ${altrNftCollectionFactoryV2.address} successfully upgraded!`);

    await verifyProxiedContractImplementation(
        "AltrNftCollectionFactoryV2",
        altrNftCollectionFactoryV2,
        "contracts/AltrNftCollectionFactoryV2.sol:AltrNftCollectionFactoryV2"
    );
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
