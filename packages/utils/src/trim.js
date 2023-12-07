export const trimLeft = (str, char = ' ') => {
    let l = str.length;
    let i = 0;
    for (; i < l; i++) {
        if (str[i] !== char) break;
    }

    return i > 0 ? str.substring(i) : str;
};

export const trimRight = (str, char = ' ') => {
    let l = str.length - 1;
    let i = l;
    for (; i > 0; i--) {
        if (str[i] !== char) break;
    }

    return i < l ? str.substring(0, i + 1) : str;
};

export const trim = (str, char = ' ') => {
    return trimRight(trimLeft(str, char), char);
};
