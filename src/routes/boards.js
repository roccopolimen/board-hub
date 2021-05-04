const express = require('express');
const router = express.Router();
const boardsData = require('../data/boards');
const xss = require('xss');
const error_handler = require('../errors/error-handler');

/**
 * Render base page that will show a user their boards
 */
router.get('/', async (req, res) => {
    try {
        let userId = req.session.user._id;
        if(userId) {
            //read all of a user's boards
            let boards = await boardsData.readAll(userId);
            //render the boards page with their boards
            res.render('boards', { title: "Boards", boards: boards, loggedIn: true, user: req.session.user });
        }
        else throw new Error("Logged in user must have an ID");
    } 
    catch (e) {
        //Either boardsData.readAll() failed or they were logged in and didn't have an ID (shouldn't happen)
        res.status(500).render('error-page', { title: "500 Internal Server Error", message: e.toString(), error: true });
    }
});

// POST /boards
// adds a new board for the user with the given name
router.post('/', async (req, res) => {
    try {
        let boardName;
        if(!req.body) {
            res.status(400).render('error-page', { title: "400 Bad Request", message: 'no request body provided', error: true });
            return;
        }
        if(xss(req.body.boardName)) {
            if(error_handler.checkNonEmptyString(xss(req.body.boardName))) {
                boardName = xss(req.body.boardName);
            } else {
                res.status(400).render('error-page', { title: "400 Bad Request", message: 'invalid boardName', error: true });
                return;
            }
        } else {
            res.status(400).render('error-page', { title: "400 Bad Request", message: 'no board to update', error: true });
            return;
        }
        const board = await boardsData.create(req.session.user._id.toString(), boardName);
        res.redirect(`/board/${board._id.toString()}`);
    } catch(e) {
        res.status(500).json({ error: e.toString() });
    }
});

module.exports = router;