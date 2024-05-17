const def = require('./a/def')
const pino = require('pino')
const logger = pino({
  msgPrefix: '[HTTP] ',
  timestamp: pino.stdTimeFunctions.isoTime
})

// const logger = require('pino')({
//   msgPrefix: '[HTTP] ',
//   timestamp: () => `,"time":"${new Date(Date.now()).toISOString()}"`
// })

const id = 1
const slot = 123
const json = { busy: 0 }
logger.info({ json }, 'Checked EV stall %s with ID %s', slot, id)

const busy = json.busy !== undefined ? Boolean(json.busy) : true
logger.info({ id, slot }, busy ? 'EV is charging, exit disabled' : 'Exit is enabled')

logger.error(new Error('test'), 'fetch error')

const { area, dbNumber } = def.EV_STALLS_READ
const start = slot === 1 ? 0 + 2 : (slot - 1) * 4 + 2
const buffer = Buffer.alloc(2)
logger.info({ area, dbNumber, start, buffer }, 'write params')
const response = true
logger.info({ id, slot, response }, response ? 'write ok' : 'write error')

const card = 77
logger.info({ card }, 'request to swap')
const PARAM_NOT_VALID = 'parameters not valid'
const CARD_OUT_OF_RANGE = 'card out of range'
const CARD_NOT_PRESENT = 'card not present'
const NOT_PARKED_IN_EV = 'card not parked in EV stall'
logger.warn({ card }, PARAM_NOT_VALID)
logger.warn({ card }, CARD_OUT_OF_RANGE)
logger.warn({ card }, CARD_NOT_PRESENT)
logger.warn({ card }, NOT_PARKED_IN_EV)
logger.info({ card, response }, response ? 'write ok' : 'write error')
