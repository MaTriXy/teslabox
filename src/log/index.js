const config = require('../config')

const _ = require('lodash')

const levels = ['debug', 'info', 'warn', 'error']

let logs = []

const log = (level, message) => {
  const minLogLevel = levels.indexOf(config.get('logLevel'))
  const logLevel = levels.indexOf(level)

  if (logLevel < minLogLevel) {
    return false
  }

  const row = {
    created: new Date(),
    level,
    message
  }

  const output = ['warn', 'error'].includes(level) ? 'error' : 'log'
  console[output](_.join(_.values(row), ' '))

  logs.push(row)
  logs = logs.slice(-100)
}

exports.start = (cb) => {
  cb = cb || function () {}

  cb()
}

exports.debug = (message) => {
  log('debug', message)
}

exports.info = (message) => {
  log('info', message)
}

exports.warn = (message) => {
  log('warn', message)
}

exports.error = (message) => {
  log('error', message)
}

exports.list = () => {
  return logs
}

exports.purge = () => {
  logs = []
}
