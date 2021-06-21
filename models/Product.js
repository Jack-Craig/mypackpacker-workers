const mongoose = require('mongoose')

const ProductModel = mongoose.model('product', new mongoose.Schema({
    displayName: String, // Same as ID
    categoryID: String,
    fuzzyNames: {type: [String], default: []},
    brand: String,
    priceInfo: {
        /**
        [source] ,
        url: String,
        priceHistory: [
            {
                date: Date,
                priceRange: {
                    minPrice: Number,
                    paxPrice: Number,
                },
                isAvaliable: Boolean
            }
        ]
        */
    },
    productInfo: {
        weight: Number,
        size: Number,
        pictures: [String],
        description: String,
        unaffiliatedUrl: String
    },
    lowestPriceRange: {
        minPrice: Number,
        maxPrice: Number
    },
    userCreated: {type: Boolean, default: false},
    authorUserId: {type: mongoose.Schema.Types.ObjectId, required: false},
    dateCreated: {type: Date, default: Date.now}
}, {strict: false}))

module.exports = ProductModel