const uWS = require('uWebSockets.js')
const querystring = require('querystring')
const { readJson, sendJson, Message } = require('./json')

const PORT = 9100

const start = async () => {
  try {
    const app = uWS.App().listen(PORT, token => console.info(token))
    app.get('/sotefin/api/exit_is_enabled', (res, req) => {
      const { cardID, stall } = querystring.parse(req.getQuery())
      console.log('card', cardID, typeof cardID, 'stall', stall, typeof stall)
      // res.end('Hello from chargeworks test server')
      switch (stall) {
        case '4':
        case '8':
          sendJson(res, { busy: 0 })
          break
        default:
          sendJson(res, { busy: 1 })
      }
    })
  } catch (err) {
    console.error(new Error(err))
    process.exit(1)
  }
}

start()
