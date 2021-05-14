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

    app.get('/about', async (req, res) => {
        try {
            res.sendFile(path.resolve('static/about.html'));
          } catch (e) {
            res.status(500).render('error-page', { title: "500 Internal Server Error", error: true });
          }
    });

    // catch all bad URLs and provide a 404.
    app.use('*', (req, res) => {
        res.status(404).render('error-page', { title: "404 Page Not Found", error: true });
    });
};

module.exports = constructorMethod;