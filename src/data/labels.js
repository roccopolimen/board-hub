const mongoCollections = require('../config/mongoCollections');
const boards = mongoCollections.boards;
const cards = require('./cards');
const {label_colors} = require('../public/constants/index');
const {ObjectId} = require('mongodb');
const error_handler = require('../errors/error-handler'); 

/**
 * Get a specific card from a board.
 * @param {string} boardId The board's id.
 * @param {string} cardId The card's id.
 * @returns A card object
 */
async function getCardById(boardId, cardId){
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
        throw new Error('Card not found.');
    } 
    foundCard._id = foundCard._id.toString();

    return foundCard;
}

const exportedModules = {
    /**
     * Get all labels from a card.
     * @param {string} boardId The board's id.
     * @param {string} cardId The card's id.
     * @returns A list of labels.
     */
    async getAllLabels(boardId, cardId){
        if(!boardId || !error_handler.checkObjectId(boardId)){
            throw new Error('boardId is not valid.');
        }
        if(!cardId || !error_handler.checkObjectId(cardId)){
            throw new Error('cardId is not valid.');
        }

        const boardCollection = await boards();
        const board = await boardCollection.findOne({_id: ObjectId(boardId)});
        if(board === null){
            throw new Error('There is not board with that id.');
        }

        const cardList = board.cards;
        const labelList;

        if(cardList.length === 0){
            throw new Error('That board has no cards.');
        }
        for(let card of cardList){
            if(card._id.toString() === cardId){
                if(card.labels.length === 0){
                    throw new Error('That card has no labels.');
                }
                labelList = card.labels;
            }
        }
        for(let label of labelList){
            label._id = label._id.toString();
        }
        return labelList;
    },
    /**
     * Get a specific label from a card.
     * @param {string} boardId The board's id.
     * @param {string} cardId The card's id.
     * @param {string} labelId The label's id.
     * @returns A label object.
     */
    async getLabelById(boardId, cardId, labelId){
        if(!boardId || !error_handler.checkObjectId(boardId)){
            throw new Error('boardId is not valid.');
        }
        if(!cardId || !error_handler.checkObjectId(cardId)){
            throw new Error('cardId is not valid.');
        }
        if(!labelId || !error_handler.checkObjectId(labelId)){
            throw new Error('boardId is not valid.');
        }

        const boardCollection = await boards();
        const board = await boardCollection.findOne({_id: ObjectId(boardId)});
        if(board === null){
            throw new Error('There is not board with that id.');
        }

        const cardList = board.cards;
        let foundCard;
        let returnLabel;
        
        if(cardList.length === 0){
            throw new Error('That board has no cards.');
        }

        for(let card of cardList){
            if(card._id.toString() === cardId){
                foundCard = card;
            }
        }
        if(!foundCard){
            throw new Error('Card not found');
        } 

        for(let label of foundCard){
            if(label._id.toString() === labelId){
                returnLabel = label;
            }
        }
        if(!returnLabel){
            throw new Error('Label not found');
        } 
        returnLabel._id = returnLabel._id.toString();

        return returnLabel;

    },

    /**
     * Get the index of a label.
     * @param {string} boardId The board's id.
     * @param {string} cardId The card's id.
     * @param {string} labelId The label's id.
     * @returns An index of a label.
     */
    async getLabelIndexById(boardId, cardId, labelId){
        if(!boardId || !error_handler.checkObjectId(boardId)){
            throw new Error('boardId is not valid.');
        }
        if(!cardId || !error_handler.checkObjectId(cardId)){
            throw new Error('cardId is not valid.');
        }
        if(!labelId || !error_handler.checkObjectId(labelId)){
            throw new Error('boardId is not valid.');
        }

        const boardCollection = await boards();
        const board = await boardCollection.findOne({_id: ObjectId(boardId)});
        if(board === null){
            throw new Error('There is not board with that id.');
        }

        const cardList = board.cards;
        let foundCard;
        let returnLabel;
        
        if(cardList.length === 0){
            throw new Error('That board has no cards.');
        }

        for(let card of cardList){
            if(card._id.toString() === cardId){
                foundCard = card;
            }
        }
        if(!foundCard){
            throw new Error('Card not found');
        } 

        let index = 0;
        for(let label of foundCard){
            if(label._id.toString() === labelId){
                returnLabel = label;
                break;
            }
            index++;
        }
        if(!returnLabel){
            throw new Error('Label not found');
        } 

        return index;

    },

    /**
     * Add a label to a card.
     * @param {string} boardId The board's id.
     * @param {string} cardId The card's id.
     * @param {string} text The label's text.
     * @param {string} color The label's color hex code.
     * @returns A label object.
     */
    async addLabel(boardId, cardId, text){
        if(!boardId || !error_handler.checkObjectId(boardId)){
            throw new Error('boardId is not valid.');
        }
        if(!cardId || !error_handler.checkObjectId(cardId)){
            throw new Error('cardId is not valid.');
        }
        if(!text || !error_handler.checkNonEmptyString(text)){
            throw new Error('Text must not be empty.');
        }

        let newBoardId = ObjectId(boardId);
        const labelColor = label_colors[Math.floor(Math.random() * label_colors.length)];
        const boardCollection = await boards();

        const card = await getCardById(boardId, cardId);

        const label = {
            _id: new ObjectId(), 
            text: text,
            color: labelColor
        };

        card.labels.push(label);

        const updateInfo = await boardCollection.updateOne({_id: newBoardId}, { $set: {cards: card}})
        if (!updateInfo.matchedCount && !updateInfo.modifiedCount){
            throw new Error('Could not add the label.');
        }

        const label = await getLabelById(boardId, cardId, label._id);
        return label;
    },
    
    /**
     * Update a label.
     * @param {string} boardId The board's id.
     * @param {string} cardId The card's id.
     * @param {string} labelId The label's id.
     * @param {string} text The label's text.
     * @param {string} color The label's color hex code.
     * @returns A label object.
     */
    async updateLabel(boardId, cardId, labelsArray){

        if(!boardId || !error_handler.checkObjectId(boardId)){
            throw new Error('boardId is not valid.');
        }
        if(!cardId || !error_handler.checkObjectId(cardId)){
            throw new Error('cardId is not valid.');
        }
        if(!labelArray || !error_handler.checkArrayOfLabels(labelsArray)){
            throw new Error('labelsArray is not valid');
        }

        let newBoardId = ObjectId(boardId);
        const boardCollection = await boards();

        const card = await getCardById(boardId, cardId);
        card.labels = labelsArray;

        const updateInfo = await boardCollection.updateOne({_id: newBoardId }, {$set: {cards: card}});
        if (!updateInfo.matchedCount && !updateInfo.modifiedCount){
            throw new Error('Could not update the label.');
        }
        
        const label = await getLabelById(boardId, cardId, labelId);
        return label;
    },

    /**
     * Delete a label.
     * @param {string} boardId The board's id.
     * @param {string} cardId The card's id.
     * @param {string} labelId The label's id.
     * @returns An object containing the labelId and if the label was deleted.
     */
    async deleteLabel(boardId, cardId, labelId){
        if(!boardId || !error_handler.checkObjectId(boardId)){
            throw new Error('boardId is not valid');
        }
        if(!cardId || !error_handler.checkObjectId(cardId)){
            throw new Error('cardId is not valid');
        }
        if(!labelId || !error_handler.checkObjectId(labelId)){
            throw new Error('labelId is not valid');
        }
        
        const boardCollection = await boards();
        const newBoardId = ObjectId(boardId);

        const card = await getCardById(boardId, cardId);
        card.labels.filter((obj) => obj._id.toString() !== labelId);

        const updateInfo = await boardCollection.updateOne({_id: newBoardId }, {$set: {cards: card}})
        if (!updateInfo.matchedCount && !updateInfo.modifiedCount){
            throw new Error('Could not delete the label.');
        }

        return {labelId: labelId, deleted: true};
    }
}

module.exports = exportedModules;