#! /usr/bin/env node

var path         = require('path')
var fs           = require('fs')
var ssbKeys      = require('ssb-keys')
var muxrpcli     = require('muxrpcli')
var mdm          = require('mdmanifest')

var config       = require('./config')(process.env.disco_appname)
var createDisco  = require('./')

var manifest     = mdm.manifest(fs.readFileSync('./api.md', 'utf-8'))
var keys         = ssbKeys.loadOrCreateSync(path.join(config.path, 'secret'))

console.log(keys.id, manifest)
// special server command
if (process.argv[2] == 'server') {
  config.keys = keys
  var server = createDisco(config)
  return
}

// connect
createDisco.createClient({keys: keys})({port: config.port, host: config.host||'localhost', key: keys.id}, function (err, disco) {
  if(err) throw err

  // run commandline
  muxrpcli(process.argv.slice(2), manifest, disco)
})
