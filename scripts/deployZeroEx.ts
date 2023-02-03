import { ethers } from "hardhat";
import IOwnableFeature from "../artifacts/@0x/contracts-zero-ex/contracts/src/features/interfaces/IOwnableFeature.sol/IOwnableFeature.json";

const WETH = ethers.constants.AddressZero;
const STAKING = ethers.constants.AddressZero;
const PROTOCOL_FEE_MULTIPLIER = 1;

export async function deploySimpleFunctionRegistryFeature() {
    const SimpleFunctionRegistry = await ethers.getContractFactory("AltrSimpleFunctionRegistryFeature");
    const simpleFunctionRegistry = await SimpleFunctionRegistry.deploy();
    console.log(`Simple Function Registry Feature: ${simpleFunctionRegistry.address}`);
    return simpleFunctionRegistry.address;
}

export async function deployOwnableFeature() {
    const OwnableFeature = await ethers.getContractFactory("AltrOwnableFeature");
    const ownableFeature = await OwnableFeature.deploy();
    console.log(`Ownable Feature: ${ownableFeature.address}`);
    return ownableFeature.address;
}

export async function deployInitialMigration() {
    const [deployer] = await ethers.getSigners();
    const InitialMigration = await ethers.getContractFactory("AltrInitialMigration");
    const initialMigration = await InitialMigration.deploy(deployer.address);
    console.log(`Initial Migration: ${initialMigration.address}`);
    return initialMigration;
}

export async function deployZeroEx(bootstrapCallerAddress: string) {
    const ZeroEx = await ethers.getContractFactory("AltrZeroEx");
    const zeroEx = await ZeroEx.deploy(bootstrapCallerAddress);
    console.log(`Zero Ex: ${zeroEx.address}`);
    return zeroEx;
}

export async function deployFeeControllerContract() {
    const FeeCollectorController = await ethers.getContractFactory("AltrFeeCollectorController");
    const feeCollectorController = await FeeCollectorController.deploy(ethers.constants.AddressZero, ethers.constants.AddressZero);
    console.log(`Fee Collector Controller: ${feeCollectorController.address}`);
    return feeCollectorController;
}

export async function deployBootstrapFeaturesAsync() {
    return {
        registry: await deploySimpleFunctionRegistryFeature(),
        ownable: await deployOwnableFeature(),
    };
}

/**
 * Migrate an instance of the Exchange proxy with minimum viable features.
 */
export async function initialMigrateAsync() {
    const owner = (await ethers.getSigners())[0];
    console.log(`Owner: ${owner.address}`);
    const migrator = await deployInitialMigration();
    const zeroEx = await deployZeroEx(migrator.address);
    const _features = await deployBootstrapFeaturesAsync();
    await (await migrator.initializeZeroEx(owner.address, zeroEx.address, _features)).wait();
    return zeroEx;
}

async function deployTransformERC20(): Promise<string> {
    const TransformERC20 = await ethers.getContractFactory("AltrTransformERC20Feature");
    const transformERC20 = await TransformERC20.deploy();
    console.log(`Transform ERC20: ${transformERC20.address}`);
    return transformERC20.address;
}

async function deployMetaTransactions(zeroExAddress: string): Promise<string> {
    const MetaTransactions = await ethers.getContractFactory("AltrMetaTransactionsFeature");
    const metaTransactions = await MetaTransactions.deploy(zeroExAddress);
    console.log(`Meta Transactions: ${metaTransactions.address}`);
    return metaTransactions.address;
}

async function deployNativeOrders(zeroExAddress: string, feeCollectorControllerAddress: string): Promise<string> {
    const NativeOrders = await ethers.getContractFactory("AltrNativeOrdersFeature");
    const nativeOrders = await NativeOrders.deploy(zeroExAddress, WETH, STAKING, feeCollectorControllerAddress, PROTOCOL_FEE_MULTIPLIER);
    console.log(`Native Orders: ${nativeOrders.address}`);
    return nativeOrders.address;
}

async function deployOtcOrder(zeroExAddress: string): Promise<string> {
    const OtcOrders = await ethers.getContractFactory("AltrOtcOrdersFeature");
    const otcOrders = await OtcOrders.deploy(zeroExAddress, WETH);
    console.log(`Otc Orders: ${otcOrders.address}`);
    return otcOrders.address;
}

/**
 * Deploy all the features for a full Exchange Proxy.
 */
export async function deployFullFeaturesAsync(zeroExAddress: string) {
    const feeCollectorController = await deployFeeControllerContract();
    return {
        ...(await deployBootstrapFeaturesAsync()),
        transformERC20: await deployTransformERC20(),
        metaTransactions: await deployMetaTransactions(zeroExAddress),
        nativeOrders: await deployNativeOrders(zeroExAddress, feeCollectorController.address),
        otcOrders: await deployOtcOrder(zeroExAddress),
    };
}

async function deployFullMigration() {
    const [deployer] = await ethers.getSigners();
    const FullMigration = await ethers.getContractFactory("AltrFullMigration");
    const fullMigration = await FullMigration.deploy(deployer.address);
    console.log(`Full Migration: ${fullMigration.address}`);
    return fullMigration;
}

export async function deployERC721Orders(zeroExAddress: string) {
    const ERC721Orders = await ethers.getContractFactory("AltrERC721OrdersFeature");
    const erc721Orders = await ERC721Orders.deploy(zeroExAddress, WETH);
    console.log(`ERC721Orders: ${erc721Orders.address}`);
    return erc721Orders;
}

/**
 * Deploy a fully featured instance of the Exchange Proxy.
 */
export async function deployZeroExAndFullMigrate() {
    const [deployer] = await ethers.getSigners();
    const migrator = await deployFullMigration();
    const bootstrapCaller = await migrator.getBootstrapper();
    const zeroEx = await deployZeroEx(bootstrapCaller);
    const _features = await deployFullFeaturesAsync(zeroEx.address);
    const erc721Orders = await deployERC721Orders(zeroEx.address);
    const migrateOpts = {
        transformerDeployer: deployer.address,
    };
    await migrator.migrateZeroEx(deployer.address, zeroEx.address, _features, migrateOpts);
    const migrateTransaction = await erc721Orders.populateTransaction.migrate();
    const zeroExMigrator = new ethers.Contract(zeroEx.address, IOwnableFeature.abi, deployer);
    const tx = await zeroExMigrator.migrate(erc721Orders.address, migrateTransaction.data, deployer.address);
    console.log(tx);
    return zeroEx;
}

deployZeroExAndFullMigrate();
