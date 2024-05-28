# Entity Model Generation

## flow

1. Load entities by linker

    * inherit from base entity if any
        * features
        * fields
        * key
        * index
    * initialize features
    * add fields        
    * add key
    * add inex
    * api

2. Building relationship by database modeler


## fields modifiers

1. field -> latest.field
2. if has modifiers, convert it to PipedValue

## compile context

moduleName - The ool module name of the object to compile.
logger
variables

1. let compileContext = {
        targetName,        
        logger,
        topoNodes: new Set(),
        topoSort: new TopoSort(),
        astMap: {}, // Store the AST for a node
        mapOfTokenToMeta: new Map(), // Store the source code block point
        modelVars: new Set(),
        mapOfFunctorToFile: (sharedContext && sharedContext.mapOfFunctorToFile) || {}, // Use to record import lines
        newFunctorFiles: (sharedContext && sharedContext.newFunctorFiles) || []
    };

## oolong config

oolong.schemaDeployment is a map of schemaName to modelSettings which will be merged with dataSource config when passed into modeler api.

    modelSettings = { 
        dataSource /* schemaDeployment.dataSource */, 
        connectionString /* dataSource.<driver>.<name>.connection */, 
        options /* other members under dataSource.<driver>.<name> */, 
        ...others /* other members under schemaDeployment */
    };

    
