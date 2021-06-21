const mongoose = require('mongoose')

const SubCategoryModel = mongoose.model('category', new mongoose.Schema({
    _id: String,
    displayName: String,
    count: Number,
    weightCat: String,
    fields: [],
    vsStore: {},
    filters: []
}, {collection: 'category', strict: false}))

module.exports = SubCategoryModel