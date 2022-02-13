const archive = require('./archive')
const stream = require('./stream')

const async = require('async')

exports.start = (cb) => {
  async.parallel([
    archive.start,
    stream.start
  ], cb)
}
