const RedisSMQ = require('rsmq')
const mongoose = require('mongoose')

const QUEUENAME = 'all_messages'
const NAMESPACE = 'packpacker'

const REDIS_HOST = process.env.REDIS_HOST
const REDIS_PORT = process.env.REDIS_PORT
const REDIS_PASS = process.env.REDIS_PASS

const handleAdminMessage = require('./subprocessess/adminMessages')

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
                mJSON.isAdminMessage = mJSON.isAdminMessage === 'true'
                mJSON.isWorkerMessage = mJSON.isWorkerMessage === 'true'
                let promise = null
                if (mJSON.isWorkerMessage) {

                }
                if (mJSON.isAdminMessage) {
                    promise = handleAdminMessage(mJSON)
                }
                promise.finally(() => {
                    rsmq.deleteMessage({ qname: QUEUENAME, id: res.id })
                })
            }
        })
    }, 2000)
})