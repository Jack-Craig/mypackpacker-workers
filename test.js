const mongoose = require('mongoose')
require('dotenv').config()

const SubCategory = require('./models/SubCategory') 
const handleAdminMessage = require('./subprocessess/adminMessages')
const handleAnalyticsCompile = require('./subprocessess/analyticsCompiler')
const handleCullGear = require('./subprocessess/cullGearZombies')
const handleUpdatePackStats = require('./subprocessess/updatePackStats')
const handleCullPacks = require('./subprocessess/cullPackZombies')
const handlePackFilters = require('./subprocessess/updatePackFilters')
const handleGearStats = require('./subprocessess/updateGearStats')

const transfer = {
    rat: 'Higher rated', // Rating
    fP: 'More expensive', // Price
    fW: 'Heavier', // Weight
    s: 'More capacity', // Backback size
    th: 'Thicker', // Pad thickness
    tr: 'Higher rated', // Sleeping bag temp
    cap: 'Larger', // Water container/stove size
    lo: 'Brighter', // Lumens for light
    cp: 'Sleeps more', // Sleeping capacity

}

mongoose.connect(process.env.MONGO_URI).then(async () => {
    await handleUpdatePackStats({content: 'pots-and-pans'})
    await mongoose.disconnect()
})