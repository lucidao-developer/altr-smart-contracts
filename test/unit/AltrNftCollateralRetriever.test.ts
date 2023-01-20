import { expect } from "chai";
import { ethers } from "hardhat";
import { deployNftCollection } from "../../scripts/deployFunctions";
import { SOLIDITY_ERROR_MSG } from "../common";

const COLLATERAL_RETRIEVER_ERROR_MSG = new SOLIDITY_ERROR_MSG("AltrNftCollateralRetriever");

export default function () {
    describe("constructor", function () {
        it("Should be initialized", async function () {
            await expect(this.nftCollateralRetriever.deployTransaction).to.emit(this.nftCollateralRetriever, "Initialized").withArgs(1);
        });
        it("Should set owner to signer", async function () {
            expect(await this.nftCollateralRetriever.owner()).to.equal(this.signer.address);
        });
    });
    describe("initialize", function () {
        it("Should revert because already initialized", async function () {
            await expect(
                this.nftCollectionFactory.initialize(this.nftLicenseManager.address, this.governanceNftTreasury.address)
            ).to.be.revertedWith(COLLATERAL_RETRIEVER_ERROR_MSG.ALREADY_INITIALIZED);
        });
    });
    describe("burnNft", function () {
        it("Should revert if caller has not MINTER_ROLE", async function () {
            const nftCollection = await deployNftCollection(
                "name",
                "symbol",
                this.signer,
                this.vaultManager.address,
                this.oracle1.address,
                this.governanceNftTreasury.address
            );
            await nftCollection.connect(this.oracle1).safeMint("Token URI");
            await expect(this.nftCollateralRetriever.burnNft(nftCollection.address, 1)).to.be.revertedWith(
                COLLATERAL_RETRIEVER_ERROR_MSG.ONLY_MINTER_CAN_BURN
            );
        });
        it("Should revert if passed an unknown collection as parameter", async function () {
            const nftCollection = await deployNftCollection(
                "name",
                "symbol",
                this.signer,
                this.vaultManager.address,
                this.oracle1.address,
                this.governanceNftTreasury.address
            );
            await nftCollection.connect(this.oracle1).safeMint("Token URI");
            await expect(this.nftCollateralRetriever.connect(this.oracle1).burnNft(nftCollection.address, 1)).to.be.revertedWith(
                COLLATERAL_RETRIEVER_ERROR_MSG.UNKNOWN_COLLECTION
            );
        });
        it("Should burn nft, if is passed the correct nft", async function () {
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
            const nftCollection = await ethers.getContractAt("AltrNftCollection", nftCollectionAddress);
            await nftCollection.connect(this.oracle1).safeMint("Token URI");
            await nftCollection.connect(this.oracle1).approve(this.nftCollateralRetriever.address, 1);

            await expect(this.nftCollateralRetriever.connect(this.oracle1).burnNft(nftCollection.address, 1)).not.to.be.reverted;
            expect(await nftCollection.balanceOf(this.oracle1.address)).to.equal(0);
        });
        it("Should emit an event", async function () {
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
            const nftCollection = await ethers.getContractAt("AltrNftCollection", nftCollectionAddress);
            await nftCollection.connect(this.oracle1).safeMint("Token URI");
            await nftCollection.connect(this.oracle1).approve(this.nftCollateralRetriever.address, 1);

            await expect(await this.nftCollateralRetriever.connect(this.oracle1).burnNft(nftCollection.address, 1))
                .to.emit(this.nftCollateralRetriever, "NftBurned")
                .withArgs(nftCollection.address, this.oracle1.address, 1);
        });
    });
    describe("onERC721Received", function () {
        it("Should revert if contract caller in unkwnown", async function () {
            const unknownNftCollection = await deployNftCollection(
                "name",
                "symbol",
                this.signer,
                this.vaultManager.address,
                this.oracle1.address,
                this.governanceNftTreasury.address
            );
            await unknownNftCollection.connect(this.oracle1).safeMint("Token URI");
            await expect(
                unknownNftCollection
                    .connect(this.oracle1)
                ["safeTransferFrom(address,address,uint256)"](this.oracle1.address, this.nftCollateralRetriever.address, 1)
            ).to.be.revertedWith(COLLATERAL_RETRIEVER_ERROR_MSG.UNKNOWN_COLLECTION);
        });
        it("Should revert if vault service is expired", async function () {
            await this.nftCollection.setVaultServiceDeadline(1, Date.now());
            await ethers.provider.send("evm_mine", [Date.now()]);
            await expect(
                this.nftCollection
                    .connect(this.oracle1)
                ["safeTransferFrom(address,address,uint256)"](this.oracle1.address, this.nftCollateralRetriever.address, 1)
            ).to.be.revertedWith(COLLATERAL_RETRIEVER_ERROR_MSG.VAULT_SERVICE_EXPIRED);
        });
        it("Should revert if caller has not already pay fee", async function () {
            await this.nftCollection.setVaultServiceDeadline(1, Date.now());
            await expect(
                this.nftCollection
                    .connect(this.oracle1)
                ["safeTransferFrom(address,address,uint256)"](this.oracle1.address, this.nftCollateralRetriever.address, 1)
            ).to.be.revertedWith(COLLATERAL_RETRIEVER_ERROR_MSG.FEE_NOT_PAID);
        });
        it("If signer is an Oracle and redemption fee is 0 than should emit an event (???...probably wrong)", async function () {
            await this.nftCollection.setVaultServiceDeadline(1, Date.now());
            await this.platformFeeManager.setRedemptionFee(ethers.constants.Zero);

            await expect(
                this.nftCollection
                    .connect(this.oracle1)
                ["safeTransferFrom(address,address,uint256)"](this.oracle1.address, this.nftCollateralRetriever.address, 1)
            )
                .to.emit(this.nftCollateralRetriever, "RedeemRequest")
                .withArgs(this.nftCollection.address, this.oracle1.address, this.oracle1.address, 1);
        });
        it("If signer is an Oracle and redemption fee is greather than 0 than should emit an event (???...probably wrong)", async function () { });
    });
    describe("getCollectionFactory", function () {
        it("Should return the address of nft collection factory", async function () {
            expect(await this.nftCollateralRetriever.nftCollectionFactory()).to.equal(this.nftCollectionFactory.address);
        });
    });
    describe("setNftCollectionFactory", function () {
        it("Should revert if is null address", async function () {
            await expect(this.nftCollateralRetriever.setNftCollectionFactory(ethers.constants.AddressZero)).to.be.revertedWith(
                COLLATERAL_RETRIEVER_ERROR_MSG.CANNOT_BE_NULL_ADDRESS
            );
        });
        it("Should revert if new contract does not support INftCollectionFactory interface", async function () {
            await expect(this.nftCollateralRetriever.setNftCollectionFactory(this.owner1.address)).to.be.revertedWith(
                COLLATERAL_RETRIEVER_ERROR_MSG.DOES_NOT_SUPPORT_INTERFACE("INftCollectionFactory")
            );
        });
        it("Should change nftCollectionfactory", async function () {
            const NewNftCollectionFactory = await ethers.getContractFactory("AltrNftCollectionFactory");
            const newNftCollectionFactory = await NewNftCollectionFactory.deploy();
            await this.nftCollateralRetriever.setNftCollectionFactory(newNftCollectionFactory.address);
            expect(await this.nftCollateralRetriever.nftCollectionFactory()).to.equal(newNftCollectionFactory.address);
        });
        it("Should emit an event", async function () {
            const NewNftCollectionFactory = await ethers.getContractFactory("AltrNftCollectionFactory");
            const newNftCollectionFactory = await NewNftCollectionFactory.deploy();
            expect(await this.nftCollateralRetriever.setNftCollectionFactory(newNftCollectionFactory.address))
                .to.emit(this.nftCollateralRetriever, "NftCollectionFactoryChanged")
                .withArgs(newNftCollectionFactory.address);
        });
    });
    describe("setFeeManager", function () {
        it("Should revert if is null address", async function () {
            await expect(this.nftCollateralRetriever.setFeeManager(ethers.constants.AddressZero)).to.be.revertedWith(
                COLLATERAL_RETRIEVER_ERROR_MSG.CANNOT_BE_NULL_ADDRESS
            );
        });
        it("Should revert if new contract does not support IFeeManager interface", async function () {
            await expect(this.nftCollateralRetriever.setFeeManager(this.owner1.address)).to.be.revertedWith(
                COLLATERAL_RETRIEVER_ERROR_MSG.DOES_NOT_SUPPORT_INTERFACE("IFeeManager")
            );
        });
        it("Should change feeManager", async function () {
            const NewFeeManager = await ethers.getContractFactory("AltrFeeManager");
            const newFeeManager = await NewFeeManager.deploy();
            await this.nftCollateralRetriever.setFeeManager(newFeeManager.address);
            expect(await this.nftCollateralRetriever.feeManager()).to.equal(newFeeManager.address);
        });
        it("Should emit an event", async function () {
            const NewFeeManager = await ethers.getContractFactory("AltrFeeManager");
            const newFeeManager = await NewFeeManager.deploy();
            expect(await this.nftCollateralRetriever.setFeeManager(newFeeManager.address))
                .to.emit(this.nftCollateralRetriever, "FeeManagerChanged")
                .withArgs(newFeeManager.address);
        });
    });
}
