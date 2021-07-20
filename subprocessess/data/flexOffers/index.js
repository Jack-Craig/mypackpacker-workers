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
            let updateList = []
            for (const prdSrc of products) {
                console.log('[FO] Found match! ' + prdSrc.advertiserName + ' ' + queueMap[prdSrc.upCorEAN])
                const fullProduct = await ProductModel.findById(queueMap[prdSrc.upCorEAN]).lean()
                let update = {
                    [`variants.${prdSrc.upCorEAN}.sources.${sourceObj[prdSrc.aid]._id}`]:
                    {
                        price: prdSrc.price,
                        url: prdSrc.linkUrl,
                        meta: {
                            sku: prdSrc.sku
                        },
                        srcKey: sourceObj[prdSrc.aid]._id
                    },
                    [`variants.${prdSrc.upCorEAN}.image`]: prdSrc.imageUrl
                }
                if (fullProduct) {
                    if (prdSrc.price < fullProduct.lowestPriceRange.minPrice) {
                        update['lowestPriceRange.minPrice'] = prdSrc.price
                    }
                    if (prdSrc.price > fullProduct.maxPrice) {
                        update['lowestPriceRange.maxPrice'] = prdSrc.price
                    }
                }
                updateList.push(ProductModel.findByIdAndUpdate(queueMap[prdSrc.upCorEAN], update))
            }
            queue = []
            queueMap = []
            await Promise.all(updateList)
            await sleep()
        }
    }
    res()
})
module.exports = handleFOImport