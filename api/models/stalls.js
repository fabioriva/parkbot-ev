const format = require('date-fns/format')
const util = require('util')
const { getPlcDateTime } = require('../lib/utils7')

class Stall {
  constructor (
    nr,
    status = 0,
    date = format(new Date('1990-01-01 00:00:00'), 'yyyy-MM-dd HH:mm:ss'),
    size = 0
  ) {
    this.nr = nr
    this.status = status
    this.date = date
    this.size = size
  }

  update (buffer) {
    this.status = buffer.readInt16BE(0)
    this.date = format(
      getPlcDateTime(buffer.readInt16BE(2), buffer.readInt32BE(4)),
      'yyyy-MM-dd HH:mm:ss'
    )
    this.size = buffer.readInt16BE(8)
  }
}

exports.generateStalls = def => {
  const stalls = []
  for (let i = 0; i < def.STALLS; i++) {
    stalls.push(new Stall(i + 1))
  }
  return stalls
}

exports.updateStalls = util.promisify(
  (start, buffer, offset, stalls, callback) => {
    let byte = start
    const min = 0
    const max = buffer.length / offset
    for (let i = min; i < max; i++) {
      stalls[i].update(buffer.slice(byte, byte + offset))
      byte += offset
    }
    callback(null, stalls)
  }
)
