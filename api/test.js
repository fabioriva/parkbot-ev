require('dotenv').config()
// const { PW_API } = require('./def')
const fetch = require('node-fetch')

const args = process.argv.slice(2)
const ID = args[0]
const SLOT = args[1]
// console.log('Check EV stall status for id ' + ID + ' slot ' + SLOT)

const getEVStatus = async (id, slot) => {
    try {
        const url = `${process.env.PW_API}?stall=${slot}&cardID=${id}`
        console.log(url, process.env.PW_TOKEN)
        const res = await fetch(url, {
            headers: {
               'Content-Type': 'application/json',
                'x-api-key': process.env.PW_TOKEN
              },
        })
        const json = await res.json()
        // const json = await res.text()
        // const json = { busy: Boolean(1) }
        console.log('getEVStatus', id, slot)
        return json
    } catch (err) {
        console.error('error:', err)
        return { error: err }
    }
}

const start = async () => {
    try {
        const json = await getEVStatus(ID, SLOT)
        console.log(json, 'EV is charging', json.busy)
    } catch (err) {
        console.error('!!!!!!', err)
    }
}

start()
