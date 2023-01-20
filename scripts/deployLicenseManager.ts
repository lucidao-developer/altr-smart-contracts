import { ethers } from "hardhat";
import { farmAddress, servicePid, tokensForEligibility } from "../config/config";
import { IStakingService } from "../typechain-types";
import { getOrDeployLicenseManager } from "./deployFunctions";

async function main() {
    const stakingFarm = await ethers.getContractAt("TestFarm", farmAddress!);
    await getOrDeployLicenseManager(stakingFarm as IStakingService, servicePid, tokensForEligibility);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
