const mongoCollections = require('../config/mongoCollections');
const boardData = require('./boards');
const boards = mongoCollections.boards;
const {ObjectId} = require('mongodb');
const error_handler = require('../errors/error-handler'); 


module.exports = {
    /**
    * Gets all lists from a given board id.
    * @param {String} id The board's id.
    * @returns A list of list(column) objects.
    */
    getAllListsInBoard: async (id) => {
        if(!id || !error_handler.checkObjectId(id)) 
            throw new Error("id is not valid.");

        const board = await boardData.readById(id);
        let returnList = [];
        for(let x=0; x<board.lists.length; x++) {
            let lists = board.lists[x];
            lists._id = lists._id.toString();
            returnList.push(lists);
        }

        return returnList;
    },

    /**
    * Gets a list with a given id.
    * @param {String} listId The lists's id.
    * @param {String} boardId The board's id.
    * @returns A list object.
    */
    getListById: async (listId, boardId) => {
        if(!listId || !error_handler.checkObjectId(listId)) 
            throw new Error("listId is not valid.");

        if(!boardId || !error_handler.checkObjectId(boardId)) 
            throw new Error("boardId is not valid.");
        
        const board = await boardData.readById(boardId);

        let returnList;
        for(let y=0; y<board.lists.length; y++) {
            let list = board.lists[y];
            if(list._id.toString() === listId) {
                returnList = list;
            }
        }
        
        if(!returnList) throw new Error('List not found');

        return returnList;
    },

    /**
    * Creates a new list.
    * @param {string} listName The name of the new list.
    * @param {String} boardId The id of the board the list is added to.
    * @returns A board object.
    */
    addList: async (listName, boardId) => {
        if(!boardId || !error_handler.checkObjectId(boardId)) 
            throw new Error("id is not valid.");

        if(!listName || !error_handler.checkNonEmptyString(listName))
            throw new Error("listName is not valid.")

        const boardCollection = await boards();

        let listId = new ObjectId();
        const newList = {
            _id: listId,
            listName: listName.trim(),
            cardIds: []
        };

        const updateInfo = await boardCollection.updateOne(
            { _id: ObjectId(boardId) },
            { $push: { lists: newList } }
        );

        if(!updateInfo.matchedCount && !updateInfo.modifiedCount) throw new Error('Update failed');
        return boardData.readById(boardId);
    },

    /**
    * Adds card to end of list.
    * @param {string} listId The id of the list the card will be added to.
    * @param {string} cardId The id of the added card.
    * @param {string} boardId The id of the board the list is in.
    * @returns True if successfully added, otherwise throws Error.
    */
    addCardIdtoList: async (listId, cardId, boardId) => {
        if(!boardId || !error_handler.checkObjectId(boardId)) 
            throw new Error("boardId is not valid.");

        if(!listId || !error_handler.checkObjectId(listId)) 
            throw new Error("listId is not valid.");
        
        if(!cardId || !error_handler.checkObjectId(cardId)) 
            throw new Error("cardId is not valid.");

        let list = this.getListById(listId, boardId);

        let cardArray = list.cardIds;
        cardArray.push(cardId);

        const boardCollection = await boards();
        const updateInfo = await boardCollection.updateOne({ _id: ObjectId(boardId) },
        { lists: { id: ObjectId(listId) }}, {$set: {cardIds: cardArray}});
        if(!updateInfo.matchedCount && !updateInfo.modifiedCount) throw new Error('Update failed');

        return true;
    },

    /**
    * Changes the name of the List.
    * @param {string} listId The id of the list to change.
    * @param {string} changeName The new name for the list.
    * @param {string} boardId The id of the board the list is in.
    * @returns True if successfully changed, otherwise throws Error.
    */
    changeListName: async (listId, changeName, boardId) => {
        if(!boardId || !error_handler.checkObjectId(boardId)) 
            throw new Error("boardId is not valid.");

        if(!listId || !error_handler.checkObjectId(listId)) 
            throw new Error("listId is not valid.");
        
        if(!changeName || !error_handler.checkNonEmptyString(changeName)) 
            throw new Error("changeName is not valid.");

        let newName = changeName.trim();

        const boardCollection = await boards();
        const updateInfo = await boardCollection.updateOne({ _id: ObjectId(boardId) },
        { lists: { id: ObjectId(listId) }}, {$set: {listName: newName}});
        if(!updateInfo.matchedCount && !updateInfo.modifiedCount) throw new Error('Update failed');

        return true;
    },

    /**
    * Removes a list.
    * @param {string} listId The id of the list to be deleted.
    * @param {string} boardId The id of the board the list is in.
    * @returns True if successfully deleted, otherwise throws Error.
    */
    removeList: async (listId, boardId) =>{
        if(!boardId || !error_handler.checkObjectId(boardId)) 
            throw new Error("boardId is not valid.");

        if(!listId || !error_handler.checkObjectId(listId)) 
            throw new Error("listId is not valid.");

        const board = await boardData.readById(boardId);
        const boardCollection = await boards();

        for(let y=0; y<board.lists.length; y++) {
            let list = board.lists[y];
            if(list._id.toString() === listId) {
                const updateInfo = await boardCollection.updateOne(
                    { _id: board._id },
                    { $pull: { lists: { id: ObjectId(listId) } } }
                );
                if(!updateInfo.matchedCount && !updateInfo.modifiedCount) throw new Error('Update failed');
            }
        }

        return true;
    }


}