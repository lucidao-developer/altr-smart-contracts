import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";
import { hexlify, toUtf8Bytes } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { Network } from "hardhat/types";
import { ZERO_ADDRESS } from "../config/config";
import { isDevelopment, testRunningInHardhat } from "../scripts/utilities";
import { AnyswapV3ERC20 } from "../typechain-types";
import path from "path";
import fs from "fs";

export function checkSkipTest(skipFlag: boolean, context: Mocha.Context) {
    if (skipFlag) {
        context.skip();
    }
}

export async function resetNetwork(network: Network) {
    if (isDevelopment() && (process.env.HARDHAT_NETWORK || process.env.HARDHAT_NETWORK == "localhost")) {
        await network.provider.send("hardhat_reset");
    }
}

export async function setSnapshot(network: Network): Promise<Uint8Array | undefined> {
    if (testRunningInHardhat()) {
        return network.provider.send("evm_snapshot");
    }
    return Promise.resolve(undefined);
}

export async function restoreSnapshot(network: Network, snapshot: Uint8Array | undefined) {
    if (testRunningInHardhat()) {
        await network.provider.send("evm_revert", [snapshot]);
    }
}

export function getUnixEpoch(minutes: number) {
    return Math.round((new Date().getTime() + 1000 * 60 * minutes) / 1000);
}

export async function setNetworkTimestampTo(timestamp: number) {
    await ethers.provider.send("evm_mine", [timestamp]);
}

export async function getCurrentChainTimestamp() {
    const blockNumBefore = await ethers.provider.getBlockNumber();
    const blockBefore = await ethers.provider.getBlock(blockNumBefore);
    return blockBefore.timestamp;
}

export async function resetfUsdtBalanceForSigner(fUsdt: AnyswapV3ERC20, signer: SignerWithAddress) {
    let balance = await fUsdt.balanceOf(signer.address);
    await (await fUsdt.connect(signer).transfer(ZERO_ADDRESS, balance)).wait();
    console.log(`Trashed ${balance} fUSDT for address ${signer.address}`);
}

export async function mintBigNumberfUsdtTo(fUsdt: AnyswapV3ERC20, address: string, qty: BigNumber) {
    await (await fUsdt.mint(address, qty)).wait();
    console.log(`Transferred ${qty.toString()} fUSDT to ${address}`);
}

export async function mintfUsdtTo(fUsdt: AnyswapV3ERC20, address: string, qty: string) {
    await (await fUsdt.mint(address, ethers.utils.parseUnits(qty, 6))).wait();
    console.log(`Transferred ${qty.toString()} fUSDT to ${address}`);
}

export function toBytes1(text: string): string {
    const bytes = toUtf8Bytes(text);

    if (bytes.length != 1) {
        throw new Error("bytes1 string must be less of 1 bytes");
    }

    return hexlify(bytes);
}

export function getInterfaceIDFromAbiFile(file: string): BigNumber {
    const { abi, sourceName } = JSON.parse(file);
    const functionsName = getFunctionsNameFromContractSourceName(sourceName);
    const contractInterface = new ethers.utils.Interface(abi);
    let interfaceID = ethers.constants.Zero;
    const functions = Object.keys(contractInterface.functions);
    for (let i = 0; i < functions.length; i++) {
        if (functionsName.includes(functions[i].split("(")[0])) {
            interfaceID = interfaceID.xor(contractInterface.getSighash(functions[i]));
        }
    }

    return interfaceID;
}

function getFunctionsNameFromContractSourceName(sourceName: string): string[] {
    let contractPath = path.resolve(__dirname, "../", sourceName);
    let contractFile: string;
    try {
        contractFile = fs.readFileSync(contractPath, "utf8");
    } catch (e) {
        contractPath = path.resolve(__dirname, "../node_modules", sourceName);
        try {
            contractFile = fs.readFileSync(contractPath, "utf8");
        } catch (e) {
            throw e;
        }
    }
    const contract = contractFile.split(" ");
    const functionsName = [];
    for (let i = 0; i < contract.length; i++) {
        if (contract[i].includes("/*")) {
            while (!contract[i].includes("*/")) {
                i++;
            }
        }
        if (contract[i].includes("function")) {
            i++;
            functionsName.push(contract[i].split("(")[0]);
        }
    }
    return functionsName;
}
