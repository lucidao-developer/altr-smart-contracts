import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import fs from "fs";
import path from "path";
import { ethers, upgrades } from "hardhat";
import { getInterfaceIDFromAbiFile, mintfUsdtTo } from "../utilities";
import { AltrFeeManager__factory } from "../../typechain-types";
import { SOLIDITY_ERROR_MSG } from "../common";
import { buyoutFee, saleFee, zeroExAddress } from "../../config/config";
import { ADMIN_ROLE } from "../../config/roles";

const FEE_MANAGER_ERROR_MSG = new SOLIDITY_ERROR_MSG("AltrFeeManager");

export default function () {
    describe("constructor", function () {
        let FeeManager: AltrFeeManager__factory;
        beforeEach(async function () {
            FeeManager = await ethers.getContractFactory("AltrFeeManager");
        });
        it("Should revert if governance treasury is null address", async function () {
            const contractArgs = [
                ethers.constants.AddressZero,
                this.nftLicenseManager.address,
                this.newRedemptionFee,
                buyoutFee,
                saleFee,
                zeroExAddress,
            ];
            await expect(upgrades.deployProxy(FeeManager, contractArgs, { initializer: "initialize" })).to.be.revertedWith(
                FEE_MANAGER_ERROR_MSG.CANNOT_BE_NULL_ADDRESS
            );
        });
        it("Should revert if license manager is null address", async function () {
            const contractArgs = [
                this.governanceTreasury.address,
                ethers.constants.AddressZero,
                this.newRedemptionFee,
                buyoutFee,
                saleFee,
                zeroExAddress,
            ];
            await expect(upgrades.deployProxy(FeeManager, contractArgs, { initializer: "initialize" })).to.be.revertedWith(
                FEE_MANAGER_ERROR_MSG.CANNOT_BE_NULL_ADDRESS
            );
        });
        it("Should revert if license manager does not support ILicenseManager interface", async function () {
            const contractArgs = [
                this.governanceTreasury.address,
                this.owner1.address,
                this.newRedemptionFee,
                buyoutFee,
                saleFee,
                zeroExAddress,
            ];
            await expect(upgrades.deployProxy(FeeManager, contractArgs, { initializer: "initialize" })).to.be.revertedWith(
                FEE_MANAGER_ERROR_MSG.DOES_NOT_SUPPORT_INTERFACE("ILicenseManager")
            );
        });
        it("Should revert if buyoutFee exceeds boundaries", async function () {
            let contractArgs = [
                this.governanceTreasury.address,
                this.nftLicenseManager.address,
                this.newRedemptionFee,
                10,
                saleFee,
                zeroExAddress,
            ];
            await expect(upgrades.deployProxy(FeeManager, contractArgs, { initializer: "initialize" })).to.be.revertedWith(
                FEE_MANAGER_ERROR_MSG.FEE_EXCEEDS_BOUNDARIES
            );
            contractArgs = [
                this.governanceTreasury.address,
                this.nftLicenseManager.address,
                this.newRedemptionFee,
                100000,
                saleFee,
                zeroExAddress,
            ];
            await expect(upgrades.deployProxy(FeeManager, contractArgs, { initializer: "initialize" })).to.be.revertedWith(
                FEE_MANAGER_ERROR_MSG.FEE_EXCEEDS_BOUNDARIES
            );
        });
        it("Should revert if saleFee exceeds boundaries", async function () {
            let contractArgs = [
                this.governanceTreasury.address,
                this.nftLicenseManager.address,
                this.newRedemptionFee,
                buyoutFee,
                10,
                zeroExAddress,
            ];
            await expect(upgrades.deployProxy(FeeManager, contractArgs, { initializer: "initialize" })).to.be.revertedWith(
                FEE_MANAGER_ERROR_MSG.FEE_EXCEEDS_BOUNDARIES
            );
            contractArgs = [
                this.governanceTreasury.address,
                this.nftLicenseManager.address,
                this.newRedemptionFee,
                buyoutFee,
                1001,
                zeroExAddress,
            ];
            await expect(upgrades.deployProxy(FeeManager, contractArgs, { initializer: "initialize" })).to.be.revertedWith(
                FEE_MANAGER_ERROR_MSG.FEE_EXCEEDS_BOUNDARIES
            );
        });
        it("Should revert if redemption fee exceeds max", async function () {
            let contractArgs = [this.governanceTreasury.address, this.nftLicenseManager.address, 1001, buyoutFee, saleFee, zeroExAddress];
            await expect(upgrades.deployProxy(FeeManager, contractArgs, { initializer: "initialize" })).to.be.revertedWith(
                FEE_MANAGER_ERROR_MSG.REDEMPTION_FEE_TOO_HIGH
            );
        });
        it("Should set everything properly", async function () {
            const contractArgs = [
                this.governanceTreasury.address,
                this.nftLicenseManager.address,
                this.newRedemptionFee,
                buyoutFee,
                saleFee,
                zeroExAddress,
            ];
            const feeManager = await upgrades.deployProxy(FeeManager, contractArgs, { initializer: "initialize" });
            expect(await feeManager.redemptionFee()).to.equal(this.newRedemptionFee);
            expect(await feeManager.governanceTreasury()).to.equal(this.governanceTreasury.address);
            expect(await feeManager.licenseManager()).to.equal(this.nftLicenseManager.address);
            expect(await feeManager.buyoutFee()).to.equal(buyoutFee);
            expect(await feeManager.saleFee()).to.equal(saleFee);
        });
    });
    describe("initialize", function () {
        it("Should revert because already initialized", async function () {
            await expect(
                this.nftFeeManager.initialize(
                    this.governanceTreasury.address,
                    this.nftLicenseManager.address,
                    this.newRedemptionFee,
                    buyoutFee,
                    saleFee,
                    zeroExAddress
                )
            ).to.be.revertedWith(FEE_MANAGER_ERROR_MSG.ALREADY_INITIALIZED);
        });
    });
    describe("receiveZeroExFeeCallback", function () {
        it("Should emit an event", async function () {
            expect(await this.nftFeeManager.receiveZeroExFeeCallback(this.fUsdt.address, 0, []))
                .to.emit(this.nftFeeManager, "FeeReceived")
                .withArgs(this.fUsdt.address, 0, []);
        });
    });
    describe("setGovernanceTreasury", function () {
        it("Should revert if is null address", async function () {
            await expect(this.nftFeeManager.setGovernanceTreasury(ethers.constants.AddressZero)).to.be.revertedWith(
                FEE_MANAGER_ERROR_MSG.CANNOT_BE_NULL_ADDRESS
            );
        });
        it("Should chenge the governance treasury address", async function () {
            const NewTreasury = await ethers.getContractFactory("LucidaoGovernanceNftReserve");
            const newTreasury = await NewTreasury.deploy();
            await this.nftFeeManager.setGovernanceTreasury(newTreasury.address);
            expect(await this.nftFeeManager.governanceTreasury()).to.equal(newTreasury.address);
        });
        it("Should emit an event", async function () {
            const NewTreasury = await ethers.getContractFactory("LucidaoGovernanceNftReserve");
            const newTreasury = await NewTreasury.deploy();
            expect(await this.nftFeeManager.setGovernanceTreasury(newTreasury.address))
                .to.emit(this.nftFeeManager, "GovernanceTreasuryChanged")
                .withArgs(newTreasury.address);
        });
    });
    describe("setLicenseManager", function () {
        it("Should revert if is null address", async function () {
            await expect(this.nftFeeManager.setLicenseManager(ethers.constants.AddressZero)).to.be.revertedWith(
                FEE_MANAGER_ERROR_MSG.CANNOT_BE_NULL_ADDRESS
            );
        });
        it("Should revert if new contract does not support ILicenseManager interface", async function () {
            await expect(this.nftFeeManager.setLicenseManager(this.owner1.address)).to.be.rejectedWith(
                FEE_MANAGER_ERROR_MSG.DOES_NOT_SUPPORT_INTERFACE("ILicenseManager")
            );
        });
        it("Should change the license manager address", async function () {
            const NewLicenseManager = await ethers.getContractFactory("AltrLicenseManager");
            const newLicenseManager = await NewLicenseManager.deploy(this.testFarm.address, this.servicePid, this.tokensForEligibility);
            await this.nftFeeManager.setLicenseManager(newLicenseManager.address);
            expect(await this.nftFeeManager.licenseManager()).to.equal(newLicenseManager.address);
        });
        it("Should emit an event", async function () {
            const NewLicenseManager = await ethers.getContractFactory("AltrLicenseManager");
            const newLicenseManager = await NewLicenseManager.deploy(this.testFarm.address, this.servicePid, this.tokensForEligibility);
            expect(await this.nftFeeManager.setLicenseManager(newLicenseManager.address))
                .to.emit(this.nftFeeManager, "LicenseManagerChanged")
                .withArgs(newLicenseManager.address);
        });
    });
    describe("setRedemptionFee", function () {
        it("Should revert if new redemption fee is higher than max", async function () {
            await expect(this.nftFeeManager.setRedemptionFee(ethers.utils.parseEther("1.1"))).to.be.revertedWith(
                FEE_MANAGER_ERROR_MSG.REDEMPTION_FEE_TOO_HIGH
            );
        });
        it("Should set new redempiton fee", async function () {
            await this.nftFeeManager.setRedemptionFee(50);
            expect(await this.nftFeeManager.redemptionFee()).to.equal(50);
        });
        it("Should emit an event", async function () {
            expect(await this.nftFeeManager.setRedemptionFee(50))
                .to.emit(this.nftFeeManager, "RedemptionFeeSet")
                .withArgs(50);
        });
    });
    describe("payRedemptionFee", function () {
        it("Should revert if allowance is lower than fee", async function () {
            await expect(this.nftFeeManager.payRedemptionFee(this.nftCollection.address, 1)).to.be.revertedWith(
                FEE_MANAGER_ERROR_MSG.REQUEST_EXCEEDS_ALLOWANCE
            );
        });
        it("Should pay redemption fee", async function () {
            const fee = ethers.utils
                .parseUnits("5000", 6)
                .mul(await this.nftFeeManager.redemptionFee())
                .div(10000);
            await mintfUsdtTo(this.fUsdt, this.signer.address, "5000");
            await this.fUsdt.approve(this.nftFeeManager.address, fee);
            await expect(this.nftFeeManager.payRedemptionFee(this.nftCollection.address, 1)).to.changeTokenBalances(
                this.fUsdt,
                [this.signer.address, this.governanceTreasury.address],
                [-fee, fee]
            );
            expect(await this.nftFeeManager.isRedemptionFeePaid(this.nftCollection.address, 1)).to.be.true;
        });
        it("Should emit an event", async function () {
            const fee = ethers.utils
                .parseUnits("5000", 6)
                .mul(await this.nftFeeManager.redemptionFee())
                .div(10000);
            await mintfUsdtTo(this.fUsdt, this.signer.address, "5000");
            await this.fUsdt.approve(this.nftFeeManager.address, fee);
            await expect(this.nftFeeManager.payRedemptionFee(this.nftCollection.address, 1))
                .to.emit(this.nftFeeManager, "FeeReceived")
                .withArgs(this.fUsdt.address, fee, anyValue)
                .and.to.emit(this.nftFeeManager, "RedemptionFeePaid")
                .withArgs(this.nftCollection.address, 1, this.signer.address, fee);
        });
    });
    describe("setBuyoutFee", function () {
        it("Should revert if caller is not the owner", async function () {
            await expect(this.nftFeeManager.connect(this.owner2).setBuyoutFee(100)).to.be.revertedWith(
                FEE_MANAGER_ERROR_MSG.MISSING_ROLE(this.owner2.address, ADMIN_ROLE)
            );
        });
        it("Should revert if new fee exceeds boundaries", async function () {
            await expect(this.nftFeeManager.setBuyoutFee(49)).to.be.revertedWith(FEE_MANAGER_ERROR_MSG.FEE_EXCEEDS_BOUNDARIES);
            await expect(this.nftFeeManager.setBuyoutFee(1001)).to.be.revertedWith(FEE_MANAGER_ERROR_MSG.FEE_EXCEEDS_BOUNDARIES);
        });
        it("Should set new buyoutFee properly", async function () {
            await this.nftFeeManager.setBuyoutFee(100);
            expect(await this.nftFeeManager.buyoutFee()).to.equal(100);
        });
        it("Should emit an event", async function () {
            await expect(this.nftFeeManager.setBuyoutFee(100)).to.emit(this.nftFeeManager, "BuyoutFeeSet").withArgs(100);
        });
    });
    describe("setSaleFee", function () {
        it("Should revert if caller is not the owner", async function () {
            await expect(this.nftFeeManager.connect(this.owner2).setSaleFee(100)).to.be.revertedWith(
                FEE_MANAGER_ERROR_MSG.MISSING_ROLE(this.owner2.address, ADMIN_ROLE)
            );
        });
        it("Should revert if new fee exceeds boundaries", async function () {
            await expect(this.nftFeeManager.setSaleFee(49)).to.be.revertedWith(FEE_MANAGER_ERROR_MSG.FEE_EXCEEDS_BOUNDARIES);
            await expect(this.nftFeeManager.setSaleFee(1001)).to.be.revertedWith(FEE_MANAGER_ERROR_MSG.FEE_EXCEEDS_BOUNDARIES);
        });
        it("Should set new saleFee properly", async function () {
            await this.nftFeeManager.setSaleFee(100);
            expect(await this.nftFeeManager.saleFee()).to.equal(100);
        });
        it("Should emit an event", async function () {
            await expect(this.nftFeeManager.setSaleFee(100)).to.emit(this.nftFeeManager, "SaleFeeSet").withArgs(100);
        });
    });
    describe("isRedemptionFeePaid", function () {
        it("Should return false", async function () {
            expect(await this.nftFeeManager.isRedemptionFeePaid(this.nftCollection.address, 0)).to.be.false;
        });
        it("Should return true", async function () {
            const fee = ethers.utils
                .parseUnits("5000", 6)
                .mul(await this.nftFeeManager.redemptionFee())
                .div(1000);
            await mintfUsdtTo(this.fUsdt, this.signer.address, "5000");
            await this.fUsdt.approve(this.nftFeeManager.address, fee);
            await this.nftFeeManager.payRedemptionFee(this.nftCollection.address, 1);
            expect(await this.nftFeeManager.isRedemptionFeePaid(this.nftCollection.address, 1)).to.be.true;
        });
    });
    describe("supportsInterface", function () {
        it("Should return true", async function () {
            const dir = path.resolve(__dirname, "../../", "artifacts/contracts/interfaces/IFeeManager.sol/IFeeManager.json");
            const file = fs.readFileSync(dir, "utf8");
            const interfaceId = getInterfaceIDFromAbiFile(file);
            expect(await this.nftFeeManager.supportsInterface(interfaceId._hex)).to.be.true;
        });
        it("Should return false", async function () {
            const dir = path.resolve(__dirname, "../../", "artifacts/contracts/interfaces/IStakingService.sol/IStakingService.json");
            const file = fs.readFileSync(dir, "utf8");
            const interfaceId = getInterfaceIDFromAbiFile(file);
            expect(await this.nftFeeManager.supportsInterface(interfaceId._hex)).to.be.false;
        });
    });
}
