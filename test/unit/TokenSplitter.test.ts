import { expect } from "chai";

export default function () {
    describe("constructor", function () {
        it("Should set variable properly", async function () {
            expect(await this.tokenSplitter.redemptionToken()).to.equal(this.buyoutData.buyout.buyout[3]);
            expect(await this.tokenSplitter.token()).to.equal(this.altrFractions.address);
            expect(await this.tokenSplitter.tokenId()).to.equal(this.buyoutData.buyout.id);
            expect(await this.tokenSplitter.tokenPrice()).to.equal(this.buyoutData.buyout.buyout[4]);
        });
    });
    describe("release", function () {
        it("Should burn token", async function () {
            const balance = await this.altrFractions.balanceOf(this.owner2.address, this.buyoutData.buyout.id);
            await expect(this.tokenSplitter.release([this.owner2.address]))
                .to.emit(this.altrFractions, "OperatorBurn")
                .withArgs(this.tokenSplitter.address, this.owner2.address, this.buyoutData.buyout.id, balance);
            expect(await this.altrFractions.balanceOf(this.owner2.address, this.buyoutData.buyout.id)).to.equal(0);
        });
        it("Should transfer erc20 to fractions owner", async function () {
            const fractionsBalance = await this.altrFractions.balanceOf(this.owner2.address, this.buyoutData.buyout.id);
            const fractionsPrice = this.buyoutData.buyout.buyout[4];
            const price = fractionsBalance.mul(fractionsPrice);
            await expect(this.tokenSplitter.release([this.owner2.address])).to.changeTokenBalances(
                this.fUsdt,
                [this.owner2.address, this.tokenSplitter.address],
                [price, -price]
            );
        });
        it("Should pay zero if user has no fraction", async function () {
            await expect(this.tokenSplitter.release([this.owner1.address])).to.changeTokenBalances(
                this.fUsdt,
                [this.owner1.address, this.tokenSplitter.address],
                [0, 0]
            );
        });
        it("Should emit an event", async function () {
            const fractionsBalance = await this.altrFractions.balanceOf(this.oracle1.address, this.buyoutData.buyout.id);
            const price = this.buyoutData.buyout.buyout[4];
            await expect(this.tokenSplitter.release([this.oracle1.address]))
                .to.emit(this.tokenSplitter, "TokensReleased")
                .withArgs(
                    [this.oracle1.address],
                    this.fUsdt.address,
                    this.altrFractions.address,
                    this.buyoutData.buyout.id,
                    [fractionsBalance],
                    price
                );
        });
        it("Should relese more than one user at time", async function () {
            const oracleBalance = await this.altrFractions.balanceOf(this.oracle1.address, this.buyoutData.buyout.id);
            const owner2Balance = await this.altrFractions.balanceOf(this.owner2.address, this.buyoutData.buyout.id);
            const buyoutPrice = this.buyoutData.buyout.buyout[4];
            await expect(this.tokenSplitter.release([this.oracle1.address, this.owner2.address]))
                .to.emit(this.tokenSplitter, "TokensReleased")
                .withArgs(
                    [this.oracle1.address, this.owner2.address],
                    this.fUsdt.address,
                    this.altrFractions.address,
                    this.buyoutData.buyout.id,
                    [oracleBalance, owner2Balance],
                    buyoutPrice
                );
        });
    });
}
