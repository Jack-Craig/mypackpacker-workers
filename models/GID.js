const mongoose = require('mongoose')
module.exports = mongoose.model('gids', new mongoose.Schema({
    _id: String
}, {strict: false, collection: 'gids'}))