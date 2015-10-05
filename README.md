# disco

Disco is a data-structure server built on Secure Scuttlebutt logs.
It's a tool to compute, store, and search for information.

Disco runs user-defined scripts (called "views") to process SSB logs and export data structures.
The output structures are stored and indexed for search, so other programs (or scripts) can use them.

## Stability

Experimental: Expect the unexpected. Please provide feedback on api and your use-case.

## View Config

Disco's server command is followed by a list of views to run:

```
disco server [views...]
```

For instance:

```
disco server whois posts favorites flags community-moderation
```

Views are run in the order specified, so if one view depends on the other, put the dependended-upon script first.
Scripts are loaded from `./views`.

## Comandline / RPC interface

Every view-script produces a database (for lookup) and an index (for search).
Disco exposes both with the following CLI/RPC methods:

 - `get(view, key, cb)` looks up an entry in the db
 - `list(view, [opts])` streams entries from the db. Supports the leveldb [createReadStream](https://github.com/level/levelup#createReadStream) opts.
 - `search(view, q, [opts])` streams query results from the index. Supports the levi [searchStream](https://github.com/cshum/levi#searchstreamquery-options) opts.
 - `score(view, q, [opts])` streams query scores from the index. Supports the levi [scoreStream](https://github.com/cshum/levi#scorestreamquery-options) opts.

You can access these APIs via RPC or CLI.
From bash:

```
disco get whois bob
disco list whois
disco search whois "bob rob robert"
disco score whois "bob rob robert"
```

## Scripting Model

Scripts are executed periodically to update their data-structures.
Typically they make incremental updates to the stored data, reading recently-added messages.
However the user can ask to clear the stored data and recompute from the top.

The scripts callback the cursor of the last message they process.
This is stored, and passed to the script on the next invocation, to drive incremental updates.
It will be `undefined` on a rebuild run.

Scripts are defined as node-modules that export, at the toplevel, a function:

```js
module.exports = function (sbot, disco, opts, cb) {
  // ...
  // when done: cb(err, cursor)
})
```

The parameters are as follows:

 - `sbot` an RPC reference to the [Scuttlebot](https://github.com/ssbc/scuttlebot) server.
 - `disco` a set of APIs for manipulating the data-structure:
   - `.db` a [leveldb](https://github.com/level/levelup) instance (technically a [sublevel](https://github.com/dominictarr/level-sublevel)) for storing the datastructure
   - `.index` a [levi](https://github.com/cshum/levi) instance for storing search documents
   - Disco's standard API is also available (get, list, search, and score) to access other data-structures.
 - `opts`
   - `.cursor` the cursor last provided by this script, will be `undefined` on first run or on a rebuild run
   - `.userid` the id of the local user
 - `cb` the callback, should either be called with an error or the cursor to pass on the next incremental execution

The recommended structure of a script is as follows:

```js
var pull = require('pull-stream')

module.exports = function (sbot, disco, opts, cb) {
  var last
  pull(
    sbot.createLogStream({ gt: opts.cursor }),
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

## Data Structure Storage

Every view is given a leveldb instance (technically, a sublevel) to store its data.
Disco's interface exposes this db for reading.
The view can create sublevels of its db, to store internal datastructures (they will not be readable from the outside).

Using leveldb forces the views' output structures into a KV structure.
This is an acceptible limitation for now.

## Data Structure Indexing

Every view is given a [levi](https://github.com/cshum/levi) instance to do Term-Frequency Inverse-Document-Frequency relevance indexing.
Disco's interface exposes this index for querying.

The output of the search-index is only scored by term-relevance.
It's up to other applications to apply more advanced scoring.
