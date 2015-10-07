var pull       = require('pull-stream')
var pl         = require('pull-level')
var toPull     = require('stream-to-pull-stream')
var multicb    = require('multicb')
var mdm        = require('mdmanifest')
var pathlib    = require('path')
var fs         = require('fs')
var zerr       = require('zerr')
var levi       = require('levi')
var mlib       = require('ssb-msgs')
var valid      = require('./lib/validators')
var apidoc     = fs.readFileSync(pathlib.join(__dirname, 'api.md'), 'utf-8')
var manifest   = mdm.manifest(apidoc)

function isString (s) { return 'string' === typeof s }
function isObject (o) { return o && 'object' === typeof o }
var UsageError = zerr('Usage')
var UpstreamError = zerr('Upstream')
var PersistError = zerr('Persist')
var ScriptLoadError = zerr('ScriptLoad', 'Failed to load the script %')
var ViewNotFoundError = zerr('ViewNotFound', '% is not an active view')
var ViewAlreadyExistsError = zerr('ViewAlreadyExists', '% is already an active view')
var ViewScriptError = zerr('ViewScript', '% encountered an error while running')
var ViewIsActiveError = zerr('ViewIsActive', '% is already running')

exports.name = 'views'
exports.version = '1.0.0'
exports.manifest = manifest

exports.init = function (sbot, config) {

  var configScripts = (config.views && config.views.scripts || [])
  var computeInterval = config.views && config.views.interval || 30e3

  var viewsDir = pathlib.join(config.path, 'views')
  var activeViews = []
  var viewsDb = sbot.sublevel('views')
  var cursorsDb = sbot.sublevel('views_cursors')

  // load configured scripts
  var done = multicb()
  configScripts.forEach(function (v) { addView (v, undefined, done()) })
  done(function () {
    // periodic view run
    runAllViews()
    var computeTimer = setInterval(runAllViews, computeInterval)
    computeTimer.unref() // unreference the timer so that the program can close
  })


  function addView (view, pos, cb) {
    if (findView(view))
      throw new ViewAlreadyExistsError(view)

    // create view object
    var name = pathlib.basename(view, '.js')
    var newView = {
      name: name,
      path: pathlib.resolve(viewsDir, name+'.js'),
      isRunning: false,
      process: null,
      cursor: undefined,
      db: undefined,
      index: undefined
    }

    // attempt to load the script
    try { newView.process = require(newView.path) }
    catch (e) { throw new ScriptLoadError(e, newView.path) }

    // load view state
    cursorsDb.get(newView.name, function (err, cursor) {
      newView.cursor = cursor
      newView.db = viewsDb.sublevel(newView.name).sublevel('db')
      // newView.index  = levi(viewsDb.sublevel(newView.name).sublevel('index')) 
      //   .use(levi.tokenizer())
      //   .use(levi.stemmer())
      //   .use(levi.stopword())

      // run cb, if given
      cb && cb()
    })

    // add to listing
    if (!isNaN(pos)) activeViews.splice(pos, 0, newView)
    else             pos = (activeViews.push(newView) - 1)
    return pos
  }

  function removeView (view) {
    var name = pathlib.basename(view, '.js')
    var oldLen = activeViews.length

    // filter out the view
    activeViews = activeViews.filter(function (obj) {
      return obj.name !== name
    })

    // nothing removed? notify user
    if (oldLen === activeViews.length)
      throw new ViewNotFoundError(name)
  }

  function rebuildView (name, cb) {
    var view = findView(name)
    if (!view)
      return cb(new ViewNotFoundError(name))

    // clear cursor
    view.isRunning = true
    view.cursor = undefined
    cursorsDb.del(view.name, function (err) {
      if (err)
        return cb(new PersistError(err))

      // clear db
      pull(
        pl.read(view.db, { keys: true, values: false }),
        pull.paraMap(function (key, cb) {
          view.db.del(key, cb)
        }),
        pull.onEnd(function () {
          view.isRunning = false

          // run view
          runView(view, cb)
        })
      )
    })
  }

  function runAllViews () {
    var viewsTodo = activeViews.slice()
    doNext()
    function doNext () {
      var view = viewsTodo.shift()
      if (!view)
        return
      runView(view, function (err) {
        if (err)
          sbot.emit('log:warning', ['views', view.name, 'Errored while running: '+err, err])
        doNext()
      })
    }
  }

  function runView (name, cb) {
    var view = findView(name)
    if (!view)
      return cb(new ViewNotFoundError(name))

    if (view.isRunning)
      return cb(new ViewIsActiveError(name))

    // create the input structure
    var viewParam = {
      db: view.db,
      index: view.index,
      cursor: view.cursor,
      userId: sbot.id,
      get: viewsAPI.get,
      list: viewsAPI.list,
      search: viewsAPI.search,
      score: viewsAPI.score
    }

    // run the view's process method
    try {
      var startTs = Date.now()
      sbot.emit('log:info', ['views', view.name, 'Computing'])
      view.isRunning = true
      view.process(sbot, viewParam, function (err, cursor) {
        view.isRunning = false
        if (err)
          return cb(new ViewScriptError(e, view.name))
        sbot.emit('log:info', ['views', view.name, 'Compute finished in '+(Date.now() - startTs)+' ms'])

        // update cursor
        view.cursor = cursor
        if (!cursor) return cb()
        cursorsDb.put(view.name, cursor, function (err) {
          if (err)
            return cb(new PersistError(err))
          cb(null, true)
        })
      })
    }
    catch (e) { cb(new ViewScriptError(e, view.name)) }
  }

  // helper to lookup an active view by name
  function findView (view) {
    if (isObject(view)) return view
    var name = pathlib.basename(view, '.js')
    for (var i=0; i < activeViews.length; i++) {
      if (activeViews[i].name === name)
        return activeViews[i]
    }
  }

  var viewsAPI = {
    get: valid.async(function (name, key, cb) {
      var view = findView(name)
      if (!view) return cb(new ViewNotFoundError(name))
      view.db.get(key, cb)
    }, 'string', 'string'),

    list: valid.source(function (name, opts) {
      var view = findView(name)
      if (!view) return cb(new ViewNotFoundError(name))
      return pl.read(view.db, opts)
    }, 'string', 'object?'),

    search: valid.source(function (name, query, opts) {
      var view = findView(name)
      if (!view) return cb(new ViewNotFoundError(name))
      return toPull(view.index.searchStream(query, opts))
    }, 'string', 'string', 'object?'),

    score: valid.source(function (name, query, opts) {
      var view = findView(name)
      if (!view) return cb(new ViewNotFoundError(name))
      return toPull(view.index.scoreStream(query, opts))
    }, 'string', 'string', 'object?'),

    listViews: valid.sync(function () {
      return activeViews.map(function (view) {
        return {
          name: view.name,
          path: view.path,
          cursor: view.cursor
        }
      })
    }),

    enable: valid.sync(addView, 'string', 'number?'),
    disable: valid.sync(removeView, 'string'),
    rebuild: valid.async(rebuildView, 'string'),

    rebuildAll: valid.async(function (cb) {
      var done = multicb()
      activeViews.forEach(function (view) {
        rebuildView(view, done())
      })
      done(cb)
    })
  }
  return viewsAPI
}
