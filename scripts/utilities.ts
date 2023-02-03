import { Manifest } from "@openzeppelin/upgrades-core";
import { config as configDotenv } from "dotenv";
import fs from "fs";
import { resolve } from "path";
import yesno from "yesno";

export function skipContractVerify() {
    return (isDevelopment() && (!process.env.HARDHAT_NETWORK || process.env.HARDHAT_NETWORK == "localhost")) || isTest();
}

export function onMumbaiChain() {
    return process.env.HARDHAT_NETWORK == "polygonTestnet" || searchScriptArgsUsingNodeJsProcess("polygonTestnet");
}

export function onPolygonMainnetChain() {
    return process.env.HARDHAT_NETWORK == "polygonMainnet" || searchScriptArgsUsingNodeJsProcess("polygonMainnet");
}

export function isDevelopment() {
    return process.env.NODE_ENV == "development";
}

export function isTest() {
    return process.env.NODE_ENV == "test";
}

export function testRunningInHardhat() {
    return (
        searchScriptArgsUsingNodeJsProcess("hardhat,test") || runningCoverageScript() || searchScriptArgsUsingNodeJsProcess("mocha-test")
    );
}

export async function getOpenzeppelinNetworkManifestFilename(provider: any) {
    var filename = (await Manifest.forNetwork(provider)).file;
    return filename;
}

export async function removeOpenzeppelinProxyManifestFile(provider: any) {
    const moduleName = await getOpenzeppelinNetworkManifestFilename(provider);
    console.log(`Trying to remove ${moduleName} ...`);

    try {
        fs.accessSync(moduleName, fs.constants.F_OK);
        if (onPolygonMainnetChain()) {
            console.error("Openzeppelin proxy file for Polygon mainnet already exists! Abort...");
            throw new Error("Manually manage openzeppelin proxy file...");
        }
    } catch (err) {
        console.error(`File ${moduleName} not found. Skip remove...`);
        return;
    }

    try {
        fs.unlinkSync(moduleName);
    } catch (err) {
        console.error(`Cannot remove file ${moduleName}`);
        throw err;
    }

    console.log(`Succesfully removed file ${moduleName}`);
}

export function throwIfNot<T, K extends keyof T>(obj: Partial<T>, prop: K, msg?: string): T[K] {
    if (obj[prop] === undefined || obj[prop] === null || obj[prop] === "") {
        throw new Error(msg || `Environment is missing variable ${String(prop)}`);
    } else {
        return obj[prop] as T[K];
    }
}

export async function importModule(moduleName: string): Promise<any> {
    console.log(`importing ${moduleName}`);
    const importedModule = await import(moduleName);
    console.log(`imported...`);
    return importedModule;
}

export function searchScriptArgsUsingNodeJsProcess(key: string) {
    const exists_in_npm_lifecycle = process.env.npm_lifecycle_script && process.env.npm_lifecycle_script.indexOf(key) > -1;

    const exists_in_argv = process.argv.join().indexOf(key) > -1;

    return exists_in_npm_lifecycle || exists_in_argv;
}

export function runningCoverageScript() {
    if (searchScriptArgsUsingNodeJsProcess("hardhat,coverage,--solcoverjs")) {
        return true;
    }
    return false;
}

export function mockConsoleLog() {
    let origFn = console.log;

    console.log = function (msg) {
        if (process.env.npm_config_loglevel == "silent") {
            return;
        }
        origFn(msg);
    };
}

export function myDotenvConfig() {
    let targetEnvironment = `../.env.${process.env.NODE_ENV}`;
    console.log(`Environment: ${resolve(__dirname, targetEnvironment)}`);
    configDotenv({
        path: resolve(__dirname, targetEnvironment),
    });

    let mandatoryEnvParams = ["MNEMONIC", "POLYGONSCAN_API_KEY"];
    if (!isDevelopment()) {
        mandatoryEnvParams.push("GovernanceTreasuryAddress");
        mandatoryEnvParams.push("FusdtAddress");
        mandatoryEnvParams.push("TimelockAddress");
    }

    mandatoryEnvParams.forEach((v) => {
        throwIfNot(process.env, v);
    });
}

export function numberExponentToLarge(numIn: string) {
    numIn += "";
    var sign = "";
    numIn.charAt(0) == "-" && ((numIn = numIn.substring(1)), (sign = "-"));
    var str = numIn.split(/[eE]/g);
    if (str.length < 2) return sign + numIn;
    var power = Number(str[1]);

    var deciSp = (1.1).toLocaleString().substring(1, 2);
    str = str[0].split(deciSp);
    var baseRH = str[1] || "",
        baseLH = str[0];

    if (power >= 0) {
        if (power > baseRH.length) baseRH += "0".repeat(power - baseRH.length);
        baseRH = baseRH.slice(0, power) + deciSp + baseRH.slice(power);
        if (baseRH.charAt(baseRH.length - 1) == deciSp) baseRH = baseRH.slice(0, -1);
    } else {
        let num = Math.abs(power) - baseLH.length;
        if (num > 0) baseLH = "0".repeat(num) + baseLH;
        baseLH = baseLH.slice(0, power) + deciSp + baseLH.slice(power);
        if (baseLH.charAt(0) == deciSp) baseLH = "0" + baseLH;
    }
    return sign + (baseLH + baseRH).replace(/^0*(\d+|\d+\.\d+?)\.?0*$/, "$1");
}

export async function ask(question: string, interactive: boolean = true, exit: boolean = true) {
    if (!interactive) {
        console.log(`Non interactive mode...skipping:\n ${question}`);
        console.log("");
        return !exit;
    }
    const ok = await yesno({
        question: `* ${question}`,
    });
    if (!ok && exit) {
        process.exit(1);
    }
    return ok;
}
