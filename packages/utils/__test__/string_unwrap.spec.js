import unwrap from '../src/unwrap';

describe('unwrap', () => {
    it('should remove wrapping parentheses', () => {
        const input = "(hello)";
        const expected = "hello";
        const result = unwrap(input);
        expect(result).toEqual(expected);
    });

    it('should remove wrapping brackets', () => {
        const input = "[hello]";
        const expected = "hello";
        const result = unwrap(input);
        expect(result).toEqual(expected);
    });

    it('should remove wrapping curly braces', () => {
        const input = "{hello}";
        const expected = "hello";
        const result = unwrap(input);
        expect(result).toEqual(expected);
    });

    it('should return the same string if no wrapping elements', () => {
        const input = "hello";
        const expected = "hello";
        const result = unwrap(input);
        expect(result).toEqual(expected);
    });

    it('should remove wrapping elements with specified start and end tokens', () => {
        const input = "<hello>";
        const expected = "hello";
        const result = unwrap(input, '<', '>');
        expect(result).toEqual(expected);
    });

    it('should return orginal 1', () => {
        const input = "h";
        const expected = "h";
        const result = unwrap(input);
        expect(result).toEqual(expected);
    });

    it('should return orginal 2', () => {
        const input = null;
        
        const result = unwrap(input);
        expect(result == null).toEqual(true);
    });

    it('should use startToken when endToken is not set', () => {
        const input = "<tag>h<tag>";
        const expected = "h";
        const result = unwrap(input, "<tag>");
        expect(result).toEqual(expected);
    });
});
