require('dotenv').config()
const fetch = require('node-fetch')
const uWS = require('uWebSockets.js')
const def = require('./def')
const obj = require('./obj')
const PLC = require('./Plc')
const routes = require('./routes')

const prefix = '/api/wallstreet'



const checkEvStall = async (id, slot) => {
  try {
    const url = `http://${def.PW_BACKEND}/exitIsEnabled/${id}/${slot}`
    const res = await fetch(url, {})
    const json = await res.json()
    console.log('checkEvStall', url, id, slot, json)
    return json
  } catch (err) {
    // console.error('error:', err)
    return { error: err }
  }
}

const queue = (plc, queue) => {
  queue.forEach(async (element, key) => {
    const { id, card, slot, size } = element
    // console.log('queue', id, card, slot, size)
    if (slot < 1 || slot > def.STALLS) return
    const found = def.EV_STALLS.find(element => element === slot)
    if (found === undefined) return
    const json = await checkEvStall(card, slot)
    if (json.busy === undefined) return
    const IS_CHARGING = json.busy
    if (!IS_CHARGING) {
      const buffer = Buffer.allocUnsafe(2)
      buffer.writeUInt16BE(json.busy, 0)
      const conn = {
        area: 0x84,
        dbNumber: 542,
        start: slot === 1 ? 0 + 2 : (slot - 1) * 4 + 2,
        amount: 2,
        wordLen: 0x02
      }
      const response = await plc.write(conn, buffer)
      console.log(conn, buffer, response)
    }
  })
}

const start = async () => {
  try {
    const app = uWS.App().listen(def.HTTP, token => {
      if (token) {
        console.log('Listening to port ' + def.HTTP, token)
      } else {
        console.log('Failed to listen to port ' + def.HTTP)
      }
    })
    const plc = new PLC(def.PLC)
    plc.main(def, obj)
    plc.on('pub', ({ channel, data }) => {
      // console.log(channel, JSON.parse(data))     
      if (channel === 'aps/overview') {
        const overview = JSON.parse(data)
        queue(plc, overview.exitQueue)
        // queue(plc, overview.swapQueue)
      }
    })
    // routes
    routes(app, def, obj, plc, { prefix })
  } catch (err) {
    console.log(err)
    console.error(new Error(err))
    process.exit(1)
  }
}

start()
