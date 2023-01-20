import { expect } from "chai";
import fs from "fs";
import { ethers } from "hardhat";
import path from "path";
import { AltrLicenseManager__factory } from "../../typechain-types";
import { SOLIDITY_ERROR_MSG, SOLIDITY_PANIC_CODES } from "../common";
import { getInterfaceIDFromAbiFile } from "../utilities";

const LICENSE_MANAGER_ERROR_MSG = new SOLIDITY_ERROR_MSG("AltrLicenseManager");

export default function () {
    describe("constructor", function () {
        let LicenseManager: AltrLicenseManager__factory;
        beforeEach(async function () {
            LicenseManager = await ethers.getContractFactory("AltrLicenseManager");
        });
        it("Should revert if staking service is null address", async function () {
            await expect(
                LicenseManager.deploy(ethers.constants.AddressZero, this.servicePid, this.tokensForEligibility)
            ).to.be.revertedWith(LICENSE_MANAGER_ERROR_MSG.CANNOT_BE_NULL_ADDRESS);
        });
        it("Should revert if staking service does not support IStakingService interface", async function () {
            await expect(LicenseManager.deploy(this.owner2.address, this.servicePid, this.tokensForEligibility)).to.be.revertedWith(
                LICENSE_MANAGER_ERROR_MSG.DOES_NOT_SUPPORT_INTERFACE("IStakingService")
            );
        });
        it("Should revert if PID is invalid", async function () {
            await expect(LicenseManager.deploy(this.testFarm.address, 1000, this.tokensForEligibility)).to.be.revertedWithPanic(
                SOLIDITY_PANIC_CODES.INVALID_ARRAY_INDEX
            );
        });
        it("Should set StakingService, pid and tokensForEligibility properly", async function () {
            const licenseManager = await LicenseManager.deploy(this.testFarm.address, this.servicePid, this.tokensForEligibility);
            expect(await licenseManager.stakingService()).to.equal(this.testFarm.address);
            expect(await licenseManager.stakingServicePid()).to.equal(this.servicePid);
            expect(await this.nftLicenseManager.stakedTokensForOracleEligibility()).to.equal(this.tokensForEligibility);
        });
    });
    describe("setDiscount", function () {
        it("Should revert if caller is not the owner", async function () {
            await expect(this.nftLicenseManager.connect(this.owner1).setDiscount(this.owner2.address, 10)).to.be.revertedWith(
                LICENSE_MANAGER_ERROR_MSG.NOT_OWNER_CALLER
            );
        });
        it("Should revert if discount is not in accepted range", async function () {
            await expect(this.nftLicenseManager.setDiscount(this.owner1.address, 0)).to.be.revertedWith(
                LICENSE_MANAGER_ERROR_MSG.INVALID_DISCOUNT
            );
            await expect(this.nftLicenseManager.setDiscount(this.owner1.address, 10000)).to.be.revertedWith(
                LICENSE_MANAGER_ERROR_MSG.INVALID_DISCOUNT
            );
        });
        it("Should set discount properly for user", async function () {
            await this.nftLicenseManager.setDiscount(this.owner1.address, 100);
            expect(await this.nftLicenseManager.conventions(this.owner1.address)).to.equal(100);
        });
        it("Should emit an event", async function () {
            await expect(await this.nftLicenseManager.setDiscount(this.owner1.address, 100))
                .to.emit(this.nftLicenseManager, "DiscountSet")
                .withArgs(this.owner1.address, 100);
        });
    });
    describe("setStakingService", function () {
        it("Should revert if caller is not the owner", async function () {
            await expect(
                this.nftLicenseManager.connect(this.owner1).setStakingService(this.testFarm.address, this.servicePid)
            ).to.be.revertedWith(LICENSE_MANAGER_ERROR_MSG.NOT_OWNER_CALLER);
        });
        it("Should revert if staking service is null address", async function () {
            await expect(this.nftLicenseManager.setStakingService(ethers.constants.AddressZero, this.servicePid)).to.be.revertedWith(
                LICENSE_MANAGER_ERROR_MSG.CANNOT_BE_NULL_ADDRESS
            );
        });
        it("Should revert if staking service does not support IStakingService interface", async function () {
            await expect(this.nftLicenseManager.setStakingService(this.owner2.address, this.servicePid)).to.be.revertedWith(
                LICENSE_MANAGER_ERROR_MSG.DOES_NOT_SUPPORT_INTERFACE("IStakingService")
            );
        });
        it("Should revert if PID is invalid", async function () {
            await expect(this.nftLicenseManager.setStakingService(this.testFarm.address, 100)).to.be.revertedWithPanic(
                SOLIDITY_PANIC_CODES.INVALID_ARRAY_INDEX
            );
        });
        it("Should set new staking service", async function () {
            const TestFarm = await ethers.getContractFactory("TestFarm");
            const newTestFarm = await TestFarm.deploy(this.fUsdt.address, this.stakedTokens);
            await this.nftLicenseManager.setStakingService(newTestFarm.address, 0);
            expect(await this.nftLicenseManager.stakingService()).to.equal(newTestFarm.address);
            expect(await this.nftLicenseManager.stakingServicePid()).to.equal(0);
        });
        it("Should emit an event", async function () {
            const TestFarm = await ethers.getContractFactory("TestFarm");
            const newTestFarm = await TestFarm.deploy(this.fUsdt.address, this.stakedTokens);
            await expect(await this.nftLicenseManager.setStakingService(newTestFarm.address, 0))
                .to.emit(this.nftLicenseManager, "StakingServiceSet")
                .withArgs(newTestFarm.address, 0);
        });
    });
    describe("setStakedTokensForOracleEligibility", function () {
        it("Should revert if caller is not the owner", async function () {
            await expect(this.nftLicenseManager.connect(this.owner1).setStakedTokensForOracleEligibility(1000)).to.be.revertedWith(
                LICENSE_MANAGER_ERROR_MSG.NOT_OWNER_CALLER
            );
        });
        it("Should set tokensForEligibility properly", async function () {
            await this.nftLicenseManager.setStakedTokensForOracleEligibility(1000);
            expect(await this.nftLicenseManager.stakedTokensForOracleEligibility()).to.equal(1000);
        });
        it("Should emit en event", async function () {
            await expect(await this.nftLicenseManager.setStakedTokensForOracleEligibility(1000))
                .to.emit(this.nftLicenseManager, "StakedTokensForOracleEligibilitySet")
                .withArgs(1000);
        });
    });
    describe("getDiscount", function () {
        it("Should be initialized to 0 for every user", async function () {
            expect(await this.nftLicenseManager.getDiscount(this.owner1.address)).to.equal(0);
            expect(await this.nftLicenseManager.getDiscount(this.owner2.address)).to.equal(0);
            expect(await this.nftLicenseManager.getDiscount(this.oracle1.address)).to.equal(0);
            expect(await this.nftLicenseManager.getDiscount(this.signer.address)).to.equal(0);
        });
        it("Should get the correct discount for user", async function () {
            await this.nftLicenseManager.setDiscount(this.owner1.address, 100);
            expect(await this.nftLicenseManager.getDiscount(this.owner1.address)).to.equal(100);
        });
    });
    describe("isAQualifiedOracle", function () {
        it("Should return true if the address has more staked token than required", async function () {
            expect(await this.nftLicenseManager.isAQualifiedOracle(this.oracle1.address)).to.be.true;
        });
        it("Should return false if the address has not enougth staked token", async function () {
            await this.nftLicenseManager.setStakedTokensForOracleEligibility(1000000);
            expect(await this.nftLicenseManager.isAQualifiedOracle(this.owner1.address)).to.be.false;
        });
    });
    describe("supportsInterface", function () {
        it("Should return true", async function () {
            const dir = path.resolve(__dirname, "../../", "artifacts/contracts/interfaces/ILicenseManager.sol/ILicenseManager.json");
            const file = fs.readFileSync(dir, "utf8");
            const interfaceId = getInterfaceIDFromAbiFile(file);
            expect(await this.nftLicenseManager.supportsInterface(interfaceId._hex)).to.be.true;
        });
        it("Should return false", async function () {
            const dir = path.resolve(__dirname, "../../", "artifacts/contracts/interfaces/IFeeManager.sol/IFeeManager.json");
            const file = fs.readFileSync(dir, "utf8");
            const interfaceId = getInterfaceIDFromAbiFile(file);
            expect(await this.nftLicenseManager.supportsInterface(interfaceId._hex)).to.be.false;
        });
    });
}
