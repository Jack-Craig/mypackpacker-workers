const mongoose = require('mongoose')

const SubCategoryModel = mongoose.model('category', new mongoose.Schema({
    _id: String,
    displayName: String,
    recommendedCap: {type: Number, default: 1},
    count: Number,
    weightCat: String
}, {collection: 'category'}))

module.exports = SubCategoryModel