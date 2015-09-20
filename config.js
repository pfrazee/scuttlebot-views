var path = require('path')
var home = require('osenv').home
var nonPrivate = require('non-private-ip')
var merge = require('deep-extend')

var RC = require('rc')

module.exports = function (name, override) {
  name = name || 'disco'
  return RC(name || 'disco', merge({
    //just use an ipv4 address by default.
    //there have been some reports of seemingly non-private
    //ipv6 addresses being returned and not working.
    //https://github.com/ssbc/scuttlebot/pull/102
    host: nonPrivate.v4 || '',
    port: 19860,
    timeout: 30000,
    path: path.join(home(), '.' + name)
  }, override || {}))
}
