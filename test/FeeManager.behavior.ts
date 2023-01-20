import { expect } from "chai";
import { config as hardhatConfig, ethers, upgrades } from "hardhat";
import { HardhatNetworkHDAccountsConfig } from "hardhat/types";
import { FEE_TOKEN } from "../config/config";
import { ADMIN_ROLE } from "../config/roles";
import { AltrFeeManagerV2 } from "../typechain-types";
import { SOLIDITY_ERROR_MSG, testDiscount } from "./common";

const FEE_MANAGER_ERROR_MSG = new SOLIDITY_ERROR_MSG("AltrFeeManager");

export function feeManagerBehavior(): void {
    it("Check fee with discount 12%", async function () {
        const test = {
            feeManagerAmount: ethers.utils.parseUnits("100", 6),
            expectedRebateAmount: ethers.utils.parseUnits("12", 6),
            discount: 1200, //12%
        };
        await testDiscount(this, test.feeManagerAmount, test.expectedRebateAmount, test.discount);
    });

    it("Check fee with discount 0.01%", async function () {
        const test = {
            feeManagerAmount: ethers.utils.parseUnits("100", 6),
            expectedRebateAmount: ethers.utils.parseUnits("1", 4),
            discount: 1, //0.01%
        };
        await testDiscount(this, test.feeManagerAmount, test.expectedRebateAmount, test.discount);
    });

    it("Check fee with discount 13.25%", async function () {
        const test = {
            feeManagerAmount: ethers.utils.parseUnits("10000", 6),
            expectedRebateAmount: ethers.utils.parseUnits("1325", 6),
            discount: 1325,
        };
        await testDiscount(this, test.feeManagerAmount, test.expectedRebateAmount, test.discount);
    });

    it("upgrade fee manager implementation to V2", async function () {
        expect(await this.nftFeeManager.hasRole(ADMIN_ROLE, this.signer.address)).to.be.true;

        const AltrFeeManagerV2 = await ethers.getContractFactory("AltrFeeManagerV2");
        const altrFeeManagerV2 = (await upgrades.upgradeProxy(this.nftFeeManager.address, AltrFeeManagerV2, {
            call: { fn: "migration", args: [] },
        })) as AltrFeeManagerV2;
        expect(altrFeeManagerV2.address).to.be.eq(this.nftFeeManager.address);
        expect(await altrFeeManagerV2.hasRole(ADMIN_ROLE, this.signer.address)).to.be.eq(true);
        const proxyAdmin = await upgrades.admin.getInstance();
        expect(await altrFeeManagerV2.hasRole(ADMIN_ROLE, proxyAdmin.address)).to.be.eq(false);

        expect(await altrFeeManagerV2.governanceTreasury()).to.be.eq(await this.nftFeeManager.governanceTreasury());

        expect(await altrFeeManagerV2.governanceTreasury()).to.be.eq(this.governanceTreasury.address);

        const GOVERNANCE_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("GOVERNANCE_ROLE"));
        await expect(
            altrFeeManagerV2.connect(this.owner1).setGovernanceTreasuryForRole(this.governanceNftTreasury.address)
        ).to.be.revertedWith(FEE_MANAGER_ERROR_MSG.MISSING_ROLE(this.owner1.address.toLowerCase(), GOVERNANCE_ROLE));

        await (await altrFeeManagerV2.grantRole(GOVERNANCE_ROLE, this.owner1.address)).wait();

        await (await altrFeeManagerV2.connect(this.owner1).setGovernanceTreasuryForRole(this.governanceNftTreasury.address)).wait();

        expect(await altrFeeManagerV2.governanceTreasury()).to.be.eq(this.governanceNftTreasury.address);
    });
}
