import { ethers } from "hardhat";
import { isDevelopment, myDotenvConfig, onPolygonMainnetChain } from "../scripts/utilities";

interface IProcessEnv {
    MNEMONIC: string;
    POLYGONSCAN_API_KEY: string;
    GovernanceTreasuryAddress: string;
    TimelockAddress: string;
}

declare global {
    namespace NodeJS {
        interface ProcessEnv extends IProcessEnv { }
    }
}

myDotenvConfig();

if (isDevelopment()) {
    //change parameters value
}

export const FEE_TOKEN = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const IPFS_BASE_URL = "ipfs://";

let governanceTreasuryAddress: string | undefined = "";
let timelockAddress: string | undefined = "";
let fusdtAddress: string | undefined = "";
let farmAddress: string | undefined = "";

let governanceNftReserveAddress: string | undefined = "";
let licenseManagerAddress: string | undefined = "";
let feeManagerAddress: string | undefined = "";
let nftCollectionFactoryAddress: string | undefined = "";
let nftCollateralRetrieverAddress: string | undefined = "";
let allowListAddress: string | undefined = "";
let fractionsSaleUtilitiesAddress: string | undefined = "";

let altrFractionsAddress: string | undefined = "";
let altrFractionsSaleAddress: string | undefined = "";
let altrFractionsBuyoutAddress: string | undefined = "";

let tradeCheckerAddress: string | undefined = "";

const stakedTokens = 1000;
const servicePid = 0;
const tokensForEligibility = 0;
const redemptionFee = 1; // Chain Native Token
const insolvencyGracePeriod = 15552000; // seconds: 180 days
const minGracePeriod = 5184000; // seconds: 60 days
const freeVaultServicePeriod = 157680000; // seconds: 5 years

//Altr fractions sale
const buyoutFee = 400;
const saleFee = 400;
const buyoutMinFractions = 5000;
const buyoutOpenTimePeriod = 172800;

const tiers = {
    priceLimits: [
        ethers.utils.parseUnits("0", 6),
        ethers.utils.parseUnits("500000", 6),
        ethers.utils.parseUnits("1000000", 6),
        ethers.utils.parseUnits("2500000", 6),
        ethers.utils.parseUnits("4000000", 6),
    ],
    fractionsAmounts: [500, 1000, 4000, 6000, 10000],
};

let erc1155MetadataUri = "https://testapi.altr.trade/api/erc1155metadata/";

let zeroExAddress = "0x4fb72262344034e034fce3d9c701fd9213a55260";

if (onPolygonMainnetChain()) {
    timelockAddress = process.env.TimelockAddress;
    governanceTreasuryAddress = process.env.GovernanceTreasuryAddress;
    fusdtAddress = process.env.FusdtAddress;
    allowListAddress = process.env.AllowListAddress;

    erc1155MetadataUri = "https://api.altr.trade/api/erc1155metadata/";
    zeroExAddress = "0xdef1c0ded9bec7f1a1670819833240f027b25eff";
}

export {
    nftCollectionFactoryAddress,
    governanceTreasuryAddress,
    timelockAddress,
    licenseManagerAddress,
    feeManagerAddress,
    governanceNftReserveAddress,
    fusdtAddress,
    farmAddress,
    nftCollateralRetrieverAddress,
    allowListAddress,
    fractionsSaleUtilitiesAddress,
    altrFractionsAddress,
    altrFractionsSaleAddress,
    altrFractionsBuyoutAddress,
    stakedTokens,
    servicePid,
    tokensForEligibility,
    redemptionFee,
    insolvencyGracePeriod,
    minGracePeriod,
    freeVaultServicePeriod,
    buyoutFee,
    saleFee,
    buyoutMinFractions,
    buyoutOpenTimePeriod,
    tiers,
    erc1155MetadataUri,
    zeroExAddress,
    tradeCheckerAddress,
};
