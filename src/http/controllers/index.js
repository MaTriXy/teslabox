const log = require('../../log')

const _ = require('lodash')

exports.home = require('./home')
exports.log = require('./log')
exports.archive = require('./archive')
exports.stream = require('./stream')

exports.formatAngle = (angle) => {
  return {
    front: 'up',
    back: 'down',
    left: 'left',
    right: 'right'
  }[angle]
}

exports.formatDate = (date) => {
  const dt = date ? new Date(date) : new Date()
  return new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().substr(0, 19).replace('T', ' ')
}

exports.response = (req, res, next) => {
  const location = res.get('location')

  if (location) {
    res.redirect(location)
  } else if (_.has(res.locals, 'response')) {
    res.send(res.locals.response).end()
  } else {
    return next({})
  }

  next()
}

exports.error = (err, req, res, next) => {
  if (_.isObject(err)) {
    log.error(`${req.method} ${req.url} failed: ${err.message}`)
    res.statusCode = 500
    res.locals.response = res.locals.response || 'Server Error. <a href="/">Try again?</a>'
  } else {
    log.warn(`${req.method} ${req.url} failed${err ? `: ${err}` : ''}`)
    res.statusCode = 400
    res.locals.response = res.locals.response || 'Client Error. <a href="/">Try again?</a>'
  }

  res.send(res.locals.response).end()
  next()
}
