const usersRoutes = require('./users');
const boardRoutes = require('./board');
const boardsRoutes = require('./boards');
const homeRoutes = require('./home');
const path = require('path');

const constructorMethod = (app) => {
    
    app.use('/users', usersRoutes);
    app.use('/board', boardRoutes);
    app.use('/boards', boardsRoutes);
    app.use('/', homeRoutes);

    // catch all bad URLs and provide a 404.
    app.use('*', (req, res) => {
        res.status(404).render('error-page', { title: "404 Page Not Found", error: true });
    });
};

module.exports = constructorMethod;