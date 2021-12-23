const def = require('./def')
const { Device } = require('./models/devices')
const { generateQueue } = require('./models/queue')
const { generateStalls } = require('./models/stalls')

const EVT1 = new Device(1, 'EVT1')
const EVT2 = new Device(2, 'EVT2')
const EVT3 = new Device(3, 'EVT3')
const IVT4 = new Device(4, 'IVT4')
const IVT5 = new Device(5, 'IVT5')
const IVT6 = new Device(6, 'IVT6')

const devices = [EVT1, EVT2, EVT3, IVT4, IVT5, IVT6]

exports.devices = devices

const queue = generateQueue(def)
exports.queue = queue

exports.overview = {
  devices,
  queue
}

const stalls = generateStalls(def)
exports.stalls = stalls
