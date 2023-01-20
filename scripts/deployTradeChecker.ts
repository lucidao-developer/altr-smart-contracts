import { ethers } from "hardhat";
import { allowListAddress, zeroExAddress } from "../config/config";
import { getOrDeployTradeChecker } from "./deployFunctions";

async function main() {
    const allowList = await ethers.getContractAt("AltrAllowList", allowListAddress!);
    const zeroEx = await ethers.getContractAt("IZeroEx", zeroExAddress!);

    await getOrDeployTradeChecker(zeroEx, allowList);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
