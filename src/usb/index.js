const log = require('../log')
const config = require('../config')

const _ = require('lodash')
const async = require('async')
const glob = require('glob')
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')

const interval = 3000

const files = []
let isReady

exports.start = (cb) => {
  cb = cb || function () {}

  const isProduction = process.env.NODE_ENV === 'production'
  const usbDir = isProduction ? '/mnt/usb' : path.join(__dirname, '../../mnt/usb')
  const ramDir = isProduction ? '/mnt/ram' : path.join(__dirname, '../../mnt/ram')

  _.each(['stream/out', 'archive', 'temp'], (key) => {
    fs.mkdirSync(`${ramDir}/${key}`, { recursive: true })
  })

  async.forever((next) => {
    const isStream = config.get('stream')
    const isArchive = config.get('archive')
    const archiveClips = (Math.ceil(config.get('archiveSeconds') / 60) + 1) * 4

    async.series([
      (cb) => {
        if (!isProduction) {
          return cb()
        }

        exec(`umount ${usbDir} &> /dev/null && mount ${usbDir} &> /dev/null`, cb)
      },
      (cb) => {
        glob(`${usbDir}/**/+(event.json|*.mp4)`, (err, result) => {
          if (err) {
            return cb(err)
          }

          async.eachSeries(result, (row, cb) => {
            if (!isReady) {
              files.push(row)
              return cb()
            }

            if (files.includes(row)) {
              return cb()
            }

            const parts = row.split(/[\\/]/)
            const file = _.last(parts)
            const angle = file.includes('-front') ? 'front' : file.includes('-back') ? 'back' : file.includes('-left') ? 'left' : 'right'

            files.push(row)

            if (isStream && row.includes('RecentClips') && file.endsWith('.mp4')) {
              fs.copyFile(row, `${ramDir}/stream/${angle}.mp4`, cb)
            } else if (isArchive && file === 'event.json') {
              try {
                fs.readFile(row, (err, result) => {
                  if (err) {
                    return cb(err)
                  }

                  const event = JSON.parse(result)
                  const folder = _.nth(parts, -2)
                  const rootFolder = _.nth(parts, -3)

                  const clips = _.filter(files, (file) => {
                    return file.includes(`/${rootFolder}/${folder}/`) && file.endsWith('.mp4')
                  }).sort().reverse().slice(0, archiveClips)

                  const copyFolder = `${ramDir}/archive/${folder}`

                  async.series([
                    (cb) => {
                      fs.mkdir(copyFolder, { recursive: true }, cb)
                    },
                    (cb) => {
                      fs.copyFile(row, `${copyFolder}/${file}`, cb)
                    },
                    (cb) => {
                      async.each(clips, (clip, cb) => {
                        const parts = clip.split(/[\\/]/)
                        const file = _.last(parts)
                        fs.copyFile(clip, `${copyFolder}/${file}`, cb)
                      }, cb)
                    }
                  ], cb)
                })
              } catch (err) {
                cb(err)
              }
            } else {
              cb()
            }
          }, cb)
        })
      }
    ], (err) => {
      if (err) {
        log.warn(`usb failed: ${err}`)
      }

      isReady = true
      setTimeout(next, interval)
    })
  })

  cb()
}
