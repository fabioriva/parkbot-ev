require('dotenv').config()
const fetch = require('node-fetch')
const logger = require('pino')()
const uWS = require('uWebSockets.js')
const def = require('./def')
const obj = require('./obj')
const PLC = require('./Plc')
const routes = require('./routes')

const prefix = '/api/wallstreet'

const checkEvStall = async (id, slot) => {
  try {
    const url = `${process.env.PW_API}?stall=${slot}&cardID=${id}`
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.PW_TOKEN
      },
    })
    const json = await res.json()
    console.log('checkEvStall', id, slot, json)
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
    const found = obj.stalls.find(s => s.nr === slot && s.ev_type !== 0)
    if (found === undefined) return
    const json = await checkEvStall(card, slot)
    if (json.busy === undefined) return
    const IS_CHARGING = json.busy
    if (!IS_CHARGING) {
      const buffer = Buffer.allocUnsafe(2)
      buffer.writeUInt16BE(json.busy, 0)
      const conn = {
        area: 0x84,
        dbNumber: def.EV_STALLS_READ.dbNumber,
        start: slot === 1 ? 0 + 2 : (slot - 1) * 4 + 2,
        amount: 2,
        wordLen: 0x02
      }
      const response = await plc.write(conn, buffer)
      console.log(conn, buffer, response)
    }
  })
}

const isEvStall = (stalls, slot) => stalls.some(stall => stall.nr === slot && stall.ev_type !== 0)

const isCharging = async (id, slot) => {
  try {
    const url = `${process.env.PW_API}?stall=${slot}&cardID=${id}`
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.PW_TOKEN
      },
    })
    const json = await res.json()
    logger.info({ json }, 'Checked EV stall %s with ID %s', slot, id)
    return Boolean(json.busy)
  } catch (err) {
    return true
  }
}

const writeEvStall = async (dbNumber, plc, slot, isCharging) => {
  const buffer = Buffer.allocUnsafe(2)
  buffer.writeUInt16BE(isCharging, 0)
  const conn = {
    area: 0x84,
    dbNumber,
    start: slot === 1 ? 0 + 2 : (slot - 1) * 4 + 2,
    amount: 2,
    wordLen: 0x02
  }
  const response = await plc.write(conn, buffer)
  logger.info({ conn, response })
}

const checkQueue = (plc, queue) => {
  queue.forEach(async item => {
    logger.info(item, 'Item %s', item.id)
    if (isEvStall(obj.stalls, item.slot) && !isCharging(item.card, item.slot)) {
      await writeEvStall(def.EV_STALLS_READ.dbNumber, plc, item.slot, 0) // UNLOCK EV STALL
    }
  })
}

const checkDevices = (plc, devices) => {
  devices.forEach(async item => {
    logger.info(item, `Device ${item.name}`)
    if (/*(item.status === 4 || item.status === 5) && */isEvStall(obj.stalls, item.stall) && isCharging(item.card, item.stall)) {
      await writeEvStall(def.EV_STALLS_READ.dbNumber, plc, item.stall, 1) // LOCK EV STALL
    }
  })
}

const start = async () => {
  try {
    const app = uWS.App().listen(def.HTTP, token => console.info(token))
    const plc = new PLC(def.PLC)
    plc.main(def, obj)
    plc.on('pub', ({ channel, data }) => {
      if (channel === 'aps/overview') {
        const overview = JSON.parse(data)
        queue(plc, overview.exitQueue)
        queue(plc, overview.swapQueue)
        // checkQueue(plc, overview.exitQueue)
        // checkQueue(plc, overview.swapQueue)
        // checkDevices(plc, overview.devices.slice(3))
      }
    })
    // routes
    routes(app, def, obj, plc, { prefix })
  } catch (err) {
    console.error(new Error(err))
    process.exit(1)
  }
}

start()
