const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/', async (req, res) => {
  if(!req.session.user) {
    res.status(403).render('error-page', { title: "403 Forbidden", error: true });
    return;
  }
  try {
    res.render('profile', { title: "User Profile", user: req.session.user });
  } catch (e) {
    res.status(500).render('error-page', { title: "500 Internal Server Error", error: true });
  }
});


module.exports = router;