require('dotenv').config()
const logger = require('pino')()
const uWS = require('uWebSockets.js')
const def = require('./def')
const obj = require('./obj')
const Plc = require('../Plc')
const Router = require('../Router')
const { WriteArea } = require('../utils7')

const isEvStall = (stalls, slot) => stalls.some(stall => stall.nr === slot && stall.ev_type !== 0)

const isCharging = async (id, slot) => {
  try {
    const url = `${process.env.PW_API}?stall=${slot}&cardID=${id}`
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.PW_TOKEN
      }
    })
    const json = await res.json()
    logger.info({ json }, 'Checked EV stall %s with ID %s', slot, id)
    const busy = json.busy !== undefined ? Boolean(json.busy) : true
    console.log('Fetch ok', slot, busy ? 'EV is charging, exit disabled' : 'Exit is enabled')
    return busy
  } catch (err) {
    console.log('Fetch err', err)
    return true
  }
}

const writeEvStall = async (plc, slot, isCharging) => {
  const buffer = Buffer.alloc(2)
  buffer.writeUInt16BE(isCharging, 0)
  const { area, dbNumber } = def.EV_STALLS_READ
  const start = slot === 1 ? 0 + 2 : (slot - 1) * 4 + 2
  console.log(area, dbNumber, start, 2, 0x02, buffer)
  const response = await WriteArea(plc.client, area, dbNumber, start, 2, 0x02, buffer)
  logger.info({ slot, response })
}

// If stall is EV and not charging write to enable exit call
const checkQueue = (plc, queue) => {
  queue.forEach(async item => {
    // logger.info(item, 'Item %s', item.id)
    if (item.card >= 1 && item.card <= def.CARDS && isEvStall(obj.stalls, item.slot)) {
      // const valid = isEvStall(obj.stalls, item.slot)
      // const charge = valid ? await isCharging(item.card, item.slot) : true
      // console.log('isEvStall:', item, valid)
      // console.log('isCharging:', item, charge)
      // console.log('Queue check result:', item, valid && !charge)
      // if (valid && !charge) {
      //   console.log('unlock EV slot', item)
      // }
    // console.log(item, (isEvStall(obj.stalls, item.slot) && !isCharging(item.card, item.slot)))
    // if (isEvStall(obj.stalls, item.slot) && !isCharging(item.card, item.slot)) {
    //   await writeEvStall(plc, item.slot, 0) // UNLOCK EV STALL
    // }
      const charge = await isCharging(item.card, item.slot)
      if (!charge) {
        console.log('unlock EV slot', item)
        await writeEvStall(plc, item.slot, 0) // UNLOCK EV STALL
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
        // checkQueue(plc, overview.exitQueue)
        checkQueue(plc, overview.swapQueue)
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
    router.run(def, obj)
  } catch (err) {
    console.error(new Error(err))
    process.exit(1)
  }
}

start()
