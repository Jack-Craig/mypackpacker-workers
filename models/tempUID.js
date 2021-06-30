const mongoose = require('mongoose')

const TempUIDModel = mongoose.model('tempUID', new mongoose.Schema({
    _id: mongoose.Types.ObjectId, // User's ID
    tempId: String,
    created: Date,
}, {collection: 'temp_uids'}))
 
module.exports = TempUIDModel