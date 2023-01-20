import { expect } from "chai";
import fs from "fs";
import { ethers } from "hardhat";
import path from "path";
import { erc1155MetadataUri } from "../../config/config";
import { ADMIN_ROLE, BURN_MANAGER_ROLE } from "../../config/roles";
import { getOrDeployFractionsSale } from "../../scripts/deployFunctions";
import { SOLIDITY_ERROR_MSG } from "../common";
import { getInterfaceIDFromAbiFile } from "../utilities";

const FRACTIONS_ERROR_MSG = new SOLIDITY_ERROR_MSG("AltrFractions");

export default function () {
    describe("constructor", function () {
        it("Should grant default admin role to deployer", async function () {
            expect(await this.altrFractions.hasRole(ADMIN_ROLE, this.signer.address));
        });
    });
    describe("setUri", function () {
        it("Should revert if caller has not admin role", async function () {
            await expect(this.altrFractions.connect(this.oracle1).setUri("NewUri")).to.be.revertedWith(
                FRACTIONS_ERROR_MSG.MISSING_ROLE(this.oracle1.address, ADMIN_ROLE)
            );
        });
        it("Should update the uri", async function () {
            const newUri = "New Uri";
            await this.altrFractions.setUri(newUri);
            await this.altrFractions.mint(this.signer.address, 0, 10, "0x");
            expect(await this.altrFractions.uri(0)).to.equal(`${newUri}0`);
        });
    });
    describe("setBuyoutStatus", function () {
        it("Should revert if caller has not admin role", async function () {
            await this.altrFractions.mint(this.signer.address, 0, 10, "0x");
            await expect(this.altrFractions.connect(this.oracle1).setBuyoutStatus(0)).to.be.revertedWith(
                FRACTIONS_ERROR_MSG.MISSING_ROLE(this.oracle1.address, ADMIN_ROLE)
            );
        });
        it("Should update the buyout status", async function () {
            await this.altrFractions.mint(this.signer.address, 0, 10, "0x");
            await this.altrFractions.setBuyoutStatus(0);
            expect(await this.altrFractions.isTokenIdBoughtOut(0)).to.be.true;
        });
        it("Should emit an event", async function () {
            await this.altrFractions.mint(this.signer.address, 0, 10, "0x");
            await expect(this.altrFractions.setBuyoutStatus(0)).to.emit(this.altrFractions, "BuyoutStatusSet").withArgs(0, true);
        });
    });
    describe("mint", function () {
        it("Should revert if caller has not admin role", async function () {
            await this.altrFractions.mint(this.signer.address, 0, 10, "0x");
            await expect(this.altrFractions.connect(this.oracle1).mint(this.signer.address, 0, 10, "0x")).to.be.revertedWith(
                FRACTIONS_ERROR_MSG.MISSING_ROLE(this.oracle1.address, ADMIN_ROLE)
            );
        });
        it("Should mint new tokens and send them to signer", async function () {
            await this.altrFractions.mint(this.signer.address, 0, 10, "0x");
            expect(await this.altrFractions.balanceOf(this.signer.address, 0)).to.equal(10);
        });
    });
    describe("burn", function () {
        it("Should revert if caller is not the owner nor approved for all", async function () {
            await this.altrFractions.mint(this.signer.address, 0, 10, "0x");
            await expect(this.altrFractions.connect(this.oracle1).burn(this.signer.address, 0, 10)).to.be.revertedWith(
                FRACTIONS_ERROR_MSG.NOT_TOKEN_OWNER_ERC1155
            );
        });
        it("Should burn token", async function () {
            await this.altrFractions.mint(this.signer.address, 0, 10, "0x");
            await this.altrFractions.burn(this.signer.address, 0, 10);
            expect(await this.altrFractions.balanceOf(this.signer.address, 0)).to.equal(0);
        });
    });
    describe("operatorBurn", function () {
        it("Should revert if caller has not burn manager role", async function () {
            await this.altrFractions.mint(this.signer.address, 0, 10, "0x");
            await expect(this.altrFractions.connect(this.oracle1).operatorBurn(this.signer.address, 0, 10)).to.be.revertedWith(
                FRACTIONS_ERROR_MSG.MISSING_ROLE(this.oracle1.address, BURN_MANAGER_ROLE)
            );
        });
        it("Should burn token", async function () {
            await this.altrFractions.mint(this.signer.address, 0, 10, "0x");
            await this.altrFractions.grantRole(BURN_MANAGER_ROLE, this.signer.address);
            await this.altrFractions.operatorBurn(this.signer.address, 0, 10);
            expect(await this.altrFractions.balanceOf(this.signer.address, 0)).to.equal(0);
        });
        it("Shoul emit an event", async function () {
            await this.altrFractions.mint(this.signer.address, 0, 10, "0x");
            await this.altrFractions.grantRole(BURN_MANAGER_ROLE, this.owner1.address);
            await expect(this.altrFractions.connect(this.owner1).operatorBurn(this.signer.address, 0, 10))
                .to.emit(this.altrFractions, "OperatorBurn")
                .withArgs(this.owner1.address, this.signer.address, 0, 10);
        });
    });
    describe("grantRole", function () {
        it("Should revert if caller has not admin role", async function () {
            await expect(this.altrFractions.connect(this.owner1).grantRole(BURN_MANAGER_ROLE, this.owner2.address)).to.be.revertedWith(
                FRACTIONS_ERROR_MSG.MISSING_ROLE(this.owner1.address, ADMIN_ROLE)
            );
        });
        it("Should grant role to user", async function () {
            await this.altrFractions.grantRole(BURN_MANAGER_ROLE, this.owner1.address);
            expect(await this.altrFractions.hasRole(BURN_MANAGER_ROLE, this.owner1.address)).to.be.true;
        });
    });
    describe("uri", function () {
        it("Should revert if token ID is incorrect", async function () {
            await expect(this.altrFractions.uri(0)).to.be.revertedWith(FRACTIONS_ERROR_MSG.NON_EXISTENT_TOKEN);
        });
        it("Should return the correct uri", async function () {
            await this.altrFractions.mint(this.signer.address, 0, 10, "0x");
            expect(await this.altrFractions.uri(0)).to.equal(`${erc1155MetadataUri}0`);
        });
    });
    describe("supportsInterface", function () {
        it("Should support ERC1155 interface", async function () {
            const dir = path.resolve(__dirname, "../../", "artifacts/@openzeppelin/contracts/token/ERC1155/IERC1155.sol/IERC1155.json");
            const file = fs.readFileSync(dir, "utf8");
            const interfaceId = getInterfaceIDFromAbiFile(file);
            expect(await this.altrFractions.supportsInterface(interfaceId._hex)).to.be.true;
        });
        it("Should support IFractions interface", async function () {
            const dir = path.resolve(__dirname, "../../", "artifacts/contracts/interfaces/IFractions.sol/IFractions.json");
            const file = fs.readFileSync(dir, "utf8");
            const interfaceId = getInterfaceIDFromAbiFile(file);
            expect(await this.altrFractions.supportsInterface(interfaceId._hex)).to.be.true;
        });
        it("Should support IERC165", async function () {
            const dir = path.resolve(__dirname, "../../", "artifacts/@openzeppelin/contracts/utils/introspection/IERC165.sol/IERC165.json");
            const file = fs.readFileSync(dir, "utf8");
            const interfaceId = getInterfaceIDFromAbiFile(file);
            expect(await this.altrFractions.supportsInterface(interfaceId._hex)).to.be.true;
        });
    });
    describe("setContractSale", function () {
        it("Should revert if caller had not admin role", async function () {
            await expect(this.altrFractions.connect(this.owner1).setContractSale(ethers.constants.AddressZero)).to.be.revertedWith(
                FRACTIONS_ERROR_MSG.MISSING_ROLE(this.owner1.address, ADMIN_ROLE)
            );
        });
        it("Should revert if address is null", async function () {
            await expect(this.altrFractions.setContractSale(ethers.constants.AddressZero)).to.be.revertedWith(
                FRACTIONS_ERROR_MSG.CANNOT_BE_NULL_ADDRESS
            );
        });
        it("Should revert if the contractSale is already initialized", async function () {
            const altrFractionsSale = await getOrDeployFractionsSale(this.altrFractions, this.allowList, this.nftFeeManager);
            await expect(this.altrFractions.setContractSale(altrFractionsSale.address)).to.be.revertedWith(
                FRACTIONS_ERROR_MSG.ALREADY_INITIALIZED
            );
        });
        it("Should set new contractSale properly", async function () {
            const altrFractionsSale = await getOrDeployFractionsSale(this.altrFractions, this.allowList, this.nftFeeManager);
            expect(await this.altrFractions.altrFractionsSale()).to.equal(altrFractionsSale.address);
        });
        it("Should revert if new contract sale does not support IFractionsSale interface", async function () {
            await expect(this.altrFractions.setContractSale(this.owner1.address)).to.be.revertedWith(
                FRACTIONS_ERROR_MSG.DOES_NOT_SUPPORT_INTERFACE("IFractionsSale")
            );
        });
    });
    describe("setClosingTimeForTokenSale", function () {
        it("Should revert if caller is not the owner", async function () {
            await expect(this.altrFractions.connect(this.owner1).setClosingTimeForTokenSale(0, 100)).to.be.revertedWith(
                FRACTIONS_ERROR_MSG.MISSING_ROLE(this.owner1.address, ADMIN_ROLE)
            );
        });
        it("Should revert if closing time is smaller than current timestamp", async function () {
            await expect(this.altrFractions.setClosingTimeForTokenSale(0, 100)).to.be.revertedWith(
                FRACTIONS_ERROR_MSG.CANNOT_SET_PAST_TIME
            );
        });
        it("Should set closing time properly", async function () {
            const newClosingTime = Date.now() + 100;
            await this.altrFractions.setClosingTimeForTokenSale(0, newClosingTime);
            expect(await this.altrFractions.closingTimeForTokenSale(0)).to.equal(newClosingTime);
        });
        it("Should emit an event", async function () {
            const newClosingTime = Date.now() + 100;
            await expect(this.altrFractions.setClosingTimeForTokenSale(0, newClosingTime))
                .to.emit(this.altrFractions, "ClosingTimeForTokenSaleSet")
                .withArgs(0, newClosingTime);
        });
    });
}
