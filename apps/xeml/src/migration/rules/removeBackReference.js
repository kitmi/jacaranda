const { _ } = require('@genx/july');

function applyRule(db, Entity, entity) {
    //remove back reference

    const associations = Entity.meta.associations;
    associations && _.forOwn(associations, (assoc, anchor) => {
        const key = ':' + anchor;

        const subEntity = entity[key];
        if (subEntity) {
            if (assoc.list) {
                //array of objects
                const SubEntity = db.model(assoc.entity);
                subEntity.forEach(item => { 
                    delete item[assoc.field];
                    applyRule(db, SubEntity, item); 
                });
            } 
        } 
    });
};

module.exports = applyRule;