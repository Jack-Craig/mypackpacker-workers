const UserModel = require('../models/user')
const GearModel = require('../models/Product')
const PackModel = require('../models/Build')
const AnalyticsModel = require('../models/AnalyticsEntry')
const SessionModel = require('../models/Session')

const MASTER_ID = "5ff66a771a950d372db999b0"

const handleMessage = (messageObj) => new Promise(async (res, rej) => {
    const numUsers = await UserModel.countDocuments()
    const numGear = await GearModel.countDocuments()
    const n_sessions = await SessionModel.countDocuments()
    const packs = await PackModel.find({},{_id:0,sessionID:1,authorUserID:1}).lean()
    const entryNum = await AnalyticsModel.findByIdAndUpdate(MASTER_ID, {'$inc':{numEntries:1}}, {new: true}).lean()
    let numPacks = packs.length
    let sessionPacks = 0
    for (const pack of packs) {
        if (pack.sessionID && !pack.authorUserID) {
            sessionPacks++
        }
    }
    await AnalyticsModel.create({
        entryNumber: entryNum.numEntries,
        date: Date.now(),
        numUsers: numUsers,
        numGearItems: numGear,
        numPacks: numPacks,
        numSessionPacks: sessionPacks,
        numSessions: n_sessions
    })
    res()
})

module.exports = handleMessage