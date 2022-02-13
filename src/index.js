require('dotenv').config()

const config = require('./config')
const log = require('./log')
const aws = require('./aws')
const http = require('./http')
const telegram = require('./telegram')
const ping = require('./ping')
const ngrok = require('./ngrok')
const usb = require('./usb')
const ram = require('./ram')

const async = require('async')

async.series([
  config.start,
  log.start,
  aws.start,
  http.start,
  telegram.start,
  ping.start,
  ngrok.start,
  usb.start,
  ram.start
], (err) => {
  if (err) {
    log.error(`teslabox failed: ${err}`)
    process.exit(1)
  }

  log.info('teslabox started')
})
