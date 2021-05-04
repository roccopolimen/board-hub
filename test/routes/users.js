const express = require('express');
const router = express.Router();
const userData = require('../data/users');
const xss = require('xss');
const error_handler = require('../errors/error-handler');
const bcrypt = require('bcryptjs');

// GET /users
// loads profile page
router.get('/', async (req, res) => {
    try {
        res.json({
            message: 'profile page',
            userId: req.session.user
        });
    } catch(e) {
        res.status(500).json({ error: 'could not load profile page' });
    }
});

// POST /users/signup
// signs up a user
router.post('/signup', async (req, res) => {

    if(req.session.user) {
        res.status(403).json({ error: 'Already logged in.' });
        return;
    }

    if(!req.body) {
        res.status(400).json({ error: 'nothing to signup.' });
        return;
    }

    try {
        if(!req.body.email || !req.body.firstName || !req.body.lastName || !req.body.password)
            throw new Error("Not all fields provided");

        const email = xss(req.body.email.trim().toLowerCase());
        const firstName = xss(req.body.firstName.trim());
        const lastName = xss(req.body.lastName.trim());
        const password = xss(req.body.password.trim());

        if(!error_handler.checkEmail(email))
            throw new Error("Email is not valid.");
        
        if(!error_handler.checkFirstName(firstName))
            throw new Error("First name is not valid.");

        if(!error_handler.checkLastName(lastName))
            throw new Error("Last name is not valid.");

        if(!error_handler.checkNonEmptyString(password))
            throw new Error("Password is not valid.");

        let user = await userData.create(email, firstName, lastName, password);
        user.hashedPassword = undefined;
        user.name = `${user.firstName} ${user.lastName}`;
        user.initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
        req.session.user = user;
    } catch (e) {
        res.status(500).json({ error: e.toString() });
        return;
    }

    try {
        res.redirect('/boards');
    } catch(e) {
        res.status(500).json({ error: 'could not redirect to boards' });
    }
});

// POST /users/login
// attempt to log in user
router.post('/login', async (req, res) => {

    if(req.session.user) {
        res.status(403).json({ error: 'Already logged in.' });
        return;
    }

    if(!req.body) {
        res.status(400).json({ error: 'nothing to login.' });
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
        res.status(401).json({ error: e.toString() });
        return;
    }

    try {
        const matching = await bcrypt.compare(password, user.hashedPassword);
        if(!matching) {
            res.status(401).json({ error: 'Password is wrong.' });
            return;
        }
        user.hashedPassword = undefined;
        user.name = `${user.firstName} ${user.lastName}`;
        user.initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
        req.session.user = user;
        res.redirect('/boards');
    } catch(e) {
        res.status(500).json({ error: e.toString() });
    }
});

// POST /users/signout
// signs out the user
router.post('/signout', (req, res) => {
    try {
        req.session.destroy();
        res.redirect('/');
    } catch (e) {
        res.status(500).json({ error: e.toString() });
    }
});

// POST /users/delete
// attempts to delete user from database
router.post('/delete', async (req, res) => {
    try {
        await userData.delete(req.session.user._id);
        res.json({ message: 'user deleted' });
    } catch (e) {
        res.status(500).json({ error: e.toString() });
    }
});

module.exports = router;
