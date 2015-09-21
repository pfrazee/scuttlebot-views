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

    function searchByField (field, q, linkOpts, formatOpts) {
      var referencesById = {}
      var d = defer.source()
      var qObj = {}, qOpts = {}

      // query the search index by the field
      qObj[field]  = q
      qOpts[field] = true
      pull(
        query(qObj, qOpts),
        pull.drain(function (msg) {
          // collect all of the links in the matching messages
          mlib.indexLinks(msg.value.content, linkOpts, function (link, rel) {
            link.rel = rel
            link.author = msg.value.author
            link[field] = link[field] || msg.value.content[field] || ''
            referencesById[link.link] = referencesById[link.link] || []
            referencesById[link.link].push(link)
          })
        }, function (err) {
          if (err)
            return d.abort(err)

          // pretty-print mapper
          var map = pull.map(function (hit) {
            // pass-through if no pretty print
            if (!(formatOpts && (formatOpts.p || formatOpts.pretty)))
              return hit

            // construct nice renderings of each reference
            return pull.values([
              hit.id,
              hit.refs.map(function (ref) {
                if (ref[field])
                  // "author rel $field"
                  return ref.author + ' ' + ref.rel + ' ' + ref[field]
                return ref
              })
            ])
          })

          // results = all of the links in matching messages
          var results = Object.keys(referencesById).map(function (id) {
            // group each hits' links by author
            referencesById[id].sort(function (b, a) {
              return b.author.localeCompare(a.author)
            })
            return { id: id, refs: referencesById[id] } 
          })
          // sort the results by the number of inbounds
          // :TODO: weight inbounds by trust in their authors
          results.sort(function (a, b) {
            return b.refs.len - a.refs.length
          })
          d.resolve(pull(pull.values(results), map, pull.flatten()))
        })
      )
      return d
    }

    function whois (q, opts) {
      return searchByField('name', q, { feed: true }, opts)
    }

    function whatis (q, opts) {
      return searchByField('path', q, { blob: true }, opts)
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

