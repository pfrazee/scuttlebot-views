var pull       = require('pull-stream')
var mdm        = require('mdmanifest')
var fs         = require('fs')
var zerr       = require('zerr')
var creatLevi  = require('levi')
var mlib       = require('ssb-msgs')
var valid      = require('./lib/validators')
var apidoc     = fs.readFileSync('./api.md', 'utf-8')
var manifest   = mdm.manifest(apidoc)

function isString(s) { return 'string' === typeof s }
var UsageError = zerr('Usage', '%')
var UpstreamError = zerr('Upstream', '%')
var PersistError = zerr('Persist', '%')

exports.name = 'views'
exports.version = '1.0.0'
exports.manifest = manifest

exports.init = function (sbot, config) {

  function addView (view, pos) {
    // :TODO:
  }

  function removeView (view) {
    // :TODO:
  }

  function rebuild (view, cb) {
    // :TODO:
  }

  return {
    get: valid.async(function (view, key, cb) {
      // :TODO:
    }, 'string', 'string'),

    list: valid.source(function (view) {
      // :TODO:
    }, 'string'),

    search: valid.source(function (view) {
      // :TODO:
    }, 'string'),

    score: valid.source(function (view) {
      // :TODO:
    }, 'string'),

    listViews: valid.sync(function () {
      // :TODO:
    }),

    addView: valid.sync(addView, 'string', 'number?'),
    removeView: valid.sync(removeView, 'string'),
    rebuild: valid.async(rebuild, 'string'),

    rebuildAll: valid.async(function (cb) {
      // :TODO:
    })
  }
}
