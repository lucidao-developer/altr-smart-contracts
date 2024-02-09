import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getImplementationAddress } from "@openzeppelin/upgrades-core";
import { Contract } from "ethers";
import { ethers, network, run, upgrades } from "hardhat";
import {
    allowListAddress,
    altrFractionsAddress,
    altrFractionsBuyoutAddress,
    altrFractionsSaleAddress,
    buyoutMinFractions,
    buyoutOpenTimePeriod,
    erc1155MetadataUri,
    farmAddress,
    feeManagerAddress,
    freeVaultServicePeriod,
    fusdtAddress,
    governanceNftReserveAddress,
    governanceTreasuryAddress,
    insolvencyGracePeriod,
    licenseManagerAddress,
    minGracePeriod,
    nftCollateralRetrieverAddress,
    nftCollectionFactoryAddress,
    tiers,
    tradeCheckerAddress,
    zeroExAddress,
    setErc1155MetadataUri,
    nftCollectionFullFactoryAddress,
    nftCollectionLightFactoryAddress,
    altrPriceIndexAddress,
} from "../config/config";
import { ADMIN_ROLE, TRADE_CHECKER_ROLE } from "../config/roles";
import {
    AltrAllowList,
    AltrFeeManager,
    AltrFractions,
    AltrFractionsBuyout,
    AltrFractionsSale,
    AltrLicenseManager,
    AltrNftCollateralRetriever,
    AltrNftCollection,
    AltrNftCollectionFactory,
    AltrTestLicenseManager,
    AnyswapV3ERC20,
    FeeManagerTester,
    IStakingService,
    IZeroEx,
    LucidaoGovernanceNftReserve,
    LucidaoGovernanceReserve,
    TestFarm,
    INftCollectionFactory,
    AltrNftCollectionFullFactory,
    AltrNftCollectionLightFactory,
    AltrPriceIndex
} from "../typechain-types";
import { isProduction, skipContractVerify } from "./utilities";

export async function deployNftCollection(
    name: string,
    symbol: string,
    signer: SignerWithAddress,
    vaultManager: string,
    oracle: string,
    governanceNftTreasury: string
): Promise<AltrNftCollection> {
    const contractName = "AltrNftCollection";
    console.log(`\nDeploying contract ${contractName}`);

    // DEPLOY NFT COLLECTION
    const AltrNftCollection = await ethers.getContractFactory(contractName);
    const contractArgs = [
        name,
        symbol,
        oracle,
        vaultManager,
        signer.address,
        governanceNftTreasury,
        minGracePeriod,
        insolvencyGracePeriod,
        freeVaultServicePeriod,
    ] as const;
    const altrNftCollection: AltrNftCollection = await AltrNftCollection.connect(signer).deploy(...contractArgs);
    await altrNftCollection.deployed();
    console.log(`${contractName} address: ${altrNftCollection.address}`);

    await verifyContract(contractName, {
        address: altrNftCollection.address,
        constructorArguments: contractArgs,
        contract: `contracts/${contractName}.sol:${contractName}`
    });

    return altrNftCollection;
}

export async function getOrDeployNftCollectionFactory(
    licenseManager: AltrLicenseManager,
    governanceNftTreasury: LucidaoGovernanceNftReserve
): Promise<AltrNftCollectionFactory> {
    const contractName = "AltrNftCollectionFactory";

    if (nftCollectionFactoryAddress) {
        console.log(`\nFound contract ${contractName} implementation at address ${nftCollectionFactoryAddress}`);
        return await ethers.getContractAt(contractName, nftCollectionFactoryAddress);
    }

    console.log(`\nDeploying contract ${contractName}`);

    // DEPLOY NFT COLLECTION FACTORY
    const contractArgs = [licenseManager.address, governanceNftTreasury.address];
    const AltrNftCollectionFactory = await ethers.getContractFactory(contractName);
    const altrNftCollectionFactory = (await upgrades.deployProxy(AltrNftCollectionFactory, contractArgs, {
        initializer: "initialize",
    })) as AltrNftCollectionFactory;
    await altrNftCollectionFactory.deployed();
    console.log(`${contractName} address: ${altrNftCollectionFactory.address}`);

    const contractParameter = "contracts/AltrNftCollectionFactory.sol:AltrNftCollectionFactory";
    await verifyProxiedContractImplementation(contractName, altrNftCollectionFactory, contractParameter);
    return altrNftCollectionFactory;
}

export async function getOrDeployNftCollateralRetriever(
    nftCollectionFactory: AltrNftCollectionFactory,
    feeManager: AltrFeeManager
): Promise<AltrNftCollateralRetriever> {
    const contractName = "AltrNftCollateralRetriever";

    if (nftCollateralRetrieverAddress) {
        console.log(`\nFound contract ${contractName} implementation at address ${nftCollateralRetrieverAddress}`);
        return await ethers.getContractAt(contractName, nftCollateralRetrieverAddress);
    }

    console.log(`\nDeploying contract ${contractName}`);

    const AltrNftCollateralRetriever = await ethers.getContractFactory(contractName);
    const contractArgs = [nftCollectionFactory.address, feeManager.address];
    const altrNftCollateralRetriever = (await upgrades.deployProxy(AltrNftCollateralRetriever, contractArgs, {
        initializer: "initialize",
    })) as AltrNftCollateralRetriever;
    await altrNftCollateralRetriever.deployed();
    console.log(`${contractName} address: ${altrNftCollateralRetriever.address}`);

    const contractParameter = "contracts/AltrNftCollateralRetriever.sol:AltrNftCollateralRetriever";
    await verifyProxiedContractImplementation(contractName, altrNftCollateralRetriever, contractParameter);
    return altrNftCollateralRetriever;
}

export async function getOrDeployFeeManager(
    governanceTreasury: LucidaoGovernanceReserve,
    licenseManager: AltrLicenseManager,
    redemptionFee: number,
    buyoutFee: number,
    saleFee: number
): Promise<AltrFeeManager> {
    const contractName = "AltrFeeManager";

    if (feeManagerAddress) {
        console.log(`\nFound contract ${contractName} implementation at address ${feeManagerAddress}`);
        return await ethers.getContractAt(contractName, feeManagerAddress);
    }

    console.log(`\nDeploying contract ${contractName}`);

    // DEPLOY FEE MANAGER
    const AltrFeeManager = await ethers.getContractFactory(contractName);
    const contractArgs = [governanceTreasury.address, licenseManager.address, redemptionFee, buyoutFee, saleFee, zeroExAddress];
    const altrFeeManager = (await upgrades.deployProxy(AltrFeeManager, contractArgs, { initializer: "initialize" })) as AltrFeeManager;

    await altrFeeManager.deployed();
    console.log(`${contractName} address: ${altrFeeManager.address}`);

    const contractParameter = "contracts/AltrFeeManager.sol:AltrFeeManager";
    await verifyProxiedContractImplementation(contractName, altrFeeManager, contractParameter);
    return altrFeeManager;
}

export async function getOrDeployLicenseManager(
    stakingService: IStakingService,
    servicePid: number,
    tokensForEligibility: number
): Promise<AltrLicenseManager> {
    const contractName = "AltrLicenseManager";

    if (licenseManagerAddress) {
        console.log(`\nFound contract ${contractName} implementation at address ${licenseManagerAddress}`);
        return await ethers.getContractAt(contractName, licenseManagerAddress);
    }

    console.log(`\nDeploying contract ${contractName}`);

    // DEPLOY LICENSE MANAGER
    const contractArgs = [stakingService.address, servicePid, tokensForEligibility] as const;
    const AltrLicenseManager = await ethers.getContractFactory(contractName);
    const altrLicenseManager = await AltrLicenseManager.deploy(...contractArgs);
    await altrLicenseManager.deployed();
    console.log(`${contractName} address: ${altrLicenseManager.address}`);

    await verifyContract(contractName, {
        address: altrLicenseManager.address,
        contract: `contracts/${contractName}.sol:${contractName}`,
        constructorArguments: contractArgs,
    });

    return altrLicenseManager;
}

export async function getOrDeployLucidaoGovernanceNftReserve(luciDaoTimelockAddress: string): Promise<LucidaoGovernanceNftReserve> {
    const contractName = "LucidaoGovernanceNftReserve";

    if (governanceNftReserveAddress) {
        console.log(`\nFound contract ${contractName} implementation at address ${governanceNftReserveAddress}`);
        return await ethers.getContractAt(contractName, governanceNftReserveAddress);
    }

    console.log(`\nDeploying contract ${contractName}`);

    // DEPLOY NFT GOVERNANCE RESERVE
    const contractArgs = [] as const;
    const GovernanceNftReserve = await ethers.getContractFactory(contractName);
    const governanceNftReserve = await GovernanceNftReserve.deploy();
    await governanceNftReserve.deployed();
    console.log(`${contractName} address: ${governanceNftReserve.address}`);

    await (await governanceNftReserve.transferOwnership(luciDaoTimelockAddress)).wait();
    console.log(`${contractName} ownership given to timelock of governance ${luciDaoTimelockAddress}`);

    await verifyContract(contractName, {
        address: governanceNftReserve.address,
        contract: `contracts/${contractName}.sol:${contractName}`,
        constructorArguments: contractArgs,
    });

    return governanceNftReserve;
}

export async function getOrDeployFractions(): Promise<AltrFractions> {
    const contractName = "AltrFractions";

    if (altrFractionsAddress) {
        console.log(`\nFound contract ${contractName} implementation at address ${altrFractionsAddress}`);
        return await ethers.getContractAt(contractName, altrFractionsAddress);
    }

    console.log(`\nDeploying contract ${contractName}`);

    const contractArgs = [erc1155MetadataUri] as const;

    const AltrFractions = await ethers.getContractFactory(contractName);
    const altrFractions = await AltrFractions.deploy(...contractArgs);
    await altrFractions.deployed();
    console.log(`${contractName} address: ${altrFractions.address}`);

    await verifyContract(contractName, {
        address: altrFractions.address,
        contract: `contracts/${contractName}.sol:${contractName}`,
        constructorArguments: contractArgs,
    });

    return altrFractions;
}

export async function getOrDeployFractionsSale(
    altrFractions: AltrFractions,
    allowList: AltrAllowList,
    feeManager: AltrFeeManager
): Promise<AltrFractionsSale> {
    const contractName = "AltrFractionsSale";

    if (altrFractionsSaleAddress) {
        console.log(`\nFound contract ${contractName} implementation at address ${altrFractionsSaleAddress}`);
        return await ethers.getContractAt(contractName, altrFractionsSaleAddress);
    }

    console.log(`\nDeploying contract ${contractName}`);

    const contractArgs = [altrFractions.address, feeManager.address, allowList.address, tiers.priceLimits, tiers.fractionsAmounts] as const;
    const AltrFractionsSale = await ethers.getContractFactory(contractName);
    const altrFractionsSale = await AltrFractionsSale.deploy(...contractArgs);
    await altrFractionsSale.deployed();
    console.log(`${contractName} address: ${altrFractionsSale.address}`);

    await (await altrFractions.setContractSale(altrFractionsSale.address)).wait();
    await (await altrFractions.setUri(setErc1155MetadataUri(altrFractionsSale.address))).wait();
    await (await altrFractions.grantRole(ADMIN_ROLE, altrFractionsSale.address)).wait();

    await verifyContract(contractName, {
        address: altrFractionsSale.address,
        contract: `contracts/${contractName}.sol:${contractName}`,
        constructorArguments: contractArgs,
    });

    return altrFractionsSale;
}

export async function getOrDeployFractionsBuyout(
    deployer: SignerWithAddress,
    altrFractions: AltrFractions,
    altrFractionsSale: AltrFractionsSale,
    feeManager: AltrFeeManager
): Promise<AltrFractionsBuyout> {
    const contractName = "AltrFractionsBuyout";

    if (altrFractionsBuyoutAddress) {
        console.log(`\nFound contract ${contractName} implementation at address ${altrFractionsBuyoutAddress}`);
        return await ethers.getContractAt(contractName, altrFractionsBuyoutAddress);
    }

    console.log(`\nDeploying contract ${contractName}`);

    const contractArgs = [
        altrFractions.address,
        altrFractionsSale.address,
        feeManager.address,
        buyoutMinFractions,
        buyoutOpenTimePeriod,
    ] as const;
    const AltrFractionsBuyout = await ethers.getContractFactory(contractName);
    const altrFractionsBuyout = await AltrFractionsBuyout.deploy(...contractArgs);
    await altrFractionsBuyout.deployed();
    console.log(`${contractName} address: ${altrFractionsBuyout.address}`);

    await (await altrFractionsSale.setFractionsBuyout(altrFractionsBuyout.address)).wait();
    await (await altrFractions.grantRole(ADMIN_ROLE, altrFractionsBuyout.address)).wait();
    await (await altrFractions.renounceRole(ADMIN_ROLE, deployer.address)).wait();
    await (await feeManager.grantRole(TRADE_CHECKER_ROLE, altrFractionsBuyout.address)).wait();

    await verifyContract(contractName, {
        address: altrFractionsBuyout.address,
        contract: `contracts/${contractName}.sol:${contractName}`,
        constructorArguments: contractArgs,
    });

    return altrFractionsBuyout;
}

export async function getOrDeployNftCollectionFullFactory(nftCollectionFactoryAddress: string): Promise<AltrNftCollectionFullFactory> {
    const contractName = "AltrNftCollectionFullFactory";

    if (nftCollectionFullFactoryAddress) {
        console.log(`\nFound contract ${contractName} implementation at address ${nftCollectionFullFactoryAddress}`);
        return await ethers.getContractAt(contractName, nftCollectionFullFactoryAddress);
    }

    console.log(`\nDeploying contract ${contractName}`);

    const contractArgs = [] as const;
    const AltrNftCollectionFullFactory = await ethers.getContractFactory(contractName);
    const altrNftCollectionFullFactory = await AltrNftCollectionFullFactory.deploy(...contractArgs);
    await altrNftCollectionFullFactory.deployed();
    console.log(`${contractName} address: ${altrNftCollectionFullFactory.address}`);

    await altrNftCollectionFullFactory.transferOwnership(nftCollectionFactoryAddress);

    await verifyContract(contractName, {
        address: altrNftCollectionFullFactory.address,
        contract: `contracts/${contractName}.sol:${contractName}`,
        constructorArguments: contractArgs,
    });

    return altrNftCollectionFullFactory;
}

export async function getOrDeployNftCollectionLightFactory(nftCollectionFactoryAddress: string): Promise<AltrNftCollectionLightFactory> {
    const contractName = "AltrNftCollectionLightFactory";

    if (nftCollectionLightFactoryAddress) {
        console.log(`\nFound contract ${contractName} implementation at address ${nftCollectionLightFactoryAddress}`);
        return await ethers.getContractAt(contractName, nftCollectionLightFactoryAddress);
    }

    console.log(`\nDeploying contract ${contractName}`);

    const contractArgs = [] as const;
    const AltrNftCollectionLightFactory = await ethers.getContractFactory(contractName);
    const altrNftCollectionLightFactory = await AltrNftCollectionLightFactory.deploy(...contractArgs);
    await altrNftCollectionLightFactory.deployed();
    console.log(`${contractName} address: ${altrNftCollectionLightFactory.address}`);

    await altrNftCollectionLightFactory.transferOwnership(nftCollectionFactoryAddress);

    await verifyContract(contractName, {
        address: altrNftCollectionLightFactory.address,
        contract: `contracts/${contractName}.sol:${contractName}`,
        constructorArguments: contractArgs,
    });

    return altrNftCollectionLightFactory;
}

// *** Proxied Collateral Retriever ***
export async function verifyProxiedContractImplementation(contractName: string, contract: Contract, contractParameter: string) {
    try {
        const contractImplAddress = await getImplementationAddress(network.provider, contract.address);
        console.log(`Found ${contractName} implementation in proxied contract json. Impl address: ${contractImplAddress}`);
        await verifyContract(contractName, {
            address: contractImplAddress,
            contract: contractParameter,
        });
    } catch (error) {
        console.log(`Warning: problem while verifying ${contractName} contract. Skip! Error detail: ${error}`);
    }
}

// *** Verify contract ***
export async function verifyContract(name: string, taskArguments?: any) {
    if (skipContractVerify()) {
        return;
    }
    console.log(`Verifying contract ${name}`);
    await new Promise((r) => setTimeout(r, 90000));

    try {
        await run("verify:verify", taskArguments);
    } catch (error) {
        console.log(`Unable to verify contract ${name}`);
        console.log(error);
    }
}

export async function getOrDeployAllowList() {
    const contractName = "AltrAllowList";

    if (allowListAddress) {
        console.log(`\nFound contract ${contractName} implementation at address ${allowListAddress}`);
        return await ethers.getContractAt(contractName, allowListAddress);
    }

    console.log(`\nDeploying contract ${contractName}`);

    const AltrAllowList = await ethers.getContractFactory(contractName);
    const altrAllowList = await AltrAllowList.deploy();
    await altrAllowList.deployed();
    console.log(`${contractName} address ${altrAllowList.address}`);

    await verifyContract(contractName, {
        address: altrAllowList.address,
        contract: `contracts/${contractName}.sol:${contractName}`,
        constructorArguments: []
    });

    return altrAllowList;
}

export async function getOrDeployTradeChecker(zeroEx: IZeroEx, allowList: AltrAllowList, feeManager: AltrFeeManager) {
    const contractName = "AltrTradeChecker";

    if (tradeCheckerAddress) {
        console.log(`\nFound contract ${contractName} implementation at address ${tradeCheckerAddress}`);
        return await ethers.getContractAt(contractName, tradeCheckerAddress);
    }

    console.log(`\nDeploying contract ${contractName}`);

    const constructorArguments = [zeroEx.address, allowList.address, feeManager.address] as const;

    const AltrTradeChecker = await ethers.getContractFactory(contractName);
    const altrTradeChecker = await AltrTradeChecker.deploy(...constructorArguments);
    await altrTradeChecker.deployed();
    console.log(`${contractName} address ${altrTradeChecker.address}`);

    await (await feeManager.grantRole(TRADE_CHECKER_ROLE, altrTradeChecker.address)).wait();

    await verifyContract(contractName, {
        address: altrTradeChecker.address,
        contract: `contracts/${contractName}.sol:${contractName}`,
        constructorArguments: constructorArguments
    });

    return altrTradeChecker;
}

export async function getOrDeployAltrPriceIndex(nftCollectionFactory: INftCollectionFactory): Promise<AltrPriceIndex> {
    const contractName = "AltrPriceIndex";

    if (altrPriceIndexAddress) {
        console.log(`\nFound contract ${contractName} implementation at address ${altrPriceIndexAddress}`);
        return await ethers.getContractAt(contractName, altrPriceIndexAddress);
    }

    console.log(`\nDeploying contract ${contractName}`);

    const constructorArguments = [nftCollectionFactory.address] as const;

    const AltrPriceIndex = await ethers.getContractFactory(contractName);
    const altrPriceIndex = await AltrPriceIndex.deploy(...constructorArguments);
    await altrPriceIndex.deployed();

    console.log(`${contractName} address ${altrPriceIndex.address}`);

    await verifyContract(contractName, {
        address: altrPriceIndex.address,
        contract: `contracts/${contractName}.sol:${contractName}`,
        constructorArguments,
    });

    return altrPriceIndex;
}

/*********************************** TEST CONTRACT DEPLOY *********************/
export async function deployTestLicenseManager(
    stakinService: Contract,
    servicePid: number,
    tokensForEligibility: number
): Promise<AltrTestLicenseManager> {
    if (isProduction()) {
        throw Error("Deploying test contract in wrong environment");
    }

    const contractName = "AltrTestLicenseManager";
    console.log(`\nDeploying contract ${contractName}`);
    const contractArgs = [stakinService.address, servicePid, tokensForEligibility] as const;

    // DEPLOY TEST LICENSE MANAGER
    const AltrTestLicenseManager = await ethers.getContractFactory(contractName);
    const altrTestLicenseManager = await AltrTestLicenseManager.deploy(...contractArgs);
    await altrTestLicenseManager.deployed();
    console.log(`${contractName} address: ${altrTestLicenseManager.address}`);

    await verifyContract(contractName, { address: altrTestLicenseManager.address });

    return altrTestLicenseManager;
}

export async function deployFeeManagerTester(feeManager: string): Promise<FeeManagerTester> {
    if (isProduction()) {
        throw Error("Deploying test contract in wrong environment");
    }
    //test contract
    const contractName = "FeeManagerTester";
    console.log(`\nDeploying contract ${contractName}`);

    const FeeManagerTester = await ethers.getContractFactory(contractName);
    const feeManagerTester = await FeeManagerTester.deploy(feeManager);
    await feeManagerTester.deployed();
    console.log(`${contractName} address: ${feeManagerTester.address}`);

    await verifyContract(contractName, { address: feeManagerTester.address });

    return feeManagerTester;
}

export async function getOrDeployLucidaoGovernanceReserve(luciDaoTimelockAddress: string): Promise<LucidaoGovernanceReserve> {
    const contractName = "LucidaoGovernanceReserve";

    if (governanceTreasuryAddress) {
        console.log(`\nFound contract ${contractName} implementation at address ${governanceTreasuryAddress}`);
        return await ethers.getContractAt(contractName, governanceTreasuryAddress);
    }

    if (isProduction()) {
        throw Error("Deploying test contract in wrong environment");
    }
    console.log(`\nDeploying contract ${contractName}`);

    // DEPLOY GOVERNANCE RESERVE
    const LucidaoGovernanceReserve = await ethers.getContractFactory(contractName);
    const lucidaoGovernanceReserve = await LucidaoGovernanceReserve.deploy();
    await lucidaoGovernanceReserve.deployed();
    console.log(`${contractName} address: ${lucidaoGovernanceReserve.address}`);

    await (await lucidaoGovernanceReserve.transferOwnership(luciDaoTimelockAddress)).wait();
    console.log(`${contractName} ownership given to timelock of governance ${luciDaoTimelockAddress}`);

    return lucidaoGovernanceReserve;
}

// *** fUSDT contract ***
export async function getOrDeployfUsdt(vault: SignerWithAddress): Promise<AnyswapV3ERC20> {
    const contractName = "AnyswapV3ERC20";

    if (fusdtAddress) {
        console.log(`\nFound contract ${contractName} implementation at address ${fusdtAddress}`);
        return await ethers.getContractAt(contractName, fusdtAddress);
    }

    if (isProduction()) {
        throw Error("Deploying test contract in wrong environment");
    }

    console.log(`\nDeploying contract ${contractName}`);

    // DEPLOY fUSDT
    const Fusdt = await ethers.getContractFactory(contractName);
    const contractArgs = ["Frapped USDT", "fUSDT", 6, ethers.constants.AddressZero, vault.address] as const;
    const fusdt = await Fusdt.deploy(...contractArgs);
    await fusdt.deployed();
    console.log(`${contractName} address ${fusdt.address}`);

    await verifyContract(contractName, {
        address: fusdt.address,
        constructorArguments: contractArgs,
    });

    return fusdt;
}

// *** test farm ***
export async function getOrDeployFarm(fUsdt: AnyswapV3ERC20, stakedTokens: number): Promise<TestFarm> {
    const contractName = "TestFarm";

    if (farmAddress) {
        console.log(`\nFound contract ${contractName} implementation at address ${farmAddress}`);
        return await ethers.getContractAt(contractName, farmAddress);
    }

    console.log(`\nDeploying contract ${contractName}`);
    const contractArgs = [fUsdt.address, stakedTokens] as const;

    const MyTestFarm = await ethers.getContractFactory(contractName);
    const testFarm = await MyTestFarm.deploy(...contractArgs);
    await testFarm.deployed();
    console.log(`${contractName} address ${testFarm.address}`);

    await verifyContract(contractName, {
        address: testFarm.address,
        constructorArguments: contractArgs,
    });

    return testFarm;
}
