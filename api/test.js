
const fetch = require('node-fetch')

const getEVStatus = async (id, slot) => {
    try {
        // const url = 'http://192.168.200.104:4000/pw/wallstreet/stall/' + stall
        const url = `http://13.58.53.66/exitIsEnabled/${id}/${slot}`
        const res = await fetch(url, {})
        //   const json = await res.json()
        const json = await res.text()
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
        const json = await getEVStatus(1, 1)
        console.log(json)
    } catch (err) {
        console.error('!!!!!!', err)
    }
}

start()
