const express = require('express');
const router = express.Router();
const boardsData = require('../data/boards');

/**
 * Render base page that will show a user their boards
 */
router.get('/', async (req, res) => {
    try {
        //check if logged in
        if(req.session.user) {
            let userId = req.session.user.id;
            if(userid) {
                //read all of a user's boards
                let boards = await boardsData.readAll(userId);
                //render the boards page with their boards
                res.render('boards', { title: "Boards", theBoards: boards, loggedIn: true });
            }
            else throw "Logged in user must have an ID";
        }
        else {
            //not logged in, should go to index
            res.redirect('/');
            return;
        }
    } 
    catch (error) {
        //Either boardsData.readAll() failed or they were logged in and didn't have an ID (shouldn't happen)
        res.render('boards', { title: "Boards Error", error: error });
    }
});