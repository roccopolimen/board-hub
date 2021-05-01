const mongoCollections = require('../config/mongoCollections');
const boards = mongoCollections.boards;
const users = mongoCollections.users;
const {user_colors} = require('../public/constants/index');
const {ObjectId} = require('mongodb');
const bcrypt = require('bcryptjs');
const saltRounds = 16;
const error_handler = require('../errors/error-handler'); 


module.exports = {
    /**
     * Get a user with a specific ID.
     * @param {String} id The user's id.
     * @returns A user.
     */
    readById: async (id) => {
        if(!id || !error_handler.checkObjectId(id))
            throw new Error("id is not valid.");

         const userCollection = await users();
         const user = await userCollection.findOne({_id: ObjectId(id)});
         if(user === null)
             throw new Error("There is no user with that id.");
 
         user['_id'] = user['_id'].toString();
 
         return user;
    },

    /**
     * Get a user with a specific email.
     * @param {String} email The user's email.
     * @returns A user.
     */
     readByEmail: async (email) => {
        if(!email || !error_handler.checkEmail(email))
            throw new Error("email is not valid.");

         const userCollection = await users();
         const user = await userCollection.findOne({email: email});
         if(user === null)
             throw new Error("There is no user with that email.");
 
         user['_id'] = user['_id'].toString();
 
         return user;
    },

    /**
     * Adds a new user. Picks a random color from pre-approved values, hashes the password, and starts the list of boards as empty.
     * @param {String} email The email address of the user.
     * @param {String} firstName The first name of the user.
     * @param {String} lastName The last name of the user.
     * @param {String} password The password chosen by the user that will be hashed.
     * @returns The user object.
     */
    create: async (email, firstName, lastName, password) => {
        if(!email || !error_handler.checkEmail(email))
            throw new Error("Email is not valid.");
            
        if(!firstName || !error_handler.checkFirstName(firstName))
            throw new Error("First name is not valid.");

        if(!lastName || !error_handler.checkLastName(lastName))
            throw new Error("Last name is not valid.");

        if(!password || !error_handler.checkNonEmptyString(password))
            throw new Error("Password is not valid.");

        try {
            await module.exports.readByEmail(email);
        } catch(e){

            const hashedPassword = await bcrypt.hash(password, saltRounds);
            const color = user_colors[Math.floor(Math.random() * user_colors.length)];
    
            let newUser = {
                email,
                firstName,
                lastName,
                color,
                hashedPassword
            };
            newUser.boards = [];

            const userCollection = await users();
            const insertInfo = await userCollection.insertOne(newUser);
            if(insertInfo.insertedCount === 0)
                throw new Error("Could not add user.");

            return await module.exports.readById(insertInfo.insertedId.toString());
        }

        throw new Error("Email is already attached to a user.");
    },

    /**
     * Updates the user's password.
     * @param {String} id The user's id.
     * @param {String} password The new password to hash and replace hashedPassword.
     * @returns A user object with updated hashedPassword.
     */
    update_password: async(id, password) => {
        if(!id || !error_handler.checkObjectId(id))
            throw new Error("id is not valid.");
            
        if(!password || !error_handler.checkNonEmptyString(password))
            throw new Error("Password is not valid.");

        const newPass = await bcrypt.hash(password, saltRounds);
        const userCollection = await users();
        const updatedInfo = await userCollection.updateOne({ _id: ObjectId(id) },
        { $set: {hashedPassword: newPass} });

        if (updatedInfo.modifiedCount === 0)
            throw new Error("Could not update user password successfully.");

        return await module.exports.readById(id);
    },

    /**
     * Delete the user id from each board, comment, and card assignment.
     * @param {String} id The user's id.
     * @returns A success object.
     */
    delete: async (id) => {
        if(!id || !error_handler.checkObjectId(id))
            throw new Error("id is not valid.");

        const userCollection = await users();
        const user = await module.exports.readById(id);

        // Remove the user ID from each board and it's subdocuments (when applicable)
        const user_boards = user['boards'];
        const boardCollection = await boards();
        for(board of user_boards) {
            const curr_board = await boardCollection.findOne({_id: ObjectId(board)});
            if(curr_board === null)
                continue;

            if(curr_board.members.length === 1) { // last member
                await boardCollection.deleteOne({ _id: ObjectId(board) });
                continue;
            } 

            // https://docs.mongodb.com/manual/reference/operator/update/positional-all/#std-label-position-nested-arrays
            
            // Remove user's comments
            await boardCollection.updateMany({},
                { $pull: { "cards.$[].comments": { 'user': ObjectId(id) } } });

            // Remove user's assignments
            await boardCollection.updateMany({},
                { $pull: { "cards.$[].assigned": ObjectId(id) } });

            if(curr_board.members.length > 1) { // don't delete board
                await boardCollection.updateOne({ _id: ObjectId(board) },
                 { $pull: { members: ObjectId(id) } });
            }
         }
 
         // Delete the user from the collection
         const deletionInfo = await userCollection.deleteOne({ _id: ObjectId(id) });
         if (deletionInfo.deletedCount === 0)
             throw new Error(`Could not delete user with id of ${id}`);
 
         return { userId: id, deleted: true };
    },
    /**
     * Remove the user from the board completely.
     * @param {String} userId The user's id.
     * @param {String} boardId The board's id.
     * @returns A success object.
     */
     remove: async (userId, boardId) => {
        if(!userId || !error_handler.checkObjectId(userId))
            throw new Error("id is not valid.");

        if(!boardId || !error_handler.checkObjectId(boardId))
            throw new Error("id is not valid.");

        const userCollection = await users();
        const updatedInfo = await userCollection.updateOne({ _id: ObjectId(userId) },
            { $pull: {boards: ObjectId(boardId)} });

        if (updatedInfo.modifiedCount === 0)
            throw new Error("Could not remove user from board.");

        // Remove the user ID from each board and it's subdocuments (when applicable)
        const boardCollection = await boards();

        const curr_board = await boardCollection.findOne({_id: ObjectId(boardId)});
        if(!curr_board)
            throw new Error("No board with that id.");

        if(curr_board.members.length === 1) { // last member
            await boardCollection.deleteOne({ _id: ObjectId(boardId) });
            return;
        } else {
            await boardCollection.updateOne({ _id: ObjectId(boardId) }, { $pull: { members: ObjectId(userId) } });
        }
        
        // Remove user's comments
        await boardCollection.updateMany({_id: ObjectId(boardId)},
            { $pull: { "cards.$[].comments": { 'user': ObjectId(userId) } } });

        // Remove user's assignments
        await boardCollection.updateMany({_id: ObjectId(boardId)},
            { $pull: { "cards.$[].assigned": ObjectId(userId) } });
 
         return;
    }
};