import Box from '../src/box';

describe('Box', function () {
    it('should proxy method calls and allow updating the inner object', function () {
        const [testObject, setTestObject] = Box();

        // Set the object inside the Box
        setTestObject({
            foo: () => 'bar',
            value: 42
        });

        // Test method and property access
        assert.strictEqual(testObject.foo(), 'bar', 'Method call did not return expected result');
        assert.strictEqual(testObject.value, 42, 'Property access did not return expected value');

        // Update the inner object
        setTestObject({ value: 100 });

        // Test updated property
        assert.strictEqual(testObject.value, 100, 'Updated property did not return expected value');
    });
});