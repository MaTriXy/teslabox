const s3 = require('./s3')

const async = require('async')

exports.start = (cb) => {
  cb = cb || function () {}

  async.parallel([
    s3.start
  ], cb)
}

exports.s3 = s3
