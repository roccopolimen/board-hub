const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/', async (req, res) => {
  try {
    res.sendFile(path.resolve('../src/static/home.html'));
  } catch (e) {
    res.status(404).render('error-page', { title: e, error: true });
  }
});


module.exports = router;