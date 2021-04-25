const express = require('express');
const router = express.Router();
const boardsData = require('../data/boards');

/**
 * Render base page that will show a user their boards
 */
router.get('/', async (req, res) => {
    try {
        let userId = req.session.user._id;
        if(userid) {
            //read all of a user's boards
            let boards = await boardsData.readAll(userId);
            //render the boards page with their boards
            res.render('boards', { title: "Boards", theBoards: boards, loggedIn: true });
        }
        else throw new Error("Logged in user must have an ID");
    } 
    catch (error) {
        //Either boardsData.readAll() failed or they were logged in and didn't have an ID (shouldn't happen)
        res.status(500).render('error-page', { title: "500 Internal Server Error", error: true });
    }
});

module.exports = router;