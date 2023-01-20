import { time } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, BigNumberish, ContractReceipt } from "ethers";
import { ethers } from "hardhat";
import { SALE_ISSUER_ROLE } from "../config/roles";
import { AltrNftCollection, AltrNftCollectionFactory } from "../typechain-types";
import { mintBigNumberfUsdtTo, setNetworkTimestampTo } from "./utilities";

export const TEN_DISCOUNT = "10";
export const ZERO_DISCOUNT = "0";
export const UNINITIALIZE_UINT256 = BigNumber.from("0");

export async function mintNft(nftCollection: AltrNftCollection, tokenUri: string, minter: SignerWithAddress): Promise<ContractReceipt> {
    const nftTransaction = await nftCollection.connect(minter).safeMint(tokenUri);
    const transactionReceipt = await nftTransaction.wait();
    return transactionReceipt;
}

export function getTokenId(transactionReceipt: ContractReceipt): BigNumberish {
    const transferEvent = transactionReceipt.events?.find((x) => {
        return x.event == "Transfer";
    });
    expect(transferEvent).to.not.equal(undefined);
    if (!transferEvent || !transferEvent.args) {
        throw new Error("Error while minting Nft for Oracle");
    }
    return transferEvent.args["tokenId"];
}

export type NftTokenCollection = {
    collectionAddress: string;
    tokenId: BigNumberish;
};

export type AltrFractionSaleData = {
    id: BigNumberish;
    sale: [string, string, string, BigNumber, string, BigNumber, BigNumber, BigNumber, BigNumber, BigNumber, BigNumber, BigNumber] & {
        initiator: string;
        buyTokenManager: string;
        nftCollection: string;
        nftId: BigNumber;
        buyToken: string;
        openingTime: BigNumber;
        closingTime: BigNumber;
        fractionPrice: BigNumber;
        fractionsAmount: BigNumber;
        minFractionsKept: BigNumber;
        fractionsSold: BigNumber;
        saleMinFractions: BigNumber;
    };
    buyTokenManager: string;
};

export type AltrBuyoutData = {
    id: BigNumberish;
    buyout: [string, BigNumber, string, string, BigNumber, BigNumber, BigNumber, boolean] & {
        initiator: string;
        fractionSaleId: BigNumber;
        buyoutToken: string;
        buyoutPrice: BigNumber;
        openingTime: BigNumber;
        closingTime: BigNumber;
        isSuccessful: boolean;
    };
};

export async function buildScenario1(
    context: Mocha.Context,
    signer: SignerWithAddress,
    nftCollectionFactory: AltrNftCollectionFactory,
    oracle: SignerWithAddress
): Promise<NftTokenCollection> {
    const tokenUri = "tokenUri";
    let contractReceipt = await (
        await nftCollectionFactory
            .connect(signer)
            .createCollection(
                "watches",
                "wtch1",
                context.oracle1.address,
                context.vaultManager.address,
                context.minGracePeriod,
                context.insolvencyGracePeriod,
                context.freeVaultServicePeriod
            )
    ).wait();
    const currentContractIdx = (await nftCollectionFactory.createdContractCount()).sub("1");
    const createdContract = await context.nftCollectionFactory.createdContracts(currentContractIdx);
    const nftCollection = await ethers.getContractAt("AltrNftCollection", createdContract.collection);
    let transactionReceipt = await mintNft(nftCollection, tokenUri, oracle);
    let tokenId = getTokenId(transactionReceipt);

    return { collectionAddress: createdContract.collection, tokenId: tokenId };
}

export async function buildFractionSaleScenario(
    context: Mocha.Context,
    nftTokenCollectionData: NftTokenCollection,
    fractionsKept = ethers.constants.Zero,
    saleMinFractions = 500
) {
    const nftCollectionContract = await ethers.getContractAt("AltrNftCollection", nftTokenCollectionData.collectionAddress);

    const now = await time.latest();
    const setupSaleArgs = [
        nftCollectionContract.address,
        nftTokenCollectionData.tokenId,
        context.fUsdt.address,
        now + 5,
        now + context.saleOpenTimePeriod,
        ethers.utils.parseUnits("5000", 6),
        fractionsKept,
        saleMinFractions,
    ] as const;
    await context.altrFractionsSale.grantRole(SALE_ISSUER_ROLE, context.oracle1.address);
    await nftCollectionContract.connect(context.oracle1).approve(context.altrFractionsSale.address, nftTokenCollectionData.tokenId);
    const transactionReceipt = await (await context.altrFractionsSale.connect(context.oracle1).setupSale(...setupSaleArgs)).wait();
    const newFractionsSaleEvent = transactionReceipt.events?.find((event: any) => event.event === "NewFractionsSale");
    const buyTokenManager = newFractionsSaleEvent?.args?.at(1).at(1);

    await context.allowList.allowAddresses([context.signer.address, context.owner2.address]);

    const salesCount = await context.altrFractionsSale.salesCounter();
    const sale = await context.altrFractionsSale.getFractionsSale(salesCount.sub(1));

    const altrFractionSaleData: AltrFractionSaleData = {
        id: salesCount.sub(1),
        sale: sale,
        buyTokenManager,
    };

    return altrFractionSaleData;
}

export async function buildSuccessfulFractionsSaleScenario(
    context: Mocha.Context,
    altrFractionSaleData: AltrFractionSaleData,
    percFractionsToBuy = 100
) {
    const fractionsSale = await context.altrFractionsSale.getFractionsSale(altrFractionSaleData.id);
    const { fractionsAmount, closingTime } = fractionsSale;
    console.log(closingTime);
    console.log(await time.latest());
    const fractionsToBuy = Math.ceil(fractionsAmount.mul(percFractionsToBuy).div(100).toNumber());

    const usdtToMint = ethers.utils.parseUnits("10000000", 6);
    const usdtToApprove = altrFractionSaleData.sale.fractionPrice.mul(fractionsToBuy);

    await mintBigNumberfUsdtTo(context.fUsdt, context.signer.address, usdtToMint);
    await mintBigNumberfUsdtTo(context.fUsdt, context.owner2.address, usdtToMint);

    await context.fUsdt.approve(context.altrFractionsSale.address, usdtToApprove);
    await context.fUsdt.connect(context.owner2).approve(context.altrFractionsSale.address, usdtToApprove);

    await context.altrFractionsSale.buyFractions(altrFractionSaleData.id, fractionsToBuy);

    const fractionSale = await context.altrFractionsSale.getFractionsSale(altrFractionSaleData.id);
    const { fractionsSold } = fractionSale;
    if (fractionsSold < fractionsAmount) {
        await context.altrFractionsSale
            .connect(context.owner2)
            .buyFractions(altrFractionSaleData.id, Math.floor(fractionsAmount.sub(fractionsSold).toNumber()));
    }
    await setNetworkTimestampTo(Math.floor((await time.latest()) + context.saleOpenTimePeriod));
}

export async function buildBuyoutRequestScenario(context: Mocha.Context, fractionSaleId: BigNumberish) {
    await context.altrFractionsBuyout.requestBuyout(fractionSaleId);
    const buyoutCount = await context.altrFractionsBuyout.buyoutsCounter();
    const buyout = await context.altrFractionsBuyout.buyouts(buyoutCount.sub(1));

    const altrBuyoutData: AltrBuyoutData = {
        id: buyoutCount.sub(1),
        buyout: buyout,
    };

    return altrBuyoutData;
}

export async function buildScenario2(context: Mocha.Context, percFractionsToBuy = 100, fractionsKept = ethers.constants.Zero) {
    const nftTokenCollectionData = await buildScenario1(context, context.signer, context.nftCollectionFactory, context.oracle1);
    const altrFractionSaleData = await buildFractionSaleScenario(context, nftTokenCollectionData, fractionsKept);
    await buildSuccessfulFractionsSaleScenario(context, altrFractionSaleData, percFractionsToBuy);
    const altrBuyoutData = await buildBuyoutRequestScenario(context, altrFractionSaleData.id);

    return {
        tokenCollection: nftTokenCollectionData,
        fractionSale: altrFractionSaleData,
        buyout: altrBuyoutData,
    };
}

export async function buildBuyoutProposalScenario(context: Mocha.Context, buyoutId: BigNumberish) {
    const buyoutPrice = ethers.utils.parseUnits("1200", 6);
    context.altrFractionsBuyout.setBuyoutParams(buyoutId, buyoutPrice);

    const buyoutCount = await context.altrFractionsBuyout.buyoutsCounter();
    const buyout = await context.altrFractionsBuyout.buyouts(buyoutCount.sub(1));

    const altrBuyoutData: AltrBuyoutData = {
        id: buyoutCount.sub(1),
        buyout: buyout,
    };

    return altrBuyoutData;
}

export async function buildScenario3(context: Mocha.Context, percFractionsToBuy = 100, fractionsKept = ethers.constants.Zero) {
    const scenarioData = await buildScenario2(context, percFractionsToBuy, fractionsKept);
    const buyoutData = await buildBuyoutProposalScenario(context, scenarioData.buyout.id);

    return {
        tokenCollection: scenarioData.tokenCollection,
        fractionSale: scenarioData.fractionSale,
        buyout: buyoutData,
    };
}

export async function buildBuyoutScenario(context: Mocha.Context, fractionSaleId: BigNumberish, buyoutId: BigNumberish) {
    await context.altrFractions.setApprovalForAll(context.altrFractionsBuyout.address, true);
    await context.altrFractions.safeTransferFrom(context.signer.address, context.oracle1.address, fractionSaleId, 100, "0x");
    await context.fUsdt.approve(context.altrFractionsBuyout.address, ethers.utils.parseUnits("10000000", 6));
    await context.altrFractionsBuyout.executeBuyout(buyoutId);

    const buyoutCount = await context.altrFractionsBuyout.buyoutsCounter();
    const buyout = await context.altrFractionsBuyout.buyouts(buyoutCount.sub(1));

    const altrBuyoutData: AltrBuyoutData = {
        id: buyoutCount.sub(1),
        buyout: buyout,
    };

    return altrBuyoutData;
}

export async function buildScenario4(context: Mocha.Context, percFractionsToBuy = 100) {
    const scenarioData = await buildScenario3(context, percFractionsToBuy);
    const buyoutData = await buildBuyoutScenario(context, scenarioData.fractionSale.id, scenarioData.buyout.id);

    return {
        tokenCollection: scenarioData.tokenCollection,
        fractionSale: scenarioData.fractionSale,
        buyout: buyoutData,
    };
}

export async function buildScenario5(context: Mocha.Context, percFractionsToBuy = 100) {
    const nftTokenCollectionData = await buildScenario1(context, context.signer, context.nftCollectionFactory, context.oracle1);
    const altrFractionSaleData = await buildFractionSaleScenario(context, nftTokenCollectionData);
    const fractionsAmount = (await context.altrFractionsSale.getFractionsSale(altrFractionSaleData.id))[8];
    const fractionsToBuy = Math.ceil(fractionsAmount.mul(percFractionsToBuy).div(100).toNumber());

    const usdtToMint = ethers.utils.parseUnits("10000000", 6);
    const usdtToApprove = altrFractionSaleData.sale.fractionPrice.mul(fractionsToBuy);

    await mintBigNumberfUsdtTo(context.fUsdt, context.signer.address, usdtToMint);
    await context.fUsdt.approve(context.altrFractionsSale.address, usdtToApprove);
    return {
        tokenCollection: nftTokenCollectionData,
        fractionSale: altrFractionSaleData,
    };
}

export async function testDiscount(
    context: Mocha.Context,
    parsedFeeManagerAmount: BigNumber,
    parsedExpectedRebateAmount: BigNumber,
    discount: number
) {
    mintBigNumberfUsdtTo(context.fUsdt, context.owner1.address, parsedFeeManagerAmount);
    let appliedDiscount = await (
        await context.nftLicenseManager.connect(context.signer).setDiscount(context.owner1.address, discount)
    ).wait();

    //owner balance
    let balance = await context.fUsdt.balanceOf(context.owner1.address);
    expect(balance).to.be.eq(parsedFeeManagerAmount);

    //fee manager balance
    balance = await context.fUsdt.balanceOf(context.nftFeeManager.address);
    expect(balance).to.be.eq(0);

    //governance treasury new balance
    const governanceTreasuryBalance = await context.fUsdt.balanceOf(context.governanceTreasury.address);
    expect(governanceTreasuryBalance).to.be.eq(0);

    const feeTransferred = await (
        await context.fUsdt.connect(context.owner1).transfer(context.nftFeeManagerTester.address, parsedFeeManagerAmount)
    ).wait();

    //owner balance
    balance = await context.fUsdt.balanceOf(context.owner1.address);
    expect(balance).to.be.eq(0);

    //fee manager balance
    balance = await context.fUsdt.balanceOf(context.nftFeeManagerTester.address);

    expect(balance).to.be.eq(parsedFeeManagerAmount);

    const FEE_TOKEN = context.fUsdt.address;
    const testFeeData = ethers.utils.formatBytes32String("text");

    await expect(
        context.nftFeeManagerTester.connect(context.owner1).testReceiveZeroExFeeCallback(FEE_TOKEN, parsedFeeManagerAmount, testFeeData)
    )
        .to.emit(context.nftFeeManager, "FeeReceived")
        .withArgs(FEE_TOKEN, parsedFeeManagerAmount.sub(parsedExpectedRebateAmount), testFeeData)
        .to.emit(context.nftFeeManager, "RebateReceived")
        .withArgs(context.owner1.address, FEE_TOKEN, parsedExpectedRebateAmount, testFeeData);

    //governance treasury new balance
    balance = await context.fUsdt.balanceOf(context.governanceTreasury.address);
    expect(balance.add(governanceTreasuryBalance)).to.be.eq(parsedFeeManagerAmount.sub(parsedExpectedRebateAmount));

    //owner new balance
    balance = await context.fUsdt.balanceOf(context.owner1.address);
    expect(balance).to.be.eq(parsedExpectedRebateAmount);
}

export class SOLIDITY_ERROR_MSG {
    constructor(public contractName?: string) {}
    public ONLY_MINTER_CAN_BURN = `${this.contractName}: only Minter can burn NFT`;
    public CANNOT_TRANSFER = `${this.contractName}: cannot transfer token from minter to a not whitelisted address`;
    public DEADLINE_NOT_SET = `${this.contractName}: service deadline not set`;
    public CANNOT_SEIZE = `${this.contractName}: cannot seize token`;
    public INVALID_DISCOUNT = `${this.contractName}: discount not in accepted range`;
    public INVALID_ORACLE = `${this.contractName}: requirements to become oracle not met`;
    public UNKNOWN_COLLECTION = `${this.contractName}: unknown collection`;
    public NOT_ENOUGH_FRACTIONS_AVAILABLE = `${this.contractName}: not enough fractions available`;
    public CANNOT_TRADE_NFT_BACK = `${this.contractName}: can't trade nft back`;
    public SALE_NOT_OPEN = `${this.contractName}: sale not open`;
    public SALE_NOT_FINISHED = `${this.contractName}: sale not finished yet`;
    public CANNOT_TRADE_FRACTIONS_BACK = `${this.contractName}: can't trade fractions back`;
    public BUYOUT_ALREADY_STARTED = `${this.contractName}: buyout already started`;
    public INVALID_BUYOUT_ID = `${this.contractName}: invalid buyout id`;
    public CANNOT_TRADE_BOUGHTOUT_FRACTIONS = `${this.contractName}: cannot transfer bought out token id`;
    public NOT_ENOUGH_FRACTIONS = `${this.contractName}: not enough fractions`;
    public BUYOUT_NOT_OPEN = `${this.contractName}: buyout not open`;
    public BUYOUT_UNSUCCESSFUL = `${this.contractName}: buyout unsuccessful`;
    public CANNOT_SEND_ERC1155 = `${this.contractName}: cannot directly send ERC1155 tokens`;
    public CANNOT_SEND_ERC721 = `${this.contractName}: cannot directly send ERC721 tokens`;
    public VAULT_SERVICE_EXPIRED = `${this.contractName}: vault service expired`;
    public REDEMPTION_FEE_TOO_HIGH = `${this.contractName}: redemption fee too high`;
    public FEE_IMPORT_INCORRECT = `${this.contractName}: fee import incorrect`;
    public NATIVE_TOKEN_TRANSFER_FAIL = `${this.contractName}: native token transfer failed`;
    public FEE_EXCEEDS_BOUNDARIES = `${this.contractName}: protocol fee exceeds boundaries`;
    public MIN_BUYOUT_EXCEEDS_BOUDARIES = `${this.contractName}: buyout min fractions exceed boundaries`;
    public SALE_UNSUCCESSFUL = `${this.contractName}: sale unsuccessful`;
    public MUST_BE_BUYOUT_INITIATOR = `${this.contractName}: must be buyout initiator`;
    public MIN_TWO_FRACTIONS = `${this.contractName}: must have at least 2 fractions`;
    public INVALID_POOL_ID = `${this.contractName}: pool id not valid`;
    public FEE_NOT_PAID = `${this.contractName}: platform fee has not been paid`;
    public GRACE_PERIOD_TOO_SHORT = `${this.contractName}: grace period too short`;
    public CANNOT_BE_NULL_ADDRESS = `${this.contractName}: cannot be null address`;
    public NEW_DEADLINE_LOWER_THAN_CURRENT = `${this.contractName}: new deadline is lower than the current one`;
    public UNFINISHED_SALE = `${this.contractName}: sale not finished yet`;
    public ADDRESS_NOT_ALLOWED = `${this.contractName}: address not allowed`;
    public OPEN_TIME_PERIOD_CANNOT_BE_ZERO = `${this.contractName}: open time period cannot be less than minimum`;
    public SALE_DID_NOT_FAIL = `${this.contractName}: sale did not fail`;
    public NON_EXISTENT_TOKEN = `${this.contractName}: non existent token`;
    public SALE_INITIATOR = `${this.contractName}: must be sale initiator`;
    public CANNOT_RECEIVE_ETH = `${this.contractName}: cannot receive Eth`;
    public CANNOT_SET_PAST_TIME = `${this.contractName}: closing time cannot be set in the past`;
    public CANNOT_TRADE_FAILED_SALE_TOKEN = `${this.contractName}: cannot trade token whose sale failed`;
    public SALE_MIN_FRACTION_MUST_BE_ABOVE_0 = `${this.contractName}: sale min fractions must be above 0`;
    public MISSING_ROLE = (address: string, role: string) => `AccessControl: account ${address.toLowerCase()} is missing role ${role}`;
    public DOES_NOT_SUPPORT_INTERFACE = (correctInterface: string) =>
        `${this.contractName}: does not support ${correctInterface} interface`;
    public NOT_TOKEN_OWNER = "ERC721: caller is not token owner or approved";
    public INVALID_TOKEN = "ERC721: invalid token ID";
    public NOT_OWNER_CALLER = "Ownable: caller is not the owner";
    public NOT_TOKEN_OWNER_ERC1155 = "ERC1155: caller is not token owner or approved";
    public BURN_AMOUNT_EXCEEDED_ERC1155 = "ERC1155: burn amount exceeds balance";
    public REQUEST_EXCEEDS_ALLOWANCE = "AnyswapV3ERC20: request exceeds allowance";
    public ALREADY_INITIALIZED = "Initializable: contract is already initialized";
    public DEADLINE_LOWER_THAN_CURRENT = "AltrNftCollection: new deadline is lower than the current on";
}

export class SOLIDITY_PANIC_CODES {
    public static INVALID_ARRAY_INDEX = "0x32";
}
