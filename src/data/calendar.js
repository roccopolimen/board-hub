const mongoCollections = require('../config/mongoCollections');
const boards = mongoCollections.boards;
const error_handler = require('../errors/error-handler');
const ics = require('ics');
const { writeFileSync } = require('fs');
const ics = require('ics');

module.exports = {
    
    /**
    * Puts all cards with due dates into a .ics file
    * @param {String} boardId The board's id.
    * @param {string} calendarName The name of the .ics file to be created.
    * @returns True if all events were added, otherwise throws error.
    */
    makeCal: async (boardId, calendarName) => {
        if(!boardId || !error_handler.checkObjectId(id)) {
            throw new Error("Board id is not valid.");
        }

        if(!calendarName || !error_handler.checkNonEmptyString(calendarName)) {
            throw new Error("Calendar Name is not valid.")
        }

        const boardCollection = await boards();
        const board = await boardCollection.findOne({_id: ObjectId(boardId)});

        for(let x=0; x<board.cards.length; x++) {
            let card = board.cards[x];
            ics.createEvent({
                title: card.cardName,
                description: card.description,
                start: [card.dueDate.getFullYear(),
                    card.dueDate.getMonth() + 1,
                    card.dueDate.getDate(),
                    card.dueDate.getHours(),
                    card.dueDate.getMinutes()]
            }, (error, value) => {
                if (error) {
                  throw new Error(error);
                }
                
                let fileName = calendarName.trim();

                //I made a calendars foler to send them to for now
                writeFileSync(`${__dirname}/calendars/${fileName}.ics`, value)
            })
        }

        return true;
    }
}