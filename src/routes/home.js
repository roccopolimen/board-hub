const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    res.sendFile(path.resolve('../static/show_finder.html'));
  } catch (e) {
    res.status(404).render('error-page', { title: "404 Page Not Found", error: true });
  }
});


module.exports = router;