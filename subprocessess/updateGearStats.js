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

const handleMessage = (mObj) => new Promise(async (res, rej) => {
    const allCats = await SubCategoryModel.find().lean()
    i = 0
    for (cat of allCats) {
        console.log('Working on ' + cat.displayName)
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
        const allProducts = await ProductModel.find({ categoryID: cat._id }, proj).lean()

        const apLength = allProducts.length

        let allVals = {}
        for (const product of allProducts) {
            for (const f of filters) {
                if (!allVals.hasOwnProperty(f.vsKey)) {
                    if (f.t === 'list') {
                        allVals[f.vsKey] = []
                    } else if (f.t === 'in') {
                        allVals[f.vsKey] = {}
                    }
                }
                if (f.t === 'list') {
                    allVals[f.vsKey].push(dGet(product, f.key))
                } else if (f.t === 'in') {
                    const val = dGet(product, f.key)
                    if (!allVals[f.vsKey].hasOwnProperty(val))
                        allVals[f.vsKey][val] = 0
                    allVals[f.vsKey][val]++
                }
            }
        }
        for (const product of allProducts) {
            let productUpdate = { relStats: {} }
            for (const f of filters) {
                if (f.t === 'list') {
                    productUpdate.relStats[f.vsKey] = percentRank(allVals[f.vsKey], dGet(product, f.key)) * 100
                } else if (f.t === 'in') {
                    productUpdate.relStats[f.vsKey] = allVals[f.vsKey][dGet(product, f.key)] / apLength * 100
                }
            }
            await ProductModel.findByIdAndUpdate(product._id, productUpdate)
        }
    }
    res()
})

module.exports = handleMessage