import { expect } from "chai";
import fs from "fs";
import path from "path";
import { ADMIN_ROLE, LIST_MANAGER_ROLE } from "../../config/roles";
import { SOLIDITY_ERROR_MSG } from "../common";
import { getInterfaceIDFromAbiFile } from "../utilities";

const ALLOW_LIST_ERROR_MSG = new SOLIDITY_ERROR_MSG("AltrAllowList");

export default function () {
    describe("constructor", function () {
        it("Should give to deployer admin and list manager roles", async function () {
            expect(await this.allowList.hasRole(ADMIN_ROLE, this.signer.address)).to.be.true;
            expect(await this.allowList.hasRole(LIST_MANAGER_ROLE, this.signer.address)).to.be.true;
        });
    });
    describe("allowAddresses", function () {
        it("Should revert if caller has not list manager role", async function () {
            await expect(this.allowList.connect(this.owner1).allowAddresses([this.owner2.address])).to.be.revertedWith(
                ALLOW_LIST_ERROR_MSG.MISSING_ROLE(this.owner1.address, LIST_MANAGER_ROLE)
            );
        });
        it("Should allow all the addresses in the list", async function () {
            const ADDRESSES_TO_ALLOW = [this.owner1.address, this.owner2.address];
            await this.allowList.allowAddresses(ADDRESSES_TO_ALLOW);
            for (let i = 0; i < ADDRESSES_TO_ALLOW.length; i++) {
                expect(await this.allowList.isAddressAllowed(ADDRESSES_TO_ALLOW[i])).to.be.true;
            }
        });
        it("Should emit an event", async function () {
            await expect(this.allowList.allowAddresses([this.owner1.address]))
                .to.emit(this.allowList, "AddressesAllowed")
                .withArgs([this.owner1.address]);
        });
    });
    describe("disallowAddresses", function () {
        it("Should revert if caller has not list manager role", async function () {
            await expect(this.allowList.connect(this.owner1).allowAddresses([this.owner2.address])).to.be.revertedWith(
                ALLOW_LIST_ERROR_MSG.MISSING_ROLE(this.owner1.address, LIST_MANAGER_ROLE)
            );
        });
        it("Should disallow previously allowed addresses", async function () {
            const ADDRESSES = [this.owner1.address, this.owner2.address];
            await this.allowList.allowAddresses(ADDRESSES);
            for (let i = 0; i < ADDRESSES.length; i++) {
                expect(await this.allowList.isAddressAllowed(ADDRESSES[i])).to.be.true;
            }
            await this.allowList.disallowAddresses(ADDRESSES);
            for (let i = 0; i < ADDRESSES.length; i++) {
                expect(await this.allowList.isAddressAllowed(ADDRESSES[i])).to.be.false;
            }
        });
        it("Should emit an event", async function () {
            const ADDRESSES = [this.owner1.address, this.owner2.address];
            await this.allowList.allowAddresses(ADDRESSES);
            await expect(this.allowList.disallowAddresses(ADDRESSES)).to.emit(this.allowList, "AddressesDisallowed").withArgs(ADDRESSES);
        });
    });
    describe("isAddressAllowed", function () {
        it("Should return true", async function () {
            await this.allowList.allowAddresses([this.owner1.address]);
            expect(await this.allowList.isAddressAllowed(this.owner1.address)).to.be.true;
        });
        it("Should return false", async function () {
            expect(await this.allowList.isAddressAllowed(this.owner1.address)).to.be.false;
        });
    });
    describe("supportsInterface", function () {
        it("Should support IAllowInterface", async function () {
            const dir = path.resolve(__dirname, "../../", "artifacts/contracts/interfaces/IAllowList.sol/IAllowList.json");
            const file = fs.readFileSync(dir, "utf8");
            const interfaceId = getInterfaceIDFromAbiFile(file);
            expect(await this.allowList.supportsInterface(interfaceId._hex)).to.be.true;
        });
        it("Should support IAccessControl interface", async function () {
            const dir = path.resolve(
                __dirname,
                "../../",
                "artifacts/@openzeppelin/contracts/access/IAccessControl.sol/IAccessControl.json"
            );
            const file = fs.readFileSync(dir, "utf8");
            const interfaceId = getInterfaceIDFromAbiFile(file);
            expect(await this.allowList.supportsInterface(interfaceId._hex)).to.be.true;
        });
        it("Should NOT support IStakingService interface", async function () {
            const dir = path.resolve(__dirname, "../../", "artifacts/contracts/interfaces/IStakingService.sol/IStakingService.json");
            const file = fs.readFileSync(dir, "utf8");
            const interfaceId = getInterfaceIDFromAbiFile(file);
            expect(await this.allowList.supportsInterface(interfaceId._hex)).to.be.false;
        });
    });
}
