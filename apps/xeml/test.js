const DEDENT_STOPPER = new Map([      
    [ 'entity', 1 ],                                  
    [ 'entity.with', 1 ],
    [ 'entity.has', 1 ],               
    [ 'entity.data', 1 ], 
    [ 'entity.index', 1 ],           
    [ 'entity.input.inputSet', 2 ],
    [ 'entity.input.inputSet.item', 1 ],                  
    [ 'entity.views.dataSet', 2 ],
    [ 'entity.views.dataSet.item', 1 ],                  
    [ 'entity.associations', 1 ],
    [ 'entity.associations.item', 2 ],
    [ 'entity.associations.item.block.when', 2 ],  
    [ 'entity.views.dataSet.item.select', 2 ],
    [ 'entity.views.dataSet.item.select.item', 1 ],
    [ 'entity.views.dataSet.item.groupBy', 2 ],
    [ 'entity.views.dataSet.item.groupBy.item', 1 ],
    [ 'entity.views.dataSet.item.orderBy', 2 ],
    [ 'entity.views.dataSet.item.orderBy.item', 1 ],
    [ 'entity.views.dataSet.item.options', 2 ],
    [ 'entity.views.dataSet.item.options.item', 1 ],        
]);

console.log(DEDENT_STOPPER.size);