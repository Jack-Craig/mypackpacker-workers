const mongoose = require('mongoose')

const UserModel = mongoose.model('user', new mongoose.Schema({
    username: String,
    password: String,
    email: {type: String, required: false},
    googleID: {type: String, required: false},
    gearListSaved: {type: [mongoose.Schema.Types.ObjectId], default: []},
    gearListOwned: {type: [mongoose.Schema.Types.ObjectId], default: []},
    communityPackLikes: {type: Object, default: {}}, // packID: -1, 0, 1 (disliked, nothing, liked)
    preferredUOM: {type: String, default: 'lb'},
    accessLevel: {type: Number, default: 0}
}, {collection: 'users'}))

module.exports = UserModel