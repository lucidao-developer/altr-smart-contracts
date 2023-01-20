import { freeVaultServicePeriod, insolvencyGracePeriod, minGracePeriod } from "../config/config";
import { verifyContract } from "./deployFunctions";

async function main() {
    const contractName = "";
    const address = "";
    const contractArgs = [] as const;

    await verifyContract(contractName, {
        address: address,
        constructorArguments: contractArgs
    });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
