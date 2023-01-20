import { expect } from "chai";
import { ethers } from "hardhat";
import { buyoutFee, saleFee } from "../../config/config";
import { ADMIN_ROLE } from "../../config/roles";
import {
    getOrDeployAllowList,
    getOrDeployFarm,
    getOrDeployFeeManager,
    getOrDeployFractions,
    getOrDeployFractionsBuyout,
    getOrDeployFractionsSale,
    getOrDeployfUsdt,
    getOrDeployLicenseManager,
    getOrDeployLucidaoGovernanceReserve,
} from "../../scripts/deployFunctions";
import { AltrFractionsSale } from "../../typechain-types";
import { buildScenario2, SOLIDITY_ERROR_MSG } from "../common";

const FRACTIONS_SALE_ERROR_MSG = new SOLIDITY_ERROR_MSG("AltrFractionsSale");
const FRACTIONS_BUYOUT_ERROR_MSG = new SOLIDITY_ERROR_MSG("AltrFractionsBuyout");

export default function () {
    describe("setBuyoutParams", function () {
        it("Should revert if caller has not default admin role", async function () {
            const scenarioData = await buildScenario2(this);
            await expect(this.altrFractionsBuyout.connect(this.owner1).setBuyoutParams(scenarioData.fractionSale.id, 0)).to.be.revertedWith(
                FRACTIONS_BUYOUT_ERROR_MSG.MISSING_ROLE(this.owner1.address, ADMIN_ROLE)
            );
        });
        it("Should revert if buyout id is incorrect", async function () {
            const scenarioData = await buildScenario2(this);
            await expect(this.altrFractionsBuyout.setBuyoutParams(2, 0)).to.be.revertedWith(FRACTIONS_BUYOUT_ERROR_MSG.INVALID_BUYOUT_ID);
        });
        it("Should set new params", async function () {
            const scenarioData = await buildScenario2(this);
            await expect(this.altrFractionsBuyout.setBuyoutParams(scenarioData.fractionSale.id, 0)).not.to.be.reverted;
            const buyout = await this.altrFractionsBuyout.buyouts(scenarioData.buyout.id);
            expect(buyout.buyoutPrice).to.equal(0);
        });
        it("Should emit an event", async function () {
            const scenarioData = await buildScenario2(this);
            await expect(this.altrFractionsBuyout.setBuyoutParams(scenarioData.fractionSale.id, 0))
                .to.emit(this.altrFractionsBuyout, "BuyoutParamsSet")
                .withArgs(scenarioData.fractionSale.id, await this.altrFractionsBuyout.buyouts(scenarioData.buyout.id));
        });
    });
    describe("setBuyoutMinFractions", function () {
        it("Should revert if caller has not default admin role", async function () {
            await expect(this.altrFractionsBuyout.connect(this.owner1).setBuyoutMinFractions(0)).to.be.revertedWith(
                FRACTIONS_BUYOUT_ERROR_MSG.MISSING_ROLE(this.owner1.address, ADMIN_ROLE)
            );
        });
        it("Should revert if new min buyout exceeds boundaries", async function () {
            await expect(this.altrFractionsBuyout.setBuyoutMinFractions(0)).to.be.revertedWith(
                FRACTIONS_BUYOUT_ERROR_MSG.MIN_BUYOUT_EXCEEDS_BOUDARIES
            );
            await expect(this.altrFractionsBuyout.setBuyoutMinFractions(10000)).to.be.revertedWith(
                FRACTIONS_BUYOUT_ERROR_MSG.MIN_BUYOUT_EXCEEDS_BOUDARIES
            );
        });
        it("Should set new min buyout", async function () {
            const newMinBuyout = 4000;
            await expect(this.altrFractionsBuyout.setBuyoutMinFractions(newMinBuyout)).not.to.be.reverted;
            expect(await this.altrFractionsBuyout.buyoutMinFractions()).to.equal(newMinBuyout);
        });
        it("Should emit an event", async function () {
            const newMinBuyout = 4000;
            await expect(this.altrFractionsBuyout.setBuyoutMinFractions(newMinBuyout))
                .to.emit(this.altrFractionsBuyout, "BuyoutMinFractionsSet")
                .withArgs(newMinBuyout);
        });
    });
    describe("setAllowList", function () {
        it("Should revert if caller has not default admin role", async function () {
            await expect(this.altrFractionsSale.connect(this.owner1).setAllowList(ethers.constants.AddressZero)).to.be.revertedWith(
                FRACTIONS_SALE_ERROR_MSG.MISSING_ROLE(this.owner1.address, ADMIN_ROLE)
            );
        });
        it("Should revert if new allow list is null address", async function () {
            await expect(this.altrFractionsSale.setAllowList(ethers.constants.AddressZero)).to.be.revertedWith(
                FRACTIONS_SALE_ERROR_MSG.CANNOT_BE_NULL_ADDRESS
            );
        });
        it("Should set new allow list", async function () {
            const NewAllowList = await ethers.getContractFactory("AltrAllowList");
            const newAllowList = await NewAllowList.deploy();
            await expect(this.altrFractionsSale.setAllowList(newAllowList.address)).not.to.be.reverted;
            expect(await this.altrFractionsSale.allowList()).to.equal(newAllowList.address);
        });
        it("Should emit an event", async function () {
            const NewAllowList = await ethers.getContractFactory("AltrAllowList");
            const newAllowList = await NewAllowList.deploy();
            await expect(this.altrFractionsSale.setAllowList(newAllowList.address))
                .to.emit(this.altrFractionsSale, "AllowListSet")
                .withArgs(newAllowList.address);
        });
    });
    describe("setBuyoutOpenTimePeriod", function () {
        it("Should revert if caller has not default admin role", async function () {
            await expect(this.altrFractionsBuyout.connect(this.owner1).setBuyoutOpenTimePeriod(0)).to.be.revertedWith(
                FRACTIONS_BUYOUT_ERROR_MSG.MISSING_ROLE(this.owner1.address, ADMIN_ROLE)
            );
        });
        it("Should revert if new buyout open time period is equal 0", async function () {
            await expect(this.altrFractionsBuyout.setBuyoutOpenTimePeriod(0)).to.be.revertedWith(
                FRACTIONS_BUYOUT_ERROR_MSG.OPEN_TIME_PERIOD_CANNOT_BE_ZERO
            );
        });
        it("Should revert if new buyout open time period is less than minimum", async function () {
            const newOpenTimePeriod = 1000;
            await expect(this.altrFractionsBuyout.setBuyoutOpenTimePeriod(newOpenTimePeriod)).to.be.revertedWith(
                FRACTIONS_BUYOUT_ERROR_MSG.OPEN_TIME_PERIOD_CANNOT_BE_ZERO
            );
        });
        it("Should set new contract buyout properly", async function () {
            const newOpenTimePeriod = 86500;
            await expect(this.altrFractionsBuyout.setBuyoutOpenTimePeriod(newOpenTimePeriod)).not.to.be.reverted;
            expect(await this.altrFractionsBuyout.buyoutOpenTimePeriod()).to.equal(newOpenTimePeriod);
        });
        it("Should emit an event", async function () {
            const newOpenTimePeriod = 86500;
            await expect(this.altrFractionsBuyout.setBuyoutOpenTimePeriod(newOpenTimePeriod))
                .to.emit(this.altrFractionsBuyout, "BuyoutOpenTimePeriodSet")
                .withArgs(newOpenTimePeriod);
        });
    });
    describe("setFractionsBuyout", async function () {
        let altrFractionsSale: AltrFractionsSale;
        const accounts = await ethers.getSigners();
        const signer = accounts[0];
        beforeEach(async () => {
            const altrFractions = await getOrDeployFractions();
            const allowList = await getOrDeployAllowList();
            const governanceTreasury = await getOrDeployLucidaoGovernanceReserve(signer.address);
            const fusdt = await getOrDeployfUsdt(signer);
            const stackingService = await getOrDeployFarm(fusdt, 0);
            const licenseManager = await getOrDeployLicenseManager(stackingService, 0, 0);
            const feeManager = await getOrDeployFeeManager(governanceTreasury, licenseManager, 1, buyoutFee, saleFee);
            altrFractionsSale = await getOrDeployFractionsSale(altrFractions, allowList, feeManager);
        });
        it("Should revert if caller has not default admin role", async function () {
            await expect(altrFractionsSale.connect(this.owner1).setFractionsBuyout(ethers.constants.AddressZero)).to.be.revertedWith(
                FRACTIONS_SALE_ERROR_MSG.MISSING_ROLE(this.owner1.address, ADMIN_ROLE)
            );
        });
        it("Should revert if new contract buyout is null", async function () {
            await expect(altrFractionsSale.setFractionsBuyout(ethers.constants.AddressZero)).to.be.revertedWith(
                FRACTIONS_SALE_ERROR_MSG.CANNOT_BE_NULL_ADDRESS
            );
        });
        it("Should revert if contract buyout is already initalized", async function () {
            const altrFractionsBuyout = await getOrDeployFractionsBuyout(
                this.signer,
                this.altrFractions,
                this.altrFractionsSale,
                this.nftFeeManager
            );
            await expect(altrFractionsSale.setFractionsBuyout(altrFractionsBuyout.address)).to.be.revertedWith(
                FRACTIONS_BUYOUT_ERROR_MSG.ALREADY_INITIALIZED
            );
        });
        it("Should set new contract buyout properly", async function () {
            const altrFractionsBuyout = await getOrDeployFractionsBuyout(
                this.signer,
                this.altrFractions,
                this.altrFractionsSale,
                this.nftFeeManager
            );
            expect(await altrFractionsSale.altrFractionsBuyout()).to.equal(altrFractionsBuyout.address);
        });
    });
}
