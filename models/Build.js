const mongoose = require('mongoose')

const BuildModel = mongoose.model('builds', new mongoose.Schema({
    sessionID: String,
    authorUserID: mongoose.Schema.Types.ObjectID,
    active: Boolean,
    priceRange: {},
    displayName: String,
    build: {},
    published: {type: Boolean, default: false},
    publishDate: Date,
    description: {type: String, default: ''},
    imageIds: {type:[mongoose.Types.ObjectId], default: []},
    upvotes: {Type:Number, default: 0},
    baseWeight: {Type: Number, default: 0},
    wornWeight: {Type: Number, defualt: 0},
    totalWeight: {Type: Number, default: 0}
}, {collection: 'builds'}))

module.exports = BuildModel