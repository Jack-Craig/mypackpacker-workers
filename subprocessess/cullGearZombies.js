const ProductModel = require('../models/Product')

const handleMessage = (messageObj) => new Promise(async (res, rej) => {
    // Create aggregation pipeline to get all ids of of zombie gear items
    const r = await ProductModel.aggregate([
        { '$match': { userCreated: true } },
        { '$group': { _id: '$_id', author: { '$push': '$authorUserId' } } },
        { '$unwind': '$author' }, // Unwind to allow duplicates
        { '$lookup': { from: 'users', localField: 'author', foreignField: '_id', as: 'author' } },
        { '$unwind': '$author' },
        { '$project': { gearListSaved: '$author.gearListSaved', gearListOwned: '$author.gearListOwned', aid: '$author._id' } },
        { '$redact': { $cond: [{ $in: ['$_id', '$gearListSaved'] }, '$$PRUNE', '$$DESCEND'] } }, // Redact if saved
        { '$redact': { $cond: [{ $in: ['$_id', '$gearListOwned'] }, '$$PRUNE', '$$DESCEND'] } }, // Redact if owned
        { '$project': { aid: 1 } },
        { '$lookup': { from: 'builds', localField: 'aid', foreignField: 'authorUserID', as: 'packs' } }, // Lookup packs and check if item is in a pack
        { '$unwind': '$packs' },
        { '$project': { aid: 1, 'build': '$packs.build' } },
        { '$redact': { $cond: [{ $in: ['$_id', '$build'] }, '$$PRUNE', '$$DESCEND'] } }, // Redact if in build
        { '$group': { _id: null, 'ids': { '$push': '$_id' } } }
    ])
    if (r.length) {
        await ProductModel.deleteMany({ _id: { '$in': r[0].ids } }).lean()
        console.log(`Destroyed ${r[0].ids.length} zombie gear item(s).`)
    } else {
        console.log('No Zombie Gear Found! Today is a good day.')
    }
    res()
    // Basically this is going to be really slow, we have to get all packs and check the lists
})

module.exports = handleMessage