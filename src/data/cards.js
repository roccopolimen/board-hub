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
    async getCardById(boardId, cardId){
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

        let newBoardId = ObjectId(boardId);
        const boardCollection = await boards();

        //storyPoints and dueDate can be added via update, but are not created with a new card
        const newCard = {
            _id: new ObjectId(), 
            cardName: cardName,
            description: '',
            labels: [],
            comments: [],
            assigned: [],
            list: listId
        };

        const updateInfo = await boardCollection.updateOne({_id: newBoardId}, { $push: { cards: newCard}});

        if (!updateInfo.matchedCount && !updateInfo.modifiedCount){
            throw new Error('Could not add the card.');
        }

        const card = await getCardById(boardId, newCard._id)
        return card;

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
     * @returns The updated card.
     */
    async updateCard(boardId, cardId, listId, cardName, storyPoints, description, date, time, done, assigned){
        
        let updatedCardData = {};
        if(!boardId || !error_handler.checkObjectId(boardId)){
            throw new Error('boardId is not valid.');
        }
        if(!cardId || !error_handler.checkObjectId(cardId)){
            throw new Error('cardId is not valid.');
        }
        if(listId){
            if(!error_handler.checkObjectId(listId)){
                throw new Error('listId is not valid.');
            }
            else{
                updatedCardData.list = listId;
            }   
        }
        if(cardName){
            if(!error_handler.checkNonEmptyString(cardName)){
                throw new Error('cardName must not be empty.');
            }
            else{
                updatedCardData.cardName = cardName;
            }
        }
        if(storyPoints){
            if(!error_handler.checkStoryPoint(storyPoints)){
                throw new Error('storyPoints is not valid.');
            }
            else{
                updatedCardData.storyPoints = storyPoints;
            }
        }
        if(description){
            if(!error_handler.checkNonEmptyString(description)){
                throw new Error('description must not be empty.');
            }
            else{
                updatedCardData.description = description;
            }
        }
        if(date && time){
            if(!error_handler.checkDueDate(date) ){ // || !error_handler.checkTime(time)
                throw new Error('Must have a valid date and time.');
            }
            else{
                let dueDate = {date: `${date}*${time}`, done: done}
                updatedCardData.dueDate = dueDate;
            }
        }
        if(assigned){
            if(!error_handler.checkArrayObjectId(assigned)){
                throw new Error('Assigned must be an array of valid ObjectId\'s');
            }
            else{
                updatedCardData.assigned = assigned;
            }
        }

        let newBoardId = ObjectId(boardId);
        const boardCollection = await boards();

        //const updateInfo = await boardCollection.updateOne({_id: newBoardId}, { $set: {cards: updatedCardData}});
        const updateInfo = await boardCollection.updateOne({_id: newBoardId}, { $set: {"cards.cardId": updatedCardData}});

        if (!updateInfo.matchedCount && !updateInfo.modifiedCount){
            throw new Error('Could not update the card.');
        }
        
        const card = await this.getCardById(boardId, cardId);
        return card;
    },
    /**
     * Delete a card from a board.
     * @param {string} boardId The board's id.
     * @param {string} cardId The card's id.
     * @returns An object containing the cardId and if the card was deleted.
     */
    async removeCard(boardId, cardId){
        if(!boardId || !error_handler.checkObjectId(boardId)){
            throw new Error('boardId is not valid');
        }
        if(!cardId || !error_handler.checkObjectId(cardId)){
            throw new Error('cardId is not valid');
        }

        const boardCollection = await boards();
        const newBoardId = ObjectId(boardId);
        const newCardId = ObjectId(cardId);

        const updateInfo = await boardCollection.updateOne({_id: newBoardId }, { $pull: { cards: { _id: newCardId}}});
        if (!updateInfo.matchedCount && !updateInfo.modifiedCount){
            throw new Error('Could not delete the card.');
        }

        return {cardId: cardId, deleted: true}; 
    },
}

module.exports = exportedModules;