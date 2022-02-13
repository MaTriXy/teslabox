const ngrok = require('../ngrok')
const controllers = require('./controllers')
const routes = require('./routes')

const _ = require('lodash')
const compression = require('compression')
const express = require('express')
const favicon = require('serve-favicon')
const http = require('http')
const path = require('path')

const port = 80
const timeout = 60

let server

exports.start = (cb) => {
  cb = cb || function () {}

  const app = express()

  app.disable('x-powered-by')
  app.disable('etag')
  app.enable('case sensitive routing')
  app.enable('strict routing')
  app.set('trust proxy', 1)

  app.use(compression({
    threshold: 100
  }))

  const isProduction = process.env.NODE_ENV === 'production'
  const assetsDir = path.join(__dirname, '../assets')
  const ramDir = isProduction ? '/mnt/ram' : path.join(__dirname, '../../mnt/ram')

  app.use(favicon(path.join(assetsDir, 'favicon.ico')))

  const params = {
    fallthrough: false,
    lastModified: true,
    etag: true
  }

  app.use('/assets/', express.static(assetsDir, params))
  app.use('/ram/', express.static(ramDir, params))

  app.set('views', path.join(__dirname, './views'))
  app.set('view engine', 'hjs')
  app.use(express.urlencoded({ extended: true }))

  // public access is restricted to /stream
  app.use((req, res, next) => {
    if (!ngrok.isAdminHost(req.hostname) && !req.url.startsWith('/stream')) {
      res.location('/stream')
    }

    next()
  })

  app.use(routes)
  app.use(controllers.response)
  app.use(controllers.error)

  server = http.createServer(app)
  server.timeout = timeout
  server.keepAliveTimeout = timeout
  server.listen(port, '0.0.0.0', cb)
}

exports.end = (cb) => {
  cb = cb || function () {}

  server.close(() => cb())
}
