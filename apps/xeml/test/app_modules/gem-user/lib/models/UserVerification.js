"use strict";

require("source-map-support/register");

const {
  ValidationError,
  InvalidArgument,
  BadRequest,
  Forbidden
} = require('@genx/error');

const {
  Processors,
  Validators,
  Generators,
  Types,
  Utils: {
    Lang
  }
} = require('@genx/data');

module.exports = Base => class extends Base {
  static async createEmailVerify_(name, user, email, payload, connOpts) {
    const code = Types.TEXT.generate({
      type: 'text',
      allowedChars: 'alphanumeric',
      fixedLength: 8
    });
    return this.create_({
      name,
      user,
      email,
      code,
      payload
    }, {
      $upsert: true
    }, connOpts);
  }

  static async createMobileVerify_(name, user, mobile, payload, connOpts) {
    const code = Generators.auto({
      type: 'text',
      allowedChars: 'numeric',
      fixedLength: 6
    });
    return this.create_({
      name,
      user,
      mobile,
      code,
      payload
    }, {
      $upsert: true
    }, connOpts);
  }

  static async queryVerification_(verifyId, fetchAll, connOpts) {
    const userVerify = await this.findOne_(verifyId, connOpts);

    if (!userVerify) {
      throw new ValidationError('Invalid verification id.', {
        name: 'verifyId'
      });
    }

    if (userVerify.isExpired) {
      throw new ValidationError('Verification expired.');
    }

    if (fetchAll) {
      return userVerify;
    }

    const result = {
      id: userVerify.id,
      name: userVerify.name
    };

    if (userVerify.email) {
      result.email = userVerify.email;
    } else {
      result.mobile = userVerify.mobile;
    }

    return result;
  }

  static async activate_(verifyId, code, password, connOpts) {
    const verifyInfo = await this.queryVerification_(verifyId, true, connOpts);

    if (verifyInfo.code !== code) {
      throw new ValidationError('Verification code expired!');
    }

    const User = this.db.model('User');
    return this.db.doTransaction_(async connOpts => {
      await this.updateOne_({
        isExpired: true
      }, verifyInfo.id, connOpts);
      return User.activate_(verifyInfo, password, connOpts);
    }, null, connOpts);
  }

};
//# sourceMappingURL=UserVerification.js.map