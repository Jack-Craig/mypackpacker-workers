const axios = require('axios')
const UIDModel = require('../../../models/GID')
const ProductModel = require('../../../models/Product')
const SourceModel = require('../../../models/Source')

const BATCH_SIZE = 50
const DELAY = 1000

const sleep = () => new Promise((res, rej) => setTimeout(res, DELAY))

const getProduct = async upc => {

    return (await axios.get('http://api.flexoffers.com/products/full?UPCorEANs=' + upc, {
        headers: {
            apiKey: '79ba8446-f0fb-4128-a007-ac70a425e52b',
            accept: 'application/json'
        }
    })).data
}

const handleFOImport = content => new Promise(async (res, rej) => {
    const allSources = await SourceModel.find().lean()
    let sourceObj = {}
    for (const src of allSources) {
        sourceObj[src.flexOffersId] = src
    }
    let queue = []
    let queueMap = {}
    for await (const upc_data of UIDModel.find().lean()) {
        if (queue.length < BATCH_SIZE) {
            queue.push(upc_data._id)
            queueMap[upc_data._id] = upc_data.gearItem
            continue
        } else {
            const products = await getProduct(queue.join(','))
            let sources = []
            for (const prdSrc of products) {
                //console.log('[FO] Found match! ' + prdSrc.advertiserName + ' ' + queueMap[prdSrc.upCorEAN])
                //console.log(prdSrc.size + '   ' + prdSrc.color + '   ' + prdSrc.name)
            }
            queue = []
            queueMap = []
            await sleep()
        }
    }
    res()
})
module.exports = handleFOImport