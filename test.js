const mongoose = require('mongoose')
require('dotenv').config()

const handleAdminMessage = require('./subprocessess/adminMessages')
const handleAnalyticsCompile = require('./subprocessess/analyticsCompiler')
const handleCullGear = require('./subprocessess/cullGearZombies')
const handleUpdatePackStats = require('./subprocessess/updatePackStats')
const handleCullPacks = require('./subprocessess/cullPackZombies')
const handlePackFilters = require('./subprocessess/updatePackFilters')

mongoose.connect(process.env.MONGO_URI).then(() => {
    handleUpdatePackStats({content: 'tents'}).then(async done=>await mongoose.disconnect())
    //handlePackFilters().then(async done=>await mongoose.disconnect())
})