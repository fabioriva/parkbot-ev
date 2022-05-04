const logger = require('pino')()
const { sendJson } = require('./lib/json')

function log(req) {
    logger.info({
        'user-agent': req.getHeader('user-agent'),
        method: req.getMethod(),
        url: req.getUrl()
    })
}

function checkCard(card, def) {
    if (!Number.isInteger(card)) {
        return {
            severity: 'error',
            message: 'Parameters not valid'
        }
    }
    if (card < 1 || card > def.CARDS) {
        return {
            severity: 'error',
            message: 'Card out of range'
        }
    }
    return { severity: 'success', message: 'Card is valid' }
}

function routes(app, def, obj, plc, options) {
    const { prefix } = options

    app.get(prefix + '/overview', (res, req) => {
        log(req)
        sendJson(res, obj.overview)
    })
    app.get(prefix + '/stalls', (res, req) => {
        log(req)
        sendJson(res, obj.stalls)
    })
    // app.get(prefix + '/entry/:id/:card', async (res, req) => {
    //     log(req)
    //     const id = parseInt(req.getParameter(0))
    //     const card = parseInt(req.getParameter(1))
    //     if (!Number.isInteger(id) || !Number.isInteger(card)) {
    //         return sendJson(res, {
    //             severity: 'error',
    //             message: 'Parameters not valid'
    //         })
    //     }
    //     if (card < 1 || card > def.CARDS) {
    //         return sendJson(res, {
    //             severity: 'error',
    //             message: 'Card out of range'
    //         })
    //     }
    //     const found = obj.stalls.find(stall => stall.status === card)
    //     if (found) {
    //         return sendJson(res, { severity: 'error', message: 'Card in use' })
    //     }
    //     res.onAborted(() => {
    //         res.aborted = true
    //     })
    //     const buffer = Buffer.allocUnsafe(2)
    //     buffer.writeUInt16BE(card, 0)
    //     let conn
    //     switch (id) {
    //         case 1:
    //             conn = def.REQ_1
    //             break
    //         case 2:
    //             conn = def.REQ_2
    //             break
    //         case 3:
    //             conn = def.REQ_3
    //             break
    //         default:
    //             return sendJson(res, {
    //                 severity: 'error',
    //                 message: 'Parameters not valid'
    //             })
    //     }
    //     const response = await plc.write(conn, buffer)
    //     if (!response) {
    //         return sendJson(res, { severity: 'error', message: 'Write error' })
    //     }
    //     // success
    //     sendJson(res, {
    //         severity: 'success',
    //         message: 'entry ' + id + ' request for card ' + card
    //     })
    // })
    // app.get(prefix + '/exit/:card', async (res, req) => {
    //     log(req)
    //     const card = parseInt(req.getParameter(0))
    //     if (!Number.isInteger(card)) {
    //         return sendJson(res, {
    //             severity: 'error',
    //             message: 'Parameters not valid'
    //         })
    //     }
    //     if (card < 1 || card > def.CARDS) {
    //         return sendJson(res, {
    //             severity: 'error',
    //             message: 'Card out of range'
    //         })
    //     }
    //     const found = obj.stalls.find(stall => stall.status === card)
    //     if (found === undefined) {
    //         return sendJson(res, { severity: 'error', message: 'Card not present' })
    //     }
    //     res.onAborted(() => {
    //         res.aborted = true
    //     })
    //     const buffer = Buffer.allocUnsafe(2)
    //     buffer.writeUInt16BE(card, 0)
    //     const response = await plc.write(def.REQ_0, buffer)
    //     if (!response) {
    //         return sendJson(res, { severity: 'error', message: 'Write error' })
    //     }
    //     // success
    //     sendJson(res, {
    //         severity: 'success',
    //         message: 'exit request for card ' + card
    //     })
    // })
    app.get(prefix + '/swap/:card', async (res, req) => {
        log(req)
        const card = parseInt(req.getParameter(0))
        const { severity, message } = checkCard(card, def)
        if (severity === 'error') {
            return sendJson(res, { severity, message })
        }
        const stall = obj.stalls.find(stall => stall.status === card)
        if (stall === undefined) {
            return sendJson(res, { severity: 'error', message: 'Card not present' })
        }
        if (def.EV_STALLS.find(element => element === stall.nr) === undefined) {
            return sendJson(res, { severity: 'error', message: 'Card not parked in EV stall' })
        }
        res.onAborted(() => {
            res.aborted = true
        })
        const buffer = Buffer.allocUnsafe(2)
        buffer.writeUInt16BE(card, 0)
        const response = await plc.write(def.REQ_SWAP, buffer)
        if (!response) {
            return sendJson(res, { severity: 'error', message: 'PLC write error' })
        }
        // success
        sendJson(res, {
            severity: 'success',
            message: 'shuffle request for card ' + card
        })
    })
}

module.exports = routes