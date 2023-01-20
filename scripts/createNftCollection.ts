import { ethers } from "hardhat";
import {
    freeVaultServicePeriod, insolvencyGracePeriod,
    minGracePeriod,
    nftCollectionFactoryAddress
} from "../config/config";

async function main() {
    const [signer] = await ethers.getSigners();
    console.log(`Creating collection with signer: ${signer.address}`);
    const contractName = "AltrNftCollectionFactory";
    const name = "<name>";
    const symbol = "<symbol>";
    const oracle = "<oracle>";

    console.log(`\nCreating collection ${name} on ${contractName} at address ${nftCollectionFactoryAddress}`);
    const collectionFactory = await ethers.getContractAt(contractName, nftCollectionFactoryAddress!);
    const transaction = await collectionFactory.createCollection(
        name,
        symbol,
        oracle,
        signer.address,
        minGracePeriod,
        insolvencyGracePeriod,
        freeVaultServicePeriod
    );
    const receipt = await transaction.wait();
    console.log(receipt);

    const createdContracts = await collectionFactory.createdContracts(0);
    console.log(createdContracts[0]);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
