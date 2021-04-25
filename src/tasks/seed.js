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

// INSERT MOCK DATA INTO DATABASE

    listOfUsers.push(user1, user2, user3, user4);
    await userCollection.insertMany(listOfUsers);

    listOfBoards.push(board1);
    await boardCollection.insertMany(listOfBoards);

    return 'all done!';
}

exports = module.exports = { seedDB };