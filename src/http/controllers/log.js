const config = require('../../config')
const log = require('../../log')
const controllers = require('./')

const _ = require('lodash')

const formatLevel = (level) => {
  return {
    debug: 'secondary',
    info: 'primary',
    warn: 'warning',
    error: 'danger'
  }[level]
}

module.exports = (req, res, next) => {
  const logs = _.reverse(_.map(log.list(), (row) => {
    return {
      created: controllers.formatDate(row.created),
      level: row.level.toUpperCase(),
      color: formatLevel(row.level),
      message: row.message
    }
  }))

  const locals = {
    logs,
    hasLogs: !!logs.length
  }

  res.render('log', locals, (err, result) => {
    if (!err) {
      res.locals.response = result
    }

    next(err)
  })
}
