import fxargs from '../src/fxargs';

describe('fxargs', function () {
    it('should correctly process arguments', function () {
        function testFunction(...args) {
            return fxargs(args, ['string?', 'string?', 'function', 'object?']);
        }

        // Test case with all arguments
        let [server, authenticator, testToRun, options] = testFunction('http://localhost:3000', 'admin', () => {}, { a: 'b' });
        
        assert.strictEqual(server, 'http://localhost:3000');
        assert.strictEqual(authenticator, 'admin');
        assert.strictEqual(typeof testToRun, 'function');
        assert.strictEqual(typeof options, 'object');

        // Test case with missing optional arguments
        [server, authenticator, testToRun, options] = testFunction('http://localhost:3000', () => {});        
        assert.strictEqual(server, 'http://localhost:3000');
        assert.strictEqual(authenticator, undefined);
        assert.strictEqual(typeof testToRun, 'function');
        assert.strictEqual(options, undefined);

        // Test case with only mandatory argument
        [server, authenticator, testToRun, options] = testFunction(() => {});
        assert.strictEqual(server, undefined);
        assert.strictEqual(authenticator, undefined);
        assert.strictEqual(typeof testToRun, 'function');
        assert.strictEqual(options, undefined);
    });

    it('should throw error for missing mandatory arguments', function () {
        function testFunction(...args) {
            return fxargs(args, ['string', 'function']);
        }

        assert.throws(() => testFunction(), /Missing argument at index 0/);
        assert.throws(() => testFunction('http://localhost:3000'), /Missing argument at index 1/);        
    });

    it('should throw error for incorrect argument types', function () {
        function testFunction(...args) {
            return fxargs(args, ['string', 'function']);
        }

        assert.throws(() => testFunction(123, () => {}), /Missing or invalid argument at index 0/);
        assert.throws(() => testFunction('http://localhost:3000', 'not a function'), /Missing or invalid argument at index 1/);
    });

    it('advanced usage', function () {
        function testFunction(...args) {
            return fxargs(args, ['string|object?', 'string|function?', 'function', 'object?']);
        }

        // Test case with all arguments
        let [server, authenticator, testToRun, options] = testFunction('http://localhost:3000', 'admin', () => {}, {});
        assert.strictEqual(server, 'http://localhost:3000');
        assert.strictEqual(authenticator, 'admin');
        assert.strictEqual(typeof testToRun, 'function');
        assert.strictEqual(typeof options, 'object');

        // Test case with missing optional arguments
        [server, authenticator, testToRun, options] = testFunction('http://localhost:3000', () => {});
        assert.strictEqual(server, 'http://localhost:3000');
        assert.strictEqual(authenticator, undefined);
        assert.strictEqual(typeof testToRun, 'function');
        assert.strictEqual(options, undefined);

        // Test case with only mandatory argument
        [server, authenticator, testToRun, options] = testFunction(() => {});
        assert.strictEqual(server, undefined);
        assert.strictEqual(authenticator, undefined);
        assert.strictEqual(typeof testToRun, 'function');
        assert.strictEqual(options, undefined);

        [server, authenticator, testToRun, options] = testFunction(() => {}, () => {}, {});
        assert.strictEqual(server, undefined);
        assert.strictEqual(typeof authenticator, 'function');
        assert.strictEqual(typeof testToRun, 'function');
        assert.strictEqual(typeof options, 'object');
    });
});
