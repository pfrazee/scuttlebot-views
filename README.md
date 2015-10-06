# Scuttlebot Views

A materialized-views plugin for Scuttlebot 
It runs user-defined scripts (called "views") to process SSB logs and produce datasets.
The output datasets are stored and indexed, so other programs (or scripts) can read them.

*NOTE: search indexing is currently disabled while an issue with the `levi` dep is worked out.*

**What are Materialized Views?**

Materialized views are a concept from the [Kappa Architecture](http://www.kappa-architecture.com/).
They are the output of a log-processing function.
All views' outputs are stored in leveldb databases, meaning they are either KV structures or ordered lists.
The values are JSON documents.

**Example Views:**

 - [whois](./example-views/whois.js) - taken from https://github.com/pfraze/ssb-example-whois

**Example Usage:**

```bash
$ sbot views.addView ~/scuttlebot-views/example-views/whois
0

$ sbot views.get whois paul
[
  {
    "id": "@hxGxqPrplLjRG2vtjQL87abX4QKqeLgCwQpS730nNwE=.ed25519",
    "name": "paul",
    "trust": "high: self-assigned by you"
  }
]

$ sbot views.get whois bob
[
  {
    "id": "@HSZ7V+Hrm0mbqNGkINtN1CL8VEsY1CDMBu5yPCHg5zI=.ed25519",
    "name": "bob",
    "trust": "low: self-assigned by an unfollowed user"
  },
  {
    "id": "@PgeunKGJm05DZ0WWoRtGvH37gXMbDnVuse9HhaUT6RI=.ed25519",
    "name": "bob",
    "trust": "low: self-assigned by an unfollowed user"
  }
]

```

## Stability

Experimental: Expect the unexpected. Please provide feedback on api and your use-case.

## Setup in Scuttlebot

*This is a total hack right now -- Scuttlebot doesnt handle new plugins well yet.*

First, inside the scuttlebot directory, do:

```
npm install scuttlebot-views
```

Then make the following file changes in scuttlebot:

```diff
diff --git a/bin.js b/bin.js
index 6c67808..759510d 100755
--- a/bin.js
+++ b/bin.js
@@ -25,6 +25,7 @@ var createSbot   = require('./')
   .use(require('./plugins/local'))
   .use(require('./plugins/logging'))
   .use(require('./plugins/private'))
+  .use(require('scuttlebot-views'))
   //TODO fix plugins/local
 
 var keys = ssbKeys.loadOrCreateSync(path.join(config.path, 'secret'))
diff --git a/lib/apidocs.js b/lib/apidocs.js
index 99ebb32..b655579 100644
--- a/lib/apidocs.js
+++ b/lib/apidocs.js
@@ -8,5 +8,6 @@ module.exports = {
   gossip: fs.readFileSync(path.join(__dirname, '../plugins/gossip.md'), 'utf-8'),
   invite: fs.readFileSync(path.join(__dirname, '../plugins/invite.md'), 'utf-8'),
   'private': fs.readFileSync(path.join(__dirname, '../plugins/private.md'), 'utf-8'),
-  replicate: fs.readFileSync(path.join(__dirname, '../plugins/replicate.md'), 'utf-8')
+  replicate: fs.readFileSync(path.join(__dirname, '../plugins/replicate.md'), 'utf-8'),
+  views: fs.readFileSync(path.join(__dirname, '../node_modules/scuttlebot-views/api.md'), 'utf-8')
 }
```

Then, inside `~/.ssb/config`:

```js
{
  "views": {
    "interval": 30000, // how frequently run computation, in ms
    "scripts": [/* view scripts to run */]
  }
}
```

For instance:

```json
{
  "views": { "scripts": ["whois", "posts", "favorites", "flags"] }
}
```

Scripts are run in the order specified, so if one view depends on the other, put the dependended-upon script first.
Scripts are loaded from `~/.ssb/views` if just a name is given, otherwise they are loaded from the given path.

## Comandline / RPC interface

Every view-script produces a database (for lookup) and an index (for search).
The plugin exposes both with the following CLI/RPC methods:

 - `get(view, key, cb)` looks up an entry in the db
 - `list(view, [opts])` streams entries from the db. Supports the leveldb [createReadStream](https://github.com/level/levelup#createReadStream) opts.
 - `search(view, q, [opts])` streams query results from the index. Supports the levi [searchStream](https://github.com/cshum/levi#searchstreamquery-options) opts.
 - `score(view, q, [opts])` streams query scores from the index. Supports the levi [scoreStream](https://github.com/cshum/levi#scorestreamquery-options) opts.
 - `listViews(cb)` fetches the list of active views
 - `addView(view, pos, cb)` add a view to the active list. `pos` is an optional position in the list of active views (defaults to the end).
 - `removeView(view, cb)` remove a view from the active list
 - `rebuild(...views, cb)` clear the view's db and index, and rerun the view-script from 0. Can accept any arbitrary number of view params
 - `rebuildAll(cb)` clear all view dbs and indexes and rerun the view-scripts from 0.

You can access these APIs via RPC or CLI.
From bash:

```
sbot views.get whois bob
sbot views.list whois
sbot views.search whois "bob rob robert"
sbot views.score whois "bob rob robert"
```

## Scripting Model

Scripts are executed periodically to update their data-views.
Typically they make incremental updates to the stored data, reading recently-added messages.
However the user can ask to clear the stored data and recompute from the top.

The scripts callback the cursor of the last message they process.
This is stored, and passed to the script on the next invocation, to drive incremental updates.
It will be `undefined` on a rebuild run.

Scripts are defined as node-modules that export, at the toplevel, a function:

```js
module.exports = function (sbot, view, cb) {
  // ...
  // when done: cb(err, cursor)
})
```

The parameters are as follows:

 - `sbot` an RPC reference to the [Scuttlebot](https://github.com/ssbc/scuttlebot) server.
 - `view` a set of APIs for manipulating the data-view:
   - `.db` a [leveldb](https://github.com/level/levelup) instance (technically a [sublevel](https://github.com/dominictarr/level-sublevel)) for storing the dataview
   - `.index` a [levi](https://github.com/cshum/levi) instance for storing search documents
   - `.cursor` the cursor last provided by this script, will be `undefined` on first run or on a rebuild run
   - `.userId` the id of the local user
   - The plugin's API is also available (get, list, search, and score) to access other views.
 - `cb` the callback, should either be called with an error or the cursor to pass on the next incremental execution

The recommended structure of a script is as follows:

```js
var pull = require('pull-stream')

module.exports = function (sbot, view, cb) {
  var last
  pull(
    sbot.createLogStream({ gt: view.cursor }),
    pull.asyncMap(function (msg, cb2) {
      last = msg
      // do all processing on the message ...
      cb2()
    }),
    pull.drain(null, function () {
      // if no errors:
      cb(null, last && last.timestamp)
    })
  )  
}
```

The important part is using `asyncMap`, as this will apply backpressure and ensure you process each message before moving to the next one.

## Data View Storage

Every view is given a leveldb instance (technically, a sublevel) to store its data.
The plugin's interface exposes this db for reading.
The view can create sublevels of its db, to store internal datastructures (they will not be readable from the outside).

## Data View Indexing

Every view is given a [levi](https://github.com/cshum/levi) instance to do Term-Frequency Inverse-Document-Frequency relevance indexing.
The plugin's interface exposes this index for querying.

The output of the search-index is only scored by term-relevance.
It's up to other applications to apply more advanced scoring.
