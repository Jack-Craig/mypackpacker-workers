const BuildModel = require('../models/Build')

const get = (keyPath, obj) => {
    const keys = keyPath.split('.')
    let subObj = obj
    for (const key of keys) {
        subObj = subObj[key]
    }
    return subObj
}

const func = (messageObj) => new Promise(async (res, rej) => {
    // Shopping List: 
    // 1. filter min/maxes for list fields
    // 2. count of documents in collection
    const catKey = messageObj.content
    const allPacks = await BuildModel.find({published: true}).lean()
    let minmax = [
        {key:'priceRange.minPrice', vsKey: 'fP', type: 'list', vsStore: null},
        {key:'totalWeight', vsKey: 'fW', type: 'list', vsStore: null},
        {key: 'upvotes', vsKey: 'upv', type: 'list', vsStore: null}
    ]
    let helperCache = {} // Used for finding duplicates
    for (const pack of allPacks) {
        for (let mm of minmax) {
            let e = get(mm.key, pack)
            if (e == undefined)
                continue
            switch (mm.type) {
                case 'list':
                    if (mm.vsStore == null)
                        mm.vsStore = {min: e, max: e}
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
            }
        }
    }
    
    let update = {count: allGear.length, vsStore:{}}
    for (const mm of minmax) {
        update.vsStore[mm.vsKey] = mm.vsStore
    }
    await BuildModel.findByIdAndUpdate(0, update).lean()
    console.log('Pushed update')
    res()
})

module.exports = func