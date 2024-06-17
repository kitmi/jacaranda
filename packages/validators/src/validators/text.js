import isAlpha from 'validator/lib/isAlpha';
import isAlphanumeric from 'validator/lib/isAlphanumeric';
import isAscii from 'validator/lib/isAscii';
import isBase64 from 'validator/lib/isBase64';
import isByteLength from 'validator/lib/isByteLength';
import isDataURI from 'validator/lib/isDataURI';
import isDate from 'validator/lib/isDate';
import isDecimal from 'validator/lib/isDecimal';
import isEmail from 'validator/lib/isEmail';
import isFQDN from 'validator/lib/isFQDN';
import isHexadecimal from 'validator/lib/isHexadecimal';
import isHexColor from 'validator/lib/isHexColor';
import isIP from 'validator/lib/isIP';
import isLength from 'validator/lib/isLength';
import isLowercase from 'validator/lib/isLowercase';
import isMACAddress from 'validator/lib/isMACAddress';
import isMimeType from 'validator/lib/isMimeType';
import isMobilePhone from 'validator/lib/isMobilePhone';
import isNumeric from 'validator/lib/isNumeric';
import isStrongPassword from 'validator/lib/isStrongPassword';
import isTime from 'validator/lib/isTime';
import isUpperCase from 'validator/lib/isUppercase';
import isURL from 'validator/lib/isURL';
import isUUID from 'validator/lib/isUUID';

import makeValidator from '../makeValidator';

const semanticText = {
    alpha: makeValidator(isAlpha, 'The value is not a valid alpha string.'),
    alphanumeric: makeValidator(isAlphanumeric, 'The value is not a valid alphanumeric string.'),
    ascii: makeValidator(isAscii, 'The value is not a valid ascii string.'),
    base64: makeValidator(isBase64, 'The value is not a valid base64 string.'),
    bytesInRange: makeValidator(isByteLength, 'The byte length of the value does not falls in a valid range.'),
    dataURI: makeValidator(isDataURI, 'The value is not a valid data URI.'),
    date: makeValidator(isDate, 'The value is not a valid date string.'),
    decimal: makeValidator(isDecimal, 'The value is not a valid decimal string.'),
    email: makeValidator(isEmail, 'The value is not a valid email.'),
    domain: makeValidator(isFQDN, 'The value is not a valid domain.'),
    hex: makeValidator(isHexadecimal, 'The value is not a valid hex string.'),
    hexColor: makeValidator(isHexColor, 'The value is not a valid hex color.'),
    ip: makeValidator(isIP, 'The value is not a valid IP address.'),
    inRange: makeValidator(isLength, 'The length of the value does not falls in a valid range.'),
    lowercase: makeValidator(isLowercase, 'The value is not a lowercase string.'),
    macAddress: makeValidator(isMACAddress, 'The value is not a valid MAC address.'),
    mimeType: makeValidator(isMimeType, 'The value is not a valid MIME type.'),
    mobilePhone: makeValidator(isMobilePhone, 'The value is not a valid mobile phone number.'),
    numeric: makeValidator(isNumeric, 'The value is not a valid numeric string.'),
    strongPassword: makeValidator(isStrongPassword, 'The value is not a strong password.'),
    time: makeValidator(isTime, 'The value is not a valid time string.'),
    uppercase: makeValidator(isUpperCase, 'The value is not an uppercase string.'),
    url: makeValidator(isURL, 'The value is not a valid URL.'),
    uuid: makeValidator(isUUID, 'The value is not a valid UUID.'),
    matches: makeValidator(
        (value, pattern) => (pattern instanceof RegExp ? pattern : new RegExp(pattern)).test(value),
        'The value does not match the pattern.'
    ),
};

semanticText['alphanum'] = semanticText['alphanumeric'];
semanticText['mobile'] = semanticText['mobilePhone'];
semanticText['num'] = semanticText['numeric'];
semanticText['mime'] = semanticText['mimeType'];
semanticText['number'] = semanticText['decimal'];

export default semanticText;
