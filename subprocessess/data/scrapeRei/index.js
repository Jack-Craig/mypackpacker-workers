const axios = require('axios')
const cheerio = require('cheerio')
require('dotenv').config()
const mongoose = require('mongoose')
const https = require('https');

const ProductModel = require('../../../models/Product')
const helpers = require('./helpers')
const parseDetail = require('./parseDetail')

const prodDetailsSelector = 'script[data-client-store="product-details"]'
const prodPriceSelector = 'script[data-client-store="product-price-data"]'
const prodMetaSelector = 'script[data-client-store="product-metadata"]'
const prodModelSelector = 'script[data-client-store="product-model-data"]'
const prodImageSelector = 'script[data-client-store="image-data"]'

const agent = new https.Agent({
    rejectUnauthorized: false
});

const parserFeed = [
    [
        // 0, used for noscrape
    ],
    [
        // 1, Usually used for tents
        ['cap', 'Sleeping Capacity', { caster: parseInt }],
        ['season', 'Seasons', {}],
        ['designType', 'Design Type', {}],
        ['hasFootprint', 'Footprint Included', { dfltOnNull: 'No' }],
    ],
    [
        // 2, Usually used for backpacks
        ['hydrationCompatible', 'Hydration Compatible', { dfltOnNull: 'No' }],
        ['gender', 'Gender', { dfltOnNull: 'Unisex' }],
        ['frameType', 'Frame Type', { dfltOnNull: 'n/a' }],
        ['size', 'Gear Capacity (L)', { caster: parseFloat }]
    ],
    [
        // 3, Usually used for water containers
        ['size', 'Liquid Capacity (L)', { caster: parseFloat }],
        ['isBPAFree', 'BPA Free', { dfltOnNull: 'No' }],
        ['isInsulated', 'Insulated', { dfltOnNull: 'No' }]
    ],
    [
        // 4, Usually used for rain gear
        ['isWindproof', 'Windproof', {}],
        ['hasHood', 'Hood', {}],
        ['gender', 'Gender', {}]
    ],
    [
        // 5, Usually used for water treatment
        ['filterType', 'Filter Type', {}],
        ['effectiveness', 'Removes/Destroys', {}]
    ],
    [
        // 6, Usually used for tops
        ['gender', 'Gender', {}],
        ['sleeveLength', 'Sleeve Length', {}],
        ['isMoistureWicking', 'Moisture Wicking', {}],
        ['isSunprotective', 'Sun-Protective Fabric', {}],
        ['shirtType', 'Shirt Type', {}]
    ],
    [
        // 7, Usually used for stoves
        ['uses', 'Best Use', { isListVal: true }],
        ['fuelType', 'Fuel', {}],
        ['numBurners', 'Number of Burners', { dfltOnNull: '1 Burner' }],
        ['hasIntegratedPot', 'Integrated Pot', { yn: true }]
    ],
    [
        // 8, Usually used for socks
        ['gender', 'Gender', {}],
        ['isMoistureWicking', 'Moisture Wicking', {}],
        ['heightCat', 'Sock Height', {}]
    ],
    [
        // 9, Usually used for sleeping pads
        ['rVal', 'R-Value', { caster: parseFloat }],
        ['thickness', 'Pad Thickness (in.)', { caster: parseFloat }],
        ['hasRepairKit', 'Repair Kit Included', { yn: true }],
        ['hasStuffSack', 'Stuff Sack Included', { yn: true }],
        ['beddingType', 'Sleeping Pad Type', {}],
        ['cap', 'Sleeping Capacity', {}],
        ['shape', 'Sleeping Pad Shape', {}]
    ],
    [
        // 10, Usually used for sleepign bags
        ['tempRating', 'Temperature Rating (F)', { caster: parseFloat }],
        ['insulationType', 'Insulation Type', {}],
        ['shape', 'Sleeping Bag Shape', {}],
        ['gender', 'Gender', {}]
    ],
    [
        // 11, Usually used for pots and pans
        ['uses', 'Best Use', { isListVal: true }],
        ['cap', 'Liquid Capacity (L)', { caster: parseFloat }],
        ['material', 'Cookware Material', {}],
        ['isNonStick', 'Nonstick Surface', {}]
    ],
    [
        // 12, Usually used for mess items
        ['uses', 'Best Use', { isListVal: true }],
        ['isCollapsible', 'Collapsible', { yn: true }]
    ],
    [
        // 13, Usually used for lighting
        ['lightOutput', 'Max Light Output (Lumens)', { caster: parseFloat }],
        ['waterProofRating', 'Water-Resistance Rating', {}],
        ['redLightMode', 'Red Light Mode', { yn: true }]
    ],
    [
        // 14, usually used for knives
        ['bladeLength', 'Max Blade Length (in.)', { caster: parseFloat }],
        ['bladeType', 'Knife Blade Type', {}],
        ['bladeMaterial', 'Blade Construction', {}],
        ['handleMaterial', 'Handle Material', {}],
        ['knifeType', 'Closed Length', { tern: ['Folding', 'Fixed'] }]
    ],
    [
        // 15, usually used for insulation layers
        ['isWindproof', 'Windproof', { yn: true }],
        ['hasHood', 'Hood', {}],
        ['gender', 'Gender', {}],
        ['insulationType', 'Insulation Type', {}],
    ],
    [
        // 16, usually fire start
        ['uses', 'Best Use', { isListVal: true }],
        ['isWaterproof', 'Waterproof', { yn: true }]
    ],
    [
        // 17, bathroom
        ['uses', 'Best Use', { isListVal: true }],
    ],
    [
        // 18, boots
        ['uses', 'Best Use', { isListVal: true }],
        ['ankleHeight', 'Footwear Height', {}],
        ['isWaterproof', 'Waterproof', { yn: true }],
        ['isInsulated', 'Insulated', { yn: true }],
        ['gender', 'Gender', {}]
    ],
    [
        // 19, bottoms
        ['gender', 'Gender', {}],
        ['isSunprotective', 'Sun-Protective Fabric', {}],
        ['isQuickDry', 'Quick Drying', {}],
        ['hasCargoPockets', 'Side Cargo Pockets', {}],
        ['fabric', 'Fabric', {}]
    ]
]

const parserMap = {
    'tents': {
        dflt: parserFeed[1],
        'Bivy Sacks': parserFeed[0]
    },
    'backpacks': { dflt: parserFeed[2] },
    'water-container': { dflt: parserFeed[3] },
    'rain-gear': { dflt: parserFeed[4] },
    'water-treatment': { dflt: parserFeed[5] },
    tops: { dflt: parserFeed[6] },
    bottoms: { dflt: parserFeed[19] },
    socks: { dflt: parserFeed[8] },
    'mess-items': { dflt: parserFeed[12] },
    'pots-and-pans': { dflt: parserFeed[11] },
    stoves: { dflt: parserFeed[7] },
    boots: { dflt: parserFeed[18] },
    'sleeping-bags': { dflt: parserFeed[10] },
    'sleeping-pads': { dflt: parserFeed[9] },
    custom: { dflt: parserFeed[0] },
    'emergency-shelter': { dflt: parserFeed[0] },
    'first-aid': { dflt: parserFeed[0] },
    'sun-protection': { dflt: parserFeed[0] },
    'navigation': { dflt: parserFeed[0] },
    'other': { dflt: parserFeed[0] },
    'teeth': { dflt: parserFeed[0] },
    'fire-starter': { dflt: parserFeed[16] },
    'knives': { dflt: parserFeed[14] },
    'light': { dflt: parserFeed[13] },
    'bathroom': { dflt: parserFeed[17] },
    'insulation-layers': { dflt: parserFeed[15] }
}

const runCategoryUpdate = async (baseCatUrl, type, categoryId) => {
    let paginatedCatUrl = baseCatUrl
    let productPageUrls = await getProductPageLinks(paginatedCatUrl)
    while (productPageUrls.length) {
        for (const url of productPageUrls) {
            await updateProduct(url, type, categoryId)
        }
        const pageIndex = paginatedCatUrl.indexOf('?page=')
        if (pageIndex < 0) {
            paginatedCatUrl = `${paginatedCatUrl}?page=2`
        } else {
            const pageNum = parseInt(paginatedCatUrl.slice(pageIndex + 6))
            paginatedCatUrl = `${paginatedCatUrl.slice(0, pageIndex)}?page=${pageNum + 1}`
        }
        productPageUrls = await getProductPageLinks(paginatedCatUrl)
    }
}

const getProductPageLinks = async (catUrl) => {
    let res = ''
    try {
        res = await axios.get(catUrl, { httpsAgent: agent })
    } catch (ex) {
        return []
    }
    const $ = cheerio.load(res.data)
    let links = []
    const pageResults = $('._1COyDttDTR5M16ybKTmtJn ._1A-arB0CEJjk5iTZIRpjPs:first-child')
    pageResults.each((i, elem) => {
        const href = $(elem).attr('href')
        if (href.indexOf('rei-garage') > 0)
            return
        links.push(`http://rei.com${href}`)
    })
    return links
}

const updateProduct = async (url, type, categoryId) => {
    const productDetail = await parseProduct(url, type, categoryId)
    if (productDetail == null) {
        console.log('[Scraper] [REI] [Fail] ' + url)
        return
    }
    console.log(`[Scraper] [REI] [Comp] ${productDetail.displayName}`)
    const newProduct = await ProductModel.findOneAndUpdate({ 'sources.rei.meta.id': productDetail.sources.rei.meta.id }, productDetail, { upsert: true, new: true }).lean()
    let promiseList = []
    for (const uid of Object.keys(productDetail.variants))
        promiseList.push(GID.findByIdAndUpdate(uid, {gearItem: newProduct._id}, {upsert: true}).lean())
    await Promise.all(promiseList)
}

const parseProduct = async (url, type, categoryId) => {
    console.log('[Scraper] [REI] [Begin] ' + url)
    let res = {}
    try {
        res = await axios.get(url, { httpsAgent: agent })
    } catch (ex) {
        console.log('[Scraper] [REI] [Fail] Axios failure: ' + ex.message)
        return null
    }
    const $ = cheerio.load(res.data)
    const detailObj = JSON.parse($(prodDetailsSelector).html())
    const priceObj = JSON.parse($(prodPriceSelector).html())
    const metaObj = JSON.parse($(prodMetaSelector).html())
    const imageObj = JSON.parse($(prodImageSelector).html())
    const modelObj = JSON.parse($(prodModelSelector).html())

    // HACK
    if (categoryId === 'insulation-layers' && helpers.getFromList(detailObj.specs, 'name', 'Waterproof') != null)
        categoryId = 'rain-gear'

    const catParserFeed = parserMap.hasOwnProperty(type) ? parserMap[categoryId][type] : parserMap[categoryId]['dflt']
    const catInfo = parseDetail(detailObj, catParserFeed)

    if (catInfo.fail) {
        console.log('[Scraper] [REI] [Fail] ' + catInfo.reason)
        return null
    }
    if (priceObj == null) {
        console.log('[Scraper] [REI] [Fail] No Price')
        return null
    }
    let productWeight = -1
    let bw = helpers.getFromList(detailObj.specs, 'name', 'Weight')
    if (bw == null)
        bw = helpers.getFromList(detailObj.specs, 'name', 'Minumum Trail Weight')
    if (bw == null)
        bw = helpers.getFromList(detailObj.specs, 'name', 'Packaged Weight')
    if (bw == null)
        bw = helpers.getFromList(detailObj.specs, 'name', 'Weight With Batteries')
    if (bw == null)
        bw = helpers.getFromList(detailObj.specs, 'name', 'Weight (Pair)')
    if (bw == null && categoryId !== 'socks') {
        console.log('[Scraper] [REI] [Fail] Bad Weight')
        return null
    }
    if (categoryId === 'socks')
        productWeight = 68
    else
        productWeight = helpers.parseWeight(bw.values[Math.trunc(bw.values.length / 2)])
    if (productWeight == null || productWeight == 0) {
        console.log('[Scraper] [REI] [Fail] Bad Weight')
        return null
    }
    let variants = {}
    for (const variant of modelObj.variants) {
        let id = ''
        for (const identifier of variant.identifiers) {
            if (identifier.type == 'UPC' || identifier.type == 'EPC') {
                id = identifier.value
                break
            }
        }
        let img = ''
        for (const imgData of imageObj.media) {
            if (imgData.color.code === variant.color.code) {
                img = 'http://rei.com' + imgData.uri
                break
            }
                
        }
        variants[id] = {
            'sources.rei': {
                price: variant.sellingPrice,
                url: url,
                meta: {
                    id: parseInt(metaObj.itemNumber)
                },
                srcKey: 'rei'
            },
            variantMeta: {
                size: variant.size,
                color: variant.color.label
            },
            image: img,
            mpn: variant.manufacturersPartNumber,
            UPCorEAN: id
        }
    }

    return {
        brand: detailObj.brand,
        displayName: metaObj.title,
        categoryID: categoryId,
        variants: variants,
        lowestPriceRange: { minPrice: priceObj.min, maxPrice: priceObj.max },
        productInfo: {
            type: type,
            weight: productWeight,
            rating: { r: detailObj.reviewsSummary.overall ? detailObj.reviewsSummary.overall : 0 , n: detailObj.reviewsSummary.total ? detailObj.reviewsSummary.total : 0 },
            description: metaObj.shortDesc,
            ...catInfo.extract
        },
        publicalyViewable: true,
        userCreated: false,
        lastUpdate: Date.now()
    }
}

const reiMap = [
    ['https://www.rei.com/c/backpacking-packs', 'Backpacking Packs', 'backpacks'],
    /**
    ['https://www.rei.com/c/day-packs', 'Day Packs', 'backpacks'],
    ['https://www.rei.com/c/hiking-hydration-packs', 'Hydration Packs', 'backpacks'],
    ['https://www.rei.com/c/baby-carrier-packs', 'Other', 'backpacks'],
    ['https://www.rei.com/c/hiking-waistpacks', 'Fanny Packs', 'backpacks'],
    ['https://www.rei.com/c/pack-accessories', 'Accessories', 'backpacks'],
    ['https://www.rei.com/c/backpacking-tents', 'Backpacking Tents', 'tents'],
    ['https://www.rei.com/c/camping-tents', 'Camping Tents', 'tents'],
    ['https://www.rei.com/c/roof-top-tents', 'Other', 'tents'],
    ['https://www.rei.com/c/shelters', 'Other', 'tents'],
    ['https://www.rei.com/c/bivy-sacks', 'Other', 'tents'],
    ['https://www.rei.com/c/tent-accessories', 'Accessories', 'other'],
    ['https://www.rei.com/c/mens-sleeping-bags', 'Sleeping Bags', 'sleeping-bags'],
    ['https://www.rei.com/c/womens-sleeping-bags', 'Sleeping Bags', 'sleeping-bags'],
    ['https://www.rei.com/c/double-sleeping-bags', 'Double Bags', 'sleeping-bags'],
    ['https://www.rei.com/c/kids-sleeping-bags', 'Sleeping Bags', 'sleeping-bags'],
    ['https://www.rei.com/c/sleeping-bag-liners', 'Liners', 'sleeping-bags'],
    ['https://www.rei.com/c/camp-blankets', 'Blankets', 'sleeping-bags'],
    ['https://www.rei.com/c/sleeping-pads', 'Sleeping Pads', 'sleeping-pads'],
    ['https://www.rei.com/c/hammocks', 'Hammocks', 'sleeping-pads'],
    ['https://www.rei.com/c/cots', 'Other', 'sleeping-pads'],
    ['https://www.rei.com/c/air-mattresses', 'Other', 'sleeping-pads'],
    ['https://www.rei.com/c/camping-pillows', 'Pillows', 'sleeping-pads'],
    ['https://www.rei.com/c/stoves-and-grills', '', 'stoves'],
    ['https://www.rei.com/c/camp-cookware', '', 'pots-and-pans'],
    ['https://www.rei.com/c/camp-dinnerware', 'Dinnerware', 'mess-items',],
    ['https://www.rei.com/c/coffee-and-tea', 'Coffee And Tea', 'mess-items'],
    ['https://www.rei.com/c/camping-utensils', 'Dinnerware', 'mess-items'],
    ['https://www.rei.com/c/coolers', 'Other', 'mess-items'],
    ['https://www.rei.com/c/food', 'Food', 'mess-items'],
    ['https://www.rei.com/c/glasses-cups-and-mugs', 'Beverage Containers', 'mess-items'],
    ['https://www.rei.com/c/water-bottles-flasks-and-jugs', 'Bottles', 'water-container'],
    ['https://www.rei.com/c/water-treatment', '', 'water-treatment'],
    ['https://www.rei.com/c/hydration-reservoirs', 'Pack Bladders', 'water-container'],
    ['https://www.rei.com/c/vacuum-bottles', 'Vacuum Bottles', 'water-container'],
    ['https://www.rei.com/c/headlamps', 'Headlamps', 'light'],
    ['https://www.rei.com/c/flashlights-and-lightsticks', 'Flashlights', 'light'],
    ['https://www.rei.com/c/lanterns', 'Lanterns', 'light'],
    ['https://www.rei.com/c/gps', 'GPS', 'navigation'],
    ['https://www.rei.com/c/portable-power-devices', 'Power Banks', 'custom'],
    ['https://www.rei.com/c/radios-and-headphones', 'Audio', 'custom'],
    ['https://www.rei.com/c/watches', 'Watches', 'custom'],
    ['https://www.rei.com/c/two-way-radios', 'Communication', 'custom'],
    ['https://www.rei.com/c/plbs-and-satellite-messengers', 'Communication', 'custom'],
    ['https://www.rei.com/c/solar-chargers', 'Solar Chargers', 'custom'],
    ['https://www.rei.com/c/portable-speakers', 'Audio', 'custom'],
    ['https://www.rei.com/c/trekking-poles-hiking-staffs', 'Hiking Poles', 'custom'],
    ['https://www.rei.com/c/knives', '', 'knives'],
    ['https://www.rei.com/c/compasses', 'Compasses', 'navigation'],
    ['https://www.rei.com/c/multi-tools', 'Multi Tools', 'knives'],
    ['https://www.rei.com/c/camp-tools', 'Tools', 'knives'],
    ['https://www.rei.com/c/mens-hiking-footwear', 'Boots', 'boots'],
    ['https://www.rei.com/c/womens-hiking-footwear', 'Boots', 'boots'],
    ['https://www.rei.com/c/kids-hiking-footwear', 'Boots', 'boots'],
    ['https://www.rei.com/c/hiking-socks', '', 'socks'],
    ['https://www.rei.com/c/gaiters', 'Gaiters', 'boots'],
    
    ['https://www.rei.com/c/hiking-jackets', '', 'insulation-layers'],
    ['https://www.rei.com/c/hiking-shirts', '', 'tops'],
    ['https://www.rei.com/c/hiking-pants', 'Pants', 'bottoms'],
    ['https://www.rei.com/c/hiking-shorts', 'Shorts', 'bottoms'],
    ['https://www.rei.com/c/hiking-clothing-accessories', 'Clothing Accessories', 'custom'],
    ['https://www.rei.com/c/sunglasses', 'Sunglasses', 'sun-protection'],
    ['https://www.rei.com/c/first-aid', '', 'first-aid'],
    ['https://www.rei.com/c/emergency-and-survival', 'Emergency Gear', 'emergency-shelter'],
    ['https://www.rei.com/c/camp-bathroom', '', 'bathroom'],
    ['https://www.rei.com/c/bear-safety', 'Bear Gear', 'emergency-shelter'],
    ['https://www.rei.com/c/fire-starting-gear', '', 'fire-starter'],
    ['https://www.rei.com/c/sun-protection', 'Sun Protection', 'sun-protection'],
    ['https://www.rei.com/c/insect-repellent', 'Bug Protection', 'sun-protection']
     */
]
const run = () => new Promise(async (res, rej) => {
    await mongoose.connect(process.env.MONGO_URI)
    for (const urlData of reiMap) {
        await runCategoryUpdate(...urlData)
    }
    res()
})

module.exports = run
