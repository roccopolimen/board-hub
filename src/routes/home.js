const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/', async (req, res) => {
  try {
    if(req.session.user) {
      res.redirect('/boards');
      return;
    }
    res.sendFile(path.resolve('../src/static/home.html'));
  } catch (e) {
    res.status(500).render('error-page', { title: "500 Internal Server Error", error: true });
  }
});


module.exports = router;