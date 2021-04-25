const { ObjectId } = require('mongodb');
const mongoCollections = require('../config/mongoCollections');
const boards = mongoCollections.boards;
const { checkObjectId, checkNonEmptyString, } = require('../errors/error-handler'); 

/**
 * Creates a comment for a specific card, returns true if the comment was successfully created
 * @param {String} userId The ID of the user creating a comment
 * @param {String} boardId The ID of the board the card is on
 * @param {String} cardId The ID of the card the user is commenting on
 * @param {String} dateString Date object created when the comment is in MM/DD/YYYY*HH:MM:SS format
 * @param {String} comment Comment the user is making
 */
const create = async(userId, boardId, cardId, date, comment) => {
    if(!checkObjectId(userId)) throw new Error("Must enter a valid userId");
    if(!checkObjectId(boardId)) throw new Error("Must enter a valid boardId");
    if(!checkObjectId(cardId)) throw new Error("Must enter a valid cardId");
    //TODO: insert if statement to check if datestring is correct
    if(!checkNonEmptyString(comment)) throw new Error("Must enter a valid comment");

    const boardCollection = await boards();
    //get the board
    const board = await boardCollection.findOne({_id: ObjectId(boardId)});
    if(board === null) throw new Error("There is no board with that id.");
    //get the board's list of cards
    const cards = board.cards;
    if(cards === null) throw new Error("There are no cards in the board.");
    let theCard = null;
    let thePosition = null;
    //find the card in the array of cards
    for(let x in cards) {
        if(cards[x]._id.toString() == cardId) {
            theCard = cards[x];
            thePosition = x;
        }
    }
    if(theCard === null) throw new Error("There is no card with that id.");
    //create comment object
    let newComment = {
        _id: ObjectId(),
        user: userId,
        date: date,
        comment: comment
    }
    //update the card
    theCard.comments.push(newComment);
    //update the list of cards
    cards[thePosition] = theCard;
    //update the board
    board.cards = cards;
    let updatedInfo = await boardCollection.updateOne({_id: ObjectId(boardId)}, {$set: board});
    if(updatedInfo.modifiedCount === 0) throw "could not update comment";

    return true;
};

/**
 * Returns the comments list of the specified card of the specified board;
 * Will return [] if there are no comments on the card
 * @param {String} boardId The ID of the board the card is on
 * @param {String} cardId The ID of the card the comments are on
 */
const readAll = async(boardId, cardId) => {
    if(!checkObjectId(boardId)) throw new Error("Must enter a valid boardId");
    if(!checkObjectId(cardId)) throw new Error("Must enter a valid cardId");

    const boardCollection = await boards();
    //get the board
    const board = await boardCollection.findOne({_id: ObjectId(boardId)});
    if(board === null) throw new Error("There is no board with that id.");
    //get the board's list of cards
    const cards = board.cards;
    if(cards === null) throw new Error("There are no cards in the board.");
    let theCard = null;
    //find the card in the array of cards
    for(let x in cards) {
        if(cards[x]._id.toString() == cardId) {
            theCard = cards[x];
        }
    }
    if(theCard === null) throw new Error("There is no card with that id.");

    let theComments = theCard.comments;

    return theComments;
};

/**
 * Returns the comment with a stringified id, throws if not found
 * @param {String} boardId The ID of the board the card is on
 * @param {String} cardId The ID of the card the comments are on
 * @param {String} commentId The ID of the comment in the card
 */
const read = async(boardId, cardId, commentId) => {
    if(!checkObjectId(boardId)) throw new Error("Must enter a valid boardId");
    if(!checkObjectId(cardId)) throw new Error("Must enter a valid cardId");
    if(!checkObjectId(commentId)) throw new Error("Must enter a valid commentId");

    const boardCollection = await boards();
    //get the board
    const board = await boardCollection.findOne({_id: ObjectId(boardId)});
    if(board === null) throw new Error("There is no board with that id.");
    //get the board's list of cards
    const cards = board.cards;
    if(cards === null) throw new Error("There are no cards in the board.");
    let theCard = null;
    //find the card in the array of cards
    for(let x in cards) {
        if(cards[x]._id.toString() == cardId) {
            theCard = cards[x];
        }
    }
    if(theCard === null) throw new Error("There is no card with that id.");
    //get the list of comments
    let theComments = theCard.comments;
    if(theComments === null) throw new Error("There are no comments on the card");
    //get the comment
    let theComment = null;
    for(let y in theComments) {
        if(theComments[y]._id.toString() == commentId) {
            theComment = theComments[y];
        }
    }
    if(theComment === null) throw new Error("There is no comment with that id");

    theComment._id = theComment._id.toString();
    return theComment;
};

/**
 * Updates the date and comment of the specified comment;
 * You can't update the user, since that's not how comments work;
 * Returns true if successfully updated, throws if not
 * @param {String} boardId The ID of the board the card is on
 * @param {String} cardId The ID of the card the comments are on
 * @param {String} commentId The ID of the comment in the card
 * @param {String} date Date object created when the comment is edited in MM/DD/YYYY*HH:MM:SS format
 * @param {String} comment Comment the user is making
 */
const update = async(boardId, cardId, commentId, date, comment) => {
    if(!checkObjectId(boardId)) throw new Error("Must enter a valid boardId");
    if(!checkObjectId(cardId)) throw new Error("Must enter a valid cardId");
    if(!checkObjectId(commentId)) throw new Error("Must enter a valid commentId");
    //TODO: insert if statement to check if datestring is correct
    if(!checkNonEmptyString(comment)) throw new Error("Must enter a valid comment");

    const boardCollection = await boards();
    //get the board
    const board = await boardCollection.findOne({_id: ObjectId(boardId)});
    if(board === null) throw new Error("There is no board with that id.");
    //get the board's list of cards
    const cards = board.cards;
    if(cards === null) throw new Error("There are no cards in the board.");
    let theCard = null;
    let thePosition = null;
    //find the card in the array of cards
    for(let x in cards) {
        if(cards[x]._id.toString() == cardId) {
            theCard = cards[x];
            thePosition = x;
        }
    }
    if(theCard === null) throw new Error("There is no card with that id.");
    //get the list of comments
    let theComments = theCard.comments;
    if(theComments === null) throw new Error("There are no comments on the card");
    //get the comment
    let theComment = null;
    let commentPosition = null;
    for(let y in theComments) {
        if(theComments[y]._id.toString() == commentId) {
            theComment = theComments[y];
            commentPosition = y;
        }
    }
    if(theComment === null) throw new Error("There is no comment with that id");
    //update comment
    theComment.date = date;
    theComment.comment = comment;
    //update list of comments
    theComments[commentPosition] = theComment;
    //update card
    theCard.comments = theComments;
    //update list of cards
    cards[thePosition] = theCard;
    //update board
    board.cards = cards;

    let updatedInfo = await boardCollection.updateOne({_id: ObjectId(boardId)}, {$set: board});
    if(updatedInfo.modifiedCount === 0) throw "could not update comment";

    return true;
};

/**
 * Removes the comment from the specified card of the specified board;
 * Returns true if successfully removed, throws if not
 * @param {String} boardId 
 * @param {String} cardId 
 * @param {String} commentId
 */
const remove = async(boardId, cardId, commentId) => {
    if(!checkObjectId(boardId)) throw new Error("Must enter a valid boardId");
    if(!checkObjectId(cardId)) throw new Error("Must enter a valid cardId");
    if(!checkObjectId(commentId)) throw new Error("Must enter a valid commentId");

    const boardCollection = await boards();
    //get the board
    const board = await boardCollection.findOne({_id: ObjectId(boardId)});
    if(board === null) throw new Error("There is no board with that id.");
    //get the board's list of cards
    const cards = board.cards;
    if(cards === null) throw new Error("There are no cards in the board.");
    let theCard = null;
    let thePosition = null;
    //find the card in the array of cards
    for(let x in cards) {
        if(cards[x]._id.toString() == cardId) {
            theCard = cards[x];
            thePosition = x;
        }
    }
    if(theCard === null) throw new Error("There is no card with that id.");
    //get the list of comments
    let theComments = theCard.comments;
    if(theComments === null) throw new Error("There are no comments on the card");
    //get the comment
    let theComment = null;
    let commentPosition = null;
    for(let y in theComments) {
        if(theComments[y]._id.toString() == commentId) {
            theComment = theComments[y];
            commentPosition = y;
        }
    }
    if(theComment === null) throw new Error("There is no comment with that id");

    //remove comment from list of comments
    theComments.splice(commentPosition, 1)
    //update card
    theCard.comments = theComments;
    //update list of cards
    cards[thePosition] = theCard;
    //update board
    board.cards = cards;

    let updatedInfo = await boardCollection.updateOne({_id: ObjectId(boardId)}, {$set: board});
    if(updatedInfo.modifiedCount === 0) throw "could not update comment";

    return true;
};

module.exports = {
    description: "Comments Functions",
    create,
    readAll,
    read,
    update,
    remove
}