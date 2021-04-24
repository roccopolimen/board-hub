// TODO: uncomment when route is added.

// const userRoutes = require('./user');
// const boardRoutes = require('./board');

const boardsRoutes = require('./boards');
const homeRoutes = require('./home');


const path = require('path');

const constructorMethod = (app) => {
    // TODO: uncomment when route is added.

    // app.use('/user', userRoutes);
    // app.use('/board', boardRoutes);
    app.use('/boards', boardsRoutes);
    app.use('/', homeRoutes);


    // catch all bad URLs and provide a 404.
    app.use('*', (req, res) => {
        // res.status(404).json('Page not Found.');
        res.status(404).render('error-page', { title: "404 Page Not Found", error: true });
    });
};

module.exports = constructorMethod;