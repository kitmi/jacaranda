"use strict";

require("source-map-support/register");

const {
  ValidationError,
  ReferencedNotExist
} = require('@genx/error');

const {
  Utils: {
    Lang
  }
} = require('@genx/data');

module.exports = Base => class extends Base {
  static async ensureGroup_(entityName, entityId, connOpts) {
    console.log(entityName, entityId);

    if (entityId) {
      const Entity = this.db.model(entityName);
      const entity = await Entity.findOne_({
        $query: {
          id: entityId
        },
        $association: ['resourceGroup']
      }, connOpts);

      if (!entity) {
        throw new ReferencedNotExist('Entity not found.', {
          entityName,
          entityId
        });
      }

      if (entity.resourceGroup) {
        if (!entity[':resourceGroup'].entityId) {
          return this.updateOne_({
            entityId
          }, {
            $query: {
              id: entity.resourceGroup
            },
            $retrieveUpdated: true
          }, connOpts);
        }

        return entity[':resourceGroup'];
      }
    }

    return this.create_({
      entityName,
      entityId
    }, {
      $retrieveCreated: true
    }, { ...connOpts,
      insertIgnore: true
    });
  }

};
//# sourceMappingURL=ResourceGroup.js.map