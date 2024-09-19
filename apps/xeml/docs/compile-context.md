## sharedContext

- mapOfFunctorToFile: Map of functorId to function source JS file or function source object
- newFunctorFiles

## compileContext
- linker
- moduleName: Entity model name
- xemlModule
- modelVars
- mainStartId
- astMap: Map of topo Id to ast block
- topoSort
- mapOfTokenToMeta
- mapOfFunctorToFile: see sharedContext.mapOfFunctorToFile
- newFunctorFiles
- variables
- topoNodes: Set of topo Id

## functor

- $xt: Acticator | Processor | Valiator 
- functorId: local function name