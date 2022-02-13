const config = require('../../config')
const archive = require('../../ram/archive')
const controllers = require('./')

const _ = require('lodash')

module.exports = (req, res, next) => {
  const archives = _.reverse(_.map(archive.list(), (row) => {
    return {
      created: controllers.formatDate(row.created),
      lat: row.lat,
      lon: row.lon,
      url: row.url,
      processed: controllers.formatDate(row.processed)
    }
  }))

  const locals = {
    archives,
    hasArchives: !!archives.length
  }

  res.render('archive', locals, (err, result) => {
    if (!err) {
      res.locals.response = result
    }

    next(err)
  })
}
