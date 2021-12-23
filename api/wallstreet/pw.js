const uWS = require('uWebSockets.js')
const def = require('./def')
const { sendJson } = require('./lib/json')
const { generateStalls } = require('./models/stalls')

const PORT = 4000

const prefix = '/pw/wallstreet'

const stalls = generateStalls(def)

const start = async () => {
  try {
    const app = uWS.App().listen(PORT, token => {
      if (token) {
        console.log('Listening to port ' + PORT, token)
      } else {
        console.log('Failed to listen to port ' + PORT)
      }
    })

    // routes
    app.get(prefix + '/stall/:id', (res, req) => {
      const id = req.getParameter(0)
      sendJson(res, stalls[id - 1])
    })
    // add route /operation/entry
    // add route /operation/exit
    // add route /operation/shuffle
  } catch (err) {
    console.error(new Error(err))
    process.exit(1)
  }
}

start()
