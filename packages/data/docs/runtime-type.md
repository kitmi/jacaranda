# Runtime types

Runtime type object is some special plain object with a `$xr` key to specify its type. 

Then, entity models will translate these kinds of objects into the correct representation in the way that the back-end dbms should handle.
    
```js
{
    $xr: <Runtime Type>,
    ...properties    
}
```

## Column

Refers to a table column, can be used in `$select` and arguments of a function.

- Properties

```js
{ name }
```
 
 ## Function

 Can be used in `$select`, `$where`, `$having`.

 - Properties
 
```js
{ name, args, [alias] }
```

## Condition

JSON-style condition.

- Properties

```js
{ expr }
```

## Raw 

Directly pass `value` into SQL, no escaping, should be used carefully to avoid SQL injection attack. To be deprecate in next version.

- Properties

```js
{ value }
```

## Query 

- Properties
  
```js
{ query }
```

## BinExpr 

Normally used in conditions like where and joining on clause, as well as some calculation as arguments of function.

- Properties

```js
{ left, op, right }
```

## DataSet

- Properties

{ model, query }

```js
{ left, op, right }
```

## Request

Refers to the `{ request: ctx.request, header: ctx.header, session: ctx.session, state: ctx.state }` object of `koa` like HttpRequest.

## Symbol

## Data

Refers to the db operation context object.
