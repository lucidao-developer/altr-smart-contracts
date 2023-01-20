import { BigNumber } from "@ethersproject/bignumber";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
    AltrNftCollateralRetriever,
    AltrNftCollection,
    AltrNftCollectionFactory,
    AltrFeeManager,
    AltrLicenseManager,
    AnyswapV3ERC20,
    LucidaoGovernanceReserve,
    TestFarm,
    LucidaoGovernanceNftReserve,
    AltrFractions,
    AltrFractionsSale,
    AltrAllowList,
} from "../typechain-types";

declare module "mocha" {
    export interface Context {
        zero: BigNumber;
        oneEth: BigNumber;
        negativeOneEth: BigNumber;
        snapshot: Uint8Array | undefined;
        skipTest: boolean;

        signer: SignerWithAddress;
        oracle1: SignerWithAddress;
        owner1: SignerWithAddress;
        owner2: SignerWithAddress;
        vaultManager: SignerWithAddress;
        timelock: SignerWithAddress;
        governanceTreasury: LucidaoGovernanceReserve;
        governanceNftTreasury: LucidaoGovernanceNftReserve;
        addressZero: string;
        signers: SignerWithAddress[];

        nftCollection: AltrNftCollection;
        nftCollectionFactory: AltrNftCollectionFactory;
        nftCollateralRetriever: AltrNftCollateralRetriever;
        nftLicenseManager: AltrLicenseManager;
        nftFeeManager: AltrFeeManager;
        fUsdt: AnyswapV3ERC20;

        altrFractions: AltrFractions;
        altrFractionsSale: AltrFractionsSale;
        allowList: AltrAllowList;

        testFarm: TestFarm;
        stakedTokens: number;
        servicePid: number;
        redemptionFee: number;
        tokensForEligibility: number;
        minGracePeriod: number;
        insolvencyGracePeriod: number;
        freeVaultServicePeriod: number;

        saleOpenTimePeriod: number;
    }
}
