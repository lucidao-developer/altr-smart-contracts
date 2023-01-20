import { ethers } from "hardhat";
import { buyoutFee, redemptionFee, saleFee, servicePid, stakedTokens, timelockAddress, tokensForEligibility } from "../config/config";
import { IStakingService } from "../typechain-types";
import {
    getOrDeployAllowList, getOrDeployFarm, getOrDeployFeeManager, getOrDeployFractions,
    getOrDeployFractionsSale, getOrDeployfUsdt, getOrDeployLicenseManager, getOrDeployLucidaoGovernanceNftReserve, getOrDeployLucidaoGovernanceReserve, getOrDeployNftCollateralRetriever, getOrDeployNftCollectionFactory
} from "./deployFunctions";
import { isDevelopment, isTest, removeOpenzeppelinProxyManifestFile } from "./utilities";

async function main() {
    const [deployer, fakeTimelock] = await ethers.getSigners();

    console.log(`Deploying contracts with the account: ${deployer.address} on Network: ${process.env.HARDHAT_NETWORK}`);
    console.log(`Account balance: ${(await deployer.getBalance()).toString()}`);

    if (!isDevelopment() && !isTest()) {
        throw new Error("Check env parameters");
    }

    let myTimelockAddress = timelockAddress || "";
    if (isDevelopment()) {
        myTimelockAddress = fakeTimelock.address;
    }

    await removeOpenzeppelinProxyManifestFile(ethers.provider);

    const fUsdt = await getOrDeployfUsdt(deployer);

    const governanceTreasury = await getOrDeployLucidaoGovernanceReserve(myTimelockAddress);

    const stakingFarm = await getOrDeployFarm(fUsdt, stakedTokens);

    const governanceNftTreasury = await getOrDeployLucidaoGovernanceNftReserve(myTimelockAddress);

    // license manager
    const licenseManager = await getOrDeployLicenseManager(stakingFarm as IStakingService, servicePid, tokensForEligibility);

    // collection factory
    const nftCollectionFactory = await getOrDeployNftCollectionFactory(deployer, licenseManager, governanceNftTreasury);

    // fee manager
    const feeManager = await getOrDeployFeeManager(governanceTreasury, licenseManager, redemptionFee, buyoutFee, saleFee);

    // DEPLOY PROXIED COLLATERAL RETRIEVER
    const collateralRetriever = await getOrDeployNftCollateralRetriever(nftCollectionFactory, feeManager);

    // Altr allow list
    const allowList = await getOrDeployAllowList();

    // Altr fractions
    const fractions = await getOrDeployFractions();

    // Altr fractions sale
    const fractionsSale = await getOrDeployFractionsSale(fractions, allowList, feeManager);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
