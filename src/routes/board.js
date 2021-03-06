const express = require('express');
const router = express.Router();
const fs = require('fs');
const data = require('../data');
const usersData = data.users;
const boardsData = data.boards;
const cardsData = data.cards;
const listsData = data.lists;
const labelsData = data.labels;
const commentsData = data.comments;
const calData = data.calendar;
const {
    checkObjectId,
    checkString,
    checkBoolean,
    checkNonEmptyString,
    checkNumber,
    checkPositiveNumber,
    checkNegativeNumber,
    checkStoryPoint,
    checkEmail,
    checkFirstName,
    checkLastName,
    checkColor,
    checkArrayObjectId,
    checkDate,
    checkTime,
    checkDueDate,
    checkLabel,
    checkArrayOfLabels
} = require('../errors/error-handler'); 
const ObjectId = require('mongodb').ObjectID;
const xss = require('xss');
const bcrypt = require('bcryptjs');

// HELPER FUNCTIONS
const makeName = (first, last) => {
    return `${first} ${last}`;
};

const getInitials = (first, last) => {
    return `${first.charAt(0)}${last.charAt(0)}`;
};

const reformatDueDate = (dueDate) => {
    if(!dueDate)
        return undefined;

    let dateParts = dueDate.date.split('*');
    return {
        date: dateParts[0],
        time: dateParts[1],
        done: dueDate.done
    };
};

const reformatDate = (date) => {
    let dateParts = date.split('*');
    return {
        date: dateParts[0],
        time: dateParts[1],
    };
};

const getDate = (date) => {
    return date.split('*')[0];
};

const getTime = (date) => {
    return date.split('*')[1];
};

const equalMembers = (l1, l2) => {
    const setofIds = {};
    for(let id of l1)
        setofIds[id] = 1;
    for(let id of l2) {
        if(!setofIds[id.toString()])
            return false;
        setofIds[id.toString()] = 2;
    }
    for(let key in setofIds)
        if(setofIds[key] === 1)
            return false;
    return true;
};

// GET /board/calendar/{id}
// request to download a calendar of the board
router.get('/calendar/:id', async (req, res) => {

    const id = req.params.id;
    if(!id || !checkNonEmptyString(id) || !checkObjectId(id)) {
        res.status(400).render('error-page', { title: "400 ID of Board not proper ID", error: true });
        return;
    }

    let boardInfo = {};
    try {
        boardInfo = await boardsData.readById(id);
    } catch(e) {
        res.status(404).render('error-page', { title: "404 Board not Found.", message: e.toString(), error: true });
        return;
    }

    try {
        let foundUser = false;
        for(memberId of boardInfo.members) {
            if(req.session.user._id === memberId.toString()) {
                foundUser = true;
                break;
            }
        }
        if(!foundUser)
            throw new Error("Not your board, therefore can not see card.")
    } catch(e) {
        res.status(403).render('error-page', { title: "403 Forbidden", message: e.toString(), error: true });
        return;
    }

    try {
        const calPath = await calData.makeCal(boardInfo._id.toString(), boardInfo.boardName);
        res.download(calPath, err => {fs.unlinkSync(calPath)}); // send to user for download, and delete after
    } catch(e) {
        res.status(500).render('error-page', { title: "500 Internal Error", message: e.toString(), error: true });
    }
});

// GET /board/gcal/{boardId}/{cardId}
// request to generate a google event for a card
router.get('/gcal/:boardId/:cardId', async (req, res) => {

    const boardId = req.params.boardId;
    if(!boardId || !checkNonEmptyString(boardId) || !checkObjectId(boardId)) {
        res.status(400).render('error-page', { title: "400 ID of Board not proper ID", error: true });
        return;
    }

    const cardId = req.params.cardId;
    if(!cardId || !checkNonEmptyString(cardId) || !checkObjectId(cardId)) {
        res.status(400).render('error-page', { title: "400 ID of Card not proper ID", error: true });
        return;
    }

    let boardInfo = {};
    try {
        boardInfo = await boardsData.readById(boardId);
    } catch(e) {
        res.status(404).render('error-page', { title: "404 Board not Found.", message: e.toString(), error: true });
        return;
    }

    try {
        let foundUser = false;
        for(memberId of boardInfo.members) {
            if(req.session.user._id === memberId.toString()) {
                foundUser = true;
                break;
            }
        }
        if(!foundUser)
            throw new Error("Not your board, therefore can not see card.")
    } catch(e) {
        res.status(403).render('error-page', { title: "403 Forbidden", message: e.toString(), error: true });
        return;
    }

    try {
        const gCalLink = await calData.gCal(boardInfo._id.toString(), cardId);
        res.json({link: gCalLink});
    } catch(e) {
        res.status(500).render('error-page', { title: "500 Internal Error", message: e.toString(), error: true });
    }
});

// GET /board/{id}
// Main board page with all lists and cards shown
router.get('/:id', async (req, res) => {

    const id = req.params.id;
    if(!id || !checkNonEmptyString(id) || !checkObjectId(id)) {
        res.status(400).render('error-page', { title: "400 ID of Board not proper ID", error: true });
        return;
    }

    let boardInfo = {};
    try {
        boardInfo = await boardsData.readById(id);
    } catch(e) {
        res.status(404).render('error-page', { title: "404 Board not Found.", message: e.toString(), error: true });
        return;
    }

    const memberMap = {};
    try {
        for(let memberId of boardInfo.members) {
            const memberData = await usersData.readById(memberId.toString());
            memberMap[memberId.toString()] = {
                name: makeName(memberData.firstName, memberData.lastName),
                initials: getInitials(memberData.firstName, memberData.lastName),
                color: memberData.color
            };
        }

        if(!memberMap[req.session.user._id]) {
            res.status(403).render('error-page', { title: "403 User not member of this board", error: true });
            return;
        }
    } catch(e) {
        res.status(500).render('error-page', { title: "500 Internal Error", message: e.toString(), error: true });
        return;
    }
    
    const listOfListsOfCards = [];
    try {
        let listPosition = 1;
        for(let list of boardInfo.lists) {
            const listOfCards = {
                _id: list._id.toString(),
                listName: list.listName,
                position: listPosition,
                cards: []
            };
            let cardPosition = 1;
            for(let cardId of list.cardIds) {
                const card = await cardsData.readById(id, cardId.toString());
                const cardInfo = {
                    _id: card._id.toString(),
                    position: cardPosition,
                    name: card.cardName,
                    storyPoints: card.storyPoints,
                    description: card.description,
                    labels: card.labels,
                    dueDate: reformatDueDate(card.dueDate),
                    comments: [],
                    assigned: [],
                    list: list._id.toString(),
                };
                for(let comment of card.comments) {
                    const commentInfo = {
                        _id: comment._id.toString(),
                        user: memberMap[comment.user],
                        date: reformatDate(comment.date),
                        comment: comment.comment
                    };
                    cardInfo.comments.push(commentInfo);
                }
                for(let assignedId of card.assigned)
                    cardInfo.assigned.push(memberMap[assignedId.toString()]);

                listOfCards.cards.push(cardInfo);
                cardPosition++;
            }
            listOfListsOfCards.push(listOfCards);
            listPosition++;
        }
    } catch(e) {
        res.status(500).render('error-page', { title: "500 Internal Error", message: e.toString(), error: true });
        return;
    }

    try {
        const members = [];
        for(let key in memberMap) {
            let value = memberMap[key];
            members.push({ name: value.name, initials: value.initials, color: value.color });
        }

        const renderInfo = {
            _id: boardInfo._id.toString(),
            name: boardInfo.boardName,
            color: boardInfo.boardColor,
            description: boardInfo.description,
            data: listOfListsOfCards
        };
    
        res.render('board', { title: boardInfo.boardName, board: renderInfo, members: members, user: req.session.user, partial: 'board-page-script' });
    } catch(e) {
        res.status(500).render('error-page', { title: "500 Internal Error", message: e.toString(), error: true });
    }
});

// POST /board/{id}
// adds a list to the board
router.post('/:id', async (req, res) => {
    const id = req.params.id;
    if(!id || !checkNonEmptyString(id) || !checkObjectId(id)) {
        res.status(400).render('error-page', { title: "400 ID of Board not proper ID", error: true });
        return;
    }

    let boardInfo = {};
    try {
        boardInfo = await boardsData.readById(id);
    } catch(e) {
        res.status(404).render('error-page', { title: "404 Board not Found.", message: e.toString(), error: true });
        return;
    }

    try {
        let foundUser = false;
        for(memberId of boardInfo.members) {
            if(req.session.user._id === memberId.toString()) {
                foundUser = true;
                break;
            }
        }
        if(!foundUser)
            throw new Error("Not your board, therefore can not edit list.")
    } catch(e) {
        res.status(403).render('error-page', { title: "403 Forbidden", message: e.toString(), error: true });
        return;
    }

    const newData = req.body;
    if(!newData) {
        res.status(400).render('error-page', { title: "400 Bad Request", message: 'no body provided.', error: true });
        return;
    }

    let listNameInfo = {};
    if(xss(newData.listName) !== undefined) {
        if(checkNonEmptyString(xss(newData.listName))) {
            listNameInfo.listName = xss(newData.listName);
        } else {
            res.status(400).render('error-page', { title: "400 Bad Request", message: 'invalid listName', erorr: true });
            return;
        }
    }

    if(Object.keys(listNameInfo).length !== 1) {
        res.status(400).render('error-page', { title: "400 Bad Request", message: 'no listName provided', erorr: true });
        return;
    }
    
    try {
        const { listName } = listNameInfo;
        const listId = await listsData.addList(listName, id);
        res.json({ listName: listName, boardId: id, listId: listId });
    } catch(e) {
        res.status(500).render('error-page', { title: "500 Internal Error", message: e.toString(), error: true });
    }
});

// GET /board/card/{boardId}/{cardId}
// modal focused on the selected card
router.get('/card/:boardId/:cardId', async (req, res) => {

    const boardId = req.params.boardId;
    const cardId = req.params.cardId;
    if(!boardId || !checkNonEmptyString(boardId) || !checkObjectId(boardId)) {
        res.status(400).render('error-page', { title: "400 ID of Board not proper ID", error: true });
        return;
    }
    if(!cardId || !checkNonEmptyString(cardId) || !checkObjectId(cardId)) {
        res.status(400).render('error-page', { title: "400 Id of card not proper ID", error: true });
        return;
    }

    let boardInfo = {};
    try {
        boardInfo = await boardsData.readById(boardId);
    } catch(e) {
        res.status(404).render('error-page', { title: "404 Board not Found.", message: e.toString(), error: true });
        return;
    }

    const memberMap = {};
    try {
        for(let memberId of boardInfo.members) {
            const memberData = await usersData.readById(memberId.toString());
            memberMap[memberId.toString()] = {
                name: makeName(memberData.firstName, memberData.lastName),
                initials: getInitials(memberData.firstName, memberData.lastName),
                color: memberData.color
            };
        }

        if(!memberMap[req.session.user._id]) {
            res.status(403).render('error-page', { title: "403 User not member of this board", error: true });
            return;
        }
    } catch(e) {
        res.status(500).render('error-page', { title: "500 Internal Error", message: e.toString(), error: true });
        return;
    }

    let listInfo = {};
    try {
        listInfo = await listsData.getAllListsInBoard(boardId);
    } catch(e) {
        res.status(500).render('error-page', { title: "500 Internal Error", message: e.toString(), error: true });
    }

    let card = {};
    try {
        card = await cardsData.readById(boardId, cardId);
    } catch(e) {
        res.status(404).render('error-page', { title: "404 Card not Found.", message: e.toString(), error: true });
        return;
    }
    
    let cardInfo = {};
    let positions = [];
    try {
        cardInfo = {
            _id: card._id.toString(),
            position: -1,
            name: card.cardName,
            storyPoints: card.storyPoints,
            description: card.description,
            labels: card.labels,
            dueDate: reformatDueDate(card.dueDate),
            comments: [],
            members: [],
            list: card.list.toString(),
        };
        const listInfo = await listsData.readById(boardId, cardInfo.list);
        positions = [...Array(listInfo.cardIds.length+1).keys()].slice(1);
        let cardPosition = 1;
        for(cId of listInfo.cardIds) {
            if(cId.toString() === cardId)
                break;
            cardPosition++;
        }
        if(cardPosition === listInfo.cardIds.length+1)
            throw new Error("Card not in list");
        cardInfo.position = cardPosition;
        for(let comment of card.comments) {
            const commentInfo = {
                _id: comment._id.toString(),
                user: memberMap[comment.user.toString()],
                date: reformatDate(comment.date),
                comment: comment.comment
            };
            cardInfo.comments.push(commentInfo);
        }
        let assigned = [];
        for(let assignedId of card.assigned)
           assigned.push(assignedId.toString());
        for(let key in memberMap) {
            let value = memberMap[key];
            if(assigned.includes(key))
                cardInfo.members.push({ name: value.name, initials: value.initials, assigned: true, _id: key, color: value.color });
            else
                cardInfo.members.push({ name: value.name, initials: value.initials, assigned: false, _id: key, color: value.color });
        }
    } catch(e) {
        res.status(500).render('error-page', { title: "500 Internal Error", message: e.toString(), error: true });
        return;
    }
    try {
        res.render('partials/card', { layout: null, card: cardInfo, list: listInfo, positions: positions, boardId: boardId });
    } catch(e) {
        res.status(500).render('error-page', { title: "500 Internal Error", message: e.toString(), error: true });
    }

});

// PATCH /board/card/{boardId}/{cardId}
// edit card
router.patch('/card/:boardId/:cardId', async (req, res) => {

    const boardId = req.params.boardId;
    const cardId = req.params.cardId;
    if(!boardId || !checkNonEmptyString(boardId) || !checkObjectId(boardId)) {
        res.status(400).render('error-page', { title: "400 ID of Board not proper ID", error: true });
        return;
    }
    if(!cardId || !checkNonEmptyString(cardId) || !checkObjectId(cardId)) {
        res.status(400).render('error-page', { title: "400 Id of card not proper ID", error: true });
        return;
    }

    const newData = req.body;
    if(!newData) {
        res.status(400).render('error-page', { title: "400 Bad Request", message: 'no body provided.', error: true });
        return;
    }

    const updatedCardData = {};

    let boardInfo = {};
    try {
        boardInfo = await boardsData.readById(boardId);
    } catch(e) {
        res.status(404).render('error-page', { title: "404 Board not Found.", message: e.toString(), error: true });
        return;
    }

    let oldCard = {};
    try {
        oldCard = await cardsData.readById(boardId, cardId);
    } catch(e) {
        res.status(404).render('error-page', { title: "404 Card not Found.", message: e.toString(), error: true });
        return;
    }

    const memberMap = {};
    try {
        for(let memberId of boardInfo.members) {
            const memberData = await usersData.readById(memberId.toString());
            memberMap[memberId.toString()] = {
                name: makeName(memberData.firstName, memberData.lastName),
                initials: getInitials(memberData.firstName, memberData.lastName)
            };
        }

        if(!memberMap[req.session.user._id]) {
            res.status(403).render('error-page', { title: "403 User not member of this board", error: true });
            return;
        }
    } catch(e) {
        res.status(500).render('error-page', { title: "500 Internal Error", message: e.toString(), error: true });
        return;
    }

    if(newData.cardName !== undefined && xss(newData.cardName) !== oldCard.cardName) {
        if(checkNonEmptyString(xss(newData.cardName))) {
            updatedCardData.cardName = xss(newData.cardName);
        } else {
            res.status(400).render('error-page', { title: "400 Bad Request", message: 'invalid cardName', error: true });
            return;
        }
    }
    if(newData.storyPoints !== undefined) {
        let sP = 0;
        try {
            if(newData.storyPoints != '0' && newData.storyPoints !== 'NaN')
                sP = parseInt(xss(newData.storyPoints));
        } catch(e) {
            res.status(400).render('error-page', { title: "400 Bad Request", message: 'invalid storyPoints(NaN)', error: true });
            return;
        }
        if(sP !== oldCard.storyPoints) {
            if(checkStoryPoint(sP)) {
                updatedCardData.storyPoints = sP;
            } else if(sP === 0) {
                updatedCardData.storyPoints = null; // remove storyPoints
            } else {
                res.status(400).render('error-page', { title: "400 Bad Request", message: 'invalid storyPoints', error: true });
                return;
            }
        }
    }
    if(newData.description !== undefined && xss(newData.description) !== oldCard.description) {
        if(checkString(xss(newData.description))) {
            updatedCardData.description = xss(newData.description);
        } else {
            res.status(400).render('error-page', { title: "400 Bad Request", message: 'invalid description', error: true });
            return;
        }
    }
    // labels won't be edited here.
    if(oldCard.dueDate !== undefined) {
        if(newData.date && xss(newData.date) !== getDate(oldCard.dueDate.date)) {
            if(checkDate(xss(newData.date))) {
                updatedCardData.date = xss(newData.date);
            } else {
                res.status(400).render('error-page', { title: "400 Bad Request", message: 'invalid date', error: true });
                return;
            }
        }
        if(newData.time && xss(newData.time) !== getTime(oldCard.dueDate.date)) {
            if(checkTime(xss(newData.time))) {
                updatedCardData.time = xss(newData.time);
            } else {
                res.status(400).render('error-page', { title: "400 Bad Request", message: 'invalid time', error: true });
                return;
            }
        }

        if(newData.done !== undefined) {
            newData.done = (xss(newData.done) === 'true');
            if(newData.done !== oldCard.dueDate.done) {
                if(checkBoolean(newData.done)) {
                    updatedCardData.done = newData.done;
                } else {
                    res.status(400).render('error-page', { title: "400 Bad Request", message: 'invalid dueDate status', error: true });
                    return;
                }
            }
        }
    }
    else {
        if(newData.date) {
            if(checkDate(xss(newData.date))) {
                updatedCardData.date = xss(newData.date);
            } else {
                res.status(400).render('error-page', { title: "400 Bad Request", message: 'invalid date', error: true });
                return;
            }
        }
        if(newData.time) {
            if(checkTime(xss(newData.time))) {
                updatedCardData.time = xss(newData.time);
            } else {
                res.status(400).render('error-page', { title: "400 Bad Request", message: 'invalid time', error: true });
                return;
            }
        }

        if(newData.done !== undefined) {
            newData.done = (xss(newData.done) === 'true');
            if(checkBoolean(newData.done)) {
                updatedCardData.done = newData.done;
            } else {
                res.status(400).render('error-page', { title: "400 Bad Request", message: 'invalid dueDate status', error: true });
                return;
            }
        }
    }
    
    // comments won't be edited here.
    if(newData.assigned !== undefined) { // not using xss as if it is not array, code will throw.
        if(newData.assigned === '')
            newData.assigned = [];
        if(checkArrayObjectId(newData.assigned)) {
            if(!equalMembers(newData.assigned, oldCard.assigned)) {
                for(let assignedId of newData.assigned) {
                    if(!memberMap[assignedId]) {
                        res.status(403).render('error-page', { title: "403 Forbidden", message: 'attempt to assign user to card who is not a member of this board', error: true });
                        return;
                    }
                }
                updatedCardData.assigned = newData.assigned;
            }
        } else {
            res.status(400).render('error-page', { title: "400 Bad Request", message: 'invalid assigned list', error: true });
            return;
        }
    }
    if(newData.list !== undefined && xss(newData.list) !== oldCard.list.toString()) {
        if(checkNonEmptyString(xss(newData.list)) && checkObjectId(xss(newData.list))) {
            let foundListInBoard = false;
            for(let listId of boardInfo.lists) {
                if(newData.list === listId._id.toString()) {
                    foundListInBoard = true;
                    break;
                }
            }
            if(!foundListInBoard) {
                res.status(403).render('error-page', { title: "403 Forbidden", message: 'list is not on this board', error: true });
                return;
            }
            updatedCardData.list = xss(newData.list);
        } else {
            res.status(400).render('error-page', { title: "400 Bad Request", message: 'invalid listId', error: true });
            return;
        }
    }
    if(newData.position) {
        let position = parseInt(xss(newData.position));
        if(checkPositiveNumber(position)) {
            updatedCardData.position = position;
        } else {
            res.status(400).render('error-page', { title: "400 Bad Request", message: 'invalid position', error: true });
            return;
        }
    }
    if(Object.keys(updatedCardData).length === 0) {
        res.status(400).render('error-page', { title: "400 Bad Request", message: 'No values needed updating.', error: true });
        return;
    }

    try {
        const { cardName, storyPoints, description, date, time, done, list, assigned, position } = updatedCardData;

        if(list) // change the list
            await listsData.moveCardIdBetweenLists(list, cardId, boardId);
        else { // or change the position (if neither, nothing will change)
            await listsData.moveCardInList(boardId, cardId, oldCard.list.toString(), position);
        } // update the card's data
        await cardsData.updateCard(boardId, cardId, list, cardName, storyPoints, description, date, time, done, assigned);
        res.json({ boardId: boardId });
    } catch(e) {
        res.status(500).render('error-page', { title: "500 Internal Error", message: e.toString(), error: true });
    }

});

// GET /board/card/labels/{boardId}/{cardId}
// bring up modal to edit labels
router.get('/card/labels/:boardId/:cardId', async (req, res) => {

    const boardId = req.params.boardId;
    const cardId = req.params.cardId;
    if(!boardId || !checkNonEmptyString(boardId) || !checkObjectId(boardId)) {
        res.status(400).render('error-page', { title: "400 ID of Board not proper ID", error: true });
        return;
    }
    if(!cardId || !checkNonEmptyString(cardId) || !checkObjectId(cardId)) {
        res.status(400).render('error-page', { title: "400 Id of card not proper ID", error: true });
        return;
    }

    let boardInfo = {};
    try {
        boardInfo = await boardsData.readById(boardId);
    } catch(e) {
        res.status(404).render('error-page', { title: "404 Board not Found.", message: e.toString(), error: true });
        return;
    }

    try {
        let foundUser = false;
        for(memberId of boardInfo.members) {
            if(req.session.user._id === memberId.toString()) {
                foundUser = true;
                break;
            }
        }
        if(!foundUser)
            throw new Error("Not your board, therefore can not see card.")
    } catch(e) {
        res.status(403).render('error-page', { title: "403 Forbidden", message: e.toString(), error: true });
        return;
    }

    let cardInfo = {};
    try {
        cardInfo = await cardsData.readById(boardId, cardId);
    } catch(e) {
        res.status(404).render('error-page', { title: "404 Card not Found.", message: e.toString(), error: true });
        return;
    }

    try {
        const labelsInfo = await labelsData.getAllLabels(boardId, cardId);
        res.render('partials/labels', { layout: null, labels: labelsInfo, boardId: boardId, cardId: cardId })
    } catch(e) {
        res.status(500).render('error-page', { title: "500 Internal Error", message: e.toString(), error: true });
        return;
    }

});

// PATCH /board/card/labels/{boardId}/{cardId}
// edit labels
router.patch('/card/labels/:boardId/:cardId', async (req, res) => {

    const newData = req.body;
    if(!newData) {
        res.status(400).render('error-page', { title: "400 Bad Request", message: 'no body provided.', error: true });
        return;
    }

    const boardId = req.params.boardId;
    const cardId = req.params.cardId;
    if(!boardId || !checkNonEmptyString(boardId) || !checkObjectId(boardId)) {
        res.status(400).render('error-page', { title: "400 ID of Board not proper ID", error: true });
        return;
    }
    if(!cardId || !checkNonEmptyString(cardId) || !checkObjectId(cardId)) {
        res.status(400).render('error-page', { title: "400 Id of card not proper ID", error: true });
        return;
    }

    let boardInfo = {};
    try {
        boardInfo = await boardsData.readById(boardId);
    } catch(e) {
        res.status(404).render('error-page', { title: "404 Board not Found.", message: e.toString(), error: true });
        return;
    }

    try {
        let foundUser = false;
        for(memberId of boardInfo.members) {
            if(req.session.user._id === memberId.toString()) {
                foundUser = true;
                break;
            }
        }
        if(!foundUser)
            throw new Error("Not your board, therefore can not see card.")
    } catch(e) {
        res.status(403).render('error-page', { title: "403 Forbidden", message: e.toString(), error: true });
        return;
    }

    let cardInfo = {};
    try {
        cardInfo = await cardsData.readById(boardId, cardId);
    } catch(e) {
        res.status(404).render('error-page', { title: "404 Card not Found.", message: e.toString(), error: true });
        return;
    }

    let labelsInfo = {};
    try {
        labelsInfo = await labelsData.getAllLabels(boardId, cardId);
    } catch(e) {
        res.status(404).render('error-page', { title: "404 Labels not Found.", message: e.toString(), error: true });
        return;
    }

    let updatedLabelInfo = {};
    if(xss(newData.labelIds) === undefined) {
        res.status(400).render('error-page', { title: "400 Bad Request", message: 'missing labelIds', error: true });
        return;
    } else {
        if(newData.labelIds === '')
            newData.labelIds = [];
        if(!checkArrayObjectId(newData.labelIds)) {
            res.status(400).render('error-page', { title: "400 Bad Request", message: 'invalid labelIds', error: true });
            return;
        } else {
            for(let labelId of newData.labelIds) {
                let foundMatch = false;
                for(let cardLabelId of cardInfo.labels) {
                    if(labelId === cardLabelId._id.toString()) {
                        foundMatch = true;
                        break;
                    }
                }
                if(!foundMatch) {
                    res.status(400).render('error-page', { title: "400 Bad Request", message: 'nonexistent label', erorr: true });
                    return;
                }
            }
            updatedLabelInfo.labels = newData.labelIds;
        }
        if(xss(newData.newLabelName) !== undefined && newData.newLabelName.trim().length !== 0) {
            if(!checkNonEmptyString(xss(newData.newLabelName))) {
                res.status(400).render('error-page', { title: "400 Bad Request", message: 'invalid new label', erorr: true });
                return;
            } else {
                updatedLabelInfo.newLabelName = newData.newLabelName;
            }
        }
    }

    if(Object.keys(updatedLabelInfo).length === 0) {
        res.status(400).render('error-page', { title: "400 Bad Request", message: 'no labels need updating', erorr: true });
        return;
    }

    try {
        const { labels, newLabelName } = updatedLabelInfo;
        await labelsData.updateLabels(boardId, cardId, labels);
        if(newLabelName)
            await labelsData.addLabel(boardId, cardId, newLabelName);
        const labelsInfo = await labelsData.getAllLabels(boardId, cardId);
        res.json({ labelsInfo: labelsInfo, cardId: cardId });
    } catch(e) {
        res.status(500).render('error-page', { title: "500 Internal Error", message: e.toString(), error: true });
    }
});

// GET /board/card/comments/{boardId}/{cardId}
// brings up modal to edit and read comments
router.get('/card/comments/:boardId/:cardId', async (req, res) => {

    const boardId = req.params.boardId;
    const cardId = req.params.cardId;
    if(!boardId || !checkNonEmptyString(boardId) || !checkObjectId(boardId)) {
        res.status(400).render('error-page', { title: "400 ID of Board not proper ID", error: true });
        return;
    }
    if(!cardId || !checkNonEmptyString(cardId) || !checkObjectId(cardId)) {
        res.status(400).render('error-page', { title: "400 Id of card not proper ID", error: true });
        return;
    }

    let boardInfo = {};
    try {
        boardInfo = await boardsData.readById(boardId);
    } catch(e) {
        res.status(404).render('error-page', { title: "404 Board not Found.", message: e.toString(), error: true });
        return;
    }

    const memberMap = {};
    try {
        for(let memberId of boardInfo.members) {
            const memberData = await usersData.readById(memberId.toString());
            memberMap[memberId.toString()] = {
                name: makeName(memberData.firstName, memberData.lastName),
                initials: getInitials(memberData.firstName, memberData.lastName),
                color: memberData.color
            };
        }

        if(!memberMap[req.session.user._id]) {
            res.status(403).render('error-page', { title: "403 User not member of this board", error: true });
            return;
        }
    } catch(e) {
        res.status(500).render('error-page', { title: "500 Internal Error", message: e.toString(), error: true });
        return;
    }

    let cardInfo = {};
    try {
        cardInfo = await cardsData.readById(boardId, cardId);
    } catch(e) {
        res.status(404).render('error-page', { title: "404 Card not Found.", message: e.toString(), error: true });
        return;
    }

    try {
        const commentInfo = await commentsData.readAll(boardId, cardId);
        for(let index in commentInfo) {
            commentInfo[index].user = memberMap[commentInfo[index].user.toString()];
            commentInfo[index].time = getTime(commentInfo[index].date);
            commentInfo[index].date = getDate(commentInfo[index].date);
        }
        res.render('partials/comment', { layout: null, comments: commentInfo, boardId: boardId, cardId: cardId });
    } catch(e) {
        res.status(500).render('error-page', { title: "500 Internal Error", message: e.toString(), error: true });
        return;
    }
});

// PUT /board/card/comments/{boardId}/{cardId}
// adds a comment to the card
router.put('/card/comments/:boardId/:cardId', async (req, res) => {

    const userId = req.session.user._id;

    const boardId = req.params.boardId;
    const cardId = req.params.cardId;
    if(!boardId || !checkNonEmptyString(boardId) || !checkObjectId(boardId)) {
        res.status(400).render('error-page', { title: "400 ID of Board not proper ID", error: true });
        return;
    }
    if(!cardId || !checkNonEmptyString(cardId) || !checkObjectId(cardId)) {
        res.status(400).render('error-page', { title: "400 Id of card not proper ID", error: true });
        return;
    }

    let boardInfo = {};
    try {
        boardInfo = await boardsData.readById(boardId);
    } catch(e) {
        res.status(404).render('error-page', { title: "404 Board not Found.", message: e.toString(), error: true });
        return;
    }

    try {
        let foundUser = false;
        for(memberId of boardInfo.members) {
            if(req.session.user._id === memberId.toString()) {
                foundUser = true;
                break;
            }
        }
        if(!foundUser)
            throw new Error("Not your board, therefore can not see card.")
    } catch(e) {
        res.status(403).render('error-page', { title: "403 Forbidden", message: e.toString(), error: true });
        return;
    }

    let cardInfo = {};
    try {
        cardInfo = await cardsData.readById(boardId, cardId);
    } catch(e) {
        res.status(404).render('error-page', { title: "404 Card not Found.", message: e.toString(), error: true });
        return;
    }

    const newData = req.body;
    if(!newData) {
        res.status(400).render('error-page', { title: "400 Bad Request", message: 'no body provided.', error: true });
        return;
    }

    let comment;
    if(xss(newData.comment) !== undefined) {
        if(checkNonEmptyString(xss(newData.comment))) {
            comment = xss(newData.comment);
        } else {
            res.status(400).render('error-page', { title: "400 Bad Request", message: 'invalid comment', erorr: true });
            return;
        }
    } else {
        res.status(400).render('error-page', { title: "400 Bad Request", message: 'no comment', erorr: true });
        return;
    }

    try {
        const today = new Date();
        const date = `${('0'+(today.getMonth()+1)).slice(-2)}/${('0'+today.getDate()).slice(-2)}/${today.getFullYear()}*${('0'+today.getHours()).slice(-2)}:${('0'+today.getMinutes()).slice(-2)}`;
        await commentsData.create(userId, boardId, cardId, date, comment);
        res.json({ initials: req.session.user.initials, comment: comment, color: req.session.user.color });
    } catch(e) {
        res.status(500).render('error-page', { title: "500 Internal Error", message: e.toString(), error: true });
    }

});

// POST /board/remove/{id}
// request to be removed from the board
router.post('/remove/:id', async (req, res) => {
    const userId = req.session.user._id;

    const id = req.params.id;
    if(!id || !checkNonEmptyString(id) || !checkObjectId(id)) {
        res.status(400).render('error-page', { title: "400 ID of Board not proper ID", error: true });
        return;
    }
    
    let boardInfo = {};
    try {
        boardInfo = await boardsData.readById(id);
    } catch(e) {
        res.status(404).render('error-page', { title: "404 Board not Found.", message: e.toString(), error: true });
        return;
    }

    try {
        let foundUser = false;
        for(memberId of boardInfo.members) {
            if(req.session.user._id === memberId.toString()) {
                foundUser = true;
                break;
            }
        }
        if(!foundUser)
            throw new Error("Not your board, therefore can not see card.")
    } catch(e) {
        res.status(403).render('error-page', { title: "403 Forbidden", message: e.toString(), error: true });
        return;
    }

    try {
        await usersData.remove(userId, id);
        res.redirect('/boards');
    } catch(e) {
        res.status(500).render('error-page', { title: "500 Internal Error", message: e.toString(), error: true });
    }

});

// POST /board/invite/{id}
// invite someone to the board
router.post('/invite/:id', async (req, res) => {

    const id = req.params.id;
    if(!id || !checkNonEmptyString(id) || !checkObjectId(id)) {
        res.status(400).render('error-page', { title: "400 ID of Board not proper ID", error: true });
        return;
    }

    let boardInfo = {};
    try {
        boardInfo = await boardsData.readById(id);
    } catch(e) {
        res.status(404).render('error-page', { title: "404 Board not Found.", message: e.toString(), error: true });
        return;
    }

    try {
        let foundUser = false;
        for(memberId of boardInfo.members) {
            if(req.session.user._id === memberId.toString()) {
                foundUser = true;
                break;
            }
        }
        if(!foundUser)
            throw new Error("Not your board, therefore can not see card.")
    } catch(e) {
        res.status(403).render('error-page', { title: "403 Forbidden", message: e.toString(), error: true });
        return;
    }

    const newData = req.body;
    if(!newData) {
        res.status(400).render('error-page', { title: "400 Bad Request", message: 'no body provided.', error: true });
        return;
    }

    const newInvite = {};
    if(xss(newData.email)) {
        if(checkEmail(xss(newData.email))) {
            newInvite.email = xss(newData.email);
        } else {
            res.status(400).render('error-page', { title: "400 Bad Request", message: 'invalid email', erorr: true });
            return;
        }
    }

    if(Object.keys(newInvite).length !== 1) {
        res.status(400).render('error-page', { title: "400 Bad Request", message: 'Not inviting anyone', erorr: true });
        return;
    }

    const { email } = newInvite;
    let invitedUser = {};
    try {
        invitedUser = await usersData.readByEmail(email);
    } catch(e) {
        res.json({ noUser: true, message: e.toString() });
        return;
    }

    try {
        for(memberId of boardInfo.members)
            if(invitedUser._id.toString() === memberId.toString())
                throw new Error("User already on board.");
    } catch(e) {
        res.json({ alreadyMember: true, message: e.toString() });
        return;
    }

    try {
        await boardsData.addNewMember(id, email);
        res.json({ boardId: id });
    } catch(e) {
        res.status(500).render('error-page', { title: "500 Internal Error", message: e.toString(), error: true });
    }

});

// POST /board/{boardId}/{listId}
// adding a card to the board.
router.post('/:boardId/:listId', async (req, res) => {

    const boardId = req.params.boardId;
    const listId = req.params.listId;
    if(!boardId || !checkNonEmptyString(boardId) || !checkObjectId(boardId)) {
        res.status(400).render('error-page', { title: "400 ID of Board not proper ID", error: true });
        return;
    }
    if(!listId || !checkNonEmptyString(listId) || !checkObjectId(listId)) {
        res.status(400).render('error-page', { title: "400 Bad Request", message: 'ID of List not proper ID', erorr: true });
        return;
    }

    let boardInfo = {};
    try {
        boardInfo = await boardsData.readById(boardId);
    } catch(e) {
        res.status(404).render('error-page', { title: "404 Board not Found.", message: e.toString(), error: true });
        return;
    }

    try {
        let foundUser = false;
        for(memberId of boardInfo.members) {
            if(req.session.user._id === memberId.toString()) {
                foundUser = true;
                break;
            }
        }
        if(!foundUser)
            throw new Error("Not your board, therefore can not see card.")
    } catch(e) {
        res.status(403).render('error-page', { title: "403 Forbidden", message: e.toString(), error: true });
        return;
    }

    let listInfo = {};
    try {
        listInfo = await listsData.readById(boardId, listId);
    } catch(e) {
        res.status(404).render('error-page', { title: '404 List not Found.', message: e.toString(), error: true });
        return;
    }

    const newData = req.body;
    if(!newData) {
        res.status(400).render('error-page', { title: "400 Bad Request", message: 'no body provided.', error: true });
        return;
    }

    let cardNameInfo = {};
    if(xss(newData.cardName)) {
        if(checkNonEmptyString(xss(newData.cardName))) {
            cardNameInfo.cardName = xss(newData.cardName);
        } else {
            res.status(400).render('error-page', { title: "400 Bad Request", message: 'invalid cardName', erorr: true });
            return;
        }
    }

    if(Object.keys(cardNameInfo).length !== 1) {
        res.status(400).render('error-page', { title: "400 Bad Request", message: 'no cardName provided', erorr: true });
        return;
    }

    try {
        const { cardName } = cardNameInfo;
        const cardId = await cardsData.addCard(boardId, listId, cardName);
        res.json({ cardId: cardId, cardName: cardName });
    } catch(e) {
        res.status(500).render('error-page', { title: "500 Internal Error", message: e.toString(), error: true });
    }

});

// GET /board/settings/{id}
// opens the settings page for the board.
router.get('/settings/:id', async (req, res) => {

    const id = req.params.id;
    if(!id || !checkNonEmptyString(id) || !checkObjectId(id)) {
        res.status(400).render('error-page', { title: "400 ID of Board not proper ID", error: true });
        return;
    }

    let boardInfo = {};
    try {
        boardInfo = await boardsData.readById(id);
    } catch(e) {
        res.status(404).render('error-page', { title: "404 Board not Found.", message: e.toString(), error: true });
        return;
    }

    try {
        let foundUser = false;
        for(memberId of boardInfo.members) {
            if(req.session.user._id === memberId.toString()) {
                foundUser = true;
                break;
            }
        }
        if(!foundUser)
            throw new Error("Not your board, therefore can not see card.")
    } catch(e) {
        res.status(403).render('error-page', { title: "403 Forbidden", message: e.toString(), error: true });
        return;
    }

    const renderInfo = {
        _id: boardInfo._id,
        boardName: boardInfo.boardName,
        boardColor: boardInfo.boardColor,
        description: boardInfo.description
    };

    const onlyMember = (boardInfo.members.length === 1);

    try {
        res.render('board-settings', { title: 'Board Settings', board: renderInfo, onlyMember: onlyMember, user: req.session.user, partial: 'board-settings-script'});
    } catch(e) {
        res.status(500).render('error-page', { title: "500 Internal Error", message: e.toString(), error: true });
    }

});

// PATCH /board/settings/{id}
// updates the boards data
router.patch('/settings/:id', async (req, res) => {

    const id = req.params.id;
    if(!id || !checkNonEmptyString(id) || !checkObjectId(id)) {
        res.status(400).render('error-page', { title: "400 ID of Board not proper ID", error: true });
        return;
    }

    let boardInfo = {};
    try {
        boardInfo = await boardsData.readById(id);
    } catch(e) {
        res.status(404).render('error-page', { title: "404 Board not Found.", message: e.toString(), error: true });
        return;
    }

    try {
        let foundUser = false;
        for(memberId of boardInfo.members) {
            if(req.session.user._id === memberId.toString()) {
                foundUser = true;
                break;
            }
        }
        if(!foundUser)
            throw new Error("Not your board, therefore can not see card.")
    } catch(e) {
        res.status(403).render('error-page', { title: "403 Forbidden", message: e.toString(), error: true });
        return;
    }

    const newData = req.body;
    if(!newData) {
        res.status(400).render('error-page', { title: "400 Bad Request", message: 'no body provided.', error: true });
        return;
    }

    const updatedBoardInfo = {};
    if(xss(newData.boardName) && xss(newData.boardName) !== boardInfo.boardName) {
        if(checkNonEmptyString(xss(newData.boardName))) {
            updatedBoardInfo.boardName = xss(newData.boardName);
        } else {
            res.status(400).render('error-page', { title: "400 Bad Request", message: 'invalid boardName', erorr: true });
            return;
        }
    }
    if(xss(newData.boardColor) && xss(newData.boardColor) !== boardInfo.boardColor) {
        if(checkColor(xss(newData.boardColor))) {
            updatedBoardInfo.boardColor = xss(newData.boardColor);
        } else {
            res.status(400).render('error-page', { title: "400 Bad Request", message: 'invalid boardColor', erorr: true });
            return;
        }
    }
    if(xss(newData.description) && xss(newData.description) !== boardInfo.description) {
        if(checkString(xss(newData.description))) {
            updatedBoardInfo.description = xss(newData.description);
        } else {
            res.status(400).render('error-page', { title: "400 Bad Request", message: 'invalid description', erorr: true });
            return;
        }
    }

    if(Object.keys(updatedBoardInfo).length === 0) {
        res.status(400).render('error-page', { title: "400 Bad Request", message: 'Nothing to change on the board', erorr: true });
        return;
    }

    try {
        await boardsData.update(id, updatedBoardInfo);
        res.json({ boardId: id });
    } catch(e) {
        res.status(500).render('error-page', { title: "500 Internal Error", message: e.toString(), error: true });
    }

});

// GET /board/list/{boardId}/{listId}
// list modal
router.get('/list/:boardId/:listId', async (req, res) => {

    const boardId = req.params.boardId;
    const listId = req.params.listId;
    if(!boardId || !checkNonEmptyString(boardId) || !checkObjectId(boardId)) {
        res.status(400).render('error-page', { title: "400 ID of Board not proper ID", error: true });
        return;
    }
    if(!listId || !checkNonEmptyString(listId) || !checkObjectId(listId)) {
        res.status(400).render('error-page', { title: "400 Bad Request", message: 'ID of List not proper ID', erorr: true });
        return;
    }

    let boardInfo = {};
    try {
        boardInfo = await boardsData.readById(boardId);
    } catch(e) {
        res.status(404).render('error-page', { title: "404 Board not Found.", message: e.toString(), error: true });
        return;
    }

    try {
        let foundUser = false;
        for(memberId of boardInfo.members) {
            if(req.session.user._id === memberId.toString()) {
                foundUser = true;
                break;
            }
        }
        if(!foundUser)
            throw new Error("Not your board, therefore can not see card.")
    } catch(e) {
        res.status(403).render('error-page', { title: "403 Forbidden", message: e.toString(), error: true });
        return;
    }

    let listInfo = {};
    try {
        listInfo = await listsData.readById(boardId, listId);
    } catch(e) {
        res.status(404).render('error-page', { title: '404 List not Found.', message: e.toString(), error: true });
        return;
    }

    const renderInfo = {
        _id: listInfo._id.toString(),
        listName: listInfo.listName,
    };

    try {
        let listPosition = 1;
        for(let list of boardInfo.lists) {
            if(list._id.toString() === renderInfo._id)
                break;
            listPosition++;
        }
        if(listPosition === boardInfo.lists.length+1) {
            throw new Error("list not on board.");
        }
        renderInfo.position = listPosition;
        positions = [...Array(boardInfo.lists.length+1).keys()].slice(1);
        res.render('partials/list-settings', { layout: null, list: renderInfo, boardId: boardId, positions: positions });
    } catch(e) {
        res.status(500).render('error-page', { title: "500 Internal Error", message: e.toString(), error: true });
    }

});

// POST /board/list/{boardId}/{listId}
// edit list modal
router.post('/list/:boardId/:listId', async (req, res) => {

    const boardId = req.params.boardId;
    const listId = req.params.listId;
    if(!boardId || !checkNonEmptyString(boardId) || !checkObjectId(boardId)) {
        res.status(400).render('error-page', { title: "400 ID of Board not proper ID", error: true });
        return;
    }
    if(!listId || !checkNonEmptyString(listId) || !checkObjectId(listId)) {
        res.status(400).render('error-page', { title: "400 Bad Request", message: 'ID of List not proper ID', erorr: true });
        return;
    }

    const newData = req.body;
    if(!newData) {
        res.status(400).render('error-page', { title: "400 Bad Request", message: 'no body provided.', error: true });
        return;
    }

    let boardInfo = {};
    try {
        boardInfo = await boardsData.readById(boardId);
    } catch(e) {
        res.status(404).render('error-page', { title: "404 Board not Found.", message: e.toString(), error: true });
        return;
    }

    try {
        let foundUser = false;
        for(memberId of boardInfo.members) {
            if(req.session.user._id === memberId.toString()) {
                foundUser = true;
                break;
            }
        }
        if(!foundUser)
            throw new Error("Not your board, therefore can not see card.")
    } catch(e) {
        res.status(403).render('error-page', { title: "403 Forbidden", message: e.toString(), error: true });
        return;
    }

    let listInfo = {};
    try {
        listInfo = await listsData.readById(boardId, listId);
    } catch(e) {
        res.status(404).render('error-page', { title: '404 List not Found.', message: e.toString(), error: true });
        return;
    }

    let updatedListData = {};
    if(xss(newData.listName) && xss(newData.listName) !== listInfo.listName) {
        if(checkNonEmptyString(xss(newData.listName))) {
            updatedListData.listName = xss(newData.listName);
        } else {
            res.status(400).render('error-page', { title: "400 Bad Request", message: 'invalid listName', error: true });
            return;
        }
    }
    if(newData.position) {
        let position = parseInt(xss(newData.position));
        if(checkPositiveNumber(position)) {
            updatedListData.position = position;
        } else {
            res.status(400).render('error-page', { title: "400 Bad Request", message: 'invalid position', error: true });
            return;
        }
    }

    if(Object.keys(updatedListData).length === 0) {
        res.status(400).render('error-page', { title: "400 Bad Request", message: 'No values needed updating.', error: true });
        return;
    }

    try {
        const { listName, position } = updatedListData;
        if(listName)
            await listsData.changeListName(listId, listName, boardId);
        if(position)
            await boardsData.moveList(boardId, listId, position);
        res.json({ boardId: boardId });
    } catch(e) {
        res.status(500).render('error-page', { title: "500 Internal Error", message: e.toString(), error: true });
    }

});

// POST /board/delete/card/{boardId}/{cardId}
// remove a card from the board
router.post('/delete/card/:boardId/:cardId', async (req, res) => {

    const boardId = req.params.boardId;
    const cardId = req.params.cardId;
    if(!boardId || !checkNonEmptyString(boardId) || !checkObjectId(boardId)) {
        res.status(400).render('error-page', { title: "400 ID of Board not proper ID", error: true });
        return;
    }
    if(!cardId || !checkNonEmptyString(cardId) || !checkObjectId(cardId)) {
        res.status(400).render('error-page', { title: "400 Id of card not proper ID", error: true });
        return;
    }

    let boardInfo = {};
    try {
        boardInfo = await boardsData.readById(boardId);
    } catch(e) {
        res.status(404).render('error-page', { title: "404 Board not Found.", message: e.toString(), error: true });
        return;
    }

    try {
        let foundUser = false;
        for(memberId of boardInfo.members) {
            if(req.session.user._id === memberId.toString()) {
                foundUser = true;
                break;
            }
        }
        if(!foundUser)
            throw new Error("Not your board, therefore can not see card.")
    } catch(e) {
        res.status(403).render('error-page', { title: "403 Forbidden", message: e.toString(), error: true });
        return;
    }

    let card = {};
    try {
        card = await cardsData.readById(boardId, cardId);
    } catch(e) {
        res.status(404).render('error-page', { title: "404 Card not Found.", message: e.toString(), error: true });
        return;
    }

    try {
        await cardsData.removeCard(boardId, cardId, card.list.toString());
        res.redirect(`/board/${boardId}`);
    } catch(e) {
        res.status(500).render('error-page', { title: "500 Internal Error", message: e.toString(), error: true });
    }

});

// POST /board/delete/list/{boardId}/{listId}
// remove a list from the board
router.post('/delete/list/:boardId/:listId', async (req, res) => {

    const boardId = req.params.boardId;
    const listId = req.params.listId;
    if(!boardId || !checkNonEmptyString(boardId) || !checkObjectId(boardId)) {
        res.status(400).render('error-page', { title: "400 ID of Board not proper ID", error: true });
        return;
    }
    if(!listId || !checkNonEmptyString(listId) || !checkObjectId(listId)) {
        res.status(400).render('error-page', { title: "400 Bad Request", message: 'ID of List not proper ID', erorr: true });
        return;
    }

    let boardInfo = {};
    try {
        boardInfo = await boardsData.readById(boardId);
    } catch(e) {
        res.status(404).render('error-page', { title: "404 Board not Found.", message: e.toString(), error: true });
        return;
    }

    try {
        let foundUser = false;
        for(memberId of boardInfo.members) {
            if(req.session.user._id === memberId.toString()) {
                foundUser = true;
                break;
            }
        }
        if(!foundUser)
            throw new Error("Not your board, therefore can not see card.")
    } catch(e) {
        res.status(403).render('error-page', { title: "403 Forbidden", message: e.toString(), error: true });
        return;
    }

    let listInfo = {};
    try {
        listInfo = await listsData.readById(boardId, listId);
    } catch(e) {
        res.status(404).render('error-page', { title: '404 List not Found.', message: e.toString(), error: true });
        return;
    }

    try {
        await listsData.removeList(listId, boardId);
        res.redirect(`/board/${boardId}`);
    } catch(e) {
        res.status(500).render('error-page', { title: "500 Internal Error", message: e.toString(), error: true });
    }

});


module.exports = router;