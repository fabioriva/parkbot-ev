require('dotenv').config()
const fetch = require('node-fetch')
const pino = require('pino')
const uWS = require('uWebSockets.js')
const def = require('./def')
const obj = require('./obj')
const Plc = require('../Plc')
const Router = require('../Router')
const { WriteArea } = require('../utils7')

const logger = pino({
  msgPrefix: '[PARKBOT-EV] ',
  timestamp: pino.stdTimeFunctions.isoTime
})

const isEvStall = (stalls, slot) => stalls.some(stall => stall.nr === slot && stall.ev_type !== 0)

const isCharging = async (aps, id, slot) => {
  try {
    // const url = `${process.env.PW_API}?stall=${slot}&cardID=${id}&location=${aps}`
    const url = `${process.env.PW_API}?stall=${slot}&cardID=${id}&location=menlo_b`
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.PW_TOKEN
      }
    })
    const json = await res.json()
    logger.info({ json }, 'Checked EV stall %s with ID %s', slot, id)
    const busy = json.busy !== undefined ? Boolean(json.busy) : true
    logger.info({ id, slot }, busy ? 'EV is charging, exit disabled' : 'Exit is enabled')
    return busy
  } catch (err) {
    logger.error(err, 'fetch error')
    return true
  }
}

const writeEvStall = async (plc, id, slot, notCharging) => {
  try {
    const buffer = Buffer.alloc(2)
    buffer.writeUInt16BE(notCharging, 0)
    const { area, dbNumber } = def.EV_STALLS_READ
    const start = slot === 1 ? 0 + 2 : (slot - 1) * 4 + 2
    logger.info({ area, dbNumber, start, buffer }, 'write params')
    const response = await WriteArea(plc.client, area, dbNumber, start, 2, 0x02, buffer)
    logger.info({ id, slot, response }, response ? 'write ok' : 'write error')
  } catch (err) {
    logger.error(err, 'write error')
    return true
  }
}

// If stall is EV and not charging write to enable exit call
const checkQueue = (aps, plc, queue) => {
  queue.forEach(async item => {
    if (item.card >= def.CARD_MIN && item.card <= def.CARD_MAX && isEvStall(obj.stalls, item.slot)) {
      const charge = await isCharging(aps, item.card, item.slot)
      if (!charge) {
        await writeEvStall(plc, item.card, item.slot, 0) // UNLOCK EV STALL
      }
    }
  })
}

// const checkDevices = (plc, devices) => {
//   devices.forEach(async item => {
//     logger.info(item, `Device ${item.name}`)
//     if (/* (item.status === 4 || item.status === 5) && */isEvStall(obj.stalls, item.stall) && isCharging(item.card, item.stall)) {
//       await writeEvStall(plc, item.stall, 1) // LOCK EV STALL
//     }
//   })
// }

const start = async () => {
  try {
    const app = uWS.App().listen(def.HTTP, token => console.info(token))
    const plc = new Plc(def.PLC)
    plc.on('pub', ({ channel, data }) => {
      if (channel === 'aps/overview') {
        const overview = JSON.parse(data)
        checkQueue(def.APS, plc, overview.exitQueue)
        checkQueue(def.APS, plc, overview.swapQueue)
        // checkDevices(plc, overview.devices.slice(3))
      }
    })
    plc.run(def, obj)
    plc.data(def, obj)
    // Map
    const plc_ = new Plc(def.PLC)
    plc_.run(def, obj)
    plc_.map(def, obj)
    const router = new Router(app, plc)
    router.run(def, obj, `/aps/${def.APS}/ev`)
    // temp routes
    const trouter = new Router(app, plc)
    trouter.run(def, obj, '/aps/ev/menlo')
  } catch (err) {
    logger.error(new Error(err))
    process.exit(1)
  }
}

start()
