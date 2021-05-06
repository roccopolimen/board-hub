const seeder = require('./seed');

const main = async () => {
    const seed = await seeder.seedDB();
    console.log('Database has been seeded!');
    process.exit();
}

main();
