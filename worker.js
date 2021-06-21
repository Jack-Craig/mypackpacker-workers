const RedisSMQ = require('rsmq')
const mongoose = require('mongoose')
require('dotenv').config()

const QUEUENAME = 'all_messages'
const NAMESPACE = 'packpacker'

const REDIS_HOST = process.env.REDIS_HOST
const REDIS_PORT = process.env.REDIS_PORT
const REDIS_PASS = process.env.REDIS_PASS

const handleAdminMessage = require('./subprocessess/adminMessages')
const handleAnalyticsCompile = require('./subprocessess/analyticsCompiler')
const handleCullGear = require('./subprocessess/cullGearZombies')
const handleUpdatePackStats = require('./subprocessess/updatePackStats')
const handleCullPacks = require('./subprocessess/cullPackZombies')
const handleUpdatePackFilters = require('./subprocessess/updatePackFilters')
const handleUpdateGearStats = require('./subprocessess/updateGearStats')

let rsmq = new RedisSMQ({
    host: REDIS_HOST,
    port: REDIS_PORT,
    ns: NAMESPACE,
    password: REDIS_PASS
})
mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log('Mongo Connected, Worker Initiated!')
    setInterval(() => {
        rsmq.receiveMessage({ qname: QUEUENAME }, (err, res) => {
            if (err) {
                console.error(err)
                return
            }
            if (res.id) {
                console.log(`Received ${res.id}`)
                let mJSON = JSON.parse(res.message)
                if (typeof mJSON.isWorkerMessage === 'string')
                    mJSON.isWorkerMessage = mJSON.isWorkerMessage === 'true'
                if (typeof mJSON.isAdminMessage === 'string')
                    mJSON.isAdminMessage = mJSON.isAdminMessage === 'true'
                let promise = null
                if (mJSON.isWorkerMessage) {
                    switch (mJSON.type) {
                        case 'analyticsCompile': promise = handleAnalyticsCompile(mJSON); break;
                        case 'cullGearZombies': promise = handleCullGear(mJSON); break;
                        case 'updatePackStats': promise = handleUpdatePackStats(mJSON); break; // Update category/product filters
                        case 'cullPackZombies': promise = handleCullPacks(mJSON); break;
                        case 'updatePackFilters': promise = handleUpdatePackFilters(mJSON); break;
                        case 'updateGearStats': promise = handleUpdateGearStats(mJSON); break;
                    }
                } else if (mJSON.isAdminMessage) {
                    promise = handleAdminMessage(mJSON)
                }
                promise.finally(() => {
                    rsmq.deleteMessage({ qname: QUEUENAME, id: res.id }, (err, resp) => {
                        if (err) {
                            console.error(err)
                            return
                        }
                        if (resp == 1) {
                            console.log(`${res.id} Deleted`)
                        } else {
                            console.log(`${res.id} Not Found`)
                        }
                    })
                })
            }
        })
    }, 2000)
})