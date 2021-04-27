const express = require('express');
const router = express.Router();
const userData = require('../data/users');
const xss = require('xss');
const error_handler = require('../errors/error-handler');
const bcrypt = require('bcryptjs');

router.get('/', async (req, res) => {
  try {
    res.render('profile', { title: "User Profile", user: req.session.user });
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
  const email = xss(req.body.email);
  const firstName = xss(req.body.firstName);
  const lastName = xss(req.body.lastName);
  const password = xss(req.body.password);
  try {
    if(!email || !error_handler.checkEmail(email))
      throw new Error("Email is not valid.");
      
    if(!firstName || !error_handler.checkFirstName(firstName))
      throw new Error("First name is not valid.");

    if(!lastName || !error_handler.checkLastName(lastName))
      throw new Error("Last name is not valid.");

    if(!password || !error_handler.checkNonEmptyString(password))
      throw new Error("Password is not valid.");

    let user = await userData.create(email, firstName, lastName, password);
    user.hashedPassword = null;
    req.session.user = user;
  } catch (e) {
    res.render('error-page', { title: "Invalid Sign-Up", error: true, message: "Sign-Up could not be completed." });
    return;
  }

  try{
    res.redirect('/boards');
  }catch(e){
    res.status(500).render('error-page', { title: "500 Internal Server Error", error: true });
  }
});

router.post('/login', async (req, res) => {
  const email = xss(req.body.email);
  const password = xss(req.body.password);
  let user;

  // Populate the user by email.
  try {
    if(!email || !error_handler.checkEmail(email))
      throw new Error("Email is not valid.");
    if(!password || !error_handler.checkNonEmptyString(password))
      throw new Error("Password is not valid.");
    
    user = await userData.readByEmail(email);
  } catch (e) {
    res.status(401).render('error-page', { title: "401 Invalid Log-In", error: true });
    return;
  }

  let matching = false;

  // Compare the inputted password
  try{
    matching = await bcrypt.compare(password, user.hashedPassword);
    if(!matching){
      res.status(401).render('error-page', { title: "401 Invalid Log-In", error: true });
      return;
    }
    user.hashedPassword = null;
    req.session.user = user;
    res.redirect('/boards');
  }catch(e){
    res.status(500).render('error-page', { title: "500 Internal Server Error", error: true });
  }
});

router.post('/delete', async (req, res) => {
  try {
    await userData.delete(req.session._id);
    req.session.destroy();
  } catch (e) {
    res.status(500).render('error-page', { title: "500 Internal Server Error", error: true });
  }
});


module.exports = router;
