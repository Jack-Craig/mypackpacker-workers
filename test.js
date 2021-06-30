const RedisSMQ = require('rsmq')
const mongoose = require('mongoose')
require('dotenv').config()

const QUEUENAME = 'all_messages'
const NAMESPACE = 'packpacker'

const REDIS_HOST = process.env.REDIS_HOST
const REDIS_PORT = process.env.REDIS_PORT
const REDIS_PASS = process.env.REDIS_PASS

const SubCategory = require('./models/SubCategory')
const handleAdminMessage = require('./subprocessess/adminMessages')
const handleAnalyticsCompile = require('./subprocessess/analyticsCompiler')
const handleCullGear = require('./subprocessess/cullGearZombies')
const handleUpdatePackStats = require('./subprocessess/updatePackStats')
const handleCullPacks = require('./subprocessess/cullPackZombies')
const handlePackFilters = require('./subprocessess/updatePackFilters')
const handleGearStats = require('./subprocessess/updateGearStats')
const email = require('./subprocessess/email')

let rsmq = new RedisSMQ({
    host: REDIS_HOST,
    port: REDIS_PORT,
    ns: NAMESPACE,
    password: REDIS_PASS
})
rsmq.getQueueAttributesAsync({ qname: QUEUENAME }).then(res=>{
    console.log(res)
})
/**
mongoose.connect(process.env.MONGO_URI).then(async () => {
    email.handleResetPassword({content:'jackdelcraig@gmail.com'}).finally(() => {
        mongoose.disconnect()
    })
})
 */