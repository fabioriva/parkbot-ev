const EventEmitter = require('events')
const logger = require('pino')()
const snap7 = require('node-snap7')
const comm = require('./lib/comm')
const { updateDevices } = require('./models/devices')
const { updateQueue } = require('./models/queue')
const { updateStalls } = require('./models/stalls')
// const { updateStalls, occupancy } = require('./models/stalls')

class PLC extends EventEmitter {
  constructor (plc) {
    super()
    this.client = new snap7.S7Client()
    this.online = false
    this.plc = plc
  }

  error (error) {
    this.online = !this.client.Disconnect()
    logger.error('[S7 comm error] %s', this.client.ErrorText(error))
  }

  async connect () {
    this.online = await comm.connectTo(this.client, this.plc)
    logger.info('PLC %s is online', this.plc.ip)
  }

  async data (def, obj) {
    try {
      const buffer = await this.read(def.DATA_READ)
      await Promise.all([
        updateDevices(def.DB_DATA_INIT_DEVICE, buffer, 6, obj.devices),
        updateQueue(def.DB_DATA_INIT_EXIT_QUEUE, buffer, 6, obj.exitQueue),
        updateQueue(def.DB_DATA_INIT_SWAP_QUEUE, buffer, 6, obj.swapQueue)
      ])
    } catch (error) {
      this.error(error)
    } finally {
      this.publish('aps/overview', obj.overview)
    }
  }

  async map (def, obj) {
    try {
      const buffer = await this.read(def.MAP_READ)
      const stalls = await updateStalls(0, buffer, def.STALL_LEN, obj.stalls)
      this.publish('aps/stalls', stalls)
    } catch (error) {
      this.error(error)
    }
  }

  async main (def, obj) {
    try {
      await this.connect()
      this.forever(def, obj)
    } catch (err) {
      this.error(err)
    }
  }

  forever (def, obj) {
    setTimeout(async () => {
      if (this.online) {
        await this.data(def, obj)
        await this.map(def, obj)
      } else {
        this.online = this.client.Connect()
        logger.info('re-connecting... %s', this.online)
      }
      this.publish('aps/info', {
        comm: this.online
      })
      this.forever(def, obj)
    }, this.plc.polling_time)
  }

  publish (channel, data) {
    this.emit('pub', { channel, data: JSON.stringify(data) })
    // this.emit('pub', { channel, data })
  }

  async read (conn) {
    try {
      const buffer = await comm.readArea(
        this.client,
        conn.area,
        conn.dbNumber,
        conn.start,
        conn.amount,
        conn.wordLen
      )
      return buffer
    } catch (error) {
      this.error(error)
    }
  }

  async write (conn, buffer) {
    try {
      const response = await comm.writeArea(
        this.client,
        conn.area,
        conn.dbNumber,
        conn.start,
        conn.amount,
        conn.wordLen,
        buffer
      )
      return response // return true on success
    } catch (error) {
      this.error(error)
    }
  }
}

module.exports = PLC
