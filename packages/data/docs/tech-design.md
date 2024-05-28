# Jacarana Data Access Model 

## Overview

This document outlines the design of the Jacarana Data Access Model for node-js backend system, focusing on the interaction between connectors, entity models, and database models. The architecture ensures a clean, extensible, and maintainable codebase, leveraging modern JavaScript features like async/await and Proxies.

## Base Components

1. **Connector**: Manages database connections and connection pools.
2. **EntityModel**: Base class for ORM entities, encapsulates data through a proxy.
3. **DbModel**: Base class for database interactions, managing connections and transactions.

Specific database features can be implemented in subclasses inheritting from the above base components.

E.g. 

- **PostgresConnector**: leverages `pg` package to manage connnection and connection pool to PostgresQL database.
- **PostgresEntityModel**: supports some special query syntax of postgres, e.g. `ANY`, `ALL`
- **PostgresDbModel**: supports multiple schema inside a database.

## Connector 

The `Connector` class is responsible for managing connections to the database.

### Interface

```javascript
class Connector {  
  async connect_(); // Get a connection from the pool or create a new one, depending on the driver
  async disconnect_(); // Release the connection back to the pool or close it
  async end_(); // Close all connections in the pool
  async ping_(); // Ping the database
  async execute_(); // Execute a query
  async beginTransaction_(); // Begin a transaction
  async commit_(); // Commit a transaction
  async rollback_(); // Rollback a transaction
}
```

## EntityModel 

The `EntityModel` class serves as a base class for data entities with static `meta` providing metadata. `EntityModel` instance itself does not save any data since js always handle data in the form of JSON and its not necessary to implement a ActiveRecord-like class.

### Interface

```javascript
class EntityModel {
  async findOne_(criteria) // Implement find one logic
  async findMany_(criteria) // Implement find many logic
  async findAll_() // Implement find all logic
  async createOne_(data) // Implement create one logic
  async createMany_(dataArray) // Implement create many logic
  async updateOne_(criteria, data) // Implement update one logic
  async deleteOne_(criteria) // Implement delete one logic
}
```

## DbModel 

The `DbModel` class manages the lifecycle of a connection created from connector and all `EntityModel` instances are created from `DbModel`. `DbModel` uses Proxy to delegate pascal-case getter to `entity(getterName)` method.

### Interface

```javascript
class DbModel {     
  static meta;
  entity(name) {
    if (!this._cache[name]) {
        this._cache[name] = new meta.Entities[name](this);
    }
    return this._cache[name];
  }
  async transaction_(<async funciton>(anotherDbInstance));
}
```

## Usage

- A default DbModel instance `db` can be retrieved from the Jacaranda App instance.
```javascript
const db = app.db('db name');
```

- For a normal query
```javascript
const User = db.entity('User');
const user = await User.findOne_({ id: 1837 });
```

- Transaction Management
```javascript
async function performTransaction() {
  await db.transaction_(async (dbx) => {
    const user = await dbx.User.findOne_({ id: 1039 });
    await dbx.UserProfile.updateOne_({ $set: { avatar: 'xxx' }, $where: { ref: user.ref } });
  });
}
```

# Summary

This architecture provides a robust and flexible foundation for database access and management, supporting multiple database types and schemas, and enabling seamless integration of data operations with transaction management. The use of async interfaces and proxies ensures modern, efficient, and maintainable code.