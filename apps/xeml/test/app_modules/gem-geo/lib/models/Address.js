"use strict";

require("source-map-support/register");

const {
  eachAsync_
} = require('@genx/july');

const OpenCC = require('opencc');

const twConverter = new OpenCC('s2t.json');

module.exports = Base => class extends Base {
  static async afterCreate_(context) {
    const addressId = context.return.id;
    const country = context.return.country != null ? context.return.country : 'TW';
    const States = await this.db.model('State');
    const data = await this.findOne_({
      $query: {
        id: addressId
      }
    }, context.connOptions);
    const inputs = { ...data
    };
    const addressFullTxt = data.fullText;
    const _query = {
      country
    };
    const states = await States.findAll_({
      $query: _query
    }, context.connOptions);

    if (addressFullTxt) {
      await eachAsync_(states, async state => {
        const keyAddressFullTxt = country === 'TW' ? await twConverter.convertPromise(addressFullTxt) : addressFullTxt;

        if (keyAddressFullTxt.startsWith(state.name) || keyAddressFullTxt.startsWith(state.shortName)) {
          inputs.stateCode = state.code;
          inputs.state = state.name;
          inputs.country = country;
        }
      });
    }

    await this.updateOne_({ ...inputs
    }, {
      $query: {
        id: addressId
      }
    }, context.connOptions);
  }

};
//# sourceMappingURL=Address.js.map