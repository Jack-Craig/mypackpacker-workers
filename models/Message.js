const mongoose = require('mongoose')

const MessageModel = mongoose.model('message', new mongoose.Schema({
  senderId: mongoose.Types.ObjectId,
  message: String,
  type: String,
  date: {type: Date, default: Date.now},
  isAdminMessage: Boolean,
  isWorkerMessage: Boolean
}, {collection: 'messages'}))
 
module.exports = MessageModel