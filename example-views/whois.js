/**
 * Example Whois View
 * taken from https://github.com/pfraze/ssb-example-whois
 */

var pull = require('pull-stream')
var mlib = require('ssb-msgs')
var multicb = require('multicb')

module.exports = function (sbot, view, cb) {
  var assignmentsDb = view.db.sublevel('assigns')

  sbot.friends.all('follow', function (err, follows) {
    if (err) return cb(err)

    var last
    pull(
      sbot.messagesByType((view.cursor) ? { type: 'about', gt: view.cursor } : 'about'),
      pull.asyncMap(function (msg, cb2) {
        last = msg
        console.log('whois processing', msg.key)

        // expected schema: { type: 'about', name: String, about: FeedLink }
        var c = msg.value.content

        // sanity check
        if (!nonEmptyStr(c.name))
          return cb2()

        // only process self-assignments
        var target = mlib.link(c.about, 'feed')
        if (!target || target.link !== msg.value.author)
          return cb2()

        // remove the last assignment by this user
        assignmentsDb.get(target.link, function (err, name) {
          if (!name) return next()

          view.db.get(name, function (err, nameEntries) {
            if (!nameEntries) return next()

            nameEntries = nameEntries.filter(function (entry) { return entry.id !== target.link })
            view.db.put(name, nameEntries, next)
          })
        })

        function next () {
          // store the new assignment
          var name = makeNameSafe(c.name)
          view.db.get(name, function (err, entries) {
            entries = entries || []
            entries.push({
              id:    target.link,
              name:  name,
              trust: rateTrust(msg, view.userId, follows)
            })
            view.db.put(name, entries, function (err) {
              if (err) throw err
              assignmentsDb.put(target.link, name, cb2)
            })
          })
        }
      }),
      pull.drain(null, function (err) {
        if (err) throw err
        cb(null, last && last.ts)
      })
    )
  })
}

// trust-policy
function rateTrust (msg, selfId, follows) {
  // is local user: high trust
  if (msg.value.author === selfId)
    return 3
  // followed by local user: medium trust
  if (follows[selfId][msg.value.author])
    return 2
  // otherwise: low trust
  return 1
}

function nonEmptyStr (str) {
  return (typeof str === 'string' && !!(''+str).trim())
}

// allow A-z0-9._-, dont allow a trailing .
var badNameCharsRegex = /[^A-z0-9\._-]/g
function makeNameSafe (str) {
  str = str.replace(badNameCharsRegex, '_')
  if (str.charAt(str.length - 1) == '.')
    str = str.slice(0, -1) + '_'
  return str
}