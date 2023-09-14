import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { ADMIN_ROLE, NFT_MINTER_ROLE, NFT_MINTER_ROLE_MANAGER, VAULT_MANAGER_ROLE } from "../config/roles";
import { AltrNftCollectionFactoryV2 } from "../typechain-types";
import { SOLIDITY_ERROR_MSG } from "./common";
import { toBytes1 } from "./utilities";
import { getOrDeployNftCollectionFullFactory, getOrDeployNftCollectionLightFactory } from "../scripts/deployFunctions";

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
        await createCollection(this, name, symbol, this.signer, this.oracle1);

        const nftCollectionFullFactory = await getOrDeployNftCollectionFullFactory(this.nftCollectionFactory.address);
        const nftCollectionLightFactory = await getOrDeployNftCollectionLightFactory(this.nftCollectionFactory.address);

        const AltrNftCollectionFactoryV2 = await ethers.getContractFactory("AltrNftCollectionFactoryV2");
        const altrNftCollectionFactoryV2 = (await upgrades.upgradeProxy(this.nftCollectionFactory.address, AltrNftCollectionFactoryV2, { call: { fn: "migrate", args: [nftCollectionFullFactory.address, nftCollectionLightFactory.address] } })) as AltrNftCollectionFactoryV2;

        expect(altrNftCollectionFactoryV2.address).to.be.eq(this.nftCollectionFactory.address);
        await expect(altrNftCollectionFactoryV2.migrate(nftCollectionFullFactory.address, nftCollectionLightFactory.address)).to.be.revertedWith(NFT_COLLECTION_FACTORY_ERROR_MSG.ALREADY_MIGRATED);
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
                )
        ).wait();
        let collectionsCount = await altrNftCollectionFactoryV2.createdContractCount();
        expect(collectionsCount).to.equal(2);

        await (
            await altrNftCollectionFactoryV2
                .connect(this.signer)
                .createCollectionLight(
                    newName,
                    newSymbol,
                    this.oracle1.address
                )
        ).wait();
        collectionsCount = await altrNftCollectionFactoryV2.createdContractCount();
        expect(collectionsCount).to.equal(3);

        const firstCreatedCollection = await altrNftCollectionFactoryV2.createdContracts(0);
        const newCreatedCollection = await altrNftCollectionFactoryV2.createdContracts(1);
        const lightCollection = await altrNftCollectionFactoryV2.createdContracts(2);
        expect(await altrNftCollectionFactoryV2.isAKnownCollection(firstCreatedCollection.collection)).to.be.eq(true);
        expect(await altrNftCollectionFactoryV2.isAKnownCollection(newCreatedCollection.collection)).to.be.eq(true);
        expect(await altrNftCollectionFactoryV2.isAKnownCollection(lightCollection.collection)).to.be.eq(true);

        expect(firstCreatedCollection.name).to.equal(name);
        expect(firstCreatedCollection.symbol).to.equal(symbol);
        expect(firstCreatedCollection.oracle).to.equal(this.oracle1.address);

        expect(newCreatedCollection.name).to.eq(newName);
        expect(newCreatedCollection.symbol).to.equal(newSymbol);
        expect(newCreatedCollection.oracle).to.equal(this.oracle1.address);

        expect(lightCollection.name).to.equal(newName);
        expect(lightCollection.symbol).to.equal(newSymbol);
        expect(lightCollection.oracle).to.equal(this.oracle1.address);

        expect(firstCreatedCollection.tokenVersion).to.be.eq(toBytes1("1"));

        expect(newCreatedCollection.tokenVersion).to.be.eq(toBytes1("1"));
    });

    it("Should let upgrade collection only upgrading factory in V2 implementation", async function () {
        const nftCollectionFullFactory = await getOrDeployNftCollectionFullFactory(this.nftCollectionFactory.address);
        const nftCollectionLightFactory = await getOrDeployNftCollectionLightFactory(this.nftCollectionFactory.address);

        const AltrNftCollectionFactoryV2 = await ethers.getContractFactory("AltrNftCollectionFactoryV2");
        const altrNftCollectionFactoryV2 = (await upgrades.upgradeProxy(this.nftCollectionFactory.address, AltrNftCollectionFactoryV2, { call: { fn: "migrate", args: [nftCollectionFullFactory.address, nftCollectionLightFactory.address] } })) as AltrNftCollectionFactoryV2;

        const AltrNftCollectionFullFactoryV2 = await ethers.getContractFactory("AltrNftCollectionFullFactoryV2");
        const altrNftCollectionFullFactoryV2 = await AltrNftCollectionFullFactoryV2.deploy();
        await altrNftCollectionFullFactoryV2.transferOwnership(this.nftCollectionFactory.address);

        await altrNftCollectionFactoryV2.setNftCollectionFullFactory(altrNftCollectionFullFactoryV2.address, ethers.utils.hexZeroPad(ethers.utils.hexlify(2), 1));

        const collectionV2Address = await createCollection(this, "name", "sym2", this.signer, this.oracle1);

        const collectionV2 = await ethers.getContractAt("AltrNftCollectionV2", collectionV2Address);
        expect(await collectionV2.isV2()).to.be.true;
        expect((await altrNftCollectionFactoryV2.createdContracts(0)).tokenVersion).to.eq(ethers.utils.hexZeroPad(ethers.utils.hexlify(2), 1));
    })
}
