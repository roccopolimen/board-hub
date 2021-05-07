const express = require('express');
const router = express.Router();
const userData = require('../data/users');
const xss = require('xss');
const error_handler = require('../errors/error-handler');
const bcrypt = require('bcryptjs');

router.get('/', async (req, res) => {
    try {
        res.render('profile', { title: "User Profile", user: req.session.user, partial: "user-page-scripts" });
    } catch (e) {
        res.status(500).render('error-page', { title: "500 Internal Server Error", error: true });
    }
});

router.get('/signout', (req, res) => {
    try {
        //destroy cookie
        req.session.destroy();
        //go to homepage
        res.redirect('/');
        return;
    } catch (e) {
        res.status(500).render('error-page', { title: "500 Internal Server Error", error: true });
    }
});

router.post('/signup', async (req, res) => {

    if(req.session.user) {
        res.status(403).render('error-page', { title: "403 Forbidden", message: 'user already logged in', error: true });
        return;
    }

    if(!req.body) {
        res.status(400).render('error-page', { title: "400 Bad Request", message: 'no request body provided', error: true });
        return;
    }

    let email;
    let firstName;
    let lastName;
    let password;
    let user;
    try {
        if(!req.body.email || !req.body.firstName || !req.body.lastName || !req.body.password)
            throw new Error("Not all fields provided");

        email = xss(req.body.email.trim().toLowerCase());
        firstName = xss(req.body.firstName.trim());
        lastName = xss(req.body.lastName.trim());
        password = xss(req.body.password.trim());

        if(!error_handler.checkEmail(email))
            throw new Error("Email is not valid.");
        
        if(!error_handler.checkFirstName(firstName))
            throw new Error("First name is not valid.");

        if(!error_handler.checkLastName(lastName))
            throw new Error("Last name is not valid.");

        if(!error_handler.checkNonEmptyString(password))
            throw new Error("Password is not valid.");
        user = await userData.create(email, firstName, lastName, password);
    } catch (e) {
        res.json({error: true});
        return;
    }

    try {
        user.hashedPassword = undefined;
        user.name = `${user.firstName} ${user.lastName}`;
        user.initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
        req.session.user = user;
    } catch(e) {
        res.status(500).render('error-page', { title: "500 Internal Server Error", message: e.toString(), error: true });
        return;
    }

    try {
        res.json({});
    } catch(e) {
        res.status(500).render('error-page', { title: "500 Internal Server Error", message: e.toString(), error: true });
    }
});

router.post('/login', async (req, res) => {

    if(req.session.user) {
        res.status(403).render('error-page', { title: "403 Forbidden", message: 'user already logged in', error: true });
        return;
    }

    if(!req.body) {
        res.status(400).render('error-page', { title: "400 Bad Request", message: 'no request body provided', error: true });
        return;
    }

    let email;
    let password;
    let user;

    // Populate the user by email.
    try {

        if(!req.body.email || !req.body.password)
            throw new Error("Not all fields provided.");

        email = xss(req.body.email.trim().toLowerCase());
        password = xss(req.body.password);

        if(!email || !error_handler.checkEmail(email))
            throw new Error("Email is not valid.");
        if(!password || !error_handler.checkNonEmptyString(password))
            throw new Error("Password is not valid.");
            
        user = await userData.readByEmail(email);
    } catch (e) {
        res.json( {error: true } );
        return;
    }

    try {
        const matching = await bcrypt.compare(password, user.hashedPassword);
        if(!matching) {
            res.json( {error: true } );
            return;
        }
        user.hashedPassword = undefined;
        user.name = `${user.firstName} ${user.lastName}`;
        user.initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
        req.session.user = user;
        res.json({});
    } catch(e) {
        res.status(500).render('error-page', { title: "500 Internal Server Error", message: e.toString(), error: true });
    }
});

router.put('/password', async (req, res) => {
    if(!req.body) {
        res.status(400).render('error-page', { title: "400 Bad Request", message: 'no request body provided', error: true });
        return;
    }

    let password;

    try {
        if(!req.body.oldPass || !req.body.newPass)
            throw new Error("Passwords not provided.");
    }catch(e) {
        res.json({error: true});
        return;
    }

    try {
        user = await userData.readById(req.session.user._id);
        const matching = await bcrypt.compare(xss(req.body.oldPass), user.hashedPassword);
        if(!matching) {
            res.json( {error: true } );
            return;
        }
    } catch(e) {
        res.status(500).render('error-page', { title: "500 Internal Server Error", message: e.toString(), error: true });
        return;
    }

    try {
        password = xss(req.body.newPass);
        if(!password || !error_handler.checkNonEmptyString(password))
            throw new Error("Password is not valid.");
        await userData.update_password(req.session.user._id, password);
        res.json({});
    }catch(e) {
        res.json({error: true});
    }
});

router.post('/delete', async (req, res) => {
    try {
        await userData.delete(req.session.user._id);
        req.session.destroy();
        res.redirect('/');
    } catch (e) {
        res.status(500).render('error-page', { title: "500 Internal Server Error", error: true });
    }
});


module.exports = router;
