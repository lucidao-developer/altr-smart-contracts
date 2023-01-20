import { time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { buildSuccessfulFractionsSaleScenario, SOLIDITY_ERROR_MSG } from "../common";

const TIMED_TOKEN_SPLITTER_ERROR_MSG = new SOLIDITY_ERROR_MSG("TimedTokenSplitter");

export default function () {
    describe("constructor", function () {
        it("Should set variable properly", async function () {
            expect(await this.timedTokenSplitter.saleContract()).to.equal(this.altrFractionsSale.address);
            expect(await this.timedTokenSplitter.saleId()).to.equal(this.altrFractionSaleData.id);
            expect(await this.timedTokenSplitter.governanceTreasury()).to.equal(this.governanceTreasury.address);
            expect(await this.timedTokenSplitter.protocolFee()).to.equal(await this.nftFeeManager.saleFee());
        });
    });
    describe("releaseSeller", function () {
        it("Should revert if sale is open", async function () {
            await expect(this.timedTokenSplitter.releaseSeller()).to.be.revertedWith(TIMED_TOKEN_SPLITTER_ERROR_MSG.SALE_NOT_FINISHED);
        });
        it("Should revert if sale is not successful", async function () {
            await time.increase(this.saleOpenTimePeriod + 100);
            await expect(this.timedTokenSplitter.releaseSeller()).to.be.revertedWith(TIMED_TOKEN_SPLITTER_ERROR_MSG.SALE_UNSUCCESSFUL);
        });
        it("Should send protocol fee to governance treasury", async function () {
            await buildSuccessfulFractionsSaleScenario(this, this.altrFractionSaleData);
            const contractBalance = await this.fUsdt.balanceOf(this.timedTokenSplitter.address);
            const protocolFee = await this.nftFeeManager.saleFee();
            const fee = contractBalance.mul(protocolFee).div(10000);
            await expect(this.timedTokenSplitter.connect(this.oracle1).releaseSeller()).to.changeTokenBalances(
                this.fUsdt,
                [this.timedTokenSplitter.address, this.governanceTreasury.address],
                [-contractBalance, fee]
            );
        });
        it("Should send the rest to sale issuer", async function () {
            await buildSuccessfulFractionsSaleScenario(this, this.altrFractionSaleData);
            const contractBalance = await this.fUsdt.balanceOf(this.timedTokenSplitter.address);
            const protocolFee = await this.nftFeeManager.saleFee();
            const fee = contractBalance.mul(protocolFee).div(10000);
            const rest = contractBalance.sub(fee);
            await expect(this.timedTokenSplitter.connect(this.oracle1).releaseSeller()).to.changeTokenBalances(
                this.fUsdt,
                [this.timedTokenSplitter.address, this.oracle1.address],
                [-contractBalance, rest]
            );
        });
        it("Should emit an event", async function () {
            await buildSuccessfulFractionsSaleScenario(this, this.altrFractionSaleData);
            const contractBalance = await this.fUsdt.balanceOf(this.timedTokenSplitter.address);
            const protocolFee = await this.nftFeeManager.saleFee();
            const fee = contractBalance.mul(protocolFee).div(10000);
            const rest = contractBalance.sub(fee);
            await expect(this.timedTokenSplitter.connect(this.oracle1).releaseSeller())
                .to.emit(this.timedTokenSplitter, "TokensSellerReleased")
                .withArgs(this.oracle1.address, this.altrFractionsSale.address, this.altrFractionSaleData.id, rest);
        });
    });
    describe("release", async function () {
        it("Should revert if sale not closed yet", async function () {
            await expect(this.timedTokenSplitter.release([this.oracle1.address])).to.be.revertedWith(
                TIMED_TOKEN_SPLITTER_ERROR_MSG.SALE_NOT_FINISHED
            );
        });
        it("Should revert if sale is not failed", async function () {
            await buildSuccessfulFractionsSaleScenario(this, this.altrFractionSaleData);
            await expect(this.timedTokenSplitter.release([this.oracle1.address])).to.be.revertedWith(
                TIMED_TOKEN_SPLITTER_ERROR_MSG.SALE_DID_NOT_FAIL
            );
        });
        it("Should not revert", async function () {
            await time.increase(this.saleOpenTimePeriod + 1);
            await expect(this.timedTokenSplitter.release([this.oracle1.address])).not.to.be.reverted;
        });
    });
}
