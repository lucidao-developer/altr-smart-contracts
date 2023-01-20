import { getOrDeployAllowList } from "./deployFunctions";

async function main() {
    await getOrDeployAllowList();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
