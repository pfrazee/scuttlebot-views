var fs           = require('fs')
var path         = require('path')
var ssbKeys      = require('ssb-keys')

var createSbot   = require('scuttlebot')
var config       = require('ssb-config/inject')()
var keys = ssbKeys.loadOrCreateSync(path.join(config.path, 'secret'))
var manifestFile = path.join(config.path, 'manifest.json')

module.exports = function(cb) {
  // connect
  createSbot.createClient({keys: keys})({port: config.port, host: 'localhost', key: keys.id}, cb)
}