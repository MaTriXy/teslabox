const log = require('../log')

const _ = require('lodash')
const async = require('async')
const { TelegramClient } = require('messaging-api-telegram')
const p2c = require('promise-to-callback')

let client

const accessToken = process.env.TELEGRAM_ACCESS_TOKEN

exports.start = (cb) => {
  cb = cb || function () {}

  if (!accessToken) {
    log.warn('notifications disabled because TELEGRAM_ACCESS_TOKEN is missing')
    return cb()
  }

  client = new TelegramClient({
    accessToken
  })

  cb()
}

exports.sendMessage = (recipients, text, isSilent, cb) => {
  cb = cb || function () {}

  if (!client) {
    return cb()
  }

  const params = {
    disable_notification: !!isSilent
  }

  async.each(_.compact(recipients), (recipient, cb) => {
    p2c(client.sendMessage(recipient, text, params))(cb)
  }, cb)
}

exports.sendVideo = (recipients, videoUrl, caption, isSilent, cb) => {
  cb = cb || function () {}

  if (!client) {
    return cb()
  }

  const params = {
    caption,
    disable_notification: !!isSilent
  }

  async.each(_.compact(recipients), (recipient, cb) => {
    p2c(client.sendVideo(recipient, videoUrl, params))(cb)
  }, cb)
}
