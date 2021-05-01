const express = require('express');
const router = express.Router();
const boardsData = require('../data/boards');
const xss = require('xss');
const error_handler = require('../errors/error-handler');

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
    try {
        let boardName;
        if(!req.body) {
            res.status(400).json({ error: 'no data provided' });
            return;
        }
        if(xss(req.body.boardName)) {
            if(error_handler.checkNonEmptyString(xss(req.body.boardName))) {
                boardName = xss(req.body.boardName);
            } else {
                res.status(400).json({ error: 'bad boardName inputted' });
                return;
            }
        } else {
            res.status(400).json({ error: 'no board to update' });
            return;
        }
        const board = await boardsData.create(req.session.user._id.toString(), boardName);
        res.redirect(`/board/${board._id.toString()}`);
    } catch(e) {
        res.status(500).json({ error: e.toString() });
    }
});

module.exports = router;