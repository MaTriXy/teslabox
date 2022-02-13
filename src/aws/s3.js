const AWS = require('aws-sdk')

let client

const accessKeyId = process.env.AWS_ACCESS_KEY_ID
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
const region = process.env.AWS_DEFAULT_REGION
const bucket = process.env.AWS_S3_BUCKET

exports.start = (cb) => {
  cb = cb || function () {}

  if (!accessKeyId || !secretAccessKey || !region || !bucket) {
    log.warn(`archive is disabled because AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION and/or AWS_S3_BUCKET is missing`)
    return cb()
  }

  client = new AWS.S3({
    credentials: {
      accessKeyId,
      secretAccessKey
    },
    region
  })

  cb()
}

exports.putObject = (Bucket, Key, Body, cb) => {
  cb = cb || function () {}

  if (!client) {
    return cb()
  }

  client.putObject({
    Bucket: Bucket || bucket,
    Key,
    Body
  }, cb)
}

exports.getSignedUrl = (Bucket, Key, Expires, cb) => {
  cb = cb || function () {}

  if (!client) {
    return cb()
  }

  client.getSignedUrl('getObject', {
    Bucket: Bucket || bucket,
    Key,
    Expires
  }, cb)
}
