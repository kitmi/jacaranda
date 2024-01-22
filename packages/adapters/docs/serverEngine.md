# Server engine adapter

## Adapter Interface

### Engine

- init_ - called by the framework to initialize the engine
- createModuleRouter - called by the framework to create a base router for web module
- mount - called by the server to mount a module engine

### Module Router

- createRouter - called by a router plugin 
- use - use a middleware
- attach - attach a router

### Router

- use - use a middleware
- get/post/put/delete

## Context Interface

- req - engine raw request (e.g. Node Request for koa, Hono Request for hono)
- res - engine raw response
- request
- response

## Implemented

- koa
- hono