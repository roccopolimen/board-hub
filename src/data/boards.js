const mongoCollections = require('../config/mongoCollections');
const boards = mongoCollections.boards;
const users = mongoCollections.users;
const {colors} = require('../public/constants/index');
const {ObjectId} = require('mongodb');
const error_handler = require('../errors/error-handler'); 

function newFields(newBoard, oldBoard) {
  fields = {};
  if(newBoard.boardName && newBoard.boardName !== oldBoard.boardName) {
    if(!error_handler.checkNonEmptyString(newBoard.boardName))
      throw new Error("Board name must not be empty.");
    fields.boardName = newBoard.boardName;
  }
  if(newBoard.boardColor && newBoard.boardColor !== oldBoard.boardColor) {
    if(!error_handler.checkColor(newBoard.boardColor))
      throw new Error("Board color must be valid hex code.");
    fields.boardColor = newBoard.boardColor;
  }
  if(newBoard.description && newBoard.description !== oldBoard.description) {
    if(!error_handler.checkNonEmptyString(newBoard.description))
      throw new Error("Board description must not be empty.");
    fields.description = newBoard.description;
  }

  return fields;
}


module.exports = {
  /**
   * Get a board with a specific ID.
   * @param {String} id The board's id.
   * @returns A board.
   */
  readByID: async (id) => {
    if(!error_handler.checkObjectId(id))
      throw new Error("id is not valid.");

    const boardCollection = await boards();
    const board = await boardCollection.findOne({_id: ObjectId(id)});
    if(board === null)
      throw new Error("There is no board with that id.");

    board['_id'] = board['_id'].toString();

    return board;
  },

  /**
   * Gets all boards that a user is a part of.
   * @param {String} id The user's id.
   * @returns A list of board objects.
   */
  readAll: async (id) => {
    if(!error_handler.checkObjectId(id))
      throw new Error("id is not valid.");

    const userCollection = await users();
    const user = await userCollection.findOne({_id: ObjectId(id)});
    if(user === null)
      throw new Error("There is no user with that id.");
    const boardList = user['boards'];

    return boardList;
  },

  /**
   * Adds a new board to the collection. Picks a random color from pre-approved values, and starts the description, lists, and cards as empty.
   * @param {String} userId The ID of the user requesting to create a new board.
   * @param {String} boardName The name of the new board.
   * @returns The board object.
   */
  create: async (userId, boardName) => {
    if(!error_handler.checkObjectId(userId))
      throw new Error("id is not valid.");

    if(!error_handler.checkNonEmptyString(boardName))
      throw new Error("Board name must not be empty.");

    const boardColor = colors[Math.floor(Math.random() * colors.length)];
    const description = "";
    const members = [userId];
    const lists = [];
    const cards = [];

    let newBoard = {
      boardName,
      boardColor,
      description,
      members,
      lists,
      cards
    };

    const boardCollection = await boards();
    const insertInfo = await boardCollection.insertOne(newBoard);
    if(insertInfo.insertedCount === 0)
      throw new Error("Could not add board.");

    return await module.exports.readByID(insertInfo.insertedId.toString());
  },

  /**
   * Updates the board with the fields of boardData from a PUT request.
   * @param {String} id The board's id.
   * @param {Object} boardData An object that may contain boardName, boardColor, and description.
   * @returns A board object with updated fields.
   */
  update: async (id, boardData) => {
    if(!error_handler.checkObjectId(id))
      throw new Error("id is not valid.");

    const boardCollection = await boards();
    let updatedBoard = newFields(boardData, await module.exports.readByID(id));
    if(Object.keys(updatedBoard).length === 0)
      console.log("No fields to update.");
    
    if(updatedBoard.boardName) {
      await boardCollection.updateOne({ _id: ObjectId(id) },
        { $set: {boardName: updatedBoard.boardName} });
    }
    if(updatedBoard.boardColor) {
      await boardCollection.updateOne({ _id: ObjectId(id) },
        { $set: {boardColor: updatedBoard.boardColor} });
    }
    if(updatedBoard.description) {
      await boardCollection.updateOne({ _id: ObjectId(id) },
        { $set: {description: updatedBoard.description} });
    }

    return await module.exports.readByID(id);
  },

  /**
   * Adds another user as a member to this board.
   * @param {String} id The board's id.
   * @param {String} userEmail The unique email of the user to be added.
   * @returns A board object with updated fields.
   */
  addNewMember: async (id, userEmail) => {
    if(!error_handler.checkObjectId(id))
      throw new Error("id is not valid.");

    if(!error_handler.checkEmail(userEmail))
      throw new Error("Email is not valid.");
    // Add member limit ?????

    // Get the user for their id, and make sure they exist.
    const userCollection = await users();
    const user = await userCollection.findOne({email: userEmail});
    if(user === null)
      throw new Error("There is no user with that email.");

    // Update the members with that user's id.
    const boardCollection = await boards();
    await boardCollection.updateOne({ _id: ObjectId(id) },
          { $addToSet: {members: user._id.toString()} });

    return await module.exports.readByID(id);
  },

  /**
   * Delete the board id from each member's list of board's and drop the board from the boards collection.
   * @param {String} id The board's id.
   * @returns A success object.
   */
  delete: async (id) => {
    if(!error_handler.checkObjectId(id))
      throw new Error("id is not valid.");

    const boardCollection = await boards();

    // Remove the board ID from each member
    const board = await module.exports.readByID(id);
    const members = board['members'];
    const userCollection = await users();
    for(member of members) {
      await userCollection.updateOne({ _id: ObjectId(member) },
        { $pull: { boards: id } });
    }

    // Delete the board from the collection
    const deletionInfo = await boardCollection.deleteOne({ _id: ObjectId(id) });
    if (deletionInfo.deletedCount === 0)
      throw new Error(`Could not delete board with id of ${id}`);

    return { boardId: id, deleted: true };
  }
}