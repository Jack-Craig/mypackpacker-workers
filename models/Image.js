const mongoose = require('mongoose')

const ImageModel = mongoose.model('image', new mongoose.Schema({
    uploaderID: mongoose.Types.ObjectId,
    img: {
        data: Buffer,
        contentType: String
    },
    associatedID: mongoose.Types.ObjectId,
    associatedSubID: String,
    uploadDate: {type: Date, default: new Date()}
}, {collection: 'images'}))
 
module.exports = ImageModel