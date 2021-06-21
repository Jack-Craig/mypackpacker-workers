const CategoryModel = require('../models/SubCategory')
const ProductModel = require('../models/Product')

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

    const allGear = await ProductModel.find({ categoryID: catKey }).lean()
    let helperCache = {} // Used for finding duplicates
    for (const item of allGear) {
        for (let mm of minmax) {
            let e = get(mm.key, item)
            if (e == undefined || e === '')
                continue
            switch (mm.type) {
                case 'list':
                    if (mm.vsStore == null)
                        mm.vsStore = { min: e, max: e }
                    else {
                        if (mm.vsStore.min > e) {
                            mm.vsStore.min = e
                        }
                        if (mm.vsStore.max < e) {
                            mm.vsStore.max = e
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
        }
        update.vsStore[mm.vsKey] = mm.vsStore
    }
    CategoryModel.findByIdAndUpdate(catKey, update).then(rawRes => {
        console.log(rawRes)
        res()
    })
})

module.exports = func