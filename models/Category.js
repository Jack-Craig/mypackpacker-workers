const mongoose = require('mongoose')

const UserModel = mongoose.model('header-categories', new mongoose.Schema({
    _id: String,
    displayName: String,
    subCategories: [String],
    count: Number,
}, {collection: 'header-categories'}))

module.exports = UserModel