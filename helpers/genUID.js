const crypto = require('crypto')

const N_BYTES = 24

const genUID = () => {
    try {
        const b_buf = crypto.randomBytes(N_BYTES)
        let hexCoded = ''
        for (const b of b_buf) {
            hexCoded += b.toString(16)
        }
        console.log(`[GenUID] Generated ${hexCoded} (${b_buf.length} bytes).`)
        return hexCoded
    } catch (ex) {
        console.error(ex)
        return null
    }
}

module.exports = genUID