import { expect } from "chai";
import { ContractReceipt } from "ethers";
import { freeVaultServicePeriod, IPFS_BASE_URL } from "../config/config";
import { ADMIN_ROLE, NFT_MINTER_ROLE, NFT_MINTER_ROLE_MANAGER, VAULT_MANAGER_ROLE } from "../config/roles";
import { getTokenId, mintNft, SOLIDITY_ERROR_MSG, UNINITIALIZE_UINT256 } from "./common";
import { getUnixEpoch, setNetworkTimestampTo } from "./utilities";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const NFT_COLLECTION_ERROR_MSG = new SOLIDITY_ERROR_MSG("AltrNftCollection");

export function nftCollectionBehavior(): void {
    async function baseNftCheck(context: Mocha.Context, transactionReceipt: ContractReceipt, tokenUri: string) {
        const tokenId = getTokenId(transactionReceipt);
        expect(tokenId).to.equal(1);
        const completeTokenUri = await context.nftCollection.tokenURI(tokenId.toString());
        expect(completeTokenUri).to.equal(`${IPFS_BASE_URL}${tokenUri}`);
    }

    it("Mint nft on nft collection", async function () {
        const tokenUri = "fakeTokenUriv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu";
        await expect(mintNft(this.nftCollection, tokenUri, this.signer)).to.be.revertedWith(
            NFT_COLLECTION_ERROR_MSG.MISSING_ROLE(this.signer.address.toLowerCase(), NFT_MINTER_ROLE)
        );
        await expect(mintNft(this.nftCollection, tokenUri, this.owner1)).to.be.revertedWith(
            NFT_COLLECTION_ERROR_MSG.MISSING_ROLE(this.owner1.address.toLowerCase(), NFT_MINTER_ROLE)
        );
        const transactionReceipt = await mintNft(this.nftCollection, tokenUri, this.oracle1);
        await baseNftCheck(this, transactionReceipt, tokenUri);
        const oracleBalance = await this.nftCollection.balanceOf(this.oracle1.address);
        expect(oracleBalance).to.equal(1);
        const tokenId = getTokenId(transactionReceipt);
        const tokenOwner = await this.nftCollection.ownerOf(tokenId);
        expect(tokenOwner).is.not.equal(this.signer.address);
        expect(tokenOwner).is.equal(this.oracle1.address);
        const deadline = await this.nftCollection.getVaultServiceDeadline(tokenId);
        expect(deadline).is.not.equal(UNINITIALIZE_UINT256);
    });

    it("Test token URI", async function () {
        let tokenUri = "";
        let transactionReceipt = await mintNft(this.nftCollection, tokenUri, this.oracle1);
        let tokenId = getTokenId(transactionReceipt);
        let completeTokenUri = await this.nftCollection.tokenURI(tokenId.toString());
        expect(completeTokenUri).to.equal(`${IPFS_BASE_URL}${tokenId}`);
        tokenUri = "myTokenUri";
        transactionReceipt = await mintNft(this.nftCollection, tokenUri, this.oracle1);
        tokenId = getTokenId(transactionReceipt);
        completeTokenUri = await this.nftCollection.tokenURI(tokenId.toString());
        expect(completeTokenUri).to.equal(`${IPFS_BASE_URL}${tokenUri}`);
    });

    it("Set token deadline", async function () {
        const tokenUri = "fakeTokenUriv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu";
        const transactionReceipt = await mintNft(this.nftCollection, tokenUri, this.oracle1);
        const tokenId = getTokenId(transactionReceipt);
        let vaultServiceDeadline = await this.nftCollection.getVaultServiceDeadline(tokenId);
        expect(vaultServiceDeadline).is.not.equal(UNINITIALIZE_UINT256);

        let newDeadline = Date.now();
        await expect(this.nftCollection.connect(this.owner1).setVaultServiceDeadline(tokenId, newDeadline)).to.be.revertedWith(
            NFT_COLLECTION_ERROR_MSG.MISSING_ROLE(this.owner1.address, VAULT_MANAGER_ROLE)
        );
        await (await this.nftCollection.connect(this.vaultManager).setVaultServiceDeadline(tokenId, newDeadline)).wait();
        vaultServiceDeadline = await this.nftCollection.getVaultServiceDeadline(tokenId);
        expect(vaultServiceDeadline).is.equal(newDeadline);

        //cannot set a prev deadline
        newDeadline = getUnixEpoch(5);
        await expect(this.nftCollection.connect(this.vaultManager).setVaultServiceDeadline(tokenId, newDeadline)).to.be.revertedWith(
            NFT_COLLECTION_ERROR_MSG.NEW_DEADLINE_LOWER_THAN_CURRENT
        );

        //cannot reset a deadline
        await expect(
            this.nftCollection.connect(this.vaultManager).setVaultServiceDeadline(tokenId, UNINITIALIZE_UINT256)
        ).to.be.revertedWith(NFT_COLLECTION_ERROR_MSG.NEW_DEADLINE_LOWER_THAN_CURRENT);

        //can update deadline
        newDeadline = Date.now();
        await (await this.nftCollection.connect(this.vaultManager).setVaultServiceDeadline(tokenId, newDeadline)).wait();
        vaultServiceDeadline = await this.nftCollection.getVaultServiceDeadline(tokenId);
        expect(vaultServiceDeadline).is.equal(newDeadline);
    });

    it("Set a vault deadline in the past", async function () {
        const tokenUri = "fakeTokenUriv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu";
        const transactionReceipt = await mintNft(this.nftCollection, tokenUri, this.oracle1);
        const tokenId = getTokenId(transactionReceipt);
        let newDeadline = getUnixEpoch(-1000);
        let vaultServiceDeadline = await this.nftCollection.getVaultServiceDeadline(tokenId);
        expect(vaultServiceDeadline).is.not.equal(UNINITIALIZE_UINT256);
        await expect(this.nftCollection.connect(this.vaultManager).setVaultServiceDeadline(tokenId, newDeadline)).to.be.revertedWith(
            NFT_COLLECTION_ERROR_MSG.NEW_DEADLINE_LOWER_THAN_CURRENT
        );
    });

    it("Approve for all", async function () {
        const tokenUri = "fakeTokenUriv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu";
        const transactionReceipt = await mintNft(this.nftCollection, tokenUri, this.oracle1);

        //set approval for nonexistent collection
        await this.nftCollection.connect(this.signer).setApprovalForAll(this.oracle1.address, true);

        //mark user as operator
        await this.nftCollection.connect(this.oracle1).setApprovalForAll(this.owner1.address, true);

        //unmark user as operator
        await this.nftCollection.connect(this.oracle1).setApprovalForAll(this.owner1.address, true);

        //mark signer as operator
        await this.nftCollection.connect(this.oracle1).setApprovalForAll(this.signer.address, true);
    });

    it("Burn on nft collection", async function () {
        const tokenUri = "fakeTokenUriv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu";
        let transactionReceipt = await mintNft(this.nftCollection, tokenUri, this.oracle1);
        let tokenId = getTokenId(transactionReceipt);

        //Fake Owner burn
        await expect(this.nftCollection.connect(this.owner1).burn(tokenId)).to.be.revertedWith(NFT_COLLECTION_ERROR_MSG.NOT_TOKEN_OWNER);
        await (await this.nftCollection.connect(this.oracle1).transferFrom(this.oracle1.address, this.owner1.address, tokenId)).wait();
        //burn token after transfer from minter to new owner
        let realOwner = await this.nftCollection.ownerOf(tokenId);
        expect(await this.nftCollection.balanceOf(this.oracle1.address)).to.equal(0);
        expect(await this.nftCollection.balanceOf(this.owner1.address)).to.equal(1);
        expect(realOwner).to.be.equal(this.owner1.address);
        await expect(this.nftCollection.connect(this.oracle1).burn(tokenId)).to.be.revertedWith(NFT_COLLECTION_ERROR_MSG.NOT_TOKEN_OWNER);

        //Real owner burn
        await this.nftCollection.connect(this.owner1).burn(tokenId);
        await expect(this.nftCollection.ownerOf(tokenId)).to.be.revertedWith(NFT_COLLECTION_ERROR_MSG.INVALID_TOKEN);

        transactionReceipt = await mintNft(this.nftCollection, tokenUri, this.oracle1);
        tokenId = getTokenId(transactionReceipt);

        await expect(this.nftCollection.connect(this.signer).burn(tokenId)).to.be.revertedWith(NFT_COLLECTION_ERROR_MSG.NOT_TOKEN_OWNER);

        //Oracle can burn only if real owner
        realOwner = await this.nftCollection.ownerOf(tokenId);
        expect(realOwner).to.be.equal(this.oracle1.address);
        await this.nftCollection.connect(this.oracle1).burn(tokenId);
        await expect(this.nftCollection.ownerOf(tokenId)).to.be.revertedWith(NFT_COLLECTION_ERROR_MSG.INVALID_TOKEN);
    });

    it("Oracle sets approvalForAll for an owner that burns the token", async function () {
        const tokenUri = "fakeTokenUriv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu";
        let transactionReceipt = await mintNft(this.nftCollection, tokenUri, this.oracle1);
        const tokenId = getTokenId(transactionReceipt);
        this.nftCollection.connect(this.oracle1).setApprovalForAll(this.owner1.address, true);
        await this.nftCollection.connect(this.owner1).burn(tokenId);
        await expect(this.nftCollection.ownerOf(tokenId)).to.be.revertedWith(NFT_COLLECTION_ERROR_MSG.INVALID_TOKEN);
    });

    it("Check Role", async function () {
        expect(await this.nftCollection.MINTER_ROLE()).to.equal(NFT_MINTER_ROLE);
        expect(await this.nftCollection.VAULT_MANAGER_ROLE()).to.equal(VAULT_MANAGER_ROLE);
        expect(await this.nftCollection.DEFAULT_ADMIN_ROLE()).to.equal(ADMIN_ROLE);
        expect(await this.nftCollection.MINTER_ROLE_MANAGER()).to.equal(NFT_MINTER_ROLE_MANAGER);
    });

    it("Test minter admin role", async function () {
        const tokenUri = "fakeTokenUriv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu";
        await expect(this.nftCollection.connect(this.oracle1).grantRole(NFT_MINTER_ROLE_MANAGER, this.owner2.address)).to.be.revertedWith(
            NFT_COLLECTION_ERROR_MSG.MISSING_ROLE(this.oracle1.address.toLowerCase(), ADMIN_ROLE)
        );

        await expect(this.nftCollection.connect(this.owner1).grantRole(NFT_MINTER_ROLE, this.owner2.address)).to.be.revertedWith(
            NFT_COLLECTION_ERROR_MSG.MISSING_ROLE(this.owner1.address.toLowerCase(), NFT_MINTER_ROLE_MANAGER)
        );

        await expect(mintNft(this.nftCollection, tokenUri, this.owner2)).to.be.revertedWith(
            NFT_COLLECTION_ERROR_MSG.MISSING_ROLE(this.owner2.address.toLowerCase(), NFT_MINTER_ROLE)
        );

        await (await this.nftCollection.connect(this.oracle1).grantRole(NFT_MINTER_ROLE, this.owner2.address)).wait();

        const transactionReceipt = await mintNft(this.nftCollection, tokenUri, this.owner2);
        const tokenId = getTokenId(transactionReceipt);
        let realOwner = await this.nftCollection.ownerOf(tokenId);
        expect(realOwner).to.be.equal(this.oracle1.address);
        await expect(
            this.nftCollection.connect(this.owner2).transferFrom(this.oracle1.address, this.owner1.address, tokenId)
        ).to.be.revertedWith(NFT_COLLECTION_ERROR_MSG.NOT_TOKEN_OWNER);

        await expect(this.nftCollection.connect(this.owner1).grantRole(NFT_MINTER_ROLE, this.owner2.address)).to.be.revertedWith(
            NFT_COLLECTION_ERROR_MSG.MISSING_ROLE(this.owner1.address.toLowerCase(), NFT_MINTER_ROLE_MANAGER)
        );

        await (await this.nftCollection.connect(this.oracle1).revokeRole(NFT_MINTER_ROLE, this.owner2.address)).wait();

        await expect(mintNft(this.nftCollection, tokenUri, this.owner2)).to.be.revertedWith(
            NFT_COLLECTION_ERROR_MSG.MISSING_ROLE(this.owner2.address.toLowerCase(), NFT_MINTER_ROLE)
        );

        await expect(this.nftCollection.connect(this.oracle1).grantRole(NFT_MINTER_ROLE_MANAGER, this.owner2.address)).to.be.revertedWith(
            NFT_COLLECTION_ERROR_MSG.MISSING_ROLE(this.oracle1.address.toLowerCase(), ADMIN_ROLE)
        );

        await (await this.nftCollection.connect(this.signer).grantRole(NFT_MINTER_ROLE_MANAGER, this.owner2.address)).wait();

        const owner2HasMinterManagerRole = await this.nftCollection
            .connect(this.owner2)
            .hasRole(NFT_MINTER_ROLE_MANAGER, this.owner2.address);

        expect(owner2HasMinterManagerRole).to.be.eq(true);
    });

    it("oracle can transfer approved nft", async function () {
        const tokenUri = "fakeTokenUriv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu";
        let transactionReceipt = await mintNft(this.nftCollection, tokenUri, this.oracle1);
        let tokenId = getTokenId(transactionReceipt);

        await (await this.nftCollection.connect(this.oracle1).transferFrom(this.oracle1.address, this.owner1.address, tokenId)).wait();
        expect(await this.nftCollection.balanceOf(this.oracle1.address)).to.equal(0)
        expect(await this.nftCollection.balanceOf(this.owner1.address)).to.equal(1)

        await expect(
            this.nftCollection.connect(this.oracle1).transferFrom(this.owner1.address, this.oracle1.address, tokenId)
        ).to.be.revertedWith(NFT_COLLECTION_ERROR_MSG.NOT_TOKEN_OWNER);

        await (await this.nftCollection.connect(this.owner1).approve(this.oracle1.address, tokenId)).wait();

        await (await this.nftCollection.connect(this.oracle1).transferFrom(this.owner1.address, this.owner2.address, tokenId)).wait();
        expect(await this.nftCollection.balanceOf(this.owner1.address)).to.equal(0)
        expect(await this.nftCollection.balanceOf(this.owner2.address)).to.equal(1)

        const tokenOwner = await this.nftCollection.ownerOf(tokenId);
        expect(tokenOwner).to.be.equal(this.owner2.address);
    });

    it("test seize with a vault service deadline and return token to owner", async function () {
        const tokenUri = "fakeTokenUriv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu";
        const transactionReceipt = await mintNft(this.nftCollection, tokenUri, this.oracle1);
        const origTokenId = getTokenId(transactionReceipt);
        let newDeadline = (await time.latest()) + freeVaultServicePeriod + 1000;
        let vaultServiceDeadline = await this.nftCollection.getVaultServiceDeadline(origTokenId);
        await (await this.nftCollection.connect(this.vaultManager).setVaultServiceDeadline(origTokenId, newDeadline)).wait();
        vaultServiceDeadline = await this.nftCollection.getVaultServiceDeadline(origTokenId);
        expect(vaultServiceDeadline).is.equal(newDeadline);
        await (await this.nftCollection.connect(this.oracle1).transferFrom(this.oracle1.address, this.owner1.address, origTokenId)).wait();
        let realOwner = await this.nftCollection.ownerOf(origTokenId);
        const owner1Balance = await this.nftCollection.balanceOf(this.owner1.address);
        expect(realOwner).to.be.equal(this.owner1.address);

        await expect(this.nftCollection.connect(this.oracle1).seize(origTokenId)).to.be.revertedWith(
            NFT_COLLECTION_ERROR_MSG.MISSING_ROLE(this.oracle1.address.toLowerCase(), ADMIN_ROLE)
        );

        await expect(this.nftCollection.seize(origTokenId)).to.be.revertedWith(NFT_COLLECTION_ERROR_MSG.CANNOT_SEIZE);

        await setNetworkTimestampTo(newDeadline);

        await expect(this.nftCollection.connect(this.signer).seize(origTokenId)).to.be.revertedWith(NFT_COLLECTION_ERROR_MSG.CANNOT_SEIZE);

        let grace_months = await this.nftCollection.insolvencyGracePeriod();

        await setNetworkTimestampTo(grace_months.add(newDeadline).sub(1).toNumber());

        await expect(this.nftCollection.seize(origTokenId)).to.be.revertedWith(NFT_COLLECTION_ERROR_MSG.CANNOT_SEIZE);

        await expect(await this.nftCollection.seize(origTokenId))
            .to.emit(this.governanceNftTreasury, "NftReceived")
            .withArgs(this.nftCollection.address, this.owner1.address, this.signer.address, origTokenId, ethers.constants.One);

        const tokenId = origTokenId;

        realOwner = await this.nftCollection.ownerOf(tokenId);
        expect(realOwner).to.be.equal(this.governanceNftTreasury.address);
        const newOwner1Balance = await this.nftCollection.balanceOf(this.owner1.address);
        expect(newOwner1Balance).to.be.equal(owner1Balance.sub(1));

        await expect(
            this.governanceNftTreasury.connect(this.owner2).approveERC721(this.nftCollection.address, this.signer.address, tokenId)
        ).to.be.revertedWith(NFT_COLLECTION_ERROR_MSG.NOT_OWNER_CALLER);

        await (
            await this.governanceNftTreasury.connect(this.timelock).approveERC721(this.nftCollection.address, this.owner2.address, tokenId)
        ).wait();

        await this.nftCollection.connect(this.owner2).transferFrom(this.governanceNftTreasury.address, this.owner2.address, tokenId);
        expect(await this.nftCollection.balanceOf(this.governanceNftTreasury.address)).to.equal(0)
        expect(await this.nftCollection.balanceOf(this.owner2.address)).to.equal(1)

        realOwner = await this.nftCollection.ownerOf(tokenId);
        expect(realOwner).to.be.equal(this.owner2.address);
        expect(await this.nftCollection.balanceOf(this.governanceNftTreasury.address)).to.be.equal(0);
        expect(await this.nftCollection.balanceOf(this.owner2.address)).to.be.equal(1);
    });

    it("Revoke role to oracle that try to mint", async function () {
        const tokenUri = "TOKENURI";
        console.log(NFT_MINTER_ROLE_MANAGER);
        await this.nftCollection.revokeRole(NFT_MINTER_ROLE, this.oracle1.address);
        await expect(this.nftCollection.connect(this.oracle1).safeMint(tokenUri)).to.be.revertedWith(
            NFT_COLLECTION_ERROR_MSG.MISSING_ROLE(this.oracle1.address, NFT_MINTER_ROLE)
        );
    });
}
