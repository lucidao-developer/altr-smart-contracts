import { ethers } from "hardhat";
import { buyoutFee, governanceTreasuryAddress, licenseManagerAddress, redemptionFee, saleFee } from "../config/config";
import { getOrDeployFeeManager } from "./deployFunctions";

async function main() {
    const governanceTreasury = await ethers.getContractAt("LucidaoGovernanceReserve", governanceTreasuryAddress!);
    const licenseManager = await ethers.getContractAt("AltrLicenseManager", licenseManagerAddress!);
    await getOrDeployFeeManager(governanceTreasury, licenseManager, redemptionFee!, buyoutFee, saleFee);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
