const mongoose = require('mongoose')
module.exports = mongoose.model('sources', new mongoose.Schema({
    _id: String
}, {strict: false, collection: 'sources'}))