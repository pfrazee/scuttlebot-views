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