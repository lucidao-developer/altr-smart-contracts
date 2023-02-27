import { ethers, network } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
    deployFeeManagerTester,
    deployNftCollection,
    getOrDeployAllowList,
    getOrDeployFarm,
    getOrDeployFeeManager,
    getOrDeployFractions,
    getOrDeployFractionsBuyout,
    getOrDeployFractionsSale,
    getOrDeployfUsdt,
    getOrDeployLicenseManager,
    getOrDeployNftCollateralRetriever,
    deployNftCollection,
    getOrDeployNftCollectionFactory,
    getOrDeployTradeChecker,
    getOrDeployLucidaoGovernanceNftReserve,
    getOrDeployLucidaoGovernanceReserve,
    getOrDeployFarm,
    getOrDeployAllowList,
    getOrDeployFractions,
    getOrDeployFractionsSale,
    getOrDeployFractionsBuyout,
} from "../scripts/deployFunctions";
import { deployZeroExAndFullMigrate } from "../scripts/deployZeroEx";
import { mockConsoleLog, removeOpenzeppelinProxyManifestFile } from "../scripts/utilities";
import { IStakingService } from "../typechain-types";
import { buildFractionSaleScenario, buildScenario1, buildScenario4 } from "./common";
import { lucidaoGovernanceNftReserveBehavior } from "./LucidaoGovernanceNftReserve.behavior";
import { nftCollectionBehavior } from "./NftCollection.behavior";
import { nftCollectionFactoryBehavior } from "./NftCollectionFactory.behavior";
import { nftCollateralRetrieverBehavior } from "./NftCollateralRetriever.behavior";
import { licenseManagerBehavior } from "./LicenseManager.behavior";
import { resetNetwork, restoreSnapshot, setSnapshot, mintBigNumberfUsdtTo } from "./utilities";
import { feeManagerBehavior } from "./FeeManager.behavior";
import { buyoutFee, freeVaultServicePeriod, insolvencyGracePeriod, minGracePeriod, saleFee } from "../config/config";
import { nftFractionalizationBehavior } from "./NftFractionalization.behavior";
import { tradeCheckerBehavior } from "./TradeChecker.behavior";
import {
    altrAllowList,
    altrFeeManager,
    altrFractions,
    altrFractionsSale,
    altrLicenseManager,
    altrNftCollateralRetriever,
    altrNftCollection,
    altrNftCollectionFactory,
    timedTokenSplitter,
    tokenSplitter,
} from "./unit";

var chai = require("chai");
chai.config.includeStack = true;

describe("Tests", () => {
    let signer: SignerWithAddress;
    let oracle1: SignerWithAddress;
    let owner1: SignerWithAddress;
    let owner2: SignerWithAddress;
    let timelock: SignerWithAddress;
    let vaultManager: SignerWithAddress;
    let signers: SignerWithAddress[];

    before(async function () {
        mockConsoleLog();
        signers = await ethers.getSigners();
        [signer, oracle1, owner1, owner2, timelock, vaultManager] = signers;
        this.skipTest = false;
        this.signer = signer;
        console.log(`Signer: ${this.signer.address}`);
        this.oracle1 = oracle1;
        console.log(`Oracle1: ${this.oracle1.address}`);
        this.owner1 = owner1;
        console.log(`Owner1: ${this.owner1.address}`);
        this.owner2 = owner2;
        console.log(`Owner2: ${this.owner2.address}`);
        this.timelock = timelock;
        console.log(`Timelock: ${this.timelock.address}`);
        this.vaultManager = vaultManager;
        console.log(`VaultManager: ${this.vaultManager.address}`);
        /* Contracts used only for testing purpose */
        this.fUsdt = await getOrDeployfUsdt(this.signer);
        this.governanceTreasury = await getOrDeployLucidaoGovernanceReserve(timelock.address);
        this.governanceNftTreasury = await getOrDeployLucidaoGovernanceNftReserve(timelock.address);
        this.allowList = await getOrDeployAllowList();
        this.stakedTokens = 1000;
        this.servicePid = 0;
        this.redemptionFee = 500;
        this.tokensForEligibility = 0;
        this.minGracePeriod = minGracePeriod;
        this.insolvencyGracePeriod = insolvencyGracePeriod;
        this.freeVaultServicePeriod = freeVaultServicePeriod;

        this.saleOpenTimePeriod = 86500;

        this.testFarm = await getOrDeployFarm(this.fUsdt, this.stakedTokens);
        console.log(`Governance Treasury: ${this.governanceTreasury.address}`);
        console.log(`Governance Nft Treasury: ${this.governanceNftTreasury.address}`);
    });

    describe("Behavioral tests", () => {
        describe("Nft Collection Factory", () => {
            before(async function () {
                await resetNetwork(network);
                await removeOpenzeppelinProxyManifestFile(ethers.provider);
                this.nftLicenseManager = await getOrDeployLicenseManager(
                    this.testFarm as IStakingService,
                    this.servicePid,
                    this.tokensForEligibility
                );
                this.nftCollectionFactory = await getOrDeployNftCollectionFactory(this.nftLicenseManager, this.governanceNftTreasury);
            });

            beforeEach(async function () {
                this.snapshot = await setSnapshot(network);
            });

            afterEach(async function () {
                await restoreSnapshot(network, this.snapshot);
            });

            nftCollectionFactoryBehavior();
        });

        describe("Nft Collection", () => {
            before(async function () {
                await resetNetwork(network);
                this.nftCollection = await deployNftCollection(
                    "oracle1Watches",
                    "OR1_WTCH",
                    this.signer,
                    this.vaultManager.address,
                    this.oracle1.address,
                    this.governanceNftTreasury.address
                );
            });

            beforeEach(async function () {
                this.snapshot = await setSnapshot(network);
            });

            afterEach(async function () {
                await restoreSnapshot(network, this.snapshot);
            });

            nftCollectionBehavior();
        });

        describe("Nft Collateral Retriever", () => {
            before(async function () {
                await resetNetwork(network);
                await removeOpenzeppelinProxyManifestFile(ethers.provider);
                this.nftLicenseManager = await getOrDeployLicenseManager(
                    this.testFarm as IStakingService,
                    this.servicePid,
                    this.tokensForEligibility
                );
                this.nftCollectionFactory = await getOrDeployNftCollectionFactory(this.nftLicenseManager, this.governanceNftTreasury);
                this.platformFeeManager = await getOrDeployFeeManager(
                    this.governanceTreasury,
                    this.nftLicenseManager,
                    this.redemptionFee,
                    buyoutFee,
                    saleFee
                );
                this.altrFractions = await getOrDeployFractions();
                this.altrFractionsSale = await getOrDeployFractionsSale(this.altrFractions, this.allowList, this.platformFeeManager);
                this.nftCollateralRetriever = await getOrDeployNftCollateralRetriever(this.nftCollectionFactory, this.platformFeeManager);
                this.altrFractionsBuyout = await getOrDeployFractionsBuyout(
                    this.signer,
                    this.altrFractions,
                    this.altrFractionsSale,
                    this.platformFeeManager
                );
            });

            beforeEach(async function () {
                this.snapshot = await setSnapshot(network);
            });

            afterEach(async function () {
                await restoreSnapshot(network, this.snapshot);
            });

            nftCollateralRetrieverBehavior();
        });

        describe("Nft License Manager", () => {
            before(async function () {
                await resetNetwork(network);
                this.nftLicenseManager = await getOrDeployLicenseManager(
                    this.testFarm as IStakingService,
                    this.servicePid,
                    this.tokensForEligibility
                );
            });

            beforeEach(async function () {
                this.snapshot = await setSnapshot(network);
            });

            afterEach(async function () {
                await restoreSnapshot(network, this.snapshot);
            });

            licenseManagerBehavior();
        });

        describe("Nft Fee Manager", () => {
            before(async function () {
                await resetNetwork(network);
                await removeOpenzeppelinProxyManifestFile(ethers.provider);
                this.nftLicenseManager = await getOrDeployLicenseManager(
                    this.testFarm as IStakingService,
                    this.servicePid,
                    this.tokensForEligibility
                );
                this.nftFeeManager = await getOrDeployFeeManager(
                    this.governanceTreasury,
                    this.nftLicenseManager,
                    this.redemptionFee,
                    buyoutFee,
                    saleFee
                );
                this.nftFeeManagerTester = await deployFeeManagerTester(this.nftFeeManager.address);
            });

            beforeEach(async function () {
                this.snapshot = await setSnapshot(network);
            });

            afterEach(async function () {
                await restoreSnapshot(network, this.snapshot);
            });

            feeManagerBehavior();
        });

        describe("Nft Fractionalization", () => {
            before(async function () {
                await resetNetwork(network);
                this.nftLicenseManager = await getOrDeployLicenseManager(
                    this.testFarm as IStakingService,
                    this.servicePid,
                    this.tokensForEligibility
                );
                this.nftCollectionFactory = await getOrDeployNftCollectionFactory(this.nftLicenseManager, this.governanceNftTreasury);
                this.nftFeeManager = await getOrDeployFeeManager(
                    this.governanceTreasury,
                    this.nftLicenseManager,
                    this.redemptionFee,
                    buyoutFee,
                    saleFee
                );
                this.altrFractions = await getOrDeployFractions();
                this.altrFractionsSale = await getOrDeployFractionsSale(this.altrFractions, this.allowList, this.nftFeeManager);
                this.altrFractionsBuyout = await getOrDeployFractionsBuyout(
                    this.signer,
                    this.altrFractions,
                    this.altrFractionsSale,
                    this.nftFeeManager
                );
            });

            beforeEach(async function () {
                this.snapshot = await setSnapshot(network);
            });

            afterEach(async function () {
                await restoreSnapshot(network, this.snapshot);
            });

            nftFractionalizationBehavior();
        });

        describe("Governance Reserve", () => {
            before(async function () {
                await resetNetwork(network);
                this.altrFractions = await getOrDeployFractions();
                this.nftCollection = await deployNftCollection(
                    "name",
                    "sym",
                    this.signer,
                    this.vaultManager.address,
                    this.oracle1.address,
                    this.governanceNftTreasury.address
                );
            });

            beforeEach(async function () {
                this.snapshot = await setSnapshot(network);
            });

            afterEach(async function () {
                await restoreSnapshot(network, this.snapshot);
            });

            lucidaoGovernanceNftReserveBehavior();
        });
        describe("Trade Checker", () => {
            before(async function () {
                await resetNetwork(network);
                this.licenseManager = await getOrDeployLicenseManager(this.testFarm, this.servicePid, this.tokensForEligibility);
                this.feeManager = await getOrDeployFeeManager(
                    this.governanceTreasury,
                    this.licenseManager,
                    this.redemptionFee,
                    buyoutFee,
                    saleFee
                );
                this.zeroEx = await deployZeroExAndFullMigrate();
                this.tradeChecker = await getOrDeployTradeChecker(this.zeroEx, this.allowList, this.feeManager);
                this.nftCollectionFactory = await getOrDeployNftCollectionFactory(this.licenseManager, this.governanceNftTreasury);
            });
            beforeEach(async function () {
                this.snapshot = await setSnapshot(network);
                const transaction = await this.nftCollectionFactory.createCollection(
                    "name",
                    "symbol",
                    this.oracle1.address,
                    this.signer.address,
                    0,
                    0,
                    0
                );
                const tx = await transaction.wait();
                const nftCollectionAddress = tx.events?.at(-1)?.args?.contractAddress;
                this.nftCollection = await ethers.getContractAt("AltrNftCollection", nftCollectionAddress);
                await this.nftCollection.connect(this.oracle1).safeMint("Token URI");
                await mintBigNumberfUsdtTo(this.fUsdt, this.signer.address, ethers.utils.parseUnits("1000", 6));
            });

            afterEach(async function () {
                await restoreSnapshot(network, this.snapshot);
            });

            tradeCheckerBehavior();
        });
    });

    describe("Unit tests", () => {
        describe("Nft Collection Factory", () => {
            before(async function () {
                await resetNetwork(network);
                this.nftLicenseManager = await getOrDeployLicenseManager(
                    this.testFarm as IStakingService,
                    this.servicePid,
                    this.tokensForEligibility
                );
                this.nftCollectionFactory = await getOrDeployNftCollectionFactory(this.nftLicenseManager, this.governanceNftTreasury);
            });
            beforeEach(async function () {
                this.snapshot = await setSnapshot(network);
            });

            afterEach(async function () {
                await restoreSnapshot(network, this.snapshot);
            });
            altrNftCollectionFactory();
        });
        describe("Nft Collection", () => {
            before(async function () {
                await resetNetwork(network);
                this.nftCollection = await deployNftCollection(
                    "oracle1Watches",
                    "OR1_WTCH",
                    this.signer,
                    this.vaultManager.address,
                    this.oracle1.address,
                    this.governanceNftTreasury.address
                );
            });

            beforeEach(async function () {
                this.snapshot = await setSnapshot(network);
            });

            afterEach(async function () {
                await restoreSnapshot(network, this.snapshot);
            });

            altrNftCollection();
        });
        describe("Nft Collateral Retriever", () => {
            before(async function () {
                await resetNetwork(network);
                await removeOpenzeppelinProxyManifestFile(ethers.provider);
                this.nftLicenseManager = await getOrDeployLicenseManager(
                    this.testFarm as IStakingService,
                    this.servicePid,
                    this.tokensForEligibility
                );
                this.nftCollectionFactory = await getOrDeployNftCollectionFactory(this.nftLicenseManager, this.governanceNftTreasury);
                this.platformFeeManager = await getOrDeployFeeManager(
                    this.governanceTreasury,
                    this.nftLicenseManager,
                    this.redemptionFee,
                    buyoutFee,
                    saleFee
                );
                this.nftCollateralRetriever = await getOrDeployNftCollateralRetriever(this.nftCollectionFactory, this.platformFeeManager);
            });

            beforeEach(async function () {
                this.snapshot = await setSnapshot(network);
                const transaction = await this.nftCollectionFactory.createCollection(
                    "name",
                    "symbol",
                    this.oracle1.address,
                    this.signer.address,
                    0,
                    0,
                    0
                );
                const tx = await transaction.wait();
                const nftCollectionAddress = tx.events?.at(-1)?.args?.contractAddress;
                this.nftCollection = await ethers.getContractAt("AltrNftCollection", nftCollectionAddress);
                await this.nftCollection.connect(this.oracle1).safeMint("Token URI");
            });

            afterEach(async function () {
                await restoreSnapshot(network, this.snapshot);
            });

            altrNftCollateralRetriever();
        });
        describe("License Manager", () => {
            before(async function () {
                await resetNetwork(network);
                this.nftLicenseManager = await getOrDeployLicenseManager(
                    this.testFarm as IStakingService,
                    this.servicePid,
                    this.tokensForEligibility
                );
            });
            beforeEach(async function () {
                this.snapshot = await setSnapshot(network);
            });

            afterEach(async function () {
                await restoreSnapshot(network, this.snapshot);
            });

            altrLicenseManager();
        });
        describe("Fee Manager", () => {
            before(async function () {
                await resetNetwork(network);
                this.nftLicenseManager = await getOrDeployLicenseManager(
                    this.testFarm as IStakingService,
                    this.servicePid,
                    this.tokensForEligibility
                );

                this.nftCollectionFactory = await getOrDeployNftCollectionFactory(this.nftLicenseManager, this.governanceNftTreasury);

                this.nftFeeManager = await getOrDeployFeeManager(
                    this.governanceTreasury,
                    this.nftLicenseManager,
                    this.redemptionFee,
                    buyoutFee,
                    saleFee
                );
                this.altrFractions = await getOrDeployFractions();
                this.altrFractionsSale = await getOrDeployFractionsSale(this.altrFractions, this.allowList, this.nftFeeManager);
                this.altrFractionsBuyout = await getOrDeployFractionsBuyout(
                    this.signer,
                    this.altrFractions,
                    this.altrFractionsSale,
                    this.nftFeeManager
                );
            });
            beforeEach(async function () {
                this.snapshot = await setSnapshot(network);
                const data = await buildScenario4(this);
                this.nftCollection = await ethers.getContractAt("AltrNftCollection", data.tokenCollection.collectionAddress);
                this.newRedemptionFee = 500;
            });

            afterEach(async function () {
                await restoreSnapshot(network, this.snapshot);
            });
            altrFeeManager();
        });
        describe("Allow List", () => {
            before(async function () {
                await resetNetwork(network);
                this.allowList = await getOrDeployAllowList();
            });
            beforeEach(async function () {
                this.snapshot = await setSnapshot(network);
            });
            afterEach(async function () {
                await restoreSnapshot(network, this.snapshot);
            });
            altrAllowList();
        });
        describe("Fractions Sale", () => {
            before(async function () {
                await resetNetwork(network);
                this.nftLicenseManager = await getOrDeployLicenseManager(
                    this.testFarm as IStakingService,
                    this.servicePid,
                    this.tokensForEligibility
                );
                this.nftCollectionFactory = await getOrDeployNftCollectionFactory(this.nftLicenseManager, this.governanceNftTreasury);
                this.altrFractions = await getOrDeployFractions();
                this.nftFeeManager = await getOrDeployFeeManager(
                    this.governanceTreasury,
                    this.nftLicenseManager,
                    this.redemptionFee,
                    buyoutFee,
                    saleFee
                );
                this.altrFractionsSale = await getOrDeployFractionsSale(this.altrFractions, this.allowList, this.nftFeeManager);
                this.altrFractionsBuyout = await getOrDeployFractionsBuyout(
                    this.signer,
                    this.altrFractions,
                    this.altrFractionsSale,
                    this.nftFeeManager
                );
            });
            beforeEach(async function () {
                this.snapshot = await setSnapshot(network);
            });
            afterEach(async function () {
                await restoreSnapshot(network, this.snapshot);
            });
            altrFractionsSale();
        });
        describe("Fractions", () => {
            before(async function () {
                await resetNetwork(network);
                this.nftLicenseManager = await getOrDeployLicenseManager(
                    this.testFarm as IStakingService,
                    this.servicePid,
                    this.tokensForEligibility
                );
                this.nftCollectionFactory = await getOrDeployNftCollectionFactory(this.nftLicenseManager, this.governanceNftTreasury);
                this.altrFractions = await getOrDeployFractions();
                this.nftFeeManager = await getOrDeployFeeManager(
                    this.governanceTreasury,
                    this.nftLicenseManager,
                    this.redemptionFee,
                    buyoutFee,
                    saleFee
                );
            });
            beforeEach(async function () {
                this.snapshot = await setSnapshot(network);
            });
            afterEach(async function () {
                await restoreSnapshot(network, this.snapshot);
            });
            altrFractions();
        });
        describe("Token Splitter", () => {
            before(async function () {
                await resetNetwork(network);
                this.nftLicenseManager = await getOrDeployLicenseManager(
                    this.testFarm as IStakingService,
                    this.servicePid,
                    this.tokensForEligibility
                );
                this.nftCollectionFactory = await getOrDeployNftCollectionFactory(this.nftLicenseManager, this.governanceNftTreasury);
                this.altrFractions = await getOrDeployFractions();
                this.nftFeeManager = await getOrDeployFeeManager(
                    this.governanceTreasury,
                    this.nftLicenseManager,
                    this.redemptionFee,
                    buyoutFee,
                    saleFee
                );
                this.altrFractionsSale = await getOrDeployFractionsSale(this.altrFractions, this.allowList, this.nftFeeManager);
                this.altrFractionsBuyout = await getOrDeployFractionsBuyout(
                    this.signer,
                    this.altrFractions,
                    this.altrFractionsSale,
                    this.nftFeeManager
                );
            });
            beforeEach(async function () {
                const percFractionToBuy = 95;
                this.snapshot = await setSnapshot(network);
                this.buyoutData = await buildScenario4(this, percFractionToBuy);
                this.tokenSplitter = await ethers.getContractAt("TokenSplitter", this.buyoutData.buyout.buyout[2]);
            });
            afterEach(async function () {
                await restoreSnapshot(network, this.snapshot);
            });
            tokenSplitter();
        });
        describe("Timed Token Splitter", () => {
            before(async function () {
                await resetNetwork(network);
                this.nftLicenseManager = await getOrDeployLicenseManager(
                    this.testFarm as IStakingService,
                    this.servicePid,
                    this.tokensForEligibility
                );
                this.nftCollectionFactory = await getOrDeployNftCollectionFactory(this.nftLicenseManager, this.governanceNftTreasury);
                this.altrFractions = await getOrDeployFractions();
                this.nftFeeManager = await getOrDeployFeeManager(
                    this.governanceTreasury,
                    this.nftLicenseManager,
                    this.redemptionFee,
                    buyoutFee,
                    saleFee
                );
                this.altrFractionsSale = await getOrDeployFractionsSale(this.altrFractions, this.allowList, this.nftFeeManager);
            });
            beforeEach(async function () {
                this.snapshot = await setSnapshot(network);
                this.nftTokenCollectionData = await buildScenario1(this, this.signer, this.nftCollectionFactory, this.oracle1);
                this.altrFractionSaleData = await buildFractionSaleScenario(this, this.nftTokenCollectionData);
                this.timedTokenSplitter = await ethers.getContractAt("TimedTokenSplitter", this.altrFractionSaleData.buyTokenManager);
            });
            afterEach(async function () {
                await restoreSnapshot(network, this.snapshot);
            });
            timedTokenSplitter();
        });
    });
});
