const mongoCollections = require('../config/mongoCollections');
const boards = mongoCollections.boards;
const error_handler = require('../errors/error-handler');
const ics = require('ics');
const {ObjectId} = require('mongodb');
const { writeFileSync } = require('fs');
const { google } = require("calendar-link");


function genDate(card) {
    let tmp = card.dueDate.date.split("/");
    let tmp2 = tmp[2].split("*");
    let tmp3 = tmp2[1].split(":");
    return {year: tmp2[0],
            month: tmp[0],
            day: tmp[1],
            hour: tmp3[0],
            minutes: tmp3[1]};
}

module.exports = {
    
    /**
    * Puts all cards with due dates into a .ics file
    * @param {String} boardId The board's id.
    * @param {string} calendarName The name of the .ics file to be created.
    * @returns The path to the calendar file.
    */
    makeCal: async (boardId, calendarName) => {
        if(!boardId || !error_handler.checkObjectId(boardId)) {
            throw new Error("Board id is not valid.");
        }

        if(!calendarName || !error_handler.checkNonEmptyString(calendarName)) {
            throw new Error("Calendar Name is not valid.")
        }

        const boardCollection = await boards();
        const board = await boardCollection.findOne({_id: ObjectId(boardId)});

        let events = [];
        for(let x=0; x<board.cards.length; x++) {
            let card = board.cards[x];
            if(card.dueDate === undefined)
                continue;
            let date = genDate(card);
            events.push({
                title: card.cardName,
                description: card.description,
                start: [parseInt(date.year),
                    parseInt(date.month),
                    parseInt(date.day),
                    parseInt(date.hour),
                    parseInt(date.minutes)],
                duration: { hours: 1 }
            });
        }

        const { error, value } = ics.createEvents(events);
        
        if (error) {
            throw new Error("Couldn't make calendar file.");
        }
            
        let fileName = calendarName.trim();

        //I made a calendars folder to send them to for now
        // writeFileSync(`${__dirname}/calendars/${fileName}.ics`, value)
        writeFileSync(`public/calendars/${fileName}.ics`, value);

        return `public/calendars/${fileName}.ics`;
    },
    
     gCal: async (boardId, cardId) => {
        if(!boardId || !error_handler.checkObjectId(boardId)) {
            throw new Error("Board id is not valid.");
        }
        
        if(!cardId || !error_handler.checkObjectId(cardId)) {
            throw new Error("Card id is not valid.");
        }
        const boardCollection = await boards();
        const board = await boardCollection.findOne({_id: ObjectId(boardId)});
        let card;
        for(let x=0; x<board.cards.length; x++) {
            let tmp = board.cards[x];
            if (tmp._id == cardId){
                card = tmp;
                break;
            }
        }
        if(!card) {
            throw new Error("Couldn't find that card.");
        }

        if(card.dueDate === undefined) {
            throw new Error("No due date for this card.")
        }

        const date = genDate(card);
        const event = {
            title: card.cardName,
            description: card.description,
            start: `${date.year}-${date.month}-${date.day} ${date.hour}:${date.minutes}:00 +0100`,
            duration: [1, "hour"],
          };
          
        const linky = google(event);
        return linky;
    }
}