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
let rsmq = new RedisSMQ({
    host: REDIS_HOST,
    port: REDIS_PORT,
    ns: NAMESPACE,
    password: REDIS_PASS
})
setInterval(() => {
    rsmq.getQueueAttributes({ qname: QUEUENAME }, (err, resp) => {
        if (err) {
            console.error(err)
            return
        }
        console.log(`Total Messages: ${resp.msgs}\tSent: ${resp.totalsent}\tReceived: ${resp.totalrecv}`)
    })
}, 1000)

mongoose.connect(process.env.MONGO_URI).then(async () => {
   
     mongoose.disconnect()
})