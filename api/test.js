const { PW_BACKEND } = require('./def')
const fetch = require('node-fetch')

const args = process.argv.slice(2)
const ID = args[0]
const SLOT = args[1]
console.log('Check EV stall status for id ' + ID + ' slot ' + SLOT)

const getEVStatus = async (id, slot) => {
    try {
        const url = `http://${PW_BACKEND}/exitIsEnabled/${id}/${slot}`
        const res = await fetch(url, {})
        const json = await res.json()
        // const json = await res.text()
        // const json = { busy: Boolean(1) }
        console.log('getEVStatus', id, slot, json)
        return json
    } catch (err) {
        console.error('error:', err)
        return { error: err }
    }
}

const start = async () => {
    try {
        const json = await getEVStatus(ID, SLOT)
        console.log(json)
    } catch (err) {
        console.error('!!!!!!', err)
    }
}

start()
