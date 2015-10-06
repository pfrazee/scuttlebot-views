/**
 * Example Whois View
 * taken from https://github.com/pfraze/ssb-example-whois
 */

var pull = require('pull-stream')
var mlib = require('ssb-msgs')
var multicb = require('multicb')

module.exports = function (sbot, view, cb) {
  var assignmentsDb = view.db.sublevel('assigns') // internal db, feedId->name assignments

  sbot.friends.all('follow', function (err, follows) {
    if (err) return cb(err)

    var last
    pull(
      // fetch type: about msgs
      sbot.messagesByType((view.cursor) ? { type: 'about', gt: view.cursor } : 'about'),
      pull.asyncMap(function (msg, cb2) {
        last = msg
        console.log('whois processing', msg.key)

        // expected schema: { type: 'about', name: String, about: FeedLink }
        var c = msg.value.content
        if (!nonEmptyStr(c.name))
          return cb2()

        // only process self-assignments
        var target = mlib.link(c.about, 'feed')
        if (!target || target.link !== msg.value.author)
          return cb2()

        // remove the last assignment by this user
        removeOldAssignment(target.link, function () {
          // store the new assignment
          var done = multicb()
          var name = makeNameSafe(c.name)
          assignmentsDb.put(target.link, name, done())
          addNameEntry(name, {
            id:    target.link,
            name:  name,
            trust: rateTrust(msg, view.userId, follows)
          }, done())
          done(cb2)          
        })
      }),
      pull.drain(null, function (err) {
        if (err) throw err
        cb(null, last && last.ts)
      })
    )

    function addNameEntry (name, entry, cb) {
      // pull current state
      view.db.get(name, function (err, entries) {
        entries = entries || []
        entries.push(entry)
        // write new state
        view.db.put(name, entries, cb)
      })
    }

    function removeOldAssignment (feedId, cb) {
      // look up current name
      assignmentsDb.get(feedId, function (err, name) {
        if (!name) return cb()

        // get the name's entries
        view.db.get(name, function (err, entries) {
          if (!entries) return cb()

          // filter out the old assignment
          entries = entries.filter(function (entry) { return entry.id !== feedId })
          view.db.put(name, entries, cb)
        })
      })
    }
  })
}

// trust-policy
function rateTrust (msg, selfId, follows) {
  if (msg.value.author === selfId)
    return 'high: self-assigned by you'
  if (follows[selfId][msg.value.author])
    return 'medium: self-assigned by a followed user'
  return 'low: self-assigned by an unfollowed user'
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