const usersRoutes = require('./users');
const boardRoutes = require('./board');
const boardsRoutes = require('./boards');
const path = require('path');

const constructorMethod = (app) => {

    app.use('/users', usersRoutes);
    app.use('/board', boardRoutes);
    app.use('/boards', boardsRoutes);

    // home page, no backend data functions needed.
    app.get('/', (req, res) => {
        res.json({ message: 'Home page' });
    });

    // catch all bad URLs and provide a 404.
    app.use('*', (req, res) => {
        res.status(404).json({ error: 'Page not Found.' });
    });
};

module.exports = constructorMethod;
