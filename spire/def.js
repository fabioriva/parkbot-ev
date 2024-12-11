exports.HOST =
  process.env.NODE_ENV !== 'production'
    ? process.env.DEVELOPMENT_SERVER
    : process.env.PRODUCTION_SERVER
exports.HTTP = 9100
exports.PLC = {
  ip: '192.168.67.2',
  rack: 0,
  slot: 1,
  polling_time: 999
}

exports.QUEUE_LEN = 5

const DB_DATA = 541
const DB_DATA_LEN = 134
exports.DB_DATA_INIT_DEVICE = 0
exports.DB_DATA_INIT_EXIT_QUEUE = 36
exports.DB_DATA_INIT_SWAP_QUEUE = 70

exports.DATA_READ = {
  area: 0x84,
  dbNumber: DB_DATA,
  start: 0,
  amount: DB_DATA_LEN,
  wordLen: 0x02
}
exports.REQ_SWAP = {
  area: 0x84,
  dbNumber: DB_DATA,
  start: 134,
  amount: 2,
  wordLen: 0x02
}

const CARDS = 266
const CARD_LEN = 10
exports.CARDS = CARDS
exports.CARD_LEN = CARD_LEN

const STALLS = 276
const STALL_LEN = 10
exports.STALLS = STALLS
exports.STALL_LEN = STALL_LEN
exports.STALL_STATUS = {
  FREE: 0,
  PAPA: 997,
  RSVD: 998,
  LOCK: 999
}

exports.MAP_READ = {
  area: 0x84,
  dbNumber: 510,
  start: 0,
  amount: STALLS * STALL_LEN,
  wordLen: 0x02
}
exports.EV_STALLS_READ = {
  area: 0x84,
  dbNumber: 542,
  start: 0,
  amount: STALLS * 4,
  wordLen: 0x02
}
exports.EV_CARDS_READ = {
  area: 0x84,
  dbNumber: 543,
  start: 0,
  amount: CARDS * 2,
  wordLen: 0x02
}
