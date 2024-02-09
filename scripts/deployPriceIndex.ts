import { ethers } from "hardhat";
import { getOrDeployAltrPriceIndex, getOrDeployFarm, getOrDeployLicenseManager, getOrDeployLucidaoGovernanceNftReserve, getOrDeployNftCollectionFactory, getOrDeployfUsdt, verifyContract } from "./deployFunctions";
import { safePriceIndexWatchesAddress, servicePid, stakedTokens, timelockAddress, tokensForEligibility } from "../config/config";
import { IStakingService } from "../typechain-types";
import { VALUATION_EXPERT_ROLE } from "../config/roles";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying contracts with the account: ${deployer.address} on Network: ${process.env.HARDHAT_NETWORK}`);
    console.log(`Account balance: ${(await deployer.getBalance()).toString()}`);

    const usdt = await getOrDeployfUsdt(deployer);

    const stakingFarm = await getOrDeployFarm(usdt, stakedTokens);

    const governanceNftTreasury = await getOrDeployLucidaoGovernanceNftReserve(timelockAddress!);

    const licenseManager = await getOrDeployLicenseManager(stakingFarm as IStakingService, servicePid, tokensForEligibility);

    const collectionFactory = await getOrDeployNftCollectionFactory(licenseManager, governanceNftTreasury);

    const priceIndex = await getOrDeployAltrPriceIndex(collectionFactory);

    const collectionAddresses: string[] = []; // set address of collections you want to track here

    for (const collectionAddress of collectionAddresses) {
        console.log(`registering collection ${collectionAddress} in the Price Index`);
        await (await priceIndex.registerCollection(collectionAddress, VALUATION_EXPERT_ROLE)).wait();
    }

    console.log(`all collections registered`);

    await priceIndex.grantRole(VALUATION_EXPERT_ROLE, safePriceIndexWatchesAddress!);

    console.log(`valuation expert role granted to ${safePriceIndexWatchesAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
