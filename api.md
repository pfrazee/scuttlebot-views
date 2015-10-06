# Scuttlebot Views

A materialized-views plugin for Scuttlebot.


## get: async

Gets an entry from the view's db

```bash
get {view} {key}
```
```js
get(view, key, cb)
```

- `view` string
- `key` string


## list: source

Streams entries from the view's db

```bash
list {view} [opts...]
```
```js
list(view, opts)
```

- `view` string
- `opts` Supports the leveldb [createReadStream](https://github.com/level/levelup#createReadStream) opts.


## search: source

Streams query results from the index.

```bash
search {view} {query} [opts...]
```
```js
search(view, query, opts)
```

- `view` string
- `query` string
- `opts` Supports the levi [searchStream](https://github.com/cshum/levi#searchstreamquery-options) opts.


## score: source

Streams query scores from the index.

```bash
score {view} {query} [opts...]
```
```js
score(view, query, opts)
```

- `view` string
- `query` string
- `opts` Supports the levi [searchStream](https://github.com/cshum/levi#searchstreamquery-options) opts.


## listViews: sync

Fetches the list of active views

```bash
listViews
```
```js
listViews(cb)
```


## addView: sync

Add a view to the active list.

```bash
addView {view} [post]
```
```js
addView(view, pos, cb)
````

 - `view` string
 - `pos` an optional position in the list of active views (defaults to the end)


## removeView: sync

Remove a view from the active list.

```bash
removeView {view}
```
```js
removeView(view, cb)
```

 - `view` string


## rebuild: async

Clear the view's db and index, and rerun the view-script from 0.

```bash
rebuild {..views}
```
```js
rebuild(...views, cb)` 
```

 - `views` strings


## rebuildAll: async

Clear all view dbs and indexes and rerun the view-scripts from 0.

```bash
rebuildAll
```
```js
rebuildAll(cb)
```