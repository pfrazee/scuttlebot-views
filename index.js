var SecretStack = require('secret-stack')
var pull       = require('pull-stream')
var toPull     = require('stream-to-pull-stream')
var ssbKeys    = require('ssb-keys')
var path       = require('path')
var osenv      = require('osenv')
var mkdirp     = require('mkdirp')
var rimraf     = require('rimraf')
var mdm        = require('mdmanifest')
var fs         = require('fs')
var zerr       = require('zerr')
var creatLevi  = require('levi')
var pushable   = require('pull-pushable')
var valid      = require('./lib/validators')
var apidoc     = fs.readFileSync('./api.md', 'utf-8')
var manifest   = mdm.manifest(apidoc)

function isString(s) { return 'string' === typeof s }
var UsageError = zerr('Usage', '%')
var UpstreamError = zerr('Upstream', '%')
var PersistError = zerr('Persist', '%')

function usage (cmd) {
  return mdm.usage(apidoc, cmd)
}

var SSB = {
  manifest: manifest,
  permissions: {
    master: {allow: null, deny: null},
    anonymous: {allow: ['query', 'usage'], deny: null}
  },
  init: function (api, opts) {
    // useful for testing
    if (opts.temp) {
      var name = isString(opts.temp) ? opts.temp : ''+Date.now()
      opts.path = path.join(osenv.tmpdir(), name)
      rimraf.sync(opts.path)

    }

    var dbPath = path.join(opts.path, 'db')
    // load/create database
    mkdirp.sync(dbPath)

    if(!opts.keys)
      opts.keys = ssbKeys.generate('ed25519', opts.seed && new Buffer(opts.seed, 'base64'))

    if(!opts.path)
      throw UsageError('opts.path *must* be provided, or use opts.temp=sname to create a test instance')

    var levi = creatLevi(path.join(opts.path, 'db'), null, opts.keys)
      .use(creatLevi.tokenizer())
      .use(creatLevi.stemmer())
      .use(creatLevi.stopword())

    function query (q, opts) {
      var ps = pushable()
      levi.searchStream(q, opts)
        .each(ps.push.bind(ps))
        .done(ps.end.bind(ps))
      return ps
    }

    require('./lib/sbot')(function (err, sbot) {
      if (err)
        throw UpstreamError(err)

      pull(
        sbot.createLogStream({ live: true, keys: true, values: true }),
        pull.drain(
          function (msg) {
            if (msg.sync)
              return
            levi.put(msg.key, msg.value, function (err) {
              if (err)
                throw PersistError(err)
            })
          },
          function (err) {
            if (err)
              throw UpstreamError(err)
          }
        )
      )
    })

    return {
      id                       : opts.keys.id,
      keys                     : opts.keys,
      usage                    : valid.sync(usage, 'string?|boolean?'),
      query                    : valid.source(query, 'string|object')
    }
  }
}

module.exports = SecretStack({
  appKey: require('./lib/disco-cap')
})
.use(SSB)

