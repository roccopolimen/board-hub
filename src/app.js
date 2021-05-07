const express = require('express');
const app = express();
const static = express.static(__dirname + '/public');
const session = require('express-session');
const configRoutes = require('./routes');
const exphbs = require('express-handlebars');

const handlebarsInstance = exphbs.create({
    defaultLayout: 'main',
    // Specify helpers which are only registered on this instance.
    helpers: {
        asJSON: (obj, spacing) => {
            if (typeof spacing === 'number')
                return new Handlebars.SafeString(JSON.stringify(obj, null, spacing));

            return new Handlebars.SafeString(JSON.stringify(obj));
        },
        // https://stackoverflow.com/questions/15088215/handlebars-js-if-block-helper
        if_eq: function(a, b, opts) {
            if(a == b)
                return opts.fn(this);
            else
                return opts.inverse(this);
        }
    },
    partialsDir: ['views/partials/']
});

const rewriteUnsupportedBrowserMethods = (req, res, next) => {
    // If the user posts to the server with a property called _method, rewrite the request's method
    // To be that method; so if they post _method=PUT you can now allow browsers to POST to a route that gets
    // rewritten in this middleware to a PUT route
    if (req.body && req.body._method) {
        req.method = req.body._method;
        delete req.body._method;
    }

    // let the next middleware run:
    next();
};

// public will be our route for static files
app.use('/public', static);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rewriteUnsupportedBrowserMethods);

// using express handlebars
app.engine('handlebars', handlebarsInstance.engine);
app.set('view engine', 'handlebars');

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
  if(req.originalUrl == "/" || req.originalUrl == "/users/login" ||
   req.originalUrl == "/users/signup" || req.originalUrl == "/about") next();
  else {
    if(!loggedin && reqroute !== "/favicon.ico" && 
    (reqroute.search("/boards") === 0 || reqroute.search("/board") === 0) ||
    reqroute.search("/users") === 0) {
      res.status(403).render('error-page', { title: "403 Access Forbidden", error: true });
    }

    //if you're logged in, proceed to whatever page you were trying to access
    else {
      next();
    }
});

configRoutes(app);

app.listen(3000, () => {
    console.log("We've now got a server!");
    console.log('Your routes will be running on http://localhost:3000');
});