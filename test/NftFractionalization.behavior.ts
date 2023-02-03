import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";
import { buyoutFee, tiers } from "../config/config";
import { SALE_ISSUER_ROLE } from "../config/roles";
import {
    buildFractionSaleScenario,
    buildScenario1,
    buildScenario2,
    buildScenario3,
    buildScenario4,
    buildScenario5,
    buildSuccessfulFractionsSaleScenario,
    SOLIDITY_ERROR_MSG,
} from "./common";
import { mintBigNumberfUsdtTo, mintfUsdtTo, restoreSnapshot, setSnapshot } from "./utilities";

const NFT_FRACTIONS_ERROR_MSG = new SOLIDITY_ERROR_MSG("AltrFractions");
const NFT_FRACTIONS_SALE_ERROR_MSG = new SOLIDITY_ERROR_MSG("AltrFractionsSale");
const NFT_FRACTIONS_BUYOUT_ERROR_MSG = new SOLIDITY_ERROR_MSG("AltrFractionsBuyout");
const TIMED_TOKEN_SPLITTER_ERROR_MSG = new SOLIDITY_ERROR_MSG("TimedTokenSplitter");
const DENOMINATOR = 10000;

export function nftFractionalizationBehavior() {
    it("Sets up sale", async function () {
        const nftTokenCollectionData = await buildScenario1(this, this.signer, this.nftCollectionFactory, this.oracle1);
        const nftCollectionContract = await ethers.getContractAt("AltrNftCollection", nftTokenCollectionData.collectionAddress);

        const now = Date.now() + 5;
        const setupSaleWrongArgs = [
            nftCollectionContract.address,
            nftTokenCollectionData.tokenId,
            this.fUsdt.address,
            now,
            now + this.saleOpenTimePeriod,
            10e6,
            ethers.constants.Zero,
            ethers.constants.Zero,
        ] as const;

        await expect(this.altrFractionsSale.connect(this.oracle1).setupSale(...setupSaleWrongArgs)).to.be.revertedWith(
            NFT_FRACTIONS_SALE_ERROR_MSG.MISSING_ROLE(this.oracle1.address.toLowerCase(), SALE_ISSUER_ROLE)
        );

        await this.altrFractionsSale.grantRole(SALE_ISSUER_ROLE, this.oracle1.address);

        await expect(this.altrFractionsSale.connect(this.oracle1).setupSale(...setupSaleWrongArgs)).to.be.revertedWith(
            NFT_FRACTIONS_SALE_ERROR_MSG.SALE_MIN_FRACTION_MUST_BE_ABOVE_0
        );

        const setupSaleRightArgs = [
            nftCollectionContract.address,
            nftTokenCollectionData.tokenId,
            this.fUsdt.address,
            now,
            now + this.saleOpenTimePeriod,
            10e6,
            ethers.constants.Zero,
            ethers.BigNumber.from(10),
        ] as const;

        await expect(this.altrFractionsSale.connect(this.oracle1).setupSale(...setupSaleRightArgs)).to.be.revertedWith(
            NFT_FRACTIONS_SALE_ERROR_MSG.NOT_TOKEN_OWNER
        );

        await nftCollectionContract.connect(this.oracle1).approve(this.altrFractionsSale.address, nftTokenCollectionData.tokenId);

        await this.altrFractionsSale.connect(this.oracle1).setupSale(...setupSaleRightArgs);

        const salesCount = await this.altrFractionsSale.salesCounter();
        const saleId = salesCount.sub(1);
        const sale = await this.altrFractionsSale.getFractionsSale(saleId);
        expect(sale.initiator).to.be.eq(this.oracle1.address);

        expect(await this.altrFractions.balanceOf(this.altrFractionsSale.address, saleId)).to.equal(
            (await this.altrFractionsSale.getFractionsSale(saleId))[8]
        );
    });

    it("Manages ERC721 retrieval for failed sale", async function () {
        const nftTokenCollectionData = await buildScenario1(this, this.signer, this.nftCollectionFactory, this.oracle1);
        const altrFractionSaleData = await buildFractionSaleScenario(this, nftTokenCollectionData);

        const nftCollection = await ethers.getContractAt("AltrNftCollection", altrFractionSaleData.sale.nftCollection);

        await expect(this.altrFractionsSale.connect(this.oracle1).withdrawFailedSaleNft(altrFractionSaleData.id)).to.be.revertedWith(
            NFT_FRACTIONS_SALE_ERROR_MSG.UNFINISHED_SALE
        );

        await time.increaseTo((await time.latest()) + this.saleOpenTimePeriod);

        await this.altrFractionsSale.grantRole(SALE_ISSUER_ROLE, this.owner2.address);
        await expect(this.altrFractionsSale.connect(this.owner2).withdrawFailedSaleNft(altrFractionSaleData.id)).to.be.revertedWith(
            NFT_FRACTIONS_SALE_ERROR_MSG.SALE_INITIATOR
        );
        await this.altrFractionsSale.revokeRole(SALE_ISSUER_ROLE, this.owner2.address);

        await expect(this.altrFractionsSale.connect(this.oracle1).withdrawFailedSaleNft(altrFractionSaleData.id))
            .to.emit(this.altrFractionsSale, "FailedSaleNftWithdrawn")
            .withArgs(
                altrFractionSaleData.id,
                this.oracle1.address,
                altrFractionSaleData.sale.nftCollection,
                altrFractionSaleData.sale.nftId
            );

        expect(await nftCollection.ownerOf(altrFractionSaleData.sale.nftId)).to.equal(this.oracle1.address);
    });

    it("Manages ERC721 retrieval for successful sale", async function () {
        const nftTokenCollectionData = await buildScenario1(this, this.signer, this.nftCollectionFactory, this.oracle1);
        const altrFractionSaleData = await buildFractionSaleScenario(this, nftTokenCollectionData);
        const fractionsAmount = (await this.altrFractionsSale.getFractionsSale(altrFractionSaleData.id))[8];
        const usdtToSpend = altrFractionSaleData.sale.fractionPrice.mul(fractionsAmount);

        await mintfUsdtTo(this.fUsdt, this.signer.address, "10000000");
        await this.fUsdt.approve(this.altrFractionsSale.address, ethers.utils.parseUnits("10000000", 6));

        await expect(this.altrFractionsSale.buyFractions(altrFractionSaleData.id, fractionsAmount.add(1))).to.be.revertedWith(
            NFT_FRACTIONS_SALE_ERROR_MSG.NOT_ENOUGH_FRACTIONS_AVAILABLE
        );

        await expect(this.altrFractionsSale.buyFractions(+altrFractionSaleData.id.toString() + 1, 1)).to.be.revertedWith(
            NFT_FRACTIONS_SALE_ERROR_MSG.SALE_NOT_OPEN
        );

        await expect(this.altrFractionsSale.buyFractions(altrFractionSaleData.id, fractionsAmount))
            .to.changeTokenBalances(this.fUsdt, [this.signer.address, altrFractionSaleData.buyTokenManager], [-usdtToSpend, usdtToSpend])
            .and.to.emit(this.altrFractionsSale, "FractionsPurchased")
            .withArgs(altrFractionSaleData.id, this.signer.address, fractionsAmount);

        expect(await this.altrFractions.balanceOf(this.altrFractionsSale.address, altrFractionSaleData.id)).to.equal(
            (await this.altrFractionsSale.getFractionsSale(altrFractionSaleData.id))[8].sub(fractionsAmount)
        );
        expect(await this.altrFractions.balanceOf(this.signer.address, altrFractionSaleData.id)).to.equal(fractionsAmount);
        expect(await this.altrFractionsSale.isSaleSuccessful(altrFractionSaleData.id)).to.be.true;
        await expect(this.altrFractionsSale.connect(this.oracle1).withdrawFailedSaleNft(altrFractionSaleData.id)).to.be.revertedWith(
            NFT_FRACTIONS_SALE_ERROR_MSG.CANNOT_TRADE_NFT_BACK
        );

        await time.increaseTo((await time.latest()) + this.saleOpenTimePeriod);

        expect(await time.latest()).to.be.gt(altrFractionSaleData.sale.closingTime);
        await expect(this.altrFractionsSale.buyFractions(altrFractionSaleData.id, fractionsAmount)).to.be.revertedWith(
            NFT_FRACTIONS_SALE_ERROR_MSG.SALE_NOT_OPEN
        );

        await expect(this.altrFractionsSale.connect(this.oracle1).withdrawFailedSaleNft(altrFractionSaleData.id)).to.be.revertedWith(
            NFT_FRACTIONS_SALE_ERROR_MSG.CANNOT_TRADE_NFT_BACK
        );
    });

    it("Manages fractions trasfer for failed sale", async function () {
        const fractionsToBuy = 10;
        const nftTokenCollectionData = await buildScenario1(this, this.signer, this.nftCollectionFactory, this.oracle1);
        const altrFractionSaleData = await buildFractionSaleScenario(this, nftTokenCollectionData);
        const usdtToSpend = altrFractionSaleData.sale.fractionPrice.mul(fractionsToBuy);
        await mintBigNumberfUsdtTo(this.fUsdt, this.signer.address, usdtToSpend);
        await this.fUsdt.approve(this.altrFractionsSale.address, usdtToSpend);
        await this.altrFractionsSale.buyFractions(altrFractionSaleData.id, fractionsToBuy);
        await time.increaseTo((await time.latest()) + this.saleOpenTimePeriod);

        await expect(this.altrFractions.safeTransferFrom(this.signer.address, this.owner1.address, 0, 100, "0x")).to.be.revertedWith(
            NFT_FRACTIONS_ERROR_MSG.CANNOT_TRADE_FAILED_SALE_TOKEN
        );
    });

    it("manages USDT retrieval for failed sale", async function () {
        const fractionsToBuy = 10;

        const nftTokenCollectionData = await buildScenario1(this, this.signer, this.nftCollectionFactory, this.oracle1);
        const altrFractionSaleData = await buildFractionSaleScenario(this, nftTokenCollectionData);
        const usdtToSpend = altrFractionSaleData.sale.fractionPrice.mul(fractionsToBuy);

        const timedTokenSplitter = await ethers.getContractAt("TimedTokenSplitter", altrFractionSaleData.buyTokenManager);

        await mintBigNumberfUsdtTo(this.fUsdt, this.signer.address, usdtToSpend);
        await this.fUsdt.approve(this.altrFractionsSale.address, usdtToSpend);

        await expect(await this.altrFractionsSale.buyFractions(altrFractionSaleData.id, fractionsToBuy)).to.changeTokenBalances(
            this.fUsdt,
            [this.signer.address, timedTokenSplitter.address],
            [-usdtToSpend, usdtToSpend]
        );
        await expect(timedTokenSplitter.release([this.signer.address])).to.be.revertedWith(
            TIMED_TOKEN_SPLITTER_ERROR_MSG.SALE_NOT_FINISHED
        );
        await time.increaseTo((await time.latest()) + this.saleOpenTimePeriod);

        await expect(this.altrFractionsSale.buyFractions(altrFractionSaleData.id, fractionsToBuy)).to.be.revertedWith(
            NFT_FRACTIONS_SALE_ERROR_MSG.SALE_NOT_OPEN
        );

        await expect(timedTokenSplitter.release([this.signer.address]))
            .to.changeTokenBalances(this.fUsdt, [this.signer.address, timedTokenSplitter.address], [usdtToSpend, -usdtToSpend])
            .and.to.emit(timedTokenSplitter, "TokensReleased")
            .withArgs(
                [this.signer.address],
                this.fUsdt.address,
                this.altrFractions.address,
                altrFractionSaleData.id,
                [fractionsToBuy],
                altrFractionSaleData.sale.fractionPrice
            );
    });

    it("manages USDT retrieval for successful sale", async function () {
        const nftTokenCollectionData = await buildScenario1(this, this.signer, this.nftCollectionFactory, this.oracle1);
        const altrFractionSaleData = await buildFractionSaleScenario(this, nftTokenCollectionData);

        const timedTokenSplitter = await ethers.getContractAt("TimedTokenSplitter", altrFractionSaleData.buyTokenManager);

        await expect(timedTokenSplitter.connect(this.oracle1).releaseSeller()).to.be.revertedWith(
            TIMED_TOKEN_SPLITTER_ERROR_MSG.SALE_NOT_FINISHED
        );

        await buildSuccessfulFractionsSaleScenario(this, altrFractionSaleData);

        await expect(timedTokenSplitter.release([this.signer.address])).to.be.revertedWith(
            TIMED_TOKEN_SPLITTER_ERROR_MSG.SALE_DID_NOT_FAIL
        );

        const timedTokenSplitterBalance = await this.fUsdt.balanceOf(timedTokenSplitter.address);
        const protocolFee = await timedTokenSplitter.protocolFee();
        const sellerAmount = timedTokenSplitterBalance.sub(timedTokenSplitterBalance.mul(protocolFee).div(DENOMINATOR));

        await expect(timedTokenSplitter.connect(this.oracle1).releaseSeller())
            .to.emit(timedTokenSplitter, "TokensSellerReleased")
            .withArgs(this.oracle1.address, this.altrFractionsSale.address, altrFractionSaleData.id, sellerAmount);
    });

    it("manages USDT retrieval for successful sale and closing time not reached", async function () {
        const nftTokenCollectionData = await buildScenario1(this, this.signer, this.nftCollectionFactory, this.oracle1);
        const altrFractionSaleData = await buildFractionSaleScenario(this, nftTokenCollectionData);

        const timedTokenSplitter = await ethers.getContractAt("TimedTokenSplitter", altrFractionSaleData.buyTokenManager);
        const fractionsAmount = (await this.altrFractionsSale.getFractionsSale(altrFractionSaleData.id))[8];
        const fractionsToBuy = Math.ceil(fractionsAmount.mul(100).div(100).toNumber());

        const usdtToMint = ethers.utils.parseUnits("10000000", 6);
        const usdtToApprove = altrFractionSaleData.sale.fractionPrice.mul(fractionsToBuy);

        await mintBigNumberfUsdtTo(this.fUsdt, this.signer.address, usdtToMint);

        await this.fUsdt.approve(this.altrFractionsSale.address, usdtToApprove);

        await this.altrFractionsSale.buyFractions(altrFractionSaleData.id, fractionsToBuy);
        expect(await this.altrFractionsSale.isSaleSuccessful(altrFractionSaleData.id)).to.be.true;

        await expect(timedTokenSplitter.release([this.signer.address])).to.be.revertedWith(
            TIMED_TOKEN_SPLITTER_ERROR_MSG.SALE_DID_NOT_FAIL
        );

        const timedTokenSplitterBalance = await this.fUsdt.balanceOf(timedTokenSplitter.address);
        const protocolFee = await timedTokenSplitter.protocolFee();
        const sellerAmount = timedTokenSplitterBalance.sub(timedTokenSplitterBalance.mul(protocolFee).div(DENOMINATOR));

        await expect(timedTokenSplitter.connect(this.oracle1).releaseSeller())
            .to.emit(timedTokenSplitter, "TokensSellerReleased")
            .withArgs(this.oracle1.address, this.altrFractionsSale.address, altrFractionSaleData.id, sellerAmount);
    });

    it("Manages buyout request for successful sale", async function () {
        const nftTokenCollectionData = await buildScenario1(this, this.signer, this.nftCollectionFactory, this.oracle1);
        const altrFractionSaleData = await buildFractionSaleScenario(this, nftTokenCollectionData);
        await buildSuccessfulFractionsSaleScenario(this, altrFractionSaleData);

        const buyoutId = await this.altrFractionsBuyout.buyoutsCounter();
        await expect(this.altrFractionsBuyout.requestBuyout(altrFractionSaleData.id))
            .to.emit(this.altrFractionsBuyout, "BuyoutRequested")
            .withArgs(altrFractionSaleData.id, this.signer.address, buyoutId);
    });

    it("Manages request buyout for uncessful sale", async function () {
        const nftTokenCollectionData = await buildScenario1(this, this.signer, this.nftCollectionFactory, this.oracle1);
        const altrFractionSaleData = await buildFractionSaleScenario(this, nftTokenCollectionData);
        await time.increaseTo((await time.latest()) + this.saleOpenTimePeriod);
        await expect(this.altrFractionsBuyout.requestBuyout(altrFractionSaleData.id)).to.be.revertedWith(
            NFT_FRACTIONS_BUYOUT_ERROR_MSG.SALE_UNSUCCESSFUL
        );
    });

    it("Manages buyout proposal for successful request", async function () {
        const scenarioData = await buildScenario2(this);
        const buyoutPrice = ethers.utils.parseUnits("1200", 6);

        const buyoutOpenTimePeriod = await this.altrFractionsBuyout.buyoutOpenTimePeriod();

        await expect(this.altrFractionsBuyout.setBuyoutParams(scenarioData.buyout.id, buyoutPrice))
            .to.emit(this.altrFractionsBuyout, "BuyoutParamsSet")
            .withArgs(scenarioData.buyout.id, anyValue);

        const buyout = await this.altrFractionsBuyout.buyouts(scenarioData.buyout.id);
        const now = await time.latest();
        expect(buyout.openingTime).to.be.eq(ethers.BigNumber.from(now));
        expect(buyout.closingTime).to.be.eq(buyoutOpenTimePeriod.add(now));
        expect(buyout.buyoutPrice).to.be.eq(buyoutPrice);

        await expect(this.altrFractionsBuyout.setBuyoutParams(scenarioData.buyout.id, buyoutPrice)).to.revertedWith(
            NFT_FRACTIONS_BUYOUT_ERROR_MSG.BUYOUT_ALREADY_STARTED
        );

        await expect(this.altrFractionsBuyout.setBuyoutParams(+scenarioData.buyout.id.toString() + 1, buyoutPrice)).to.revertedWith(
            NFT_FRACTIONS_BUYOUT_ERROR_MSG.INVALID_BUYOUT_ID
        );
    });

    it("Manages out of time buyout for successful buyout proposal", async function () {
        const scenarioData = await buildScenario3(this);

        await time.increase(scenarioData.buyout.buyout.closingTime.add(1));

        await expect(this.altrFractionsBuyout.executeBuyout(scenarioData.buyout.id)).to.be.revertedWith(
            NFT_FRACTIONS_BUYOUT_ERROR_MSG.BUYOUT_NOT_OPEN
        );
    });

    it("Manages buyout for successful buyout proposal", async function () {
        const scenarioData = await buildScenario3(this);

        await expect(this.altrFractionsBuyout.executeBuyout(scenarioData.buyout.id)).to.be.revertedWith(
            NFT_FRACTIONS_SALE_ERROR_MSG.NOT_TOKEN_OWNER_ERC1155
        );

        await this.altrFractions.setApprovalForAll(this.altrFractionsBuyout.address, true);
        await this.altrFractions.safeTransferFrom(
            this.signer.address,
            this.oracle1.address,
            scenarioData.buyout.buyout.fractionSaleId,
            500,
            "0x"
        );
        await expect(this.altrFractionsBuyout.executeBuyout(scenarioData.buyout.id)).to.be.revertedWith(
            NFT_FRACTIONS_BUYOUT_ERROR_MSG.NOT_ENOUGH_FRACTIONS
        );

        await this.altrFractions
            .connect(this.oracle1)
            .safeTransferFrom(this.oracle1.address, this.signer.address, scenarioData.buyout.buyout.fractionSaleId, 400, "0x");

        await expect(this.altrFractionsBuyout.executeBuyout(scenarioData.buyout.id)).to.be.revertedWith(
            NFT_FRACTIONS_BUYOUT_ERROR_MSG.REQUEST_EXCEEDS_ALLOWANCE
        );

        await this.fUsdt.approve(this.altrFractionsBuyout.address, ethers.utils.parseUnits("10000000", 6));

        const buyoutPrice = scenarioData.buyout.buyout.buyoutPrice.mul(100);
        const fee = buyoutPrice.mul(buyoutFee).div(DENOMINATOR);

        await expect(this.altrFractionsBuyout.executeBuyout(scenarioData.buyout.id))
            .to.changeTokenBalances(
                this.fUsdt,
                [this.signer.address, (await this.altrFractionsBuyout.buyouts(scenarioData.buyout.id))[2], this.governanceTreasury.address],
                [-buyoutPrice.add(fee), buyoutPrice, fee]
            )
            .and.to.emit(this.altrFractionsBuyout, "BuyoutExecuted")
            .withArgs(scenarioData.buyout.id, this.signer.address, 400, scenarioData.buyout.buyout.buyoutPrice.mul(100));

        const nftCollection = await ethers.getContractAt("AltrNftCollection", scenarioData.fractionSale.sale.nftCollection);
        await expect(
            nftCollection["safeTransferFrom(address,address,uint256)"](
                this.altrFractionsSale.address,
                this.signer.address,
                scenarioData.fractionSale.sale.nftId
            )
        ).to.emit(nftCollection, "Transfer");
    });

    it("Manages trade of bought out fractions for successful buyout", async function () {
        const fractionsToTrade = 100;

        const scenarioData = await buildScenario4(this);

        const fractionsBuyoutPrice = scenarioData.buyout.buyout.buyoutPrice.mul(fractionsToTrade);

        await expect(
            this.altrFractions
                .connect(this.oracle1)
                .safeTransferFrom(
                    this.oracle1.address,
                    this.signer.address,
                    scenarioData.buyout.buyout.fractionSaleId,
                    fractionsToTrade,
                    "0x"
                )
        ).to.be.revertedWith(NFT_FRACTIONS_ERROR_MSG.CANNOT_TRADE_BOUGHTOUT_FRACTIONS);

        const buyout = await this.altrFractionsBuyout.buyouts(scenarioData.buyout.id);

        const tokenSplitter = await ethers.getContractAt("TokenSplitter", buyout[2]);

        await expect(tokenSplitter.release([this.oracle1.address])).to.changeTokenBalances(
            this.fUsdt,
            [this.oracle1.address, tokenSplitter.address],
            [fractionsBuyoutPrice, -fractionsBuyoutPrice]
        );
    });

    it("Cannot send ERC1155 directly", async function () {
        const scenarioData = await buildScenario2(this);

        await expect(
            this.altrFractions.safeTransferFrom(this.signer.address, this.altrFractionsSale.address, scenarioData.fractionSale.id, 1, "0x")
        ).to.be.revertedWith(NFT_FRACTIONS_SALE_ERROR_MSG.CANNOT_SEND_ERC1155);
    });

    it("Cannot send ERC721 directly", async function () {
        const scenarioData = await buildScenario4(this);

        const nftCollection = await ethers.getContractAt("AltrNftCollection", scenarioData.fractionSale.sale.nftCollection);
        await nftCollection["safeTransferFrom(address,address,uint256)"](
            this.altrFractionsSale.address,
            this.signer.address,
            scenarioData.fractionSale.sale.nftId
        );

        await expect(
            nftCollection["safeTransferFrom(address,address,uint256)"](
                this.signer.address,
                this.altrFractionsSale.address,
                scenarioData.fractionSale.sale.nftId
            )
        ).to.be.revertedWith(NFT_FRACTIONS_SALE_ERROR_MSG.CANNOT_SEND_ERC721);
    });

    it("Manages unsupervised buyout for 100% share holders and unsuccessful sale", async function () {
        const scenarioData = await buildScenario1(this, this.signer, this.nftCollectionFactory, this.oracle1);
        const altrFractionSaleData = await buildFractionSaleScenario(this, scenarioData);
        await time.increase(10000000000000);
        await this.altrFractions.setApprovalForAll(this.altrFractionsSale.address, true);
        await expect(this.altrFractionsBuyout.buyoutUnsupervised(altrFractionSaleData.id)).to.be.revertedWith(
            NFT_FRACTIONS_BUYOUT_ERROR_MSG.SALE_UNSUCCESSFUL
        );
    });

    it("Manages unsupervised buyouts for 100% share holders", async function () {
        const scenarioData = await buildScenario3(this);
        await expect(this.altrFractionsBuyout.buyoutUnsupervised(scenarioData.buyout.id)).to.be.revertedWith(
            NFT_FRACTIONS_BUYOUT_ERROR_MSG.NOT_TOKEN_OWNER_ERC1155
        );
        await this.altrFractions.setApprovalForAll(this.altrFractionsBuyout.address, true);
        await this.altrFractions.safeTransferFrom(this.signer.address, this.oracle1.address, scenarioData.fractionSale.id, 1, "0x");
        await expect(this.altrFractionsBuyout.buyoutUnsupervised(scenarioData.buyout.id)).to.be.revertedWith(
            NFT_FRACTIONS_BUYOUT_ERROR_MSG.NOT_ENOUGH_FRACTIONS
        );
        await this.altrFractions
            .connect(this.oracle1)
            .safeTransferFrom(this.oracle1.address, this.signer.address, scenarioData.fractionSale.id, 1, "0x");
        const fractionsBalance = await this.altrFractions.balanceOf(this.signer.address, scenarioData.fractionSale.id);
        await expect(this.altrFractionsBuyout.buyoutUnsupervised(scenarioData.fractionSale.id))
            .to.emit(this.altrFractionsBuyout, "BuyoutExecuted")
            .withArgs(1, this.signer.address, fractionsBalance, 0);
    });

    it("Allows buys only from whitelisted addresses", async function () {
        const scenarioData = await buildScenario5(this);
        await expect(this.altrFractionsSale.buyFractions(scenarioData.fractionSale.id, 1)).not.to.be.reverted;
        await expect(this.altrFractionsSale.connect(this.owner1).buyFractions(scenarioData.fractionSale.id, 1)).to.be.revertedWith(
            NFT_FRACTIONS_SALE_ERROR_MSG.ADDRESS_NOT_ALLOWED
        );
    });

    it("Manages fractions sales with some shares kept from sale", async function () {
        const scenarioData = await buildScenario3(this, 80, BigNumber.from("100"));
        await expect(this.altrFractionsBuyout.executeBuyout(scenarioData.buyout.id)).to.be.revertedWith(
            NFT_FRACTIONS_SALE_ERROR_MSG.NOT_TOKEN_OWNER_ERC1155
        );

        const timedTokenSplitter = await ethers.getContractAt("TimedTokenSplitter", scenarioData.fractionSale.buyTokenManager);

        await this.altrFractions.setApprovalForAll(this.altrFractionsBuyout.address, true);
        await this.altrFractions.safeTransferFrom(
            this.signer.address,
            this.oracle1.address,
            scenarioData.buyout.buyout.fractionSaleId,
            400,
            "0x"
        );
        await expect(this.altrFractionsBuyout.executeBuyout(scenarioData.buyout.id)).to.be.revertedWith(
            NFT_FRACTIONS_BUYOUT_ERROR_MSG.NOT_ENOUGH_FRACTIONS
        );

        await this.altrFractions
            .connect(this.oracle1)
            .safeTransferFrom(this.oracle1.address, this.signer.address, scenarioData.buyout.buyout.fractionSaleId, 400, "0x");

        await expect(this.altrFractionsBuyout.executeBuyout(scenarioData.buyout.id)).to.be.revertedWith(
            NFT_FRACTIONS_BUYOUT_ERROR_MSG.REQUEST_EXCEEDS_ALLOWANCE
        );

        await this.fUsdt.approve(this.altrFractionsBuyout.address, ethers.utils.parseUnits("10000000", 6));

        const buyoutPrice = scenarioData.buyout.buyout.buyoutPrice.mul(100);
        const fee = buyoutPrice.mul(buyoutFee).div(DENOMINATOR);

        await expect(this.altrFractionsBuyout.executeBuyout(scenarioData.buyout.id))
            .to.changeTokenBalances(
                this.fUsdt,
                [this.signer.address, (await this.altrFractionsBuyout.buyouts(scenarioData.buyout.id))[2], this.governanceTreasury.address],
                [-buyoutPrice.add(fee), buyoutPrice, fee]
            )
            .and.to.emit(this.altrFractionsBuyout, "BuyoutExecuted")
            .withArgs(scenarioData.buyout.id, this.signer.address, 400, scenarioData.buyout.buyout.buyoutPrice.mul(100));

        await expect(this.altrFractionsSale.connect(this.oracle1).withdrawFractionsKept(scenarioData.fractionSale.id))
            .to.emit(this.altrFractionsSale, "FractionsKeptWithdrawn")
            .withArgs(scenarioData.fractionSale.id, this.oracle1.address, scenarioData.fractionSale.sale[10]);
    });

    it("Manages fractions sales with 100 fractions kept and minumum of 400 fractions saled", async function () {
        const nftTokenCollectionData = await buildScenario1(this, this.signer, this.nftCollectionFactory, this.oracle1);
        const altrFractionSaleData = await buildFractionSaleScenario(this, nftTokenCollectionData, ethers.BigNumber.from(100), 400);

        await expect(this.altrFractionsSale.buyFractions(altrFractionSaleData.id, 500)).to.be.revertedWith(
            NFT_FRACTIONS_SALE_ERROR_MSG.NOT_ENOUGH_FRACTIONS_AVAILABLE
        );
        const usdtToApprove = ethers.utils.parseUnits("5000", 6);
        await mintBigNumberfUsdtTo(this.fUsdt, this.signer.address, usdtToApprove);
        await this.fUsdt.approve(this.altrFractionsSale.address, usdtToApprove);

        await this.altrFractionsSale.buyFractions(altrFractionSaleData.id, 299);
        expect(await this.altrFractionsSale.isSaleSuccessful(altrFractionSaleData.id)).to.be.false;
        await this.altrFractionsSale.buyFractions(altrFractionSaleData.id, 1);
        expect(await this.altrFractionsSale.isSaleSuccessful(altrFractionSaleData.id)).to.be.true;
        await expect(this.altrFractionsSale.buyFractions(altrFractionSaleData.id, 100)).not.to.be.reverted;
        await expect(this.altrFractionsSale.buyFractions(altrFractionSaleData.id, 1)).to.be.revertedWith(
            NFT_FRACTIONS_SALE_ERROR_MSG.SALE_NOT_OPEN
        );
    });

    it("Manages fractions sales with all the fractions kept", async function () {
        const nftTokenCollectionData = await buildScenario1(this, this.signer, this.nftCollectionFactory, this.oracle1);
        const altrFractionSaleData = await buildFractionSaleScenario(this, nftTokenCollectionData, ethers.BigNumber.from(499), 500);
        const usdtToApprove = ethers.utils.parseUnits("20", 6);
        await mintBigNumberfUsdtTo(this.fUsdt, this.signer.address, usdtToApprove);
        await this.fUsdt.approve(this.altrFractionsSale.address, usdtToApprove);
        expect(await this.altrFractionsSale.isSaleSuccessful(altrFractionSaleData.id)).to.be.false;
        await expect(this.altrFractionsSale.buyFractions(altrFractionSaleData.id, 1)).not.to.be.reverted;
        expect(await this.altrFractionsSale.isSaleSuccessful(altrFractionSaleData.id)).to.be.true;
        await expect(this.altrFractionsSale.buyFractions(altrFractionSaleData.id, 1)).to.be.revertedWith(
            NFT_FRACTIONS_SALE_ERROR_MSG.SALE_NOT_OPEN
        );
    });

    it("Manages fraction sales with no fractions kept and a minumun of 1 fractions saled", async function () {
        const nftTokenCollectionData = await buildScenario1(this, this.signer, this.nftCollectionFactory, this.oracle1);
        const altrFractionSaleData = await buildFractionSaleScenario(this, nftTokenCollectionData, ethers.constants.Zero, 1);
        const usdtToApprove = ethers.utils.parseUnits("5000", 6);
        await mintBigNumberfUsdtTo(this.fUsdt, this.signer.address, usdtToApprove);
        await this.fUsdt.approve(this.altrFractionsSale.address, usdtToApprove);
        expect(await this.altrFractionsSale.isSaleSuccessful(altrFractionSaleData.id)).to.be.false;
        await expect(this.altrFractionsSale.buyFractions(altrFractionSaleData.id, 1)).not.to.be.reverted;
        expect(await this.altrFractionsSale.isSaleSuccessful(altrFractionSaleData.id)).to.be.true;
        await expect(this.altrFractionsSale.buyFractions(altrFractionSaleData.id, 100)).not.to.be.reverted;
        await expect(this.altrFractionsSale.buyFractions(altrFractionSaleData.id, 399)).not.to.be.reverted;
        await expect(this.altrFractionsSale.buyFractions(altrFractionSaleData.id, 1)).to.be.revertedWith(
            NFT_FRACTIONS_SALE_ERROR_MSG.SALE_NOT_OPEN
        );
    });

    it("Manages fractions sales with 100 fractions kept e a minimum of 300 fractions saled", async function () {
        const nftTokenCollectionData = await buildScenario1(this, this.signer, this.nftCollectionFactory, this.oracle1);
        const altrFractionSaleData = await buildFractionSaleScenario(this, nftTokenCollectionData, ethers.BigNumber.from(100), 300);

        await expect(this.altrFractionsSale.buyFractions(altrFractionSaleData.id, 500)).to.be.revertedWith(
            NFT_FRACTIONS_SALE_ERROR_MSG.NOT_ENOUGH_FRACTIONS_AVAILABLE
        );
        const usdtToApprove = ethers.utils.parseUnits("5000", 6);
        await mintBigNumberfUsdtTo(this.fUsdt, this.signer.address, usdtToApprove);
        await this.fUsdt.approve(this.altrFractionsSale.address, usdtToApprove);

        await this.altrFractionsSale.buyFractions(altrFractionSaleData.id, 199);
        expect(await this.altrFractionsSale.isSaleSuccessful(altrFractionSaleData.id)).to.be.false;
        await this.altrFractionsSale.buyFractions(altrFractionSaleData.id, 1);
        expect(await this.altrFractionsSale.isSaleSuccessful(altrFractionSaleData.id)).to.be.true;
        await expect(this.altrFractionsSale.buyFractions(altrFractionSaleData.id, 100)).not.to.be.reverted;
        await time.increase(this.saleOpenTimePeriod);
        await expect(this.altrFractionsSale.buyFractions(altrFractionSaleData.id, 1)).to.be.revertedWith(
            NFT_FRACTIONS_SALE_ERROR_MSG.SALE_NOT_OPEN
        );
        await expect(this.altrFractionsSale.connect(this.oracle1).withdrawFractionsKept(altrFractionSaleData.id))
            .to.emit(this.altrFractionsSale, "FractionsKeptWithdrawn")
            .withArgs(altrFractionSaleData.id, this.oracle1.address, 200);
    });

    it("Manages various tier based on price", async function () {
        const nftTokenCollectionData = await buildScenario1(this, this.signer, this.nftCollectionFactory, this.oracle1);
        const nftCollectionContract = await ethers.getContractAt("AltrNftCollection", nftTokenCollectionData.collectionAddress);
        await this.altrFractionsSale.grantRole(SALE_ISSUER_ROLE, this.oracle1.address);
        await nftCollectionContract.connect(this.oracle1).approve(this.altrFractionsSale.address, nftTokenCollectionData.tokenId);
        for (let i = 1; i < tiers.priceLimits.length; i++) {
            let snapshot = await setSnapshot(network);
            const now = Date.now();
            const setupSaleArgs = [
                nftCollectionContract.address,
                nftTokenCollectionData.tokenId,
                this.fUsdt.address,
                now,
                now + this.saleOpenTimePeriod,
                tiers.priceLimits[i].toString(),
                ethers.constants.Zero,
                500,
            ] as const;
            await this.altrFractionsSale.connect(this.oracle1).setupSale(...setupSaleArgs);
            const id = (await this.altrFractionsSale.salesCounter()).sub(1);
            const fractionsAmount = (await this.altrFractionsSale.getFractionsSale(id))[8];
            expect(fractionsAmount).to.equal(tiers.fractionsAmounts[i - 1]);
            await restoreSnapshot(network, snapshot);
        }
    });
}
