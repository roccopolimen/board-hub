const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/', async (req, res) => {
  try {
    res.render('profile', { title: "User Profile", user: req.session.user });
  } catch (e) {
    res.status(500).render('error-page', { title: "500 Internal Server Error", error: true });
  }
});


module.exports = router;
