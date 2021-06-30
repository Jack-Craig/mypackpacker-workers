const MessageModel = require('../models/Message')
const handleMessage = (messageObj) => new Promise((resolve, reject) => {
    MessageModel.create(messageObj).then(resolve).catch(reject)
})
module.exports = handleMessage