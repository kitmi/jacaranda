# Connector

A connector is used to connect a data source, which can be but not limited to database, file and object storage.

* A connector contains methods to create and destroy connections.
* A connector does not store the connection object in its internal state. 

## members

* driver - Connector driver, e.g. mysql, mongodb, ...
* name - Connector name, which may not be the same as database name.
* connectionString - URL style connection string.
* options - Extra connector options. 

## execution options

* createDatabase

## transaction options

* isolationLevel

## query operators



