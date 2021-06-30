const SubCategoryModel = require('../models/SubCategory')
const ProductModel = require('../models/Product')

const dGet = (obj, path) => {
    const p = path.split('.')
    for (const v of p)
        obj = obj[v]
    return obj
}

function percentRank(array, n) {
    var L = 0;
    var S = 0;
    var N = array.length
    for (var i = 0; i < array.length; i++) {
        if (array[i] < n) {
            L += 1
        } else if (array[i] === n) {
            S += 1
        } else {

        }
    }
    var pct = (L + (0.5 * S)) / N
    return pct
}

// uniqueVals is a list of all values (sorted)
// valCounts is a dictionary of the number of products with value v for this field
function getPlacement(uniqueVals, valCounts, v) {
    let numBefore = 0
    for (const val of uniqueVals) {
        if (val == v)
            break
        numBefore += valCounts[val]
    }
    return ++numBefore
}

const handleMessage = (mObj) => new Promise(async (res, rej) => {
    const allCats = await SubCategoryModel.find().lean()
    i = 0
    for (cat of allCats) {
        console.log('[GearStats] Working on ' + cat.displayName)
        const filters = [
            { vsKey: 'fP', key: 'lowestPriceRange.minPrice', t: 'list' },
            { vsKey: 'fW', key: 'productInfo.weight', t: 'list' },
            { vsKey: 'rat', key: 'productInfo.rating.r', t: 'list' },
            ...cat.filters,
        ]
        let proj = {}
        for (const f of filters) {
            proj[f.key] = 1
        }
        // TODO: User a cursor
        const allProducts = await ProductModel.find({ categoryID: cat._id, userCreated: false }, proj).lean()

        let valCounts = {} // productType -> valueStoreKey -> "value" -> "count"
        let uniqueVals = {}
        let typeTotals = {}
        for (const product of allProducts) {
            if (!valCounts.hasOwnProperty(product.productInfo.type)) {
                valCounts[product.productInfo.type] = {}
                uniqueVals[product.productInfo.type] = {}
            }
            if (!typeTotals.hasOwnProperty(product.productInfo.type))
                typeTotals[product.productInfo.type] = 0
            typeTotals[product.productInfo.type] += 1
            let tValCounts = valCounts[product.productInfo.type]
            let tUniqueVals = uniqueVals[product.productInfo.type]
            for (const f of filters) {
                if (f.t === 'in')
                    continue
                if (!tValCounts.hasOwnProperty(f.vsKey)) {
                    tValCounts[f.vsKey] = {}
                    tUniqueVals[f.vsKey] = new Set()
                }
                const val = dGet(product, f.key)
                if (!tValCounts[f.vsKey].hasOwnProperty(val))
                    tValCounts[f.vsKey][val] = 0
                tValCounts[f.vsKey][val]++
                tUniqueVals[f.vsKey].add(val)
            }
            valCounts[product.productInfo.type] = tValCounts
            uniqueVals[product.productInfo.type] = tUniqueVals
        }
        let sortedUniqueVals = {}
        for (const key1 of Object.keys(uniqueVals)) {
            sortedUniqueVals[key1] = {}
            for (const key2 of Object.keys(uniqueVals[key1])) {
                let newArr = Array.from(uniqueVals[key1][key2])
                newArr.sort((a, b) => a - b)
                sortedUniqueVals[key1][key2] = newArr
            }
        }
        let orderCache = {}
        for (const product of allProducts) {
            const pt = product.productInfo.type
            let productUpdate = { relStats: {} }
            for (const f of filters) {
                if (f.t === 'in')
                    continue
                let currentValue = dGet(product, f.key)
                if (orderCache.hasOwnProperty(pt) && orderCache[pt].hasOwnProperty(f.vsKey) && orderCache[pt][f.vsKey].hasOwnProperty(currentValue)) {
                    productUpdate.relStats[f.vsKey] = {placement: orderCache[pt][f.vsKey][currentValue], total: typeTotals[pt]}
                    continue
                }
                if (!orderCache.hasOwnProperty(pt))
                    orderCache[pt] = {}
                if (!orderCache[pt].hasOwnProperty(f.vsKey))
                    orderCache[pt][f.vsKey] = {}
                let placement = getPlacement(sortedUniqueVals[pt][f.vsKey], valCounts[pt][f.vsKey], currentValue)
                productUpdate.relStats[f.vsKey] = {placement: placement, total: typeTotals[pt]}
                orderCache[pt][f.vsKey][currentValue] = placement
            }
            await ProductModel.findByIdAndUpdate(product._id, productUpdate)
        }
    }
    res()
})

module.exports = handleMessage