const UOM_TO_G = {
    'lbs': 453.592,
    'lb': 453.592,
    'pounds': 453.592,
    'pound': 453.592,
    'oz': 28.3495,
    'ounce': 28.3495,
    'ounces': 28.3495
}
module.exports = {
    getFromList: (list, key, keyValue) => {
        for (const item of list) {
            if (item[key] == keyValue) {
                if (item === 'Unavailable')
                    return null
                return item
            }
        }
        return null
    },
    parseWeight: weightStr => {
        let weightList = weightStr.split(' ')
        let weight = 0
        let curRatio = -1
        for (let i = weightList.length - 1; i >= 0; i--) {
            if (weightList[i] === '') // Buggy behaviour triggered when there are 2 spaces between a word
                continue
            if (curRatio > 0) {
                weight += curRatio * parseFloat(weightList[i])
                curRatio = -1
                continue
            }
            let dotIdx = weightList[i].indexOf('.')
            if (dotIdx > 0)
                weightList[i] = weightList[i].slice(0, dotIdx)
            curRatio = UOM_TO_G[weightList[i]]
        }
        if (isNaN(weight))
            return null
        return weight

    }
}