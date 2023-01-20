import { ethers } from "hardhat";
import { allowListAddress, altrFractionsAddress, feeManagerAddress } from "../config/config";
import { getOrDeployFractionsSale } from "./deployFunctions";

async function main() {
    const fractions = await ethers.getContractAt("AltrFractions", altrFractionsAddress!);
    const feeManager = await ethers.getContractAt("AltrFeeManager", feeManagerAddress!);
    const allowList = await ethers.getContractAt("AltrAllowList", allowListAddress!);

    await getOrDeployFractionsSale(fractions, allowList, feeManager);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
