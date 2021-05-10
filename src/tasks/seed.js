const connection = require('../config/mongoConnection');
const ObjectId = require('mongodb').ObjectID;


const seedDB = async () => {

// PREPARE THE DATABASE

    const db = await connection();

    try {
        await db.collection('users').drop();
    } catch(e) {
        // the collection does not exist yet
    }

    try {
        await db.collection('boards').drop();
    } catch(e) {
        // the collection does not exist yet
    }

    const boardCollection = await db.collection('boards');
    const userCollection = await db.collection('users');

// HELPER FUNCTIONS TO MAKE OBJECTS

    const makeUser = (id, email, firstName, lastName, color, hashedPassword) => {
        return {
            _id: id,
            email: email,
            firstName: firstName,
            lastName: lastName,
            color: color,
            hashedPassword: hashedPassword,
            boards: []
        };
    };

    const addBoardToUser = (user, boardId) => {
        user.boards.push(boardId);
    };

    const makeBoard = (id, boardName, boardColor, description) => {
        return {
            _id: id,
            boardName: boardName,
            boardColor: boardColor,
            description: description,
            members: [],
            lists: [],
            cards: []
        };
    };

    const addMemberToBoard = (board, userId) => {
        board.members.push(userId);
    };

    const addListToBoard = (board, list) => {
        board.lists.push(list);
    };

    const addCardToBoard = (board, card) => {
        board.cards.push(card);
    };

    const makeList = (id, listName) => {
        return {
            _id: id,
            listName: listName,
            cardIds: []
        };
    };

    const addCardToList = (list, cardId) => {
        list.cardIds.push(cardId);
    };

    const makeCard = (id, cardName, storyPoints, description, dueDate, listId) => {
        return {
            _id: id,
            cardName: cardName,
            storyPoints, storyPoints,
            description: description,
            labels: [],
            dueDate: dueDate,
            comments: [],
            assigned: [],
            list: listId
        };
    };

    const addLabelToCard = (card, label) => {
        card.labels.push(label);
    };

    const addCommentToCard = (card, comment) => {
        card.comments.push(comment);
    };

    const addAssignedToCard = (card, userId) => {
        card.assigned.push(userId);
    };

    const makeLabel = (id, text, color) => {
        return {
            _id: id,
            text: text,
            color: color
        };
    };

    const makeComment = (id, userId, date, comment) => {
        return {
            _id: id,
            user: userId,
            date: date,
            comment: comment
        };
    };

// CREATE USERS

    const listOfUsers = [];

    // user 1
    const user1 = makeUser(ObjectId('608424a979077f0a237f1d16'), 'user1@gmail.com', 'First', 'User', '#aa47bc', '$2y$08$X1b4xs.OBrhiUxelDZkVdOWNd3ytLWwM8GpmP2CVX490GR/gzjnYm');

    // user 2
    const user2 = makeUser(ObjectId('608424a979077f0a237f1d17'), 'user2@gmail.com', 'Second', 'User', '#7a1fa2', '$2y$08$.CJDbmU9se5Pzy7L.U4u4er5MF8mcxoA9hvkA/8.Sf4m1KT/7j1K.');

    // user 3
    const user3 = makeUser(ObjectId('608424a979077f0a237f1d18'), 'user3@gmail.com', 'Third', 'User', '#5c6bc0', '$2y$08$mULdDOEWEMtUnKkU6.yPQ.3AAK5qGx34WlDUVyj5StHxJw7dUpF46');

    // user 4
    const user4 = makeUser(ObjectId('608424a979077f0a237f1d19'), 'user4@gmail.com', 'Fourth', 'User', '#689f39', '$2y$08$/oFNbdJN4m/obzbo9znU..1u2OlVsQn2r0yne2ouQJfOiXRnLBLVO');

// CREATE BOARDS

    const listOfBoards = [];

    // BOARD 1
    const board1 = makeBoard(ObjectId('608424a979077f0a237f1d1a'), 'First Board', '#E27D60', 'this is my first board');

    addBoardToUser(user1, board1._id);
    addBoardToUser(user2, board1._id);
    addMemberToBoard(board1, user1._id);
    addMemberToBoard(board1, user2._id);

    // BOARD 1 LISTS
    const board1List1 = makeList(ObjectId('608424a979077f0a237f1d1b'), 'First List');
    const board1List2 = makeList(ObjectId('608424a979077f0a237f1d1c'), 'Second List');
    const board1List3 = makeList(ObjectId('608424a979077f0a237f1d1d'), 'Third List');

    // BOARD 1 CARD 1
    const board1Card1 = makeCard(ObjectId('608424a979077f0a237f1d1e'), 'Card 1', 1, 'this is my first card', { date: '04/24/2021*12:04', done: false }, board1List1._id);
    addCardToList(board1List1, board1Card1._id);
    addCardToBoard(board1, board1Card1);

    const board1Card1Label1 = makeLabel(ObjectId('608424a979077f0a237f1d22'), 'label 1', '#3FEEE6');
    addLabelToCard(board1Card1, board1Card1Label1);

    const board1Card1Label2 = makeLabel(ObjectId('608424a979077f0a237f1d23'), 'label 2', '#EFE2BA');
    addLabelToCard(board1Card1, board1Card1Label2);

    const board1Card1Comment1 = makeComment(ObjectId('608424a979077f0a237f1d24'), user1._id, '04/08/2020*14:44', 'this is my first comment');
    addCommentToCard(board1Card1, board1Card1Comment1);

    const board1Card1Comment2 = makeComment(ObjectId('608424a979077f0a237f1d25'), user2._id, '09/09/2020*08:08', 'this is my second comment');
    addCommentToCard(board1Card1, board1Card1Comment2);

    // BOARD 1 CARD 2
    const board1Card2 = makeCard(ObjectId('608424a979077f0a237f1d1f'), 'Card 2', 2, 'this is my second card', { date: '04/25/2021*01:05', done: false }, board1List1._id);
    addCardToList(board1List1, board1Card2._id);
    addCardToBoard(board1, board1Card2);

    const board1Card2Label1 = makeLabel(ObjectId('608424a979077f0a237f1d26'), 'card2Label', '#14A76C');
    addLabelToCard(board1Card2, board1Card2Label1);

    const board1Card2Comment1 = makeComment(ObjectId('608424a979077f0a237f1d27'), user2._id, '06/14/2020*08:15', 'second card comment');
    addCommentToCard(board1Card2, board1Card2Comment1);

    addAssignedToCard(board1Card2, user2._id);
    addAssignedToCard(board1Card2, user1._id);

    // BOARD 1 CARD 3
    const board1Card3 = makeCard(ObjectId('608424a979077f0a237f1d20'), 'Card 3', 3, 'this is my third card', { date: '04/26/2021*01:06', done: true }, board1List1._id);
    addCardToList(board1List1, board1Card3._id);
    addCardToBoard(board1, board1Card3);

    addAssignedToCard(board1Card3, user1._id);

    // BOARD 1 CARD 4
    const board1Card4 = makeCard(ObjectId('608424a979077f0a237f1d21'), 'Card 4', 76, 'this is my fourth card', { date: '07/07/2021*01:06', done: true }, board1List2._id);
    addCardToList(board1List2, board1Card4._id);
    addCardToBoard(board1, board1Card4);

    const board1Card4Comment1 = makeComment(ObjectId('608424a979077f0a237f1d28'), user2._id, '05/05/2020*05:05', 'looks good!');
    addCommentToCard(board1Card4, board1Card4Comment1);

    addListToBoard(board1, board1List1);
    addListToBoard(board1, board1List2);
    addListToBoard(board1, board1List3);

// SEED DATA FOR GRADING

    // USERS
    const pHill = makeUser(ObjectId('608424a979077f0a237f1d2a'), 'phill@stevens.edu', 'Patrick', 'Hill', '#ec407a', '$2y$12$gpB5GkxpvtXkBi513TtWFuJ024UafaWCLlW7CGVqYiEhh9FP04OV2');

    const nickPrimamore = makeUser(ObjectId('608424a979077f0a237f1d2b'), 'nprimamo@stevens.edu', 'Nick', 'Primamore', '#0288d1', '$2y$12$2FDcp.Vsol/JpsNHbhqLguvxS1/L/xSdkd855OKagvBWPtjhIrH3C');
    const natalieBernhard = makeUser(ObjectId('608424a979077f0a237f1d2c'), 'nbernhar@stevens.edu', 'Natalie', 'Bernhard', '#c2175b', '$2y$12$8cA/fDmyJrMh6mIsbIRU7eKqz5ta2594Qw8890H3FDFmtj47cQUy6');
    const abinJones = makeUser(ObjectId('608424a979077f0a237f1d2d'), 'ajones6@stevens.edu', 'Abin', 'Jones', '#ef6c00', '$2y$12$vSqYtPop8VQZCQKgwqqBierqyE/v6p/ovOY1KMrHc/ZThdrH6neaS');
    const christinaLi = makeUser(ObjectId('608424a979077f0a237f1d2e'), 'cli50@stevens.edu', 'Christina', 'Li', '#7a1fa2', '$2y$12$xdE3wxMPMmzo8fw9ALYFauMcu6204VrBlUGrhAILmIue4/rJQ0SX2');
    const liamKing = makeUser(ObjectId('608424a979077f0a237f1d2f'), 'lking2@stevens.edu', 'Liam', 'King', '#78909c', '$2y$12$RL6Fznyfvh7tTUgnZ26dPOrqZ/.uvfCwB1ByE3syTgksG2xdJJ7QC');
    const sejalVyas = makeUser(ObjectId('608424a979077f0a237f1d30'), 'svyas5@stevens.edu', 'Sejal', 'Vyas', '#512da7', '$2y$12$3a85OauuKlQARkm6IKRfru6zkAp0zp1.H5vDCWsqt0x9mc9wNF3C2 ');

    // BOARDS
    const cs546 = makeBoard(ObjectId('608424a979077f0a237f1d31'), 'CS 546', '#557A95', 'board to organize duties of running CS 546: Web Programming I at Stevens.');
    const homeRenovation = makeBoard(ObjectId('608424a979077f0a237f1d32'), 'New Home, New Chores', '#E27D60', 'this is my personal board I use to keep track of all the things I want to accomplish to get this new house to be my dream home!');

    addBoardToUser(pHill, cs546._id);
    addBoardToUser(nickPrimamore, cs546._id);
    addBoardToUser(natalieBernhard, cs546._id);
    addBoardToUser(abinJones, cs546._id);
    addBoardToUser(christinaLi, cs546._id);

    addMemberToBoard(cs546, pHill._id);
    addMemberToBoard(cs546, nickPrimamore._id);
    addMemberToBoard(cs546, natalieBernhard._id);
    addMemberToBoard(cs546, abinJones._id);
    addMemberToBoard(cs546, christinaLi._id);

    addBoardToUser(pHill, homeRenovation._id);
    addMemberToBoard(homeRenovation, pHill._id);

    // LISTS
    const csToDo = makeList(ObjectId('608424a979077f0a237f1d33'), 'To Do');
    const csInProgress = makeList(ObjectId('608424a979077f0a237f1d34'), 'In Progress');
    const csCompleted = makeList(ObjectId('608424a979077f0a237f1d35'), 'Completed');

    addListToBoard(cs546, csToDo);
    addListToBoard(cs546, csInProgress);
    addListToBoard(cs546, csCompleted);

    const homeBackLog = makeList(ObjectId('608424a979077f0a237f1d4c'), 'Backlog');
    const homeFinished = makeList(ObjectId('608424a979077f0a237f1d4d'), 'Finished');

    addListToBoard(homeRenovation, homeBackLog);
    addListToBoard(homeRenovation, homeFinished);

    // CARDS

    // CARD 1
    const giveBH100 = makeCard(ObjectId('608424a979077f0a237f1d36'), 'Give BoardHub a 100%', 1, 'great project. 10/10 would recommend all of my co-workers swtich to BoardHub and leave Trello', { date: '05/21/2021*03:00', done: false }, csToDo._id);
    addCardToList(csToDo, giveBH100._id);
    addCardToBoard(cs546, giveBH100);

    const giveBH100L1 = makeLabel(ObjectId('608424a979077f0a237f1d3d'), 'Grading', '#ff78cb');
    addLabelToCard(giveBH100, giveBH100L1);
    const giveBH100L2 = makeLabel(ObjectId('608424a979077f0a237f1d43'), 'Important!', '#344563');
    addLabelToCard(giveBH100, giveBH100L2);
    const giveBH100L1C1 = makeComment(ObjectId('608424a979077f0a237f1d3e'), nickPrimamore._id, '05/17/2021*14:44', 'I couldn\'t aggre more!');
    addCommentToCard(giveBH100, giveBH100L1C1);
    const giveBH100L1C2 = makeComment(ObjectId('608424a979077f0a237f1d3f'), natalieBernhard._id, '05/17/2021*14:57', '+1');
    addCommentToCard(giveBH100, giveBH100L1C2);
    const giveBH100L1C3 = makeComment(ObjectId('608424a979077f0a237f1d40'), christinaLi._id, '05/17/2021*15:27', '^^');
    addCommentToCard(giveBH100, giveBH100L1C3);
    const giveBH100L1C4 = makeComment(ObjectId('608424a979077f0a237f1d41'), abinJones._id, '05/17/2021*18:40', 'We Love BoardHub!');
    addCommentToCard(giveBH100, giveBH100L1C4);
    addAssignedToCard(giveBH100, pHill._id);

    // CARD 2
    const inviteToBoard = makeCard(ObjectId('608424a979077f0a237f1d37'), 'Invite Liam and Sejal To Board!', 1, 'we forgot to add Liam and Sejal! :O\nNo Worries, we can just go to \'Board Settings\' at the top right and invite them using their emails since they are already registered :) [lking2@stevens.edu, svyas5@stevens.edu]', {} ,csToDo._id);
    delete inviteToBoard.dueDate;
    addCardToList(csToDo, inviteToBoard._id);
    addCardToBoard(cs546, inviteToBoard);

    const inviteToBoardL1 = makeLabel(ObjectId('608424a979077f0a237f1d42'), 'Administrative', '#00c2e0');
    addLabelToCard(inviteToBoard, inviteToBoardL1);
    const inviteToBoardC1 = makeComment(ObjectId('608424a979077f0a237f1d44'), christinaLi._id, '05/15/2021*08:33', 'How could you forget them Professor!');
    addCommentToCard(inviteToBoard, inviteToBoardC1);


    // CARD 3
    const organizedAndProductive = makeCard(ObjectId('608424a979077f0a237f1d38'), 'Being Organized and Productive', 0, 'BoardHub has improved our productivity tenfold!', {} ,csInProgress._id);
    delete organizedAndProductive.dueDate;
    delete organizedAndProductive.storyPoints;
    addCardToList(csInProgress, organizedAndProductive._id);
    addCardToBoard(cs546, organizedAndProductive);

    const organizedAndProductiveC1 = makeComment(ObjectId('608424a979077f0a237f1d44'), pHill._id, '05/16/2021*12:12', 'all thanks to BoardHub! :)');
    addCommentToCard(organizedAndProductive, organizedAndProductiveC1);

    // CARD 4
    const gradeFinals = makeCard(ObjectId('608424a979077f0a237f1d39'), 'Grade Final Projects', 5, 'Go through and grade each project based on the outline and personal testing.', { date: '05/21/2021*22:00', done: false } ,csInProgress._id);
    addCardToList(csInProgress, gradeFinals._id);
    addCardToBoard(cs546, gradeFinals);

    const gradeFinalsL1 = makeLabel(ObjectId('608424a979077f0a237f1d45'), 'Grading', '#c377e0');
    addLabelToCard(gradeFinals, gradeFinalsL1);
    addAssignedToCard(gradeFinals, pHill._id);

    // CARD 5
    const givingLectures = makeCard(ObjectId('608424a979077f0a237f1d3a'), 'Lectures', 8, '', { date: '05/10/2021*21:00', done: true } ,csCompleted._id);
    addCardToList(csCompleted, givingLectures._id);
    addCardToBoard(cs546, givingLectures);

    const givingLecturesC1 = makeComment(ObjectId('608424a979077f0a237f1d46'), pHill._id, '04/12/2021*17:02', 'can someone come to lecture tonight?');
    addCommentToCard(givingLectures, givingLecturesC1);
    const givingLecturesC2 = makeComment(ObjectId('608424a979077f0a237f1d47'), natalieBernhard._id, '04/12/2021*17:55', 'I\'ll be there Professor!');
    addCommentToCard(givingLectures, givingLecturesC2);
    addAssignedToCard(givingLectures, pHill._id);

    // CARD 6
    const hoolaHoop = makeCard(ObjectId('608424a979077f0a237f1d3b'), 'Learn How To Hoola Hoop', 3, 'all the cool kids are doing it, so we thought we\'d give it a shot!', {} ,csCompleted._id);
    delete hoolaHoop.dueDate;
    addCardToList(csCompleted, hoolaHoop._id);
    addCardToBoard(cs546, hoolaHoop);

    const hoolaHoopL1 = makeLabel(ObjectId('608424a979077f0a237f1d48'), 'Important!', '#51e898');
    addLabelToCard(hoolaHoop, hoolaHoopL1);
    const hoolaHoopC1 = makeComment(ObjectId('608424a979077f0a237f1d49'), abinJones._id, '05/10/2021*14:23', 'Are we getting paid to do this?');
    addCommentToCard(hoolaHoop, hoolaHoopC1);
    const hoolaHoopC2 = makeComment(ObjectId('608424a979077f0a237f1d4a'), pHill._id, '05/10/2021*15:08', 'Of course');
    addCommentToCard(hoolaHoop, hoolaHoopC2);
    const hoolaHoopC3 = makeComment(ObjectId('608424a979077f0a237f1d4b'), pHill._id, '05/10/2021*15:09', 'you will be getting paid with a newfound skill');
    addCommentToCard(hoolaHoop, hoolaHoopC3);
    addAssignedToCard(hoolaHoop, pHill._id);
    addAssignedToCard(hoolaHoop, nickPrimamore._id);
    addAssignedToCard(hoolaHoop, natalieBernhard._id);
    addAssignedToCard(hoolaHoop, abinJones._id);
    addAssignedToCard(hoolaHoop, christinaLi._id);

    // CARD 7
    const today = new Date();
    const date = `${('0'+(today.getMonth()+1)).slice(-2)}/${('0'+today.getDate()).slice(-2)}/${today.getFullYear()}*${('0'+today.getHours()).slice(-2)}:${('0'+today.getMinutes()).slice(-2)}`;
    const switchBoard = makeCard(ObjectId('608424a979077f0a237f1d3c'), 'Switch from Trello to BoardHub', 1, 'all the cool kids are doing it, so we thought we\'d give it a shot! (just like hoola hooping). Glad you chose to make the switch right now!', { date: date, done: true } ,csCompleted._id);
    addCardToList(csCompleted, switchBoard._id);
    addCardToBoard(cs546, switchBoard);

    // CARD 8
    const gotHouse = makeCard(ObjectId('608424a979077f0a237f1d4e'), 'Buy a House!', 99, 'congrats again on the house!', {} ,homeFinished._id);
    delete gotHouse.dueDate;
    addCardToList(homeFinished, gotHouse._id);
    addCardToBoard(homeRenovation, gotHouse);

    // CARD 9
    const getDesk = makeCard(ObjectId('608424a979077f0a237f1d4f'), 'Get a Desk (Sit/Stand?)', 2, 'buy a new desk that\'ll make working from home more enjoyable', {} ,homeBackLog._id);
    delete getDesk.dueDate;
    addCardToList(homeBackLog, getDesk._id);
    addCardToBoard(homeRenovation, getDesk);

    // CARD 10
    const getKeyboard = makeCard(ObjectId('608424a979077f0a237f1d50'), 'Get a Clicky Keyboard', 1, 'nothing is more satisfying than clacking away on a mechanical keyboard when programming. Others in the house may disagree...', {} ,homeBackLog._id);
    delete getKeyboard.dueDate;
    addCardToList(homeBackLog, getKeyboard._id);
    addCardToBoard(homeRenovation, getKeyboard);

    // CARD 11
    const abstractArt = makeCard(ObjectId('608424a979077f0a237f1d51'), 'Abstract Art Canvas', 3, 'Set the mood of the house with some abstract art pieces, so when people come over they think you have \'exquisite taste\'', {} ,homeBackLog._id);
    delete abstractArt.dueDate;
    addCardToList(homeBackLog, abstractArt._id);
    addCardToBoard(homeRenovation, abstractArt);

    // CARD 12
    const basketballHoop = makeCard(ObjectId('608424a979077f0a237f1d52'), 'Get a Basketball Hoop', 2, 'No family home is complete without a basketball hoop in the driveway to inspire the young ones to one day be in the NBA', {} ,homeBackLog._id);
    delete basketballHoop.dueDate;
    addCardToList(homeBackLog, basketballHoop._id);
    addCardToBoard(homeRenovation, basketballHoop);


// INSERT MOCK DATA INTO DATABASE

    listOfUsers.push(user1, user2, user3, user4, pHill, nickPrimamore, natalieBernhard, abinJones, christinaLi, liamKing, sejalVyas);
    await userCollection.insertMany(listOfUsers);

    listOfBoards.push(board1, cs546, homeRenovation);
    await boardCollection.insertMany(listOfBoards);

    return 'all done!';
}

exports = module.exports = { seedDB };