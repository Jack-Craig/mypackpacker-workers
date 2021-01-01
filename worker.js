const RedisSMQ = require('rsmq')

const QUEUENAME = 'testqueue'
const NAMESPACE = 'rsmq'

const REDIS_HOST = process.env.REDIS_HOST
const REDIS_PORT = process.env.REDIS_PORT
const REDIS_PASS = process.env.REDIS_PASS

let rsmq = new RedisSMQ({
    host: REDIS_HOST,
    port: REDIS_PORT,
    ns: NAMESPACE,
    password: REDIS_PASS
})

const start = () => {
    console.log('Worker Initiated!')
    setInterval(() => {
        const r = rsmq.receiveMessage({ qname: QUEUENAME }, (err, res) => {
            if (err) {
                console.error(err)
                return
            }
            if (res.id) {
                console.log(`Received ${res.id}, ${res.message}`)
                rsmq.deleteMessage({ qname: QUEUENAME, id: res.id }, e => {
                    if (e) {
                        console.error(e)
                        return
                    }
                    console.log('Deleted message')
                })
            } else {
                console.log('No message in queue')
            }
        })
    }, 2000)
}
start()