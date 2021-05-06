const userData = require('./users');
const boardData = require('./boards');
const listData = require('./lists');
const cardData = require('./cards');
const labelData = require('./labels');
const commentData = require('./comments');

module.exports = {
    users: userData,
    boards: boardData,
    lists: listData,
    cards: cardData,
    labels: labelData,
    comments: commentData
};