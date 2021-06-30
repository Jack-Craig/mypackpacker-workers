const BuildModel = require('../models/Build')

const handleMessage = (messageObj) => new Promise(async (res, rej) => {
    // Create aggregation pipeline to get all ids of of zombie gear items
    let oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate()-90) // 3 months ago
    const r = await BuildModel.find({ sessionID: {$exists: true}, authorUserID: {$exists: false}, dateCreated:{$lte:oneWeekAgo}}, {_id:1}).lean()
    let ids = []
    for (const idObj of r)
        ids.push(idObj._id)
    if (r.length) {
        await BuildModel.deleteMany({ _id: { '$in':  ids} }).lean()
        console.log(`[PackZombie] Destroyed ${r.length} zombie pack(s).`)
    } else {
        console.log('[PackZombie] No Zombie Packs Found! Today is a good day.')
    }
    res()
    // Basically this is going to be really slow, we have to get all packs and check the lists
})

module.exports = handleMessage