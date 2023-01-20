import { getOrDeployFractions } from "./deployFunctions";

async function main() {
    await getOrDeployFractions();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
