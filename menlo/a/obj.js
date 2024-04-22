const def = require('./def')
const { Device } = require('../Device')
const { generateQueue } = require('../Queue')
const { generateStalls } = require('../Stall')

const EU1 = new Device(1, 'EU1')
const EU2 = new Device(2, 'EU2')
const EU3 = new Device(3, 'EU3')
const T1 = new Device(4, 'T1')
const T2 = new Device(5, 'T2')
const T3 = new Device(6, 'T3')

const devices = [EU1, EU2, EU3, T1, T2, T3]

exports.devices = devices

const exitQueue = generateQueue(def.QUEUE_LEN)
exports.exitQueue = exitQueue

const swapQueue = generateQueue(def.QUEUE_LEN)
exports.swapQueue = swapQueue

exports.overview = {
  devices,
  exitQueue,
  swapQueue
}

const stalls = generateStalls(def)
exports.stalls = stalls
