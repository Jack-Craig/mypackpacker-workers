const mongoose = require('mongoose')

const AnalyticsModel = mongoose.model('analytics', new mongoose.Schema({
    entryNumber: Number,
    numEntries: {type: Number, required:false},
    date: { type: Date, default: Date.now },
    numUsers: Number,
    numPacks: Number,
    numSessionPacks: Number,
    numGearItems: Number
}, { collection: 'analytics' }))

module.exports = AnalyticsModel