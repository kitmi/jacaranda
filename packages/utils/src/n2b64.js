// this is not standard base64 encoding, it's a custom encoding that uses a url-friendly alphabet
// for standard base64 encoding, use base64Encode and base64Decode 
const alphabet = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';

// binary to string lookup table
const b2s = alphabet.split('');

// string to binary lookup table
// 123 == 'z'.charCodeAt(0) + 1
const s2b = new Array(123);
for (let i = 0; i < alphabet.length; i++) {
  s2b[alphabet.charCodeAt(i)] = i;
}

// number to base64
export const ntob64 = (number) => {
  if (number < 0) return `-${ntob64(-number)}`;

  let lo = number >>> 0;
  let hi = (number / 4294967296) >>> 0;

  let right = '';
  while (hi > 0) {
    right = b2s[0x3f & lo] + right;
    lo >>>= 6;
    lo |= (0x3f & hi) << 26;
    hi >>>= 6;
  }

  let left = '';
  do {
    left = b2s[0x3f & lo] + left;
    lo >>>= 6;
  } while (lo > 0);

  return left + right;
};

// base64 to number
export const b64ton = (base64) => {
  let number = 0;
  const sign = base64.charAt(0) === '-' ? 1 : 0;

  for (let i = sign; i < base64.length; i++) {
    number = number * 64 + s2b[base64.charCodeAt(i)];
  }

  return sign ? -number : number;
};
