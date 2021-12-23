require('dotenv').config()
const fetch = require('node-fetch')
const uWS = require('uWebSockets.js')
const def = require('./def')
const obj = require('./obj')
const PLC = require('./Plc')
const { sendJson } = require('./lib/json')

const prefix = '/api/wallstreet'

// const check = (card, op) => {
//   if (!Number.isInteger(card)) {
//     return { error: 'Parameters not valid' }
//   }
//   if (card < 1 || card > def.CARDS) {
//     return { error: 'Card out of range' }
//   }
//   const found = obj.stalls.find(stall => stall.status === card)
//   if (op === 0 && found === undefined) {
//     return { error: 'Card not present' }
//   }
//   if (op !== 0 && found) {
//     return { error: 'Card in use' }
//   }
// }

const queue = (plc, data) => {
  // console.log(data)
  data.queue.forEach(async (element, key) => {
    const { id, card, stall } = element
    if (stall < 1 || stall > def.STALLS) return
    if (!obj.stalls[stall - 1].myEv) return
    const { isBusy, error } = await getEVStatus(stall)
    if (error) return
    console.log('Stall is busy ?????', stall, isBusy)
    if (!isBusy) {
      console.log('Queue', key, id, card, stall)
      const buffer = Buffer.allocUnsafe(2)
      buffer.writeUInt16BE(1, 0)
      const conn = {
        area: 0x84,
        dbNumber: 542,
        start: stall === 1 ? 0 + 8 : (stall - 1) * def.STALL_LEN + 8,
        amount: 2,
        wordLen: 0x02
      }
      const response = await plc.write(conn, buffer)
      console.log(conn, buffer, response)
    }
  })
}

const getEVStatus = async stall => {
  try {
    const url = 'http://192.168.200.104:4000/pw/wallstreet/stall/' + stall
    const res = await fetch(url, {})
    const json = await res.json()
    // const json = { busy: Boolean(1) }
    console.log('getEVStatus', stall, json)
    return json
  } catch (err) {
    // console.error('error:', err)
    return { error: err }
  }
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
    const plc01 = new PLC(def.PLC)
    plc01.main(def, obj)
    plc01.on('pub', ({ channel, data }) => {
      // console.log(channel, JSON.parse(data))
      if (channel === 'aps/overview') queue(plc01, JSON.parse(data))
      // if (channel === 'aps/stalls') {
      //   const stalls = JSON.parse(data)
      //   console.log(stalls[0])
      // }
    })
    // routes
    app.get(prefix + '/overview', (res, req) => {
      sendJson(res, obj.overview)
    })
    app.get(prefix + '/stalls', (res, req) => {
      sendJson(res, obj.stalls)
    })
    app.get(prefix + '/entry/:id/:card', async (res, req) => {
      const id = parseInt(req.getParameter(0))
      const card = parseInt(req.getParameter(1))
      if (!Number.isInteger(id) || !Number.isInteger(card)) {
        return sendJson(res, {
          severity: 'error',
          message: 'Parameters not valid'
        })
      }
      if (card < 1 || card > def.CARDS) {
        return sendJson(res, {
          severity: 'error',
          message: 'Card out of range'
        })
      }
      const found = obj.stalls.find(stall => stall.status === card)
      if (found) {
        return sendJson(res, { severity: 'error', message: 'Card in use' })
      }
      res.onAborted(() => {
        res.aborted = true
      })
      const buffer = Buffer.allocUnsafe(2)
      buffer.writeUInt16BE(card, 0)
      let conn
      switch (id) {
        case 1:
          conn = def.REQ_1
          break
        case 2:
          conn = def.REQ_2
          break
        case 3:
          conn = def.REQ_3
          break
        default:
          return sendJson(res, {
            severity: 'error',
            message: 'Parameters not valid'
          })
      }
      const response = await plc01.write(conn, buffer)
      if (!response) {
        return sendJson(res, { severity: 'error', message: 'Write error' })
      }
      // success
      sendJson(res, {
        severity: 'success',
        message: 'entry ' + id + ' request for card ' + card
      })
    })
    app.get(prefix + '/exit/:card', async (res, req) => {
      const card = parseInt(req.getParameter(0))
      if (!Number.isInteger(card)) {
        return sendJson(res, {
          severity: 'error',
          message: 'Parameters not valid'
        })
      }
      if (card < 1 || card > def.CARDS) {
        return sendJson(res, {
          severity: 'error',
          message: 'Card out of range'
        })
      }
      const found = obj.stalls.find(stall => stall.status === card)
      if (found === undefined) {
        return sendJson(res, { severity: 'error', message: 'Card not present' })
      }
      res.onAborted(() => {
        res.aborted = true
      })
      const buffer = Buffer.allocUnsafe(2)
      buffer.writeUInt16BE(card, 0)
      const response = await plc01.write(def.REQ_0, buffer)
      if (!response) {
        return sendJson(res, { severity: 'error', message: 'Write error' })
      }
      // success
      sendJson(res, {
        severity: 'success',
        message: 'exit request for card ' + card
      })
    })
    app.get(prefix + '/swap/:card', (res, req) => {
      sendJson(res, obj.stalls)
    })
  } catch (err) {
    console.log(err)
    console.error(new Error(err))
    process.exit(1)
  }
}

start()
