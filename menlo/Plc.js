const EventEmitter = require('events')
const logger = require('pino')()
const snap7 = require('node-snap7')
const { ReadArea } = require('./utils7')
const { updateDevices } = require('./Device')
const { updateQueue } = require('./Queue')
const { updateStalls } = require('./Stall')

class PLC extends EventEmitter {
  constructor (plc) {
    super()
    this.client = new snap7.S7Client()
    this.online = false
    this.params = plc
  }

  exec_time (ping, func_) {
    const pong = process.hrtime(ping)
    console.info(`Execution time in millisecond: ${(pong[0] * 1000000000 + pong[1]) / 1000000}\t${func_}`)
  }

  error (e) {
    this.online = !this.client.Disconnect()
    isNaN(e) ? logger.error(e) : logger.error(this.client.ErrorText(e))
  }

  data (def, obj) {
    try {
      setTimeout(async () => {
        if (this.online) {
          const ping = process.hrtime()

          const { area, dbNumber, start, amount, wordLen } = def.DATA_READ
          const buffer = this.online ? await ReadArea(this.client, area, dbNumber, start, amount, wordLen) : Buffer.alloc(amount)
          await Promise.all([
            updateDevices(def.DB_DATA_INIT_DEVICE, buffer, 6, obj.devices),
            updateQueue(def.DB_DATA_INIT_EXIT_QUEUE, buffer, 6, obj.exitQueue),
            updateQueue(def.DB_DATA_INIT_SWAP_QUEUE, buffer, 6, obj.swapQueue)
          ])

          this.exec_time(ping, 'data')
        } else {
          this.online = this.client.Connect()
          this.online ? logger.info('Connected to PLC %s', this.params.ip) : logger.info('Connecting to PLC %s ...', this.params.ip)
        }
        if (this.online_ !== this.online) {
        // console.log('----------------------------INIT DATA----------------------------')
          this.online_ = this.online
        }
        this.publish('aps/info', {
          comm: this.online
        })
        this.data(def, obj)
      }, this.params.polling_time)
    } catch (error) {
      this.error(error)
    } finally {
      this.publish('aps/overview', obj.overview)
    }
  }

  map (def, obj) {
    try {
      setTimeout(async () => {
        if (this.online) {
          const ping = process.hrtime()

          const { area, dbNumber, start, amount, wordLen } = def.MAP_READ
          const buffer = this.online ? await ReadArea(this.client, area, dbNumber, start, amount, wordLen) : Buffer.alloc(amount)
          await updateStalls(0, buffer, def.STALL_LEN, obj.stalls)
          // const stalls = await updateStalls(0, buffer, def.STALL_LEN, obj.stalls)
          // const data = occupancy(0, stalls, def.STALL_STATUS)
          // obj.map.occupancy = data
          // this.publish('aps/stalls', stalls)

          this.exec_time(ping, 'map')
        } else {
          this.online = this.client.Connect()
          this.online ? logger.info('Connected to PLC %s', this.params.ip) : logger.info('Connecting to PLC %s ...', this.params.ip)
        }
        if (this.online_ !== this.online) {
        // console.log('----------------------------INIT MAP----------------------------')
          this.online_ = this.online
        }
        this.publish('aps/info', {
          comm: this.online
        })
        this.map(def, obj)
      }, this.params.polling_time)
    } catch (e) {
      this.error(e)
    } finally {
      this.init(def, obj)
    }
  }

  async init (def, obj) {
    try {
      const { area, dbNumber, start, amount, wordLen } = def.EV_STALLS_READ
      const buffer = this.online ? await ReadArea(this.client, area, dbNumber, start, amount, wordLen) : Buffer.alloc(amount)
      let byte = 0
      obj.stalls.forEach(s => {
        s.ev_type = buffer.readInt16BE(byte)
        s.ev_isCharging = buffer.readInt16BE(byte + 2)
        // console.log(byte, buffer.readInt16BE(byte), buffer.readInt16BE(byte + 2), s)
        byte += 4
      })
    } catch (e) {
      this.error(e)
    }
  }

  async run (def, obj) {
    try {
      this.online = this.client.ConnectTo(this.params.ip, this.params.rack, this.params.slot)
      // this.forever(def, obj)
    } catch (e) {
      this.error(e)
    }
  }

  publish (channel, data) {
    this.emit('pub', { channel, data: Buffer.from(JSON.stringify(data)) })
  }
}

module.exports = PLC
