import { expect } from "chai";
import { ethers } from "hardhat";
import { ZERO_ADDRESS } from "../config/config";
import { SOLIDITY_ERROR_MSG } from "./common";

const NFT_RESERVE_ERROR_MSG = new SOLIDITY_ERROR_MSG("LucidaoGovernanceNftReserve");

export function lucidaoGovernanceNftReserveBehavior(): void {
    it("Can receive NFT 721", async function () {
        await this.nftCollection.connect(this.oracle1).safeMint("TokenUri");
        await expect(
            this.nftCollection
                .connect(this.oracle1)
            ["safeTransferFrom(address,address,uint256)"](this.oracle1.address, this.governanceNftTreasury.address, 1)
        )
            .to.emit(this.governanceNftTreasury, "NftReceived")
            .withArgs(this.nftCollection.address, this.oracle1.address, this.oracle1.address, 1, 1);
        expect(await this.nftCollection.balanceOf(this.governanceNftTreasury.address)).to.equal(1);
    });
    it("Can transfer NFT 721", async function () {
        await this.nftCollection.connect(this.oracle1).safeMint("TokenUri");
        await this.nftCollection
            .connect(this.oracle1)
        ["safeTransferFrom(address,address,uint256)"](this.oracle1.address, this.governanceNftTreasury.address, 1);
        expect(await this.nftCollection.balanceOf(this.governanceNftTreasury.address)).to.equal(1);
        await expect(this.governanceNftTreasury.approveERC721(this.nftCollection.address, this.owner1.address, 1)).to.be.revertedWith(
            NFT_RESERVE_ERROR_MSG.NOT_OWNER_CALLER
        );
        await expect(this.governanceNftTreasury.connect(this.timelock).approveERC721(this.nftCollection.address, this.signer.address, 1))
            .to.emit(this.nftCollection, "Approval")
            .withArgs(this.governanceNftTreasury.address, this.signer.address, 1);
        await expect(
            this.nftCollection["safeTransferFrom(address,address,uint256)"](this.governanceNftTreasury.address, this.signer.address, 1)
        ).not.to.be.reverted;
        expect(await this.nftCollection.balanceOf(this.signer.address)).to.equal(1);
    });
    it("Can receive NFT 1155", async function () {
        const tokenId = "1";
        const qty = ethers.utils.parseUnits("10", 6);

        await expect(this.altrFractions.mint(this.governanceNftTreasury.address, tokenId, qty, "0x"))
            .to.emit(this.governanceNftTreasury, "NftReceived")
            .withArgs(this.altrFractions.address, ZERO_ADDRESS, this.signer.address, tokenId, qty);

        const balance = await this.altrFractions.balanceOf(this.governanceNftTreasury.address, tokenId);
        expect(balance).to.be.equal(qty);
    });
    it("Can transfer NFT 1155:", async function () {
        const tokenId = "1";
        const qty = ethers.utils.parseUnits("10", 6);
        await this.altrFractions.mint(this.governanceNftTreasury.address, tokenId, qty, "0x");
        await expect(this.governanceNftTreasury.approveERC1155(this.altrFractions.address, this.owner1.address)).to.be.revertedWith(
            NFT_RESERVE_ERROR_MSG.NOT_OWNER_CALLER
        );
        await expect(this.governanceNftTreasury.connect(this.timelock).approveERC1155(this.altrFractions.address, this.owner1.address))
            .to.emit(this.altrFractions, "ApprovalForAll")
            .withArgs(this.governanceNftTreasury.address, this.owner1.address, true);
        await this.altrFractions
            .connect(this.owner1)
            .safeTransferFrom(this.governanceNftTreasury.address, this.signer.address, tokenId, qty, "0x");
        expect(await this.altrFractions.balanceOf(this.signer.address, 1)).to.equal(qty);
    });
    it("Can batch receive NFT 1155:", async function () {
        const tokenIds = ["1", "2"];
        const qty = ethers.utils.parseUnits("10", 6);
        for (const tokenId of tokenIds) {
            await expect(this.altrFractions.mint(this.governanceNftTreasury.address, tokenId, qty, "0x"))
                .to.emit(this.governanceNftTreasury, "NftReceived")
                .withArgs(this.altrFractions.address, ZERO_ADDRESS, this.signer.address, tokenId, qty);
            await this.governanceNftTreasury.connect(this.timelock).approveERC1155(this.altrFractions.address, this.signer.address);
            await this.altrFractions.safeTransferFrom(this.governanceNftTreasury.address, this.signer.address, tokenId, qty, "0x");
        }
        await expect(
            this.altrFractions.safeBatchTransferFrom(this.signer.address, this.governanceNftTreasury.address, tokenIds, [qty, qty], "0x")
        )
            .to.emit(this.governanceNftTreasury, "NftBatchReceived")
            .withArgs(this.altrFractions.address, this.signer.address, this.signer.address, tokenIds, [qty, qty]);
        expect(await this.altrFractions.balanceOf(this.governanceNftTreasury.address, 1)).to.equal(qty);
        expect(await this.altrFractions.balanceOf(this.governanceNftTreasury.address, 2)).to.equal(qty);
    });
    it("Can batch transfer NFT 1155:", async function () {
        const tokenIds = ["1", "2"];
        const qty = ethers.utils.parseUnits("10", 6);
        for (const tokenId of tokenIds) {
            await this.altrFractions.mint(this.governanceNftTreasury.address, tokenId, qty, "0x");
        }
        await this.governanceNftTreasury.connect(this.timelock).approveERC1155(this.altrFractions.address, this.signer.address);
        await this.altrFractions.safeBatchTransferFrom(this.governanceNftTreasury.address, this.signer.address, tokenIds, [qty, qty], "0x");
        expect(await this.altrFractions.balanceOf(this.signer.address, 1)).to.equal(qty);
        expect(await this.altrFractions.balanceOf(this.signer.address, 2)).to.equal(qty);
    });
    it("Cannot receive Eth", async function () {
        await expect(
            this.signer.sendTransaction({ to: this.governanceNftTreasury.address, value: ethers.utils.parseEther("1") })
        ).to.be.revertedWith(NFT_RESERVE_ERROR_MSG.CANNOT_RECEIVE_ETH);
    });
    it("Can receive ERC20 token", async function () {
        await this.fUsdt.mint(this.signer.address, 1000);
        const amount = 100;
        await expect(this.fUsdt.transfer(this.governanceNftTreasury.address, amount))
            .to.changeTokenBalances(this.fUsdt, [this.signer.address, this.governanceNftTreasury.address], [-amount, amount])
            .and.to.emit(this.fUsdt, "Transfer")
            .withArgs(this.signer.address, this.governanceNftTreasury.address, amount);
    });
    it("Cannot transfer ERC20 token", async function () {
        await this.fUsdt.mint(this.governanceNftTreasury.address, 1000);
        const amount = 100;
        await expect(this.fUsdt.transferFrom(this.governanceNftTreasury.address, this.signer.address, amount)).to.be.revertedWith(
            NFT_RESERVE_ERROR_MSG.REQUEST_EXCEEDS_ALLOWANCE
        );
    });
}
