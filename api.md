# Disco

SSB Search Application.

## whois: source

Determine the user under the given name.

```bash
whois {query}
```

```js
whois(query)
```

Returns a stream of metadata.

- `query` string


## whatis: source

Determine the message or blob under the given query.

```bash
whatis {query}
```

```js
whatis(query)
```

Returns a stream of metadata.

- `query` string


## query: source

Run a general-purpose search query.

```bash
query {--query...}
```

```js
query(query, { fields:, gt:, gte:, lt:, lte:, values:, offset:, limit: })
```

See [https://github.com/cshum/levi].

```js
/* js only
- opts object, optional
  - fields object, scoring every fields by default. Set fields for controlling relevancy by
    - '*': true: * any fields, true is identical to 1
    - `field`: boost: number for multiplying scoring factor of a field.
  - `gt` (greater than), gte (greater than or equal) define the lower bound of key range to be searched.
  - `lt` (less than), lte (less than or equal) define the upper bound of key range to be searched.
  - `values` boolean, default true. Set to false to omit attaching document value for faster query performance.
  - `offset` number, offset results. Default 0.
  - `limit` number, limit number of results. Default infinity.
*/
```

## usage: sync

```bash
called using -h
```

```js
usage(cmd, cb)
```