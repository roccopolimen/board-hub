const express = require('express');
const router = express.Router();
const boardsData = require('../data/boards');

// GET /boards
// provides the page of the users boards
router.get('/', async (req, res) => {
    try {
        let userId = req.session.user._id;
        if(userId) {
            let boards = await boardsData.readAll(userId);
            res.json(boards);
        }
        else throw new Error("Logged in user must have an ID");
    } catch(e) {
        res.status(500).json({ error: e.toString() });
    }
});

// POST /boards
// adds a new board for the user with the given name
router.post('/', async (req, res) => {
// TODO:
});

module.exports = router;