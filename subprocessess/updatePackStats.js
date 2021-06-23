const CategoryModel = require('../models/SubCategory')
const ProductModel = require('../models/Product')

const K_PARTITIONS = 20

const get = (keyPath, obj) => {
    const keys = keyPath.split('.')
    let subObj = obj
    for (const key of keys) {
        subObj = subObj[key]
    }
    return subObj
}

// Updates the vsStore field in the category documents. Finds mins and maxes of "list" fields and unique values of "in" fields
const func = (messageObj) => new Promise(async (res, rej) => {
    // Shopping List: 
    // 1. filter min/maxes for list fields
    // 2. count of documents in collection
    const catKey = messageObj.content
    const category = await CategoryModel.findById(catKey).lean()
    let minmax = [
        { key: 'lowestPriceRange.minPrice', vsKey: 'fP', type: 'list', vsStore: null },
        { key: 'productInfo.weight', vsKey: 'fW', type: 'list', vsStore: null },
        { key: 'productInfo.rating.r', vsKey: 'rat', type: 'list', vsStore: null }
    ]
    for (const filter of category.filters) {
        // Could store vsStore here which would be fine for list filters, but not for selects and others if a brand or whatever gets removed
        minmax.push({ key: filter.key, type: filter.t, vsKey: filter.vsKey, vsStore: null })
    }

    const allGear = await ProductModel.find({ categoryID: catKey, userCreated: false }).lean()
    let helperCache = {} // Used for finding duplicates
    for (const item of allGear) {
        for (let mm of minmax) {
            let e = get(mm.key, item)
            if (e == undefined || e === '')
                continue
            switch (mm.type) {
                case 'list':
                    if (mm.vsStore == null)
                        mm.vsStore = { min: e, max: e, hist: { [item.productInfo.type]: { valSet: new Set([e]), valCount: { [e]: 1 }, min: e, max: e } } } // hist object, used for constructing bars later
                    else {
                        if (mm.vsStore.min > e) {
                            mm.vsStore.min = e
                        }
                        if (mm.vsStore.max < e) {
                            mm.vsStore.max = e
                        }
                        let prodType = item.productInfo.type
                        if (mm.vsStore.hist.hasOwnProperty(prodType)) {
                            if (mm.vsStore.hist[prodType].valSet.has(e)) {
                                mm.vsStore.hist[prodType].valCount[e]++
                            } else {
                                mm.vsStore.hist[prodType].valSet.add(e)
                                mm.vsStore.hist[prodType].valCount[e] = 1
                            }
                            if (mm.vsStore.hist[prodType].min > e)
                                mm.vsStore.hist[prodType].min = e
                            if (mm.vsStore.hist[prodType].max < e)
                                mm.vsStore.hist[prodType].max = e
                        } else {
                            mm.vsStore.hist[prodType] = { valSet: new Set([e]), valCount: { [e]: 1 }, min: e, max: e }
                        }
                    }
                    break
                case 'in':
                    if (mm.vsStore == null)
                        mm.vsStore = []
                    if (!helperCache.hasOwnProperty(mm.key))
                        helperCache[mm.key] = {}
                    if (!helperCache[mm.key][e]) {
                        helperCache[mm.key][e] = true
                        mm.vsStore.push(e)
                    }
                    break
                case 'inter':
                    if (mm.vsStore == null)
                        mm.vsStore = []
                    if (!helperCache.hasOwnProperty(mm.key)) {
                        helperCache[mm.key] = {}
                    }
                    for (const valToCheck of e) {
                        if (!helperCache[mm.key][valToCheck]) {
                            helperCache[mm.key][valToCheck] = true
                            mm.vsStore.push(valToCheck)
                        }
                    }
                    break
            }
        }
    }
    let update = { count: allGear.length, vsStore: {} }
    for (const mm of minmax) {
        if (mm.type === 'in' && mm.vsStore != null) {
            mm.vsStore.sort()
        } else if (mm.type === 'list') {
            // Create bars for the histogram
            for (const pType of Object.keys(mm.vsStore.hist)) {
                let typeHist = mm.vsStore.hist[pType]
                let sortedUniqueVals = Array.from(typeHist.valSet)
                sortedUniqueVals.sort((a, b) => a - b)
                let absWidth = typeHist.max - typeHist.min
                let partitionWidth = absWidth / K_PARTITIONS
                let curUpper = typeHist.min + partitionWidth

                let histData = {
                    bars: [],
                    start: typeHist.min,
                    partitionWidth: partitionWidth,
                }

                for (let i = 0; i < K_PARTITIONS; i++, curUpper += partitionWidth) {
                    let barCount = 0
                    while (sortedUniqueVals.length) {
                        if (curUpper >= sortedUniqueVals[0]) {
                            barCount += typeHist.valCount[sortedUniqueVals.shift()]
                        } else {
                            break
                        }
                    }
                    histData.bars.push(barCount)
                }
                mm.vsStore.hist[pType] = histData
                console.log(histData)
            }
        }
        update.vsStore[mm.vsKey] = mm.vsStore
    }
    CategoryModel.findByIdAndUpdate(catKey, update).then(_ => {
        console.log(`Updated ${category.displayName} (${catKey}). ${update.count} products reviewed.`)
        res()
    })
})

module.exports = func