const mongoCollections = require('../config/mongoCollections');
const boards = mongoCollections.boards;
const {ObjectId} = require('mongodb');
const error_handler = require('../errors/error-handler'); 

const exportedModules = {
    /**
     * Get all cards from a boardId.
     * @param {string} boardId The board's id.
     * @returns A list of cards.
     */
    async getAllCards(boardId){
        if(!boardId || !error_handler.checkObjectId(boardId)){
            throw new Error('boardId is not valid.');
        }
        const boardCollection = await boards();
        const board = await boardCollection.findOne({_id: ObjectId(boardId)});
        if(board === null){
            throw new Error('There is not board with that id.');
        }
        const cardList = board.cards;
        if(cardList.length === 0){
            throw new Error('That board has no cards.');
        }
        for(let card of cardList){
            card._id = card._id.toString();
        }
        return cardList;
    },

    /**
     * Get a specific card from a board.
     * @param {string} boardId The board's id.
     * @param {string} cardId The card's id.
     * @returns A card object
     */
    async readById(boardId, cardId){
        if(!boardId || !error_handler.checkObjectId(boardId)){
            throw new Error('boardId is not valid');
        }
        if(!cardId || !error_handler.checkObjectId(cardId)){
            throw new Error('cardId is not valid');
        }

        const boardCollection = await boards();
        const board = await boardCollection.findOne({_id: ObjectId(boardId)});
        if(board === null){
            throw new Error('There is not board with that id.');
        }
        let foundCard;
        
        for(let card of board.cards){
            if(card._id.toString() === cardId){
                foundCard = card;
            }
        }
        if(!foundCard){
            throw new Error('Card not found');
        } 
        foundCard._id = foundCard._id.toString();

        return foundCard;
    }, 

    /**
     * Add a new card to a board.
     * @param {string} boardId The board's id.
     * @param {string} listId The list's id.
     * @param {string} cardName The name of the card.
     * @returns The new card.
     */
    async addCard(boardId, listId, cardName){
        if(!boardId || !error_handler.checkObjectId(boardId)){
            throw new Error('boardId is not valid');
        }
        if(!listId || !error_handler.checkObjectId(listId)){
            throw new Error('listId is not valid');
        }
        if(!cardName || !error_handler.checkNonEmptyString(cardName)){
            throw new Error('cardName must not be empty');
        }

        const boardCollection = await boards();

        //storyPoints and dueDate can be added via update, but are not created with a new card
        const newCard = {
            _id: new ObjectId(), 
            cardName: cardName,
            description: '',
            labels: [],
            comments: [],
            assigned: [],
            list: ObjectId(listId)
        };

        const updateList = await boardCollection.updateOne({_id: ObjectId(boardId), "lists._id": ObjectId(listId)}, 
                                                            { $addToSet: {"lists.$.cardIds": newCard._id}});
        if (!updateList.matchedCount && !updateList.modifiedCount)
            throw new Error('Could not update the list.');

        const updateInfo = await boardCollection.updateOne({_id: ObjectId(boardId)}, { $addToSet: { cards: newCard}});
        if (!updateInfo.matchedCount && !updateInfo.modifiedCount)
            throw new Error('Could not add the card.');
    },

    /**
     * Updates an existing card.
     * @param {string} boardId The board's id.
     * @param {string} cardId The card's id.
     * @param {string} listId the list's id.
     * @param {string} cardName The name of the card.
     * @param {number} storyPoints The story point of the card.
     * @param {string} description The description of the card.
     * @param {string} date The date of dueDate.
     * @param {string} time The time of dueDate.
     * @param {boolean} done The done of dueDate.
     * @param {Array} assigned The array of assigned users to the card.
     * @returns nothing if successful. Throws error otherwise.
     */
    async updateCard(boardId, cardId, listId, cardName, storyPoints, description, date, time, done, assigned){
        
        let somethingToUpdate = false;

        if(!boardId || !error_handler.checkObjectId(boardId)) {
            throw new Error('boardId is not valid.');
        }
        if(!cardId || !error_handler.checkObjectId(cardId)) {
            throw new Error('cardId is not valid.');
        }

        let updatedCardData = await this.readById(boardId, cardId);
        updatedCardData._id = ObjectId(updatedCardData._id);

        if(listId) {
            if(!error_handler.checkObjectId(listId)) {
                throw new Error('listId is not valid.');
            }
            else {
                updatedCardData.list = ObjectId(listId);
                somethingToUpdate = true;
            }   
        }
        if(cardName) {
            if(!error_handler.checkNonEmptyString(cardName)) {
                throw new Error('cardName must not be empty.');
            }
            else {
                updatedCardData.cardName = cardName;
                somethingToUpdate = true;
            }
        }
        if(storyPoints !== undefined) {
            if(storyPoints === null) {
                console.log('sldakjflsdkahfdslkhf');
                delete updatedCardData.storyPoints;
                somethingToUpdate = true;
            }
            else if(!error_handler.checkStoryPoint(storyPoints)) {
                throw new Error('storyPoints is not valid.');
            }
            else {
                updatedCardData.storyPoints = storyPoints;
                somethingToUpdate = true;
            }
        }
        if(description !== undefined) {
            if(!error_handler.checkString(description)) {
                throw new Error('description must be a string.');
            }
            else {
                updatedCardData.description = description;
                somethingToUpdate = true;
            }
        }
        let newDueDate = {};
        if(date || time || done !== undefined) {
            if(date) {
                if(!error_handler.checkDate(date)) {
                    throw new Error('Must have a valid date.');
                } else {
                    newDueDate.date = date;
                    somethingToUpdate = true;
                }
            } else {
                newDueDate.date = updatedCardData.dueDate.date.split('*')[0];
            }
            if(time) {
                if(!error_handler.checkTime(time)) {
                    throw new Error('Must have a valid time.')
                } else {
                    newDueDate.date = `${newDueDate.date}*${time}`;
                    somethingToUpdate = true;
                }
            } else {
                newDueDate.date = `${newDueDate.date}*${updatedCardData.dueDate.date.split('*')[1]}`;
            }
            if(done !== undefined) {
                if(!error_handler.checkBoolean(done)) {
                    throw new Error('Done must be a valid boolean.');
                }
                newDueDate.done = done;
                somethingToUpdate = true;
            }
            updatedCardData.dueDate = newDueDate;
        }
        if(assigned) {
            if(!error_handler.checkArrayObjectId(assigned)) {
                throw new Error('Assigned must be an array of valid ObjectId\'s');
            }
            else {
                updatedCardData.assigned = assigned;
                somethingToUpdate = true;
            }
        }

        if(!somethingToUpdate)
            return;

        const boardCollection = await boards();
        const updateInfo = await boardCollection.updateOne({_id: ObjectId(boardId), "cards._id": ObjectId(cardId)}, 
                                                            { $set: {"cards.$": updatedCardData}});

        if (!updateInfo.matchedCount && !updateInfo.modifiedCount){
            throw new Error('Could not update the card.');
        }

    },
    /**
     * Delete a card from a board.
     * @param {string} boardId The board's id.
     * @param {string} cardId The card's id.
     * @param {string} listId The list's id.
     * @returns An object containing the cardId and if the card was deleted.
     */
    async removeCard(boardId, cardId, listId){
        if(!boardId || !error_handler.checkObjectId(boardId)){
            throw new Error('boardId is not valid');
        }
        if(!cardId || !error_handler.checkObjectId(cardId)){
            throw new Error('cardId is not valid');
        }
        if(!listId || !error_handler.checkObjectId(listId)){
            throw new Error('listId is not valid');
        }

        const boardCollection = await boards();
        const newBoardId = ObjectId(boardId);
        const newCardId = ObjectId(cardId);
        const newListId = ObjectId(listId);

        const updateList = await boardCollection.updateOne({ _id: ObjectId(boardId), "lists._id": ObjectId(listId) }, 
                                                                        { $pull: {"lists.$.cardIds": ObjectId(cardId) }});
        if (!updateList.matchedCount && !updateList.modifiedCount){
            throw new Error('Could not update the list.');
        }

        const updateInfo = await boardCollection.updateOne({ _id: ObjectId(boardId) }, 
                                                            { $pull: {"cards": ObjectId(cardId) }});
        if (!updateInfo.matchedCount && !updateInfo.modifiedCount){
            throw new Error('Could not delete the card.');
        }
    },
}

module.exports = exportedModules;