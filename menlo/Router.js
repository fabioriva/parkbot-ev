const pino = require('pino')
const { sendJson, Message } = require('./json')
const { WriteArea } = require('./utils7')

const logger = pino({
  msgPrefix: '[PARKBOT-EV] ',
  timestamp: pino.stdTimeFunctions.isoTime
})

const PARAM_NOT_VALID = 'parameters not valid'
const CARD_OUT_OF_RANGE = 'card out of range'
const CARD_NOT_PRESENT = 'card not present'
const NOT_PARKED_IN_EV = 'card not parked in EV stall'

class Router {
  constructor (app, plc) {
    this.app = app
    this.plc = plc
  }

  exec_time (ping, func_) {
    const pong = process.hrtime(ping)
    logger.info(`Execution time in millisecond: ${(pong[0] * 1000000000 + pong[1]) / 1000000}\t${func_}`)
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
    this.app.get(prefix + '/exit/:card', async (res, req) => {
      this.log(req)
      const card = parseInt(req.getParameter(0))
      logger.info({ card }, 'request to exit')
      if (!Number.isInteger(card)) {
        logger.warn({ card }, PARAM_NOT_VALID)
        return sendJson(res, new Message('warning', PARAM_NOT_VALID))
      }
      if (card < 1 || card > def.CARDS) {
        logger.warn({ card }, CARD_OUT_OF_RANGE)
        return sendJson(res, new Message('warning', CARD_OUT_OF_RANGE))
      }
      const stall = obj.stalls.find(s => s.status === card)
      if (stall === undefined) {
        logger.warn({ card }, CARD_NOT_PRESENT)
        return sendJson(res, new Message('warning', CARD_NOT_PRESENT))
      }
      res.onAborted(() => {
        res.aborted = true
      })
      const buffer = Buffer.alloc(2)
      buffer.writeUInt16BE(card, 0)
      const { area, dbNumber, start, amount, wordLen } = def.REQ_EXIT
      const response = await WriteArea(this.plc.client, area, dbNumber, start, amount, wordLen, buffer)
      logger.info({ card, response }, response ? 'write ok' : 'write error')
      sendJson(
        res,
        new Message(
          response ? 'success' : 'error',
          response ? 'Sent exit request for card ' + card : 'Write error!'
        )
      )
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
      logger.info({ card }, 'request to swap')
      if (!Number.isInteger(card)) {
        logger.warn({ card }, PARAM_NOT_VALID)
        return sendJson(res, new Message('warning', PARAM_NOT_VALID))
      }
      if (card < 1 || card > def.CARDS) {
        logger.warn({ card }, CARD_OUT_OF_RANGE)
        return sendJson(res, new Message('warning', CARD_OUT_OF_RANGE))
      }
      const stall = obj.stalls.find(s => s.status === card)
      if (stall === undefined) {
        logger.warn({ card }, CARD_NOT_PRESENT)
        return sendJson(res, new Message('warning', CARD_NOT_PRESENT))
      }
      if (obj.stalls.find(s => s.nr === stall.nr && s.ev_type !== 0) === undefined) {
        logger.warn({ card }, NOT_PARKED_IN_EV)
        return sendJson(res, new Message('warning', NOT_PARKED_IN_EV))
      }
      res.onAborted(() => {
        res.aborted = true
      })
      const buffer = Buffer.alloc(2)
      buffer.writeUInt16BE(card, 0)
      const { area, dbNumber, start, amount, wordLen } = def.REQ_SWAP
      const response = await WriteArea(this.plc.client, area, dbNumber, start, amount, wordLen, buffer)
      logger.info({ card, response }, response ? 'write ok' : 'write error')
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
