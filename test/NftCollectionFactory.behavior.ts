import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { ADMIN_ROLE, NFT_MINTER_ROLE, NFT_MINTER_ROLE_MANAGER, VAULT_MANAGER_ROLE } from "../config/roles";
import { AltrNftCollectionFactoryV2 } from "../typechain-types";
import { getTokenId, mintNft, SOLIDITY_ERROR_MSG } from "./common";
import { getUnixEpoch, setNetworkTimestampTo, toBytes1 } from "./utilities";

const NFT_COLLECTION_FACTORY_ERROR_MSG = new SOLIDITY_ERROR_MSG("AltrNftCollectionFactory");
const NFT_COLLECTION_ERROR_MSG = new SOLIDITY_ERROR_MSG("AltrNftCollection");

export function nftCollectionFactoryBehavior(): void {
    async function createCollection(
        context: Mocha.Context,
        name: string,
        symbol: string,
        signer: SignerWithAddress,
        oracle: SignerWithAddress
    ): Promise<string> {
        const collectionFactory = await context.nftCollectionFactory
            .connect(signer)
            .createCollection(
                name,
                symbol,
                oracle.address,
                context.signer.address,
                context.minGracePeriod,
                context.insolvencyGracePeriod,
                context.freeVaultServicePeriod
            );
        const createCollectionResult = await collectionFactory.wait();
        const collectionAddress = createCollectionResult.logs[0].address;
        return collectionAddress;
    }

    it("Mint Nft for collection", async function () {
        let collectionsCount = await this.nftCollectionFactory.createdContractCount();
        expect(collectionsCount).to.equal(0);
        const collectionAddress = await createCollection(this, "watches", "symbol", this.signer, this.oracle1);
        const collectionContract = await ethers.getContractAt("AltrNftCollection", collectionAddress);
        await expect(collectionContract.safeMint("")).to.be.revertedWith(
            NFT_COLLECTION_ERROR_MSG.MISSING_ROLE(this.signer.address.toLowerCase(), NFT_MINTER_ROLE)
        );
        await (await collectionContract.connect(this.oracle1).safeMint("")).wait();
        expect(await collectionContract.totalSupply()).to.be.eq(1);
        await expect(collectionContract.connect(this.oracle1).safeMint("")).not.to.be.reverted;
    });

    it("Create collection with valid roles", async function () {
        let collectionsCount = await this.nftCollectionFactory.createdContractCount();
        expect(collectionsCount).to.equal(0);

        const symbol = "wtch_1";
        await expect(createCollection(this, "watches", symbol, this.oracle1, this.oracle1)).to.be.revertedWith(
            NFT_COLLECTION_FACTORY_ERROR_MSG.NOT_OWNER_CALLER
        );
        const collectionAddress = await createCollection(this, "watches", symbol, this.signer, this.oracle1);

        collectionsCount = await this.nftCollectionFactory.createdContractCount();
        expect(collectionsCount).to.equal(1);

        const createdCollectionContract = await this.nftCollectionFactory.createdContracts(0);
        expect(collectionAddress).to.equal(createdCollectionContract.collection);
        expect(createdCollectionContract.symbol).to.equal(symbol);
        expect(createdCollectionContract.oracle).to.equal(this.oracle1.address);

        const collectionContract = await ethers.getContractAt("AltrNftCollection", collectionAddress);
        const derivedminterAdminRole = await collectionContract.getRoleAdmin(NFT_MINTER_ROLE);
        expect(NFT_MINTER_ROLE_MANAGER).to.eq(derivedminterAdminRole);

        const derivedMinterManagerRole = await collectionContract.getRoleAdmin(NFT_MINTER_ROLE_MANAGER);
        expect(ADMIN_ROLE).to.eq(derivedMinterManagerRole);

        const derivedVaultAdminRole = await collectionContract.getRoleAdmin(VAULT_MANAGER_ROLE);
        expect(ADMIN_ROLE).to.eq(derivedVaultAdminRole);

        //Oracle
        const oracleHasAdminRole = await collectionContract.hasRole(ADMIN_ROLE, this.oracle1.address);
        expect(oracleHasAdminRole).to.be.false;
        const oracleHasMinterRoleManager = await collectionContract.hasRole(NFT_MINTER_ROLE_MANAGER, this.oracle1.address);
        expect(oracleHasMinterRoleManager).to.be.true;
        const oracleHasMinterRole = await collectionContract.hasRole(NFT_MINTER_ROLE, this.oracle1.address);
        expect(oracleHasMinterRole).to.be.true;
        const oracleHasVaulManagerRole = await collectionContract.hasRole(VAULT_MANAGER_ROLE, this.oracle1.address);
        expect(oracleHasVaulManagerRole).to.be.false;

        //signer
        const signerHasAdminRole = await collectionContract.hasRole(ADMIN_ROLE, this.signer.address);
        expect(signerHasAdminRole).to.be.true;
        const signerHasMinterRoleManager = await collectionContract.hasRole(NFT_MINTER_ROLE_MANAGER, this.signer.address);
        expect(signerHasMinterRoleManager).to.be.true;
        const signerHasMinterRole = await collectionContract.hasRole(NFT_MINTER_ROLE, this.signer.address);
        expect(signerHasMinterRole).to.be.false;
        const signerHasVaulManagerRole = await collectionContract.hasRole(VAULT_MANAGER_ROLE, this.signer.address);
        expect(signerHasVaulManagerRole).to.be.true;

        //collectionFactory
        const factoryHasAdminRole = await collectionContract.hasRole(ADMIN_ROLE, this.nftCollectionFactory.address);
        expect(factoryHasAdminRole).to.be.false;
        const factoryHasMinterRole = await collectionContract.hasRole(NFT_MINTER_ROLE, this.nftCollectionFactory.address);
        expect(factoryHasMinterRole).to.be.false;
        const factoryHasMinterRoleManager = await collectionContract.hasRole(NFT_MINTER_ROLE_MANAGER, this.nftCollectionFactory.address);
        expect(factoryHasMinterRoleManager).to.be.false;
        const factoryHasVaulManagerRole = await collectionContract.hasRole(VAULT_MANAGER_ROLE, this.nftCollectionFactory.address);
        expect(factoryHasVaulManagerRole).to.be.false;

        await createCollection(this, "watches", symbol, this.signer, this.oracle1);
        collectionsCount = await this.nftCollectionFactory.createdContractCount();
        expect(collectionsCount).to.equal(2);
    });

    it("upgrade factory implementation to V2", async function () {
        expect(await (await upgrades.admin.getInstance()).owner()).to.be.equal(this.signer.address);
        const name = "watches_1";
        const symbol = "wtch_1";
        const newName = "watches_2";
        const newSymbol = "wtch_2";
        const deadline = getUnixEpoch(10);
        await createCollection(this, name, symbol, this.signer, this.oracle1);

        const AltrNftCollectionFactoryV2 = await ethers.getContractFactory("AltrNftCollectionFactoryV2");
        const altrNftCollectionFactoryV2 = (await upgrades.upgradeProxy(this.nftCollectionFactory.address, AltrNftCollectionFactoryV2, {
            call: { fn: "migration", args: [] },
        })) as AltrNftCollectionFactoryV2;

        expect(altrNftCollectionFactoryV2.address).to.be.eq(this.nftCollectionFactory.address);
        await (
            await altrNftCollectionFactoryV2
                .connect(this.signer)
                .createCollection(
                    newName,
                    newSymbol,
                    this.oracle1.address,
                    this.signer.address,
                    this.minGracePeriod,
                    this.insolvencyGracePeriod,
                    this.freeVaultServicePeriod,
                    deadline
                )
        ).wait();
        let collectionsCount = await altrNftCollectionFactoryV2.createdContractCount();
        expect(collectionsCount).to.equal(2);

        const firstCreatedCollection = await altrNftCollectionFactoryV2.createdContracts(0);
        const newCreatedCollection = await altrNftCollectionFactoryV2.createdContracts(1);
        expect(await altrNftCollectionFactoryV2.isAKnownCollection(firstCreatedCollection.collection)).to.be.eq(true);
        expect(await altrNftCollectionFactoryV2.isAKnownCollection(newCreatedCollection.collection)).to.be.eq(true);

        expect(firstCreatedCollection.tokenVersion).to.be.eq(toBytes1("1"));

        expect(newCreatedCollection.tokenVersion).to.be.eq(toBytes1("2"));

        //Cannot cast parent to child contract
        await expect(
            (await ethers.getContractAt("AltrNftCollectionV2", firstCreatedCollection.collection)).sellDeadline()
        ).to.be.revertedWithoutReason();

        //Can cast child to parent contract
        const newCollectionWrongCast = await ethers.getContractAt("AltrNftCollection", newCreatedCollection.collection);
        expect(await newCollectionWrongCast.name()).to.be.eq(newName);

        const newCollectionV2 = await ethers.getContractAt("AltrNftCollectionV2", newCreatedCollection.collection);
        expect(await newCollectionV2.sellDeadline()).to.be.eq(deadline);
        await setNetworkTimestampTo(deadline);

        const transactionReceipt = await mintNft(newCollectionV2, "", this.oracle1);
        const tokenId = getTokenId(transactionReceipt);

        await expect(
            newCollectionV2.connect(this.oracle1).transferFrom(this.oracle1.address, this.owner1.address, tokenId)
        ).to.be.revertedWith("Sell ended");
    });
}
