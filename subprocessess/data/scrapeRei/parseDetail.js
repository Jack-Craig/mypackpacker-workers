const helpers = require('./helpers')

module.exports = (detailObj, toParse) => {
    let pInfo = {}
    for (const parseData of toParse) {
        try {
            let sDet = helpers.getFromList(detailObj.specs, 'name', parseData[1])
            pInfo[parseData[0]] = sDet.values[Math.trunc(sDet.values.length / 2)]
            if (parseData[2].hasOwnProperty('caster'))
                pInfo[parseData[0]] = parseData[2].caster(pInfo[parseData[0]])
            if (parseData[2].hasOwnProperty('isListVal'))
                pInfo[parseData[0]] = pInfo[parseData[0]].split(',').map(v => v.trim())
            if (parseData[2].hasOwnProperty('yn'))
                pInfo[parseData[0]] = 'Yes'
            if (parseData[2].hasOwnProperty('tern'))
                pInfo[parseData[0]] = parseData[2].tern[0]
        } catch (ex) {
            if (parseData[2].hasOwnProperty('dfltOnNull')) {
                pInfo[parseData[0]] = parseData[2].dfltOnNull
                continue
            }
            if (parseData[2].hasOwnProperty('yn')) {
                pInfo[parseData[0]] = 'No'
                continue
            }
            if (parseData[2].hasOwnProperty('tern')) {
                pInfo[parseData[0]] = parseData[2].tern[1]
                continue
            }
            return { fail: true, reason: parseData[1] }
        }
    }
    return { fail: false, extract: pInfo }
}