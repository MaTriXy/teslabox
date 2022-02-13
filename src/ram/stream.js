const log = require('../log')
const config = require('../config')

const _ = require('lodash')
const async = require('async')
const path = require('path')
const fs = require('fs')
const { exec } = require('child_process')

const interval = 10000
const parallel = 4

const ramDir = process.env.NODE_ENV === 'production' ? '/mnt/ram' : path.join(__dirname, '../../mnt/ram')
const streams = {}

exports.start = (cb) => {
  cb = cb || function () {}

  async.forever((next) => {
    const isStream = config.get('stream')
    if (!isStream) {
      return setTimeout(next, interval)
    }

    async.eachLimit(['back', 'left', 'right', 'front'], parallel, (angle, cb) => {
      const file = `${ramDir}/stream/${angle}.mp4`
      const tempFile = `${ramDir}/temp/${angle}.mp4`

      fs.stat(file, (err, result) => {
        const ctime = String(_.get(result, 'ctime', ''))

        if (ctime && _.get(streams, `${angle}.ctime`) !== ctime) {
          exec(`ffmpeg -hide_banner -loglevel error -y -i ${file} -vf scale=320:240 -r 24 -an ${tempFile} && mv ${tempFile} ${ramDir}/stream/out/${angle}.mp4`, (err) => {
            if (err) {
              log.warn(`stream failed: ${err}`)
            } else {
              streams[angle] = {
                ctime,
                created: new Date()
              }

              log.debug(`streamed ${file}`)
            }

            fs.rm(file, (err) => {
              if (err) {
                log.warn(`streaming delete failed: ${err}`)
              }

              cb()
            })
          })
        } else {
          if (err && err.code !== 'ENOENT') {
            log.warn(`stat ${file} failed: ${err}`)
          }

          cb()
        }
      })
    }, () => {
      setTimeout(next, interval)
    })
  })

  cb()
}

exports.list = () => {
  return streams
}
