const seeder = require('./seed');

const main = async () => {
    const seed = await seeder.seedDB();
    process.exit();
}

main();