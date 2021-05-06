const express = require('express');
const app = express();
const session = require('express-session');
const configRoutes = require('./routes');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        name: 'AuthCookie',
        secret: "Michael Karsen Loves Hoola Hooping",
        saveUninitialized: true,
        resave: false
    })
);

app.use('*', (req, res, next) => {
    //This will run every single time any route is called
    let date = new Date().toUTCString();
    let reqmethod = req.method;
    let reqroute = req.originalUrl;
    let loggedin = false;
    if(req.session.user) loggedin = true;
    //Logs some useful stuff to the console, can be commented out
    console.log(`[${date}]: ${reqmethod} ${reqroute} | Authorized: ${loggedin}`);
    //Checks if you're going to the home page, or submitting the login/signup form, and skips if so
    if(req.originalUrl == "/" || req.originalUrl == "/users/login" || req.originalUrl == "/users/signup") next();
    else {
        //if you're logged in, proceed to whatever page you were trying to access
        if(loggedin || reqroute === "/favicon.ico") next();
        //if you aren't logged in, you're redirected to the home page, never even hitting the page you were trying to hit
        else res.status(403).json({ error: 'Forbidden, required auth.' });
    }
});

configRoutes(app);

app.listen(3000, () => {
    console.log('testing server successfully started!\nroutes are running on http://localhost:3000');
});
