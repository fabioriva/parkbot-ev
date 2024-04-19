const logger = require('pino')()
const { /* readJson, */sendJson, Message } = require('./json')
const { WriteArea } = require('./utils7')

class Router {
  constructor (app, plc) {
    this.app = app
    this.plc = plc
  }

  exec_time (ping, func_) {
    const pong = process.hrtime(ping)
    console.info(`Execution time in millisecond: ${(pong[0] * 1000000000 + pong[1]) / 1000000}\t${func_}`)
  }

  log (req) {
    logger.info({
      'user-agent': req.getHeader('user-agent'),
      method: req.getMethod(),
      url: req.getUrl()
    })
  }

  run (def, obj) {
    const prefix = '/aps/ev/' + def.APS
    this.app.get('/*', (res, req) => {
      this.log(req)
      res.end('Resource not found')
    })
    this.app.get(prefix + '/overview', (res, req) => {
      this.log(req)
      sendJson(res, obj.overview)
    })
    this.app.get(prefix + '/stalls', (res, req) => {
      this.log(req)
      sendJson(res, obj.stalls)
    })
    this.app.get(prefix + '/stalls_ev', (res, req) => {
      this.log(req)
      sendJson(res, obj.stalls.filter(s => s.ev_type !== 0))
    })
    this.app.get(prefix + '/swap/:card', async (res, req) => {
      this.log(req)
      const card = parseInt(req.getParameter(0))
      console.log('swap card', req.getParameter(0), typeof card, card)
      if (!Number.isInteger(card)) {
        return sendJson(res, new Message('warning', 'Parameters not valid'))
      }
      if (card < 1 || card > def.CARDS) {
        return sendJson(res, new Message('warning', 'Card out of range'))
      }
      const stall = obj.stalls.find(s => s.status === card)
      if (stall === undefined) {
        return sendJson(res, new Message('warning', 'Card not present'))
      }
      if (obj.stalls.find(s => s.nr === stall.nr && s.ev_type !== 0) === undefined) {
        return sendJson(res, new Message('warning', 'Card not parked in EV stall'))
      }
      res.onAborted(() => {
        res.aborted = true
      })
      const buffer = Buffer.alloc(2)
      buffer.writeUInt16BE(card, 0)
      const { area, dbNumber, start, amount, wordLen } = def.REQ_SWAP
      const response = await WriteArea(this.plc.client, area, dbNumber, start, amount, wordLen, buffer)
      sendJson(
        res,
        new Message(
          response ? 'success' : 'error',
          response ? 'Sent swap request for card ' + card : 'Write error!'
        )
      )
    })
  }
}

module.exports = Router
