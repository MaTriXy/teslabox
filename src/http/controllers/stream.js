const stream = require('../../ram/stream')
const controllers = require('./')

const _ = require('lodash')

module.exports = (req, res, next) => {
  const streams = stream.list()

  const locals = {
    front: +streams.front || false,
    back: +streams.back || false,
    left: +streams.left || false,
    right: +streams.right || false
  }

  if (typeof req.query.json !== 'undefined') {
    res.locals.response = JSON.stringify(locals)
    return next()
  }

  res.render('stream', locals, (err, result) => {
    if (!err) {
      res.locals.response = result
    }

    next(err)
  })
}
