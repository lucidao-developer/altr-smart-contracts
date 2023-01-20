import { expect } from "chai";
import fs from "fs";
import { ethers } from "hardhat";
import path from "path";
import { ADMIN_ROLE, NFT_MINTER_ROLE, VAULT_MANAGER_ROLE } from "../../config/roles";
import { AltrNftCollection__factory } from "../../typechain-types";
import { SOLIDITY_ERROR_MSG } from "../common";
import { getInterfaceIDFromAbiFile, setNetworkTimestampTo } from "../utilities";

const NFT_COLLECTION_ERROR_MSG = new SOLIDITY_ERROR_MSG("AltrNftCollection");

export default function () {
    describe("constructor", function () {
        let NftCollection: AltrNftCollection__factory;
        beforeEach(async function () {
            NftCollection = await ethers.getContractFactory("AltrNftCollection");
        });

        it("Should revert if oracle address is null", async function () {
            await expect(
                NftCollection.deploy(
                    "name",
                    "sym",
                    ethers.constants.AddressZero,
                    this.vaultManager.address,
                    this.signer.address,
                    this.governanceNftTreasury.address,
                    0,
                    0,
                    this.freeVaultServicePeriod
                )
            ).to.be.revertedWith(NFT_COLLECTION_ERROR_MSG.CANNOT_BE_NULL_ADDRESS);
        });
        it("Should revert if nft reserve address is null", async function () {
            await expect(
                NftCollection.deploy(
                    "name",
                    "sym",
                    this.oracle1.address,
                    this.vaultManager.address,
                    this.signer.address,
                    ethers.constants.AddressZero,
                    0,
                    0,
                    this.freeVaultServicePeriod
                )
            ).to.be.revertedWith(NFT_COLLECTION_ERROR_MSG.CANNOT_BE_NULL_ADDRESS);
        });
        it("Should revert if grace period too short", async function () {
            await expect(
                NftCollection.deploy(
                    "name",
                    "sym",
                    this.oracle1.address,
                    this.vaultManager.address,
                    this.signer.address,
                    this.governanceNftTreasury.address,
                    100,
                    0,
                    this.freeVaultServicePeriod
                )
            ).to.be.revertedWith(NFT_COLLECTION_ERROR_MSG.GRACE_PERIOD_TOO_SHORT);
        });
        it("Should set oracleAddress, nftReserveAddress, minGracePeriod, insolvencyGracePeriod", async function () {
            const nftCollection = await NftCollection.deploy(
                "name",
                "sym",
                this.oracle1.address,
                this.vaultManager.address,
                this.signer.address,
                this.governanceNftTreasury.address,
                0,
                0,
                this.freeVaultServicePeriod
            );
            await nftCollection.deployed();

            expect(await nftCollection.oracleAddress()).to.be.equal(this.oracle1.address);
            expect(await nftCollection.nftReserveAddress()).to.equal(this.governanceNftTreasury.address);
            expect(await nftCollection.minGracePeriod()).to.equal(0);
            expect(await nftCollection.insolvencyGracePeriod()).to.equal(0);
        });
    });
    describe("safeMint", function () {
        const TOKEN_URI = "Token URI";
        beforeEach(async function () {
            const transaction = await this.nftCollection.connect(this.oracle1).safeMint(TOKEN_URI);
            await transaction.wait();
        });
        it("Should revert if caller has not MINTER_ROLE", async function () {
            await expect(this.nftCollection.safeMint(TOKEN_URI)).to.be.revertedWith(
                NFT_COLLECTION_ERROR_MSG.MISSING_ROLE(this.signer.address, NFT_MINTER_ROLE)
            );
        });
        it("Should set the tokenId correctly", async function () {
            const token = await this.nftCollection.tokenByIndex(0);
            expect(token).to.equal(1);
        });
        it("Should set the token URI correctly", async function () {
            const tokenURI = await this.nftCollection.tokenURI(1);
            expect(tokenURI).to.equal(`ipfs://${TOKEN_URI}`);
        });
    });
    describe("tokenURI", function () {
        it("Should retrieve the correct Token URI", async function () {
            const TOKEN_URI = "Token URI";
            const transaction = await this.nftCollection.connect(this.oracle1).safeMint(TOKEN_URI);
            await transaction.wait();

            const tokenURI = await this.nftCollection.tokenURI(1);
            expect(tokenURI).to.equal(`ipfs://${TOKEN_URI}`);
        });
    });
    describe("setVaultServiceDeadline", function () {
        const TOKEN_URI = "Token URI";
        beforeEach(async function () {
            const transaction = await this.nftCollection.connect(this.oracle1).safeMint(TOKEN_URI);
            await transaction.wait();
        });
        it("Should revert if new deadline is lower than the current one", async function () {
            await expect(this.nftCollection.connect(this.vaultManager).setVaultServiceDeadline(1, 100)).to.be.revertedWith(
                NFT_COLLECTION_ERROR_MSG.NEW_DEADLINE_LOWER_THAN_CURRENT
            );
        });
        it("Should revert if caller has not VAULT_MANAGER_ROLE", async function () {
            const transaction = await this.nftCollection.connect(this.vaultManager).setVaultServiceDeadline(1, Date.now());
            await transaction.wait();
            await expect(this.nftCollection.connect(this.owner1).setVaultServiceDeadline(1, 0)).to.be.revertedWith(
                NFT_COLLECTION_ERROR_MSG.MISSING_ROLE(this.owner1.address, VAULT_MANAGER_ROLE)
            );
        });
        it("Should set the new deadline properly", async function () {
            const newDeadline = Date.now();
            const transaction = await this.nftCollection.connect(this.vaultManager).setVaultServiceDeadline(1, newDeadline);
            await transaction.wait();

            expect(await this.nftCollection.getVaultServiceDeadline(1)).to.equal(newDeadline);
        });
        it("Should emit an event", async function () {
            const newDeadline = Date.now();
            await expect(await this.nftCollection.connect(this.vaultManager).setVaultServiceDeadline(1, newDeadline))
                .to.emit(this.nftCollection, "VaultServiceDeadlineSet")
                .withArgs(1, newDeadline);
        });
    });
    describe("setInsolvencyGracePeriod", function () {
        const CURRENT_INSOLVENCY_GRACE_PERIOD = 15552000;
        it("Should revert if grace period too short", async function () {
            await expect(this.nftCollection.setInsolvencyGracePeriod(0)).to.be.revertedWith(
                NFT_COLLECTION_ERROR_MSG.GRACE_PERIOD_TOO_SHORT
            );
        });
        it("Should revert if caller has not ADMIN_ROLE", async function () {
            await expect(
                this.nftCollection.connect(this.owner1).setInsolvencyGracePeriod(CURRENT_INSOLVENCY_GRACE_PERIOD + 1)
            ).to.be.revertedWith(NFT_COLLECTION_ERROR_MSG.MISSING_ROLE(this.owner1.address, ADMIN_ROLE));
        });
        it("Should set the new insolvency grace period", async function () {
            const TOKEN_URI = "Token URI";
            const transaction = await this.nftCollection.connect(this.oracle1).safeMint(TOKEN_URI);
            await transaction.wait();
            const tx = await this.nftCollection.setInsolvencyGracePeriod(CURRENT_INSOLVENCY_GRACE_PERIOD + 1);
            await tx.wait();

            expect(await this.nftCollection.insolvencyGracePeriod()).to.equal(CURRENT_INSOLVENCY_GRACE_PERIOD + 1);
        });
        it("Should emit an event", async function () {
            await expect(await this.nftCollection.setInsolvencyGracePeriod(CURRENT_INSOLVENCY_GRACE_PERIOD + 1))
                .to.emit(this.nftCollection, "InsolvencyGracePeriodSet")
                .withArgs(CURRENT_INSOLVENCY_GRACE_PERIOD + 1);
        });
    });
    describe("setFreeVaultServicePeriod", function () {
        it("Should revert if caller has not admin role", async function () {
            await expect(this.nftCollection.connect(this.owner1).setFreeVaultServicePeriod(300)).to.be.revertedWith(
                NFT_COLLECTION_ERROR_MSG.MISSING_ROLE(this.owner1.address, ADMIN_ROLE)
            );
        });
        it("Should update free vault service timespan", async function () {
            const now = Math.floor(Date.now() / 1000) + 2000;
            await setNetworkTimestampTo(now);
            await this.nftCollection.setFreeVaultServicePeriod(300);
            await this.nftCollection.connect(this.oracle1).safeMint("Token URI");
            expect(await this.nftCollection.getVaultServiceDeadline(1)).to.approximately(now + 300, 60);
        });
        it("Should emit an event", async function () {
            await expect(await this.nftCollection.setFreeVaultServicePeriod(300))
                .to.emit(this.nftCollection, "FreeVaultServicePeriod")
                .withArgs(300);
        });
    });
    describe("getVaultServiceDeadline", function () {
        it("Should get the right vault service deadline", async function () {
            const newDeadline = Date.now();
            const transaction = await this.nftCollection.connect(this.vaultManager).setVaultServiceDeadline(1, newDeadline);
            await transaction.wait();

            expect(await this.nftCollection.getVaultServiceDeadline(1)).to.equal(newDeadline);
        });
    });
    describe("seize", function () {
        beforeEach(async function () {
            const TOKEN_URI = "Token URI";
            const transaction = await this.nftCollection.connect(this.oracle1).safeMint(TOKEN_URI);
            await transaction.wait();
        });
        it("Should revert if deadline not set", async function () {
            if ((await this.nftCollection.getVaultServiceDeadline(1)).toString() == "0") {
                await expect(this.nftCollection.seize(1)).to.be.revertedWith(NFT_COLLECTION_ERROR_MSG.DEADLINE_NOT_SET);
            }
        });
        it("Should revert if time is expired", async function () {
            const transaction = await this.nftCollection.connect(this.vaultManager).setVaultServiceDeadline(1, Date.now() + 100);
            await transaction.wait();

            await expect(this.nftCollection.seize(1)).to.be.revertedWith(NFT_COLLECTION_ERROR_MSG.CANNOT_SEIZE);
        });
        it("Should revert if caller has not ADMIN_ROLE", async function () {
            await ethers.provider.send("evm_mine", [Date.now() + 36000000]);

            await expect(this.nftCollection.connect(this.owner1).seize(1)).to.be.revertedWith(
                NFT_COLLECTION_ERROR_MSG.MISSING_ROLE(this.owner1.address, ADMIN_ROLE)
            );
        });
        it("Should transfer token to reserve address", async function () {
            await ethers.provider.send("evm_mine", [Date.now() + 36000000]);

            await this.nftCollection.seize(1);

            expect(await this.nftCollection.ownerOf(1)).to.equal(this.governanceNftTreasury.address);
        });
        it("Should emit an event", async function () {
            await ethers.provider.send("evm_mine", [Date.now() + 36000000]);

            await expect(await this.nftCollection.seize(1))
                .to.emit(this.nftCollection, "Seize")
                .withArgs(1);
        });
    });
    describe("supportsInterface", function () {
        it("Should support INftCollectionVaultService interface", async function () {
            const dir = path.resolve(
                __dirname,
                "../../",
                "artifacts/contracts/interfaces/INftCollectionVaultService.sol/INftCollectionVaultService.json"
            );
            const file = fs.readFileSync(dir, "utf8");
            const interfaceId = getInterfaceIDFromAbiFile(file);
            expect(await this.nftCollection.supportsInterface(interfaceId._hex)).to.be.true;
        });
        it("Should support IERC721 interface", async function () {
            const dir = path.resolve(__dirname, "../../", "artifacts/@openzeppelin/contracts/token/ERC721/IERC721.sol/IERC721.json");
            const file = fs.readFileSync(dir, "utf8");
            const interfaceId = getInterfaceIDFromAbiFile(file);
            expect(await this.nftCollection.supportsInterface(interfaceId._hex)).to.be.true;
        });
        it("Should support ERC721Enumerable interface", async function () {
            const dir = path.resolve(
                __dirname,
                "../../",
                "artifacts/@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol/IERC721Enumerable.json"
            );
            const file = fs.readFileSync(dir, "utf8");
            const interfaceId = getInterfaceIDFromAbiFile(file);
            expect(await this.nftCollection.supportsInterface(interfaceId._hex)).to.be.true;
        });
        it("Should support IAccessControl interface", async function () {
            const dir = path.resolve(
                __dirname,
                "../../",
                "artifacts/@openzeppelin/contracts/access/IAccessControl.sol/IAccessControl.json"
            );
            const file = fs.readFileSync(dir, "utf8");
            const interfaceId = getInterfaceIDFromAbiFile(file);
            expect(await this.nftCollection.supportsInterface(interfaceId._hex)).to.be.true;
        });
        it("Should support IERC165 interface", async function () {
            const interfaceId = "0x01ffc9a7";
            expect(await this.nftCollection.supportsInterface(interfaceId)).to.be.true;
        });
        it("Should NOT support IStakingService interface", async function () {
            const dir = path.resolve(__dirname, "../../", "artifacts/contracts/interfaces/IStakingService.sol/IStakingService.json");
            const file = fs.readFileSync(dir, "utf8");
            const interfaceId = getInterfaceIDFromAbiFile(file);
            expect(await this.nftCollection.supportsInterface(interfaceId._hex)).to.be.false;
        });
    });
}
