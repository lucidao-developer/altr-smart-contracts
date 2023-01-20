import { expect } from "chai";
import { deployTestLicenseManager, getOrDeployNftCollectionFactory } from "../scripts/deployFunctions";
import { IStakingService } from "../typechain-types";
import { SOLIDITY_ERROR_MSG, TEN_DISCOUNT, ZERO_DISCOUNT } from "./common";

const LICENSE_MANAGER_ERROR_MSG = new SOLIDITY_ERROR_MSG("AltrLicenseManager");
const NFT_COLLECTION_FACTORY_ERROR_MSG = new SOLIDITY_ERROR_MSG("AltrNftCollectionFactory");

export function licenseManagerBehavior(): void {
    it("Set discount", async function () {
        const maxDiscount = 9000; // 90%
        const gap = 1;

        let userDiscount = await this.nftLicenseManager.getDiscount(this.owner1.address);
        expect(userDiscount).to.be.eq(ZERO_DISCOUNT);

        await expect(this.nftLicenseManager.connect(this.oracle1).setDiscount(this.owner1.address, TEN_DISCOUNT)).to.be.revertedWith(
            LICENSE_MANAGER_ERROR_MSG.NOT_OWNER_CALLER
        );
        const tx = await this.nftLicenseManager.connect(this.signer).setDiscount(this.owner1.address, TEN_DISCOUNT);
        tx.wait();
        userDiscount = await this.nftLicenseManager.connect(this.oracle1).getDiscount(this.owner1.address);
        expect(userDiscount).to.be.eq(TEN_DISCOUNT);
        await expect(this.nftLicenseManager.connect(this.signer).setDiscount(this.owner1.address, ZERO_DISCOUNT)).to.be.revertedWith(
            LICENSE_MANAGER_ERROR_MSG.INVALID_DISCOUNT
        );
        await expect(this.nftLicenseManager.connect(this.signer).setDiscount(this.owner1.address, maxDiscount + gap)).to.be.revertedWith(
            LICENSE_MANAGER_ERROR_MSG.INVALID_DISCOUNT
        );
    });

    it("Check if oracle is a qualified oracle", async function () {
        expect(await this.nftLicenseManager.isAQualifiedOracle(this.oracle1.address)).to.be.equal(true);
        let nftCollectionFactory = await getOrDeployNftCollectionFactory(this.signer, this.nftLicenseManager, this.governanceNftTreasury);
        expect(await nftCollectionFactory.createdContractCount()).to.be.eq(0);
        await (
            await nftCollectionFactory.createCollection(
                "name",
                "symbol",
                this.oracle1.address,
                this.signer.address,
                this.minGracePeriod,
                this.insolvencyGracePeriod,
                this.freeVaultServicePeriod
            )
        ).wait();
        expect(await nftCollectionFactory.createdContractCount()).to.be.eq(1);
    });

    it("A not qualified oracle cannot create a collection", async function () {
        const testLicenseManager = await deployTestLicenseManager(
            this.testFarm as IStakingService,
            this.servicePid,
            this.tokensForEligibility
        );
        let nftCollectionFactory = await getOrDeployNftCollectionFactory(this.signer, testLicenseManager, this.governanceNftTreasury);
        expect(await nftCollectionFactory.createdContractCount()).to.be.eq(0);
        expect(await testLicenseManager.isAQualifiedOracle(this.oracle1.address)).to.be.equal(false);
        await expect(
            nftCollectionFactory.createCollection(
                "name",
                "symbol",
                this.oracle1.address,
                this.signer.address,
                this.minGracePeriod,
                this.insolvencyGracePeriod,
                this.freeVaultServicePeriod
            )
        ).to.be.revertedWith(NFT_COLLECTION_FACTORY_ERROR_MSG.INVALID_ORACLE);
        expect(await nftCollectionFactory.createdContractCount()).to.be.eq(0);
    });
}
