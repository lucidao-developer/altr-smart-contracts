import { expect } from "chai";
import {
    NftSwapV4,
    SignedNftOrderV4,
    SwappableAssetV4,
    UserFacingERC20AssetDataSerializedV4,
    UserFacingERC721AssetDataSerializedV4,
} from "@traderxyz/nft-swap-sdk";
import { ethers } from "hardhat";
import { SOLIDITY_ERROR_MSG } from "./common";
import { ZERO_EX_ROLE } from "../config/roles";

const TRADE_CHECKER_ERROR_MSG = new SOLIDITY_ERROR_MSG("AltrTradeChecker");

async function makerApproveAndBuildOrder(
    sdk: NftSwapV4,
    makerAsset: UserFacingERC721AssetDataSerializedV4,
    takerAsset: UserFacingERC20AssetDataSerializedV4,
    takerAddress = ethers.constants.AddressZero
): Promise<SignedNftOrderV4> {
    const makerAddress = await sdk.signer!.getAddress();
    await sdk.approveTokenOrNftByAsset(makerAsset, makerAddress);
    const order = sdk.buildOrder(makerAsset, takerAsset, makerAddress, { taker: takerAddress });
    return await sdk.signOrder(order);
}

async function takerApproveAndFill(sdk: NftSwapV4, takerAsset: SwappableAssetV4, signedOrder: SignedNftOrderV4) {
    const takerAddress = await sdk.signer!.getAddress();
    await sdk.approveTokenOrNftByAsset(takerAsset, takerAddress);
    return await sdk.fillSignedOrder(signedOrder);
}

export function tradeCheckerBehavior() {
    it("Should allow any trade without tradeChecker", async function () {
        const nftSwapSdk = new NftSwapV4(ethers.provider, this.oracle1, "31337", {
            zeroExExchangeProxyContractAddress: this.zeroEx.address,
        });
        const NFT = {
            tokenAddress: this.nftCollection.address,
            tokenId: "1",
            type: "ERC721" as const,
        };
        const FUSDT = {
            tokenAddress: this.fUsdt.address,
            amount: ethers.utils.parseUnits("50", 6).toString(),
            type: "ERC20" as const,
        };
        const signedOrder = await makerApproveAndBuildOrder(nftSwapSdk, NFT, FUSDT);
        const takerSdk = new NftSwapV4(ethers.provider, this.signer, "31337", { zeroExExchangeProxyContractAddress: this.zeroEx.address });
        const tx = takerApproveAndFill(takerSdk, FUSDT, signedOrder);
        await expect(tx).not.to.be.reverted;
        expect(await this.nftCollection.balanceOf(this.oracle1.address)).to.equal(0);
        expect(await this.nftCollection.balanceOf(this.signer.address)).to.equal(1);
    });
    it("Should not fill the same order twice", async function () {
        const nftSwapSdk = new NftSwapV4(ethers.provider, this.oracle1, "31337", {
            zeroExExchangeProxyContractAddress: this.zeroEx.address,
        });
        const NFT = {
            tokenAddress: this.nftCollection.address,
            tokenId: "1",
            type: "ERC721" as const,
        };
        const FUSDT = {
            tokenAddress: this.fUsdt.address,
            amount: ethers.utils.parseUnits("50", 6).toString(),
            type: "ERC20" as const,
        };
        const signedOrder = await makerApproveAndBuildOrder(nftSwapSdk, NFT, FUSDT);
        const takerSdk = new NftSwapV4(ethers.provider, this.signer, "31337", { zeroExExchangeProxyContractAddress: this.zeroEx.address });
        const tx = takerApproveAndFill(takerSdk, FUSDT, signedOrder);
        await expect(tx).not.to.be.reverted;
        const taker2Sdk = new NftSwapV4(ethers.provider, this.owner1, "31337", { zeroExExchangeProxyContractAddress: this.zeroEx.address });
        const tx2 = takerApproveAndFill(taker2Sdk, FUSDT, signedOrder);
        await expect(tx2).to.be.reverted;
    });
    it("Should revert if address is not allow listed", async function () {
        const nftSwapSdk = new NftSwapV4(ethers.provider, this.oracle1, "31337", {
            zeroExExchangeProxyContractAddress: this.zeroEx.address,
        });
        const NFT = {
            tokenAddress: this.nftCollection.address,
            tokenId: "1",
            type: "ERC721" as const,
        };
        const FUSDT = {
            tokenAddress: this.fUsdt.address,
            amount: ethers.utils.parseUnits("50", 6).toString(),
            type: "ERC20" as const,
        };
        const signedOrder = await makerApproveAndBuildOrder(nftSwapSdk, NFT, FUSDT, this.tradeChecker.address);
        const takerSdk = new NftSwapV4(ethers.provider, this.signer, "31337", {
            zeroExExchangeProxyContractAddress: this.tradeChecker.address,
        });
        const tx = takerApproveAndFill(takerSdk, FUSDT, signedOrder);
        await expect(tx).to.be.revertedWith(TRADE_CHECKER_ERROR_MSG.ADDRESS_NOT_ALLOWED);
    });
    it("Should handle order properly with allowlisted address", async function () {
        const nftSwapSdk = new NftSwapV4(ethers.provider, this.oracle1, "31337", {
            zeroExExchangeProxyContractAddress: this.zeroEx.address,
        });
        const NFT = {
            tokenAddress: this.nftCollection.address,
            tokenId: "1",
            type: "ERC721" as const,
        };
        const FUSDT = {
            tokenAddress: this.fUsdt.address,
            amount: ethers.utils.parseUnits("50", 6).toString(),
            type: "ERC20" as const,
        };
        const signedOrder = await makerApproveAndBuildOrder(nftSwapSdk, NFT, FUSDT, this.tradeChecker.address);
        const takerSdk = new NftSwapV4(ethers.provider, this.signer, "31337", {
            zeroExExchangeProxyContractAddress: this.tradeChecker.address,
        });
        await this.allowList.allowAddresses([this.signer.address]);
        const tx = takerApproveAndFill(takerSdk, FUSDT, signedOrder);
        await expect(tx).not.to.be.reverted;
        expect(await this.nftCollection.balanceOf(this.oracle1.address)).to.equal(0);
        expect(await this.nftCollection.balanceOf(this.signer.address)).to.equal(1);
    });
    it("Should not fill an order bypassing tradeChecker", async function () {
        const nftSwapSdk = new NftSwapV4(ethers.provider, this.oracle1, "31337", {
            zeroExExchangeProxyContractAddress: this.zeroEx.address,
        });
        const NFT = {
            tokenAddress: this.nftCollection.address,
            tokenId: "1",
            type: "ERC721" as const,
        };
        const FUSDT = {
            tokenAddress: this.fUsdt.address,
            amount: ethers.utils.parseUnits("50", 6).toString(),
            type: "ERC20" as const,
        };
        const signedOrder = await makerApproveAndBuildOrder(nftSwapSdk, NFT, FUSDT, this.tradeChecker.address);
        const takerSdk = new NftSwapV4(ethers.provider, this.signer, "31337", {
            zeroExExchangeProxyContractAddress: this.zeroEx.address,
        });
        const tx = takerApproveAndFill(takerSdk, FUSDT, signedOrder);
        await expect(tx).to.be.reverted;
    });
    it("Should revert if taker tries to fill a cancelled order", async function () {
        const nftSwapSdk = new NftSwapV4(ethers.provider, this.oracle1, "31337", {
            zeroExExchangeProxyContractAddress: this.zeroEx.address,
        });
        const NFT = {
            tokenAddress: this.nftCollection.address,
            tokenId: "1",
            type: "ERC721" as const,
        };
        const FUSDT = {
            tokenAddress: this.fUsdt.address,
            amount: ethers.utils.parseUnits("50", 6).toString(),
            type: "ERC20" as const,
        };
        const signedOrder = await makerApproveAndBuildOrder(nftSwapSdk, NFT, FUSDT, this.tradeChecker.address);
        await nftSwapSdk.cancelOrder(signedOrder.nonce, "ERC721");
        const takerSdk = new NftSwapV4(ethers.provider, this.signer, "31337", {
            zeroExExchangeProxyContractAddress: this.zeroEx.address,
        });
        await this.allowList.allowAddresses([this.signer.address]);
        const tx = takerApproveAndFill(takerSdk, FUSDT, signedOrder);
        await expect(tx).to.be.reverted;
    });
    it("Should revert if taker tries to fill an order and the maker no longer has the nft", async function () {
        const nftSwapSdk = new NftSwapV4(ethers.provider, this.oracle1, "31337", {
            zeroExExchangeProxyContractAddress: this.zeroEx.address,
        });
        const NFT = {
            tokenAddress: this.nftCollection.address,
            tokenId: "1",
            type: "ERC721" as const,
        };
        const FUSDT = {
            tokenAddress: this.fUsdt.address,
            amount: ethers.utils.parseUnits("50", 6).toString(),
            type: "ERC20" as const,
        };
        const signedOrder = await makerApproveAndBuildOrder(nftSwapSdk, NFT, FUSDT, this.tradeChecker.address);
        await nftSwapSdk.cancelOrder(signedOrder.nonce, "ERC721");
        const takerSdk = new NftSwapV4(ethers.provider, this.signer, "31337", {
            zeroExExchangeProxyContractAddress: this.zeroEx.address,
        });
        this.nftCollection.connect(this.oracle1)["safeTransferFrom(address,address,uint256)"](this.oracle1.address, this.owner1.address, 1);
        await this.allowList.allowAddresses([this.signer.address]);
        const tx = takerApproveAndFill(takerSdk, FUSDT, signedOrder);
        await expect(tx).to.be.reverted;
    });
    it("Should pay fees properly", async function () {
        await this.feeManager.grantRole(ZERO_EX_ROLE, this.zeroEx.address);
        const nftSwapSdk = new NftSwapV4(ethers.provider, this.oracle1, "31337", {
            zeroExExchangeProxyContractAddress: this.zeroEx.address,
        });
        const NFT = {
            tokenAddress: this.nftCollection.address,
            tokenId: "1",
            type: "ERC721" as const,
        };
        const FUSDT = {
            tokenAddress: this.fUsdt.address,
            amount: ethers.utils.parseUnits("50", 6).toString(),
            type: "ERC20" as const,
        };
        const fee = ethers.utils.parseUnits("10", 6);
        const makerAddress = await nftSwapSdk.signer!.getAddress();
        await nftSwapSdk.approveTokenOrNftByAsset(NFT, makerAddress);
        const order = nftSwapSdk.buildOrder(NFT, FUSDT, makerAddress, {
            taker: this.tradeChecker.address,
            fees: [
                {
                    amount: fee,
                    recipient: this.feeManager.address,
                    feeData: "0x01",
                },
            ],
        });
        const signedOrder = await nftSwapSdk.signOrder(order);
        const takerSdk = new NftSwapV4(ethers.provider, this.signer, "31337", {
            zeroExExchangeProxyContractAddress: this.tradeChecker.address,
        });
        await this.allowList.allowAddresses([this.signer.address]);
        const tx = takerApproveAndFill(takerSdk, FUSDT, signedOrder);
        await expect(tx).not.to.be.reverted;
        expect(await this.nftCollection.balanceOf(this.oracle1.address)).to.equal(0);
        expect(await this.nftCollection.balanceOf(this.signer.address)).to.equal(1);
        await expect(tx).to.changeTokenBalances(
            this.fUsdt,
            [makerAddress, this.signer.address, this.governanceTreasury.address],
            [FUSDT.amount, -fee.add(FUSDT.amount), fee]
        );
    });
}
