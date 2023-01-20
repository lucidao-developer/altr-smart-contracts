import { ethers } from "hardhat";
import { governanceNftReserveAddress, licenseManagerAddress } from "../config/config";
import { getOrDeployNftCollectionFactory } from "./deployFunctions";

async function main() {
    const [deployer] = await ethers.getSigners();
    const licenseManager = await ethers.getContractAt("AltrLicenseManager", licenseManagerAddress!);
    const governanceNftTreasury = await ethers.getContractAt("LucidaoGovernanceNftReserve", governanceNftReserveAddress!);
    await getOrDeployNftCollectionFactory(deployer, licenseManager, governanceNftTreasury);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
