export const padLeft = (str, starting) => (starting ? starting + (str ?? '') : str);
export const padRight = (str, ending) => (ending ? (str ?? '') + ending : str);
