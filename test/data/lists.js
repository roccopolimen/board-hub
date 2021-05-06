const mongoCollections = require('../config/mongoCollections');
const boards = mongoCollections.boards;
const {ObjectId, ObjectID} = require('mongodb');
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

        const boardCollection = await boards();
        const board = await boardCollection.findOne({_id: ObjectId(id)});
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
    * @param {String} boardId The board's id.
    * @param {String} listId The list's id.
    * @returns A list object, if list does not exist, throws error.
    */
    readById: async (boardId, listId) => {
        if(!listId || !error_handler.checkObjectId(listId)) 
            throw new Error("listId is not valid.");

        if(!boardId || !error_handler.checkObjectId(boardId)) 
            throw new Error("boardId is not valid.");
        
        const boardCollection = await boards();
        const board = await boardCollection.findOne({_id: ObjectId(boardId)});

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
    * @returns A board object, otherwise throws error if list wasn't added.
    */
    addList: async (listName, boardId) => {
        if(!boardId || !error_handler.checkObjectId(boardId)) 
            throw new Error("id is not valid.");

        if(!listName || !error_handler.checkNonEmptyString(listName))
            throw new Error("listName is not valid.");

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

        if(!updateInfo.matchedCount && !updateInfo.modifiedCount) throw new Error('Failed to add list to board.');

        const board = await boardCollection.findOne({_id: ObjectId(boardId)});

        return board;
    },

    /**
    * Adds card to end of list.
    * @param {string} listId The id of the list the card will be added to.
    * @param {string} cardId The id of the added card.
    * @param {string} boardId The id of the board the list is in.
    * @returns True if successfully added, otherwise throws Error.
    */
    moveCardIdBetweenLists: async (listId, cardId, boardId) => {
        if(!boardId || !error_handler.checkObjectId(boardId)) 
            throw new Error("boardId is not valid.");

        if(!listId || !error_handler.checkObjectId(listId)) 
            throw new Error("listId is not valid.");
        
        if(!cardId || !error_handler.checkObjectId(cardId)) 
            throw new Error("cardId is not valid.");

        const boardCollection = await boards();
        const board = await boardCollection.findOne({_id: ObjectId(boardId)});
        if(board === null) {
            throw new Error('There is not board with that id.');
        }
        let foundCard;
        for(let card of board.cards) {
            if(card._id.toString() === cardId) {
                foundCard = card;
                break;
            }
        }
        if(!foundCard)
            throw new Error('Card not found');

        let prevList = foundCard.list;
        const removeCardFromListInfo = await boardCollection.updateOne({ _id: ObjectId(boardId), "lists._id": prevList }, 
                                                                        { $pull: {"lists.$.cardIds": ObjectId(cardId) }});

        if(!removeCardFromListInfo.matchedCount && !removeCardFromListInfo.modifiedCount) throw new Error('Failed to pop card from List');

        const updateInfoList = await boardCollection.updateOne({_id: ObjectId(boardId), "lists._id": ObjectId(listId)}, 
                                                            { $addToSet: {"lists.$.cardIds": ObjectId(cardId)}});

        if(!updateInfoList.matchedCount && !updateInfoList.modifiedCount) throw new Error('Failed to update List');

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
        const updateInfo = await boardCollection.updateOne({_id: ObjectId(boardId), "lists._id": ObjectId(listId)}, 
                                                            { $set: {"lists.$.listName": newName}});
        if(!updateInfo.matchedCount && !updateInfo.modifiedCount) throw new Error('Update failed');

        return true;
    },

    /**
    * Adds card to end of list.
    * @param {string} boardId The id of the board the list is in.
    * @param {string} cardId The id of the added card.
    * @param {string} listId The id of the list the card will be added to.
    * @param {number} position The new position of the card.
    * @returns True if position successfully changed, false if the card is not in 
    * the list/has the same position, and throws an error otherwise.
    */
    moveCardInList: async (boardId, cardId, listId, position) => {
        if(!boardId || !error_handler.checkObjectId(boardId)) 
            throw new Error("boardId is not valid.");

        if(!cardId || !error_handler.checkObjectId(cardId)) 
            throw new Error("cardId is not valid.");

        if(!listId || !error_handler.checkObjectId(listId)) 
            throw new Error("listId is not valid.");
            
        if(position === undefined)
            return;

        if(!error_handler.checkPositiveNumber(position))
            throw new Error("cardPosition is not valid.");
        
        const boardCollection = await boards();
        const board = await boardCollection.findOne({_id: ObjectId(boardId)});

        let changelist;
        for(let y=0; y<board.lists.length; y++) {
            let list = board.lists[y];
            if(list._id.toString() === listId) {
                changelist = list;
                break;
            }
        }

        if(!changelist) throw new Error('List not found');
        
        let cardList = changelist.cardIds;
        let cardIndex = -1;
        for(let y=0; y < cardList.length; y++) {
            if(cardList[y].toString() === cardId) {
                cardIndex = y;
                break;
            }
        }
        if(cardIndex > -1) {
            cardList.splice(cardIndex, 1);
            cardList.splice(position-1, 0, ObjectId(cardId));

            const updateInfo = await boardCollection.updateOne({_id: ObjectId(boardId), "lists._id": ObjectId(listId)}, 
                                                            { $set: {"lists.$.cardIds": cardList}});

            if(!updateInfo.matchedCount && !updateInfo.modifiedCount) throw new Error('Update failed');
        } else {
            throw new Error("Card not in list");
        }

        return true;
    },

    /**
    * Removes a list.
    * @param {string} listId The id of the list to be deleted.
    * @param {string} boardId The id of the board the list is in.
    * @returns True if successfully deleted, otherwise throws Error.
    */
    removeList: async (listId, boardId) => {
        if(!boardId || !error_handler.checkObjectId(boardId)) 
            throw new Error("boardId is not valid.");

        if(!listId || !error_handler.checkObjectId(listId)) 
            throw new Error("listId is not valid.");

        const boardCollection = await boards();
        const board = await boardCollection.findOne({_id: ObjectId(boardId)});

        for(let y=0; y<board.lists.length; y++) {
            let list = board.lists[y];
            if(list._id.toString() === listId) {
                let cardList = list.cardIds;
                for(let x=0; x<cardList.length; x++) {
                    const updateInfoCard = await boardCollection.updateOne(
                        { _id: ObjectId(boardId) },
                        { $pull: { cards: { _id: cardList[x] } } }
                    );
                    if(!updateInfoCard.matchedCount && !updateInfoCard.modifiedCount) throw new Error('Update failed');
                }
                const updateInfo = await boardCollection.updateOne(
                    { _id: ObjectId(boardId) },
                    { $pull: { lists: { _id: ObjectId(listId) } } }
                );
                if(!updateInfo.matchedCount && !updateInfo.modifiedCount) throw new Error('Update failed');
            }
        }
    }


}