import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { NFT_MINTER_ROLE } from "../config/roles";
import { deployNftCollection } from "../scripts/deployFunctions";
import {
    buildFractionSaleScenario,
    buildScenario1,
    buildScenario4,
    buildSuccessfulFractionsSaleScenario,
    getTokenId,
    mintNft,
    SOLIDITY_ERROR_MSG,
} from "./common";
import { mintfUsdtTo, setNetworkTimestampTo } from "./utilities";

const COLLATERAL_RETRIEVER_ERROR_MSG = new SOLIDITY_ERROR_MSG("AltrNftCollateralRetriever");
const NFT_COLLECTION_ERROR_MSG = new SOLIDITY_ERROR_MSG("AltrNftCollection");

export function nftCollateralRetrieverBehavior(): void {
    it("Burn Nft", async function () {
        const nftTokenCollectionData = await buildScenario1(this, this.signer, this.nftCollectionFactory, this.oracle1);
        const nftCollectionContract = await ethers.getContractAt("AltrNftCollection", nftTokenCollectionData.collectionAddress);

        let tokenOwner = await nftCollectionContract.ownerOf(nftTokenCollectionData.tokenId);
        expect(tokenOwner).eq(this.oracle1.address);

        await expect(
            this.nftCollateralRetriever.burnNft(nftTokenCollectionData.collectionAddress, nftTokenCollectionData.tokenId)
        ).to.be.revertedWith(COLLATERAL_RETRIEVER_ERROR_MSG.ONLY_MINTER_CAN_BURN);

        await expect(
            this.nftCollateralRetriever
                .connect(this.oracle1)
                .burnNft(nftTokenCollectionData.collectionAddress, nftTokenCollectionData.tokenId)
        ).to.be.revertedWith(COLLATERAL_RETRIEVER_ERROR_MSG.NOT_TOKEN_OWNER);

        await nftCollectionContract
            .connect(this.oracle1)
            .transferFrom(this.oracle1.address, this.owner1.address, nftTokenCollectionData.tokenId);

        tokenOwner = await nftCollectionContract.ownerOf(nftTokenCollectionData.tokenId);
        expect(tokenOwner).eq(this.owner1.address);

        await expect(
            this.nftCollateralRetriever
                .connect(this.oracle1)
                .burnNft(nftTokenCollectionData.collectionAddress, nftTokenCollectionData.tokenId)
        ).to.be.revertedWith(COLLATERAL_RETRIEVER_ERROR_MSG.NOT_TOKEN_OWNER);

        //owner began collateral retrieving
        await nftCollectionContract
            .connect(this.owner1)
            .transferFrom(this.owner1.address, this.nftCollateralRetriever.address, nftTokenCollectionData.tokenId);

        tokenOwner = await nftCollectionContract.ownerOf(nftTokenCollectionData.tokenId);
        expect(tokenOwner).eq(this.nftCollateralRetriever.address);

        let tokenCount = await nftCollectionContract.totalSupply();
        expect(tokenCount).eq(1);

        await expect(
            this.nftCollateralRetriever
                .connect(this.owner1)
                .burnNft(nftTokenCollectionData.collectionAddress, nftTokenCollectionData.tokenId)
        ).to.be.revertedWith(COLLATERAL_RETRIEVER_ERROR_MSG.ONLY_MINTER_CAN_BURN);

        await expect(
            this.nftCollateralRetriever
                .connect(this.oracle1)
                .burnNft(nftTokenCollectionData.collectionAddress, nftTokenCollectionData.tokenId)
        )
            .to.emit(this.nftCollateralRetriever, "NftBurned")
            .withArgs(nftCollectionContract.address, this.oracle1.address, nftTokenCollectionData.tokenId);

        tokenCount = await nftCollectionContract.totalSupply();
        expect(tokenCount).eq(0);

        await expect(nftCollectionContract.ownerOf(nftTokenCollectionData.tokenId)).to.be.revertedWith(
            NFT_COLLECTION_ERROR_MSG.INVALID_TOKEN
        );
    });

    it("Minter role can burn Nft", async function () {
        const data = await buildScenario4(this);
        const nftCollectionContract = await ethers.getContractAt("AltrNftCollection", data.tokenCollection.collectionAddress);

        await this.fUsdt.approve(this.platformFeeManager.address, ethers.utils.parseUnits("250", 6));
        await this.platformFeeManager.payRedemptionFee(nftCollectionContract.address, 1);

        await nftCollectionContract["safeTransferFrom(address,address,uint256)"](
            this.altrFractionsSale.address,
            this.nftCollateralRetriever.address,
            data.tokenCollection.tokenId
        );

        let tokenCount = await nftCollectionContract.totalSupply();
        expect(tokenCount).eq(1);

        await expect(
            this.nftCollateralRetriever.connect(this.owner2).burnNft(data.tokenCollection.collectionAddress, data.tokenCollection.tokenId)
        ).to.be.revertedWith(COLLATERAL_RETRIEVER_ERROR_MSG.ONLY_MINTER_CAN_BURN);

        await (await nftCollectionContract.connect(this.oracle1).grantRole(NFT_MINTER_ROLE, this.owner2.address)).wait();

        await expect(
            this.nftCollateralRetriever.connect(this.owner2).burnNft(data.tokenCollection.collectionAddress, data.tokenCollection.tokenId)
        )
            .to.emit(this.nftCollateralRetriever, "NftBurned")
            .withArgs(nftCollectionContract.address, this.owner2.address, data.tokenCollection.tokenId);

        tokenCount = await nftCollectionContract.totalSupply();
        expect(tokenCount).eq(0);

        await expect(nftCollectionContract.ownerOf(data.tokenCollection.tokenId)).to.be.revertedWith(
            NFT_COLLECTION_ERROR_MSG.INVALID_TOKEN
        );
    });

    it("Redeem request wkf", async function () {
        const data = await buildScenario4(this);
        const nftTokenCollectionData = data.tokenCollection;
        const nftCollectionContract = await ethers.getContractAt("AltrNftCollection", nftTokenCollectionData.collectionAddress);
        console.log();
        const fee = (await this.platformFeeManager.redemptionFee())
            .mul((await this.platformFeeManager.salesInfo(nftCollectionContract.address, 1)).firstSalePrice)
            .div(10000);

        await mintfUsdtTo(this.fUsdt, this.oracle1.address, "5000");
        await this.fUsdt.connect(this.oracle1).approve(this.platformFeeManager.address, ethers.utils.parseUnits("5000", 6));
        await expect(
            this.platformFeeManager.connect(this.oracle1).payRedemptionFee(nftCollectionContract.address, 1)
        ).to.changeTokenBalances(this.fUsdt, [this.oracle1.address, this.governanceTreasury.address], [-fee, fee]);

        await nftCollectionContract["safeTransferFrom(address,address,uint256)"](
            this.altrFractionsSale.address,
            this.oracle1.address,
            nftTokenCollectionData.tokenId
        );

        await nftCollectionContract
            .connect(this.oracle1)
            .transferFrom(this.oracle1.address, this.owner1.address, nftTokenCollectionData.tokenId);
        let owner = await nftCollectionContract.ownerOf(nftTokenCollectionData.tokenId);
        expect(owner).to.be.equal(this.owner1.address);

        await expect(
            await nftCollectionContract
                .connect(this.owner1)
                ["safeTransferFrom(address,address,uint256)"](
                    this.owner1.address,
                    this.nftCollateralRetriever.address,
                    nftTokenCollectionData.tokenId
                )
        )
            .to.emit(this.nftCollateralRetriever, "RedeemRequest")
            .withArgs(nftCollectionContract.address, this.owner1.address, this.owner1.address, 1);
        owner = await nftCollectionContract.ownerOf(1);
        expect(owner).to.be.equal(this.nftCollateralRetriever.address);
    });

    it("Transfer nft with expired vault service", async function () {
        const data = await buildScenario4(this);
        const nftTokenCollectionData = data.tokenCollection;
        const nftCollectionContract = await ethers.getContractAt("AltrNftCollection", nftTokenCollectionData.collectionAddress);

        const vaultServiceDeadline = await nftCollectionContract.getVaultServiceDeadline(nftTokenCollectionData.tokenId);

        await setNetworkTimestampTo(vaultServiceDeadline.toNumber());

        await (
            await nftCollectionContract.transferFrom(this.altrFractionsSale.address, this.owner1.address, nftTokenCollectionData.tokenId)
        ).wait();
        await mintfUsdtTo(this.fUsdt, this.owner1.address, "500");
        await this.fUsdt.connect(this.owner1).approve(this.platformFeeManager.address, ethers.utils.parseUnits("250", 6));
        await this.platformFeeManager.connect(this.owner1).payRedemptionFee(nftCollectionContract.address, nftTokenCollectionData.tokenId);
        await expect(
            nftCollectionContract
                .connect(this.owner1)
                ["safeTransferFrom(address,address,uint256,bytes)"](
                    this.owner1.address,
                    this.nftCollateralRetriever.address,
                    nftTokenCollectionData.tokenId,
                    []
                )
        ).to.be.revertedWith(COLLATERAL_RETRIEVER_ERROR_MSG.VAULT_SERVICE_EXPIRED);

        const newDeadline = vaultServiceDeadline.add(60 * 60).toNumber() * 1000;
        await (
            await nftCollectionContract.connect(this.vaultManager).setVaultServiceDeadline(nftTokenCollectionData.tokenId, newDeadline)
        ).wait();
        expect(await nftCollectionContract.getVaultServiceDeadline(nftTokenCollectionData.tokenId)).is.equal(newDeadline);

        //Owner1 made an off chain payment of the vault service
        await (
            await nftCollectionContract
                .connect(this.owner1)
                ["safeTransferFrom(address,address,uint256,bytes)"](
                    this.owner1.address,
                    this.nftCollateralRetriever.address,
                    nftTokenCollectionData.tokenId,
                    []
                )
        ).wait();
        let tokenOwner = await nftCollectionContract.ownerOf(nftTokenCollectionData.tokenId);
        expect(tokenOwner).eq(this.nftCollateralRetriever.address);
    });

    it("Check unknown collection", async function () {
        let nftCollectionContract = await deployNftCollection(
            "unknownCollection",
            "UNK_COL",
            this.signer,
            this.vaultManager.address,
            this.oracle1.address,
            this.governanceNftTreasury.address
        );
        const tokenUri = "fakeTokenUriv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu";
        let transactionReceipt = await mintNft(nftCollectionContract, tokenUri, this.oracle1);
        const tokenId = getTokenId(transactionReceipt);

        let receipt = await (
            await nftCollectionContract
                .connect(this.oracle1)
                .transferFrom(this.oracle1.address, this.nftCollateralRetriever.address, tokenId)
        ).wait();
        let owner = await nftCollectionContract.ownerOf(tokenId);
        expect(owner).to.be.equal(this.nftCollateralRetriever.address);

        transactionReceipt = await mintNft(nftCollectionContract, tokenUri, this.oracle1);
        const tokenId2 = getTokenId(transactionReceipt);
        await expect(
            nftCollectionContract
                .connect(this.oracle1)
                ["safeTransferFrom(address,address,uint256,bytes)"](this.oracle1.address, this.nftCollateralRetriever.address, tokenId2, [])
        ).to.be.revertedWith(COLLATERAL_RETRIEVER_ERROR_MSG.UNKNOWN_COLLECTION);

        const data = await buildScenario4(this);
        const nftTokenCollectionData = data.tokenCollection;
        nftCollectionContract = await ethers.getContractAt("AltrNftCollection", nftTokenCollectionData.collectionAddress);

        await nftCollectionContract["safeTransferFrom(address,address,uint256)"](
            this.altrFractionsSale.address,
            this.oracle1.address,
            nftTokenCollectionData.tokenId
        );

        await mintfUsdtTo(this.fUsdt, this.oracle1.address, "5000");
        await this.fUsdt.connect(this.oracle1).approve(this.platformFeeManager.address, ethers.utils.parseUnits("250", 6));

        await this.platformFeeManager.connect(this.oracle1).payRedemptionFee(nftCollectionContract.address, 1);
        await nftCollectionContract
            .connect(this.oracle1)
            ["safeTransferFrom(address,address,uint256,bytes)"](
                this.oracle1.address,
                this.nftCollateralRetriever.address,
                nftTokenCollectionData.tokenId,
                []
            );
        owner = await nftCollectionContract.ownerOf(nftTokenCollectionData.tokenId);
        expect(owner).to.be.equal(this.nftCollateralRetriever.address);
    });

    it("Check burn on unknown collection", async function () {
        let nftCollectionContract = await deployNftCollection(
            "unknownCollection",
            "UNK_COL",
            this.signer,
            this.vaultManager.address,
            this.oracle1.address,
            this.governanceNftTreasury.address
        );
        const tokenUri = "fakeTokenUriv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu";
        let transactionReceipt = await mintNft(nftCollectionContract, tokenUri, this.oracle1);
        const tokenId = getTokenId(transactionReceipt);

        let receipt = await (
            await nftCollectionContract
                .connect(this.oracle1)
                .transferFrom(this.oracle1.address, this.nftCollateralRetriever.address, tokenId)
        ).wait();
        let owner = await nftCollectionContract.ownerOf(tokenId);
        expect(owner).to.be.equal(this.nftCollateralRetriever.address);
        await expect(this.nftCollateralRetriever.connect(this.oracle1).burnNft(nftCollectionContract.address, tokenId)).to.be.revertedWith(
            COLLATERAL_RETRIEVER_ERROR_MSG.UNKNOWN_COLLECTION
        );
    });

    it("upgrade collateral retriever implementation to V2", async function () {
        expect(await (await upgrades.admin.getInstance()).owner()).to.be.equal(this.signer.address);
        const AltrNftCollateralRetrieverV2 = await ethers.getContractFactory("AltrNftCollateralRetrieverV2");
        const altrNftCollateralRetriever = await upgrades.upgradeProxy(this.nftCollateralRetriever.address, AltrNftCollateralRetrieverV2, {
            call: { fn: "setNewString" },
        });
        expect(await altrNftCollateralRetriever.getNewString()).to.equal("This is the upgrade!");
        expect(this.nftCollateralRetriever.address).to.equal(altrNftCollateralRetriever.address);
    });

    it("upgrade collateral retriever implementation v3", async function () {
        const NewCollectionFactory = await ethers.getContractFactory("AltrNftCollectionFactory");
        const newCollectionFactory = await NewCollectionFactory.deploy();
        const AltrNftCollateralRetrieverV3 = await ethers.getContractFactory("AltrNftCollateralRetrieverV3");
        const altrNftCollateralRetriever = await upgrades.upgradeProxy(this.nftCollateralRetriever.address, AltrNftCollateralRetrieverV3);
        await altrNftCollateralRetriever.updateCollectionFactory(newCollectionFactory.address);
        expect(await altrNftCollateralRetriever.nftCollectionFactory()).to.equal(newCollectionFactory.address);
    });
}
