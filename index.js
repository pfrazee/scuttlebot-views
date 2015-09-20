var SecretStack = require('secret-stack')
var pull       = require('pull-stream')
var defer      = require('pull-defer')
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
var mlib       = require('ssb-msgs')
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
    anonymous: {allow: ['query', 'usage', 'whois', 'whatis'], deny: null}
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

    function whois (q, opts) {
      var referencesById = {}
      var d = defer.source()
      pull(
        query({ name: q }, { name: true }),
        pull.drain(function (msg) {
          mlib.indexLinks(msg.value.content, { feed: true }, function (link, rel) {
            // link.msg = msg
            link.rel = rel
            link.author = msg.value.author
            link.name = link.name || msg.value.content.name || ''
            referencesById[link.link] = referencesById[link.link] || []
            referencesById[link.link].push(link)
          })
        }, function (err) {
          if (err)
            return d.abort(err)

          var map =pull.map(function (hit) {
            if (!(opts && (opts.p || opts.pretty)))
              return hit

            return pull.values([
              hit.id,
              hit.refs.map(function (ref) {
                if (ref.name)
                  return ref.author + ' ' + ref.rel + ' ' + ref.name
                return JSON.stringify(ref)
              })
            ])
          })

          var results = Object.keys(referencesById).map(function (id) {
            referencesById[id].sort(function (b, a) {
              return b.author.localeCompare(a.author)
            })
            return { id: id, refs: referencesById[id] } 
          })
          results.sort(function (a, b) {
            return b.refs.len - a.refs.length
          })
          d.resolve(pull(pull.values(results), map, pull.flatten()))
        })
      )
      return d
    }

    function whatis (q, opts) {
      // :TODO:
      return p.error(new Error('not yet implemented'))
      /*var referencesById = {}
      var d = defer.source()
      pull(
        query(q),
        pull.take(1000),
        pull.drain(function (msg) {
          mlib.indexLinks(msg.value, { blob: true }, function (link) {
            link.msg = msg
            referencesById[link.link] = referencesById[link.link] || []
            referencesById[link.link].push(link)
          })
          mlib.indexLinks(msg.value, { msg: true }, function (link) {
            link.msg = msg
            referencesById[link.link] = referencesById[link.link] || []
            referencesById[link.link].push(link)
          })
        }, function (err) {
          if (err)
            return d.abort(err)
          var results = Object.keys(referencesById).map(function (id) {
            return { id: id, refs: referencesById[id] } 
          })
          results.sort(function (a, b) {
            return b.refs.len - a.refs.length
          })
          d.resolve(pull.values(results))
        })
      )
      return d*/
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
      query                    : valid.source(query, 'string|object'),
      whois                    : valid.source(whois, 'string', 'object?'),
      whatis                   : valid.source(whatis, 'string', 'object?')
    }
  }
}

module.exports = SecretStack({
  appKey: require('./lib/disco-cap')
})
.use(SSB)

