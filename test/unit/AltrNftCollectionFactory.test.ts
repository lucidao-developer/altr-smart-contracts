import { expect } from "chai";
import fs from "fs";
import { ethers } from "hardhat";
import path from "path";
import { SOLIDITY_ERROR_MSG } from "../common";
import { getInterfaceIDFromAbiFile } from "../utilities";

const NFT_COLLECTION_FACTORY_ERROR_MSG = new SOLIDITY_ERROR_MSG("AltrNftCollectionFactory");

export default function () {
    describe("constructor", function () {
        it("Should be initialized", async function () {
            await expect(this.nftCollectionFactory.deployTransaction).to.emit(this.nftCollectionFactory, "Initialized").withArgs(1);
        });
        it("Should set owner to signer", async function () {
            expect(await this.nftCollectionFactory.owner()).to.equal(this.signer.address);
        });
    });
    describe("initialize", function () {
        it("Should revert because already initialized", async function () {
            await expect(
                this.nftCollectionFactory.initialize(this.nftLicenseManager.address, this.governanceNftTreasury.address)
            ).to.be.revertedWith(NFT_COLLECTION_FACTORY_ERROR_MSG.ALREADY_INITIALIZED);
        });
    });
    describe("createdContractCount", function () {
        it("Should return 0 at the beginnig", async function () {
            const count = await this.nftCollectionFactory.createdContractCount();
            expect(count).to.equal(0);
        });
        it("Should return 1 after one contract creation", async function () {
            const nftCollection = await this.nftCollectionFactory.createCollection(
                "collection",
                "cll",
                this.oracle1.address,
                this.vaultManager.address,
                0,
                0,
                this.freeVaultServicePeriod
            );
            await nftCollection.wait();

            const count = await this.nftCollectionFactory.createdContractCount();
            expect(count).to.equal(1);
        });
    });
    describe("isAKnownCollection", function () {
        it("Should return false", async function () {
            expect(await this.nftCollectionFactory.isAKnownCollection(this.owner1.address)).to.be.false;
        });
        it("Should return true", async function () {
            const transaction = await this.nftCollectionFactory.createCollection(
                "collection",
                "cll",
                this.oracle1.address,
                this.vaultManager.address,
                0,
                0,
                this.freeVaultServicePeriod
            );
            const tx = await transaction.wait();
            const contractAddress = tx.events?.at(-1)?.args?.contractAddress;
            expect(await this.nftCollectionFactory.isAKnownCollection(contractAddress)).to.be.true;
        });
    });
    describe("createCollection", function () {
        it("Should revert with 'Grace period too short'", async function () {
            await expect(
                this.nftCollectionFactory.createCollection(
                    "collection",
                    "cll",
                    this.oracle1.address,
                    this.vaultManager.address,
                    100,
                    0,
                    this.freeVaultServicePeriod
                )
            ).to.be.revertedWith(NFT_COLLECTION_FACTORY_ERROR_MSG.GRACE_PERIOD_TOO_SHORT);
        });
        it("Should revert with 'Cannot be null address'", async function () {
            await expect(
                this.nftCollectionFactory.createCollection(
                    "collection",
                    "cll",
                    ethers.constants.AddressZero,
                    this.vaultManager.address,
                    0,
                    0,
                    this.freeVaultServicePeriod
                )
            ).to.be.revertedWith(NFT_COLLECTION_FACTORY_ERROR_MSG.CANNOT_BE_NULL_ADDRESS);
        });
        it("Should revert with 'Requirements to become oracle not met'", async function () {
            const tx = await this.nftLicenseManager.setStakedTokensForOracleEligibility(10000000000);
            await tx.wait();
            await expect(
                this.nftCollectionFactory.createCollection(
                    "collection",
                    "cll",
                    this.oracle1.address,
                    this.vaultManager.address,
                    0,
                    0,
                    this.freeVaultServicePeriod
                )
            ).to.be.revertedWith(NFT_COLLECTION_FACTORY_ERROR_MSG.INVALID_ORACLE);
        });
        it("Should revert if caller is not the owner", async function () {
            await expect(
                this.nftCollectionFactory
                    .connect(this.owner1)
                    .createCollection(
                        "collection",
                        "cll",
                        this.oracle1.address,
                        this.vaultManager.address,
                        0,
                        0,
                        this.freeVaultServicePeriod
                    )
            ).to.be.revertedWith(NFT_COLLECTION_FACTORY_ERROR_MSG.NOT_OWNER_CALLER);
        });
        it("Should emit an event", async function () {
            const transaction = await this.nftCollectionFactory.createCollection(
                "collection",
                "cll",
                this.oracle1.address,
                this.vaultManager.address,
                0,
                0,
                this.freeVaultServicePeriod
            );
            const tx = await transaction.wait();
            await expect(transaction)
                .to.emit(this.nftCollectionFactory, "CollectionCreated")
                .withArgs(tx.events?.at(-1)?.args?.contractAddress, "collection", "cll", this.oracle1.address);
        });
    });
    describe("setNftReserveAddress", function () {
        beforeEach(async function () {
            const NewNftReserve = await ethers.getContractFactory("LucidaoGovernanceNftReserve");
            this.newNftReserve = await NewNftReserve.deploy();
            await this.newNftReserve.deployed();
        });
        it("Should revert with 'Cannot be null address'", async function () {
            await expect(this.nftCollectionFactory.setNftReserveAddress(ethers.constants.AddressZero)).to.be.revertedWith(
                NFT_COLLECTION_FACTORY_ERROR_MSG.CANNOT_BE_NULL_ADDRESS
            );
        });
        it("Should revert if caller is not the owner", async function () {
            await expect(this.nftCollectionFactory.connect(this.owner1).setNftReserveAddress(this.owner2.address)).to.be.revertedWith(
                NFT_COLLECTION_FACTORY_ERROR_MSG.NOT_OWNER_CALLER
            );
        });
        it("Should change the nft reserve address", async function () {
            const transaction = await this.nftCollectionFactory.setNftReserveAddress(this.newNftReserve.address);
            await transaction.wait();

            expect(await this.nftCollectionFactory.nftReserveAddress()).to.equal(this.newNftReserve.address);
        });
        it("Should emit an event", async function () {
            await expect(await this.nftCollectionFactory.setNftReserveAddress(this.newNftReserve.address))
                .to.emit(this.nftCollectionFactory, "NftReserveAddressChanged")
                .withArgs(this.newNftReserve.address);
        });
    });
    describe("setLicenseManager", function () {
        beforeEach(async function () {
            const NewLicenseManager = await ethers.getContractFactory("AltrLicenseManager");
            this.newLicensemanager = await NewLicenseManager.deploy(this.testFarm.address, this.servicePid, this.tokensForEligibility);
            await this.newLicensemanager.deployed();
        });
        it("Should revert with 'Cannot be null address'", async function () {
            await expect(this.nftCollectionFactory.setLicenseManager(ethers.constants.AddressZero)).to.be.revertedWith(
                NFT_COLLECTION_FACTORY_ERROR_MSG.CANNOT_BE_NULL_ADDRESS
            );
        });
        it("Should revert if caller is not the owner", async function () {
            await expect(this.nftCollectionFactory.connect(this.owner1).setLicenseManager(this.owner2.address)).to.be.revertedWith(
                NFT_COLLECTION_FACTORY_ERROR_MSG.NOT_OWNER_CALLER
            );
        });
        it("Should change the license manager", async function () {
            const transaction = await this.nftCollectionFactory.setLicenseManager(this.newLicensemanager.address);
            await transaction.wait();

            expect(await this.nftCollectionFactory.licenseManager()).to.equal(this.newLicensemanager.address);
        });
        it("Should emit an event", async function () {
            await expect(await this.nftCollectionFactory.setLicenseManager(this.newLicensemanager.address))
                .to.emit(this.nftCollectionFactory, "LicenseManagerChanged")
                .withArgs(this.newLicensemanager.address);
        });
    });
    describe("supportsInterface", function () {
        it("Should support IERC165 interface", async function () {
            const interfaceId = "0x01ffc9a7";
            expect(await this.nftCollectionFactory.supportsInterface(interfaceId)).to.be.true;
        });
        it("Should support INftCollectionFactory interface", async function () {
            const dir = path.resolve(
                __dirname,
                "../../",
                "artifacts/contracts/interfaces/INftCollectionFactory.sol/INftCollectionFactory.json"
            );
            const file = fs.readFileSync(dir, "utf8");
            const interfaceId = getInterfaceIDFromAbiFile(file);
            expect(await this.nftCollectionFactory.supportsInterface(interfaceId._hex)).to.be.true;
        });
        it("Should support IERC165Upgradable interface", async function () {
            const dir = path.resolve(
                __dirname,
                "../../",
                "artifacts/@openzeppelin/contracts-upgradeable/utils/introspection/IERC165Upgradeable.sol/IERC165Upgradeable.json"
            );
            const file = fs.readFileSync(dir, "utf8");
            const interfaceId = getInterfaceIDFromAbiFile(file);
            expect(await this.nftCollectionFactory.supportsInterface(interfaceId._hex)).to.be.true;
        });
        it("Should NOT support IStakingService interface", async function () {
            const dir = path.resolve(__dirname, "../../", "artifacts/contracts/interfaces/IStakingService.sol/IStakingService.json");
            const file = fs.readFileSync(dir, "utf8");
            const interfaceId = getInterfaceIDFromAbiFile(file);
            expect(await this.nftCollectionFactory.supportsInterface(interfaceId._hex)).to.be.false;
        });
    });
}
