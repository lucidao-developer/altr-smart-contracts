import { ethers } from "hardhat";
import { buyoutFee, redemptionFee, saleFee, servicePid, stakedTokens, timelockAddress, tokensForEligibility } from "../config/config";
import { IStakingService } from "../typechain-types";
import {
    getOrDeployAllowList,
    getOrDeployFarm,
    getOrDeployFeeManager,
    getOrDeployFractions,
    getOrDeployFractionsBuyout,
    getOrDeployFractionsSale,
    getOrDeployfUsdt,
    getOrDeployLicenseManager,
    getOrDeployLucidaoGovernanceNftReserve,
    getOrDeployLucidaoGovernanceReserve,
    getOrDeployNftCollateralRetriever,
    getOrDeployNftCollectionFactory,
    getOrDeployTradeChecker,
} from "./deployFunctions";
import { isDevelopment, isTest, removeOpenzeppelinProxyManifestFile } from "./utilities";
import { zeroExAddress } from "../config/config";

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
    const nftCollectionFactory = await getOrDeployNftCollectionFactory(licenseManager, governanceNftTreasury);

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

    // Altr fractions buyout
    const fractionsBuyout = await getOrDeployFractionsBuyout(deployer, fractions, fractionsSale, feeManager);

    // Zero Ex contract
    const zeroEx = await ethers.getContractAt("IZeroEx", zeroExAddress!);

    // Altr trade checker
    const tradeChecker = await getOrDeployTradeChecker(zeroEx, allowList, feeManager);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
