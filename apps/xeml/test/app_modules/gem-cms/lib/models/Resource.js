"use strict";

require("source-map-support/register");

const {
  ValidationError,
  ApplicationError
} = require('@genx/error');

const {
  Utils: {
    Lang
  }
} = require('@genx/data');

const mime = require('mime');

module.exports = Base => {
  var _class;

  return _class = class extends Base {
    static getMimeTypeByName(fileName) {
      if (!fileName) {
        throw new ApplicationError('Invalid file name.');
      }

      const posLastQ = fileName.lastIndexOf('?');

      if (posLastQ !== -1) {
        fileName = fileName.substring(0, posLastQ);
      }

      const posLastDot = fileName.lastIndexOf('.');
      const ext = fileName.substring(posLastDot + 1);

      if (ext.length > 5) {
        throw new ValidationError('The file name does contain an extension.');
      }

      return mime.getType(ext);
    }

    static async addResourceToGroup_(input, variables, connOpts) {
      if (!input.group) {
        throw new ValidationError('"group" is required.');
      }

      return this.db.safeRetry_('Resource.addResourceToGroup_', async connOpts => {
        let [{
          max
        }] = await this.findAll_({
          $query: {
            group: input.group,
            category: input.category
          },
          $projection: [{
            type: 'function',
            name: 'MAX',
            alias: 'max',
            args: ['indexOrder']
          }]
        }, connOpts);
        max++;
        input.indexOrder = max;
        const ret = await this.create_(input, {
          $retrieveCreated: true
        }, connOpts);
        return ret;
      }, connOpts);
    }

  }, _class.UNCATEGORIZED = 'uncategorized', _class;
};
//# sourceMappingURL=Resource.js.map