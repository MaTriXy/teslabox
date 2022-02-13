const log = require('../log')

const async = require('async')
const ping = require('ping')

const interval = 10000
const host = '1.1.1.1'

let isAlive

exports.start = (cb) => {
  async.forever((next) => {
    ping.sys.probe(host, (result) => {
      if (result) {
        if (typeof isAlive === 'undefined') {
          log.info('connection established')
        } else if (!isAlive) {
          log.info('connection re-established')
        }
      } else if (isAlive) {
        log.warn('connection lost')
      }

      isAlive = !!result

      setTimeout(next, interval)
    })
  })

  cb()
}

exports.isAlive = () => {
  return isAlive
}
