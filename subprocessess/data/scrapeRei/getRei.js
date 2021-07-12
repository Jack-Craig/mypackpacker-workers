const cheerio = require('cheerio')
const axios = require('axios')
const fs = require('fs')
const path = require('path')

const prodDetailsSelector = 'script[data-client-store="product-details"]'
const prodPriceSelector = 'script[data-client-store="product-price-data"]'

const run = async () => {
    // Loop thru each category
    for (const catData of [
        ['https://www.rei.com/c/backpacking-packs', 'Backpacking Packs', 'backpacks'],
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
        ['https://www.rei.com/c/stoves', '', 'stoves'],
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
        ['https://www.rei.com/c/hiking-shirts', '', 'top'],
        ['https://www.rei.com/c/hiking-pants', 'Pants', 'bottoms'],
        ['https://www.rei.com/c/hiking-shorts', 'Shorts', 'bottoms'],
        ['https://www.rei.com/c/hiking-clothing-accessories', 'Clothing Accessories', 'custom'],
        ['https://www.rei.com/c/sunglasses', 'Sunglasses', 'sun-protection'],
        ['https://www.rei.com/c/first-aid', '', 'first-aid'],
        ['https://www.rei.com/c/emergency-and-survival', 'Emergency Gear', 'emergency-shelter'],
        ['https://www.rei.com/c/camp-bathroom', '', 'bathroom'],
        ['https://www.rei.com/c/bear-safety', 'Bear Gear', 'emergency-shelter'],
        ['https://www.rei.com/c/fire-starting-gear', '', 'fire-starter'],
        ['https://www.rei.com/c/sun-and-bug-protection', 'Sun & Bug Protection', 'sun-protection']
    ]) {
        // Get all links on category page
        const res = await axios.get(catData[0]).then()
        // Check 
        const $ = cheerio.load(res.data)
        let links = []
        const pageResults = $('._1COyDttDTR5M16ybKTmtJn ._1A-arB0CEJjk5iTZIRpjPs:first-child')
        pageResults.each((i, elem) => {
            const href = $(elem).attr('href')
            if (href.indexOf('rei-garage') > 0)
                return
            links.push(`http://rei.com${href}`)
        })
        
    }
}

// Parse product
const $ = cheerio.load(fs.readFileSync(path.resolve(__dirname, '../downloads/reiProd.txt')))
const $detail = $(prodDetailsSelector)
const $price = $(prodPriceSelector)
console.log(JSON.parse($detail.html()))