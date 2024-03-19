import Jsx from '../src/bundle';

describe('Jsx:cases', function () {
    it('case 1.1 - if else', function () {
        const objB = {
            value: '',
            enableShowTextForPrice: true,
        };

        const result2 = Jsx.evaluate(objB, {
            $override: {
                editMode: {
                    $expr: {
                        $if: ['$$PARENT.enableShowTextForPrice', { $set: null }, { $set: 'disabled' }],
                    },
                },
            },
        });

        result2.should.be.eql({ value: '', enableShowTextForPrice: true, editMode: null });
    });

    it('case 1.2', function () {
        const objB = {
            value: '',
            enableShowTextForPrice: false,
        };

        const result2 = Jsx.evaluate(objB, {
            $override: {
                editMode: {
                    $expr: {
                        $if: ['$$PARENT.enableShowTextForPrice', { $set: null }, { $set: 'disabled' }],
                    },
                },
            },
        });

        result2.should.be.eql({ value: '', enableShowTextForPrice: false, editMode: 'disabled' });
    });

    it('case 2.1', function () {
        const objA = {
            value: null,
            enabled: 'input6 的長度必須大於 4。',
            disabled: false,
        };

        const result = Jsx.evaluate(objA, {
            $override: {
                enabled: {
                    $expr: {
                        $match: {
                            $exist: false,
                        },
                    },
                },
            },
        });

        result.should.be.eql({ value: null, enabled: false, disabled: false });
    });

    it('case 2.2', function () {
        const objA = {
            value: null,
            enabled: null,
            disabled: false,
        };

        const result = Jsx.evaluate(objA, {
            $override: {
                enabled: {
                    $expr: {
                        $match: {
                            $exist: false,
                        },
                    },
                },
            },
        });

        result.should.be.eql({ value: null, enabled: true, disabled: false });
    });

    it('case 3.1 - pick, match all', function () {
        const objs = [
            {
                isValid: false,
                isChanged: false,
                others: 'any',
                result: false,
            },
            {
                isValid: true,
                isChanged: false,
                others: 'any',
                result: false,
            },
            {
                isValid: false,
                isChanged: true,
                others: 'any',
                result: false,
            },
            {
                isValid: true,
                isChanged: true,
                others: 'any',
                result: true,
            },
        ];

        objs.forEach((obj) => {
            const result = Jsx.evaluate(obj, [
                { $pick: ['isValid', 'isChanged'] },
                '$values',
                { $match: { '|>$all': { $being: true } } },
            ]);

            result.should.be.eql(obj.result);
        });
    });

    it('case 4.1 - string to object', function () {
        const str = 'value';

        const result = Jsx.evaluate(str, {
            name: '$$ROOT',
        });

        result.should.be.eql({ name: str });
    });

    it('case 5.1 - check in array', function () {
        const obj = {
            values: [1, 2, 3],
            value: 1,
        };

        const result = Jsx.evaluate(obj, {
            $override: {
                value: {
                    $match: {
                        $in: '$$ROOT.values',
                    },
                },
            },
        });

        result.value.should.be.ok;
    });

    it('case 5.2 - check not in array', function () {
        const obj = {
            values: [1, 2, 3],
            value: 4,
        };

        const result = Jsx.evaluate(obj, {
            $override: {
                value: {
                    $expr: {
                        $match: {
                            $in: { $expr: '$$ROOT.values' },
                        },
                    },
                },
            },
        });

        result.value.should.not.be.ok;
    });

    it('case 6.1 - check complex condition', function () {
        const obj = { activeIndex: 0, propertyType: 'all', projectId: null };

        const result = Jsx.evaluate(obj, {
            activeIndex: {
                $if: [
                    [
                        '$$ROOT',
                        {
                            $match: {
                                $any: [
                                    {
                                        propertyType: 'all',
                                    },
                                    {
                                        propertyType: 'project',
                                        projectId: { $exists: false },
                                    },
                                ],
                            },
                        },
                    ],
                    {
                        $set: 0,
                    },
                    {
                        $set: 1,
                    },
                ],
            },
        });

        result.activeIndex.should.be.exactly(0);
    });

    it('case 6.2 - check complex condition 2', function () {
        const obj = { activeIndex: 0, propertyType: 'project', projectId: 123 };

        const result = Jsx.evaluate(obj, {
            activeIndex: {
                $if: [
                    [
                        '$$ROOT',
                        {
                            $match: {
                                $any: [
                                    {
                                        propertyType: 'all',
                                    },
                                    {
                                        propertyType: 'project',
                                        projectId: { $exists: false },
                                    },
                                ],
                            },
                        },
                    ],
                    {
                        $set: 0,
                    },
                    {
                        $set: 1,
                    },
                ],
            },
        });

        result.activeIndex.should.be.exactly(1);
    });

    it('case 7.1 - compare', function () {
        const obj = { selectedCount: 4, totalCount: 4 };

        const result = Jsx.evaluate(obj, {
            $override: {
                value: {
                    $expr: [
                        '$$PARENT.selectedCount',
                        {
                            $match: {
                                $eq: { $expr: '$$PARENT.totalCount' },
                            },
                        },
                    ],
                },
                indeterminate: {
                    $expr: [
                        '$$PARENT.selectedCount',
                        {
                            $match: {
                                $lt: { $expr: '$$PARENT.totalCount' },
                                $ne: 0,
                            },
                        },
                    ],
                },
            },
        });

        result.should.be.eql({
            selectedCount: 4,
            totalCount: 4,
            value: true,
            indeterminate: false,
        });
    });

    it('case 7.2 - compare', function () {
        const obj = { selectedCount: 2, totalCount: 4 };

        const result = Jsx.evaluate(obj, {
            $override: {
                value: {
                    $expr: [
                        '$$PARENT.selectedCount',
                        {
                            $match: {
                                $eq: { $expr: '$$PARENT.totalCount' },
                            },
                        },
                    ],
                },
                indeterminate: {
                    $expr: [
                        '$$PARENT.selectedCount',
                        {
                            $match: {
                                $lt: { $expr: '$$PARENT.totalCount' },
                                $ne: 0,
                            },
                        },
                    ],
                },
            },
        });

        result.should.be.eql({
            selectedCount: 2,
            totalCount: 4,
            value: false,
            indeterminate: true,
        });
    });

    it('case 7.3 - compare', function () {
        const obj = { selectedCount: 0, totalCount: 4 };

        const result = Jsx.evaluate(obj, {
            $override: {
                value: {
                    $expr: [
                        '$$PARENT.selectedCount',
                        {
                            $match: {
                                $eq: { $expr: '$$PARENT.totalCount' },
                            },
                        },
                    ],
                },
                indeterminate: {
                    $expr: [
                        '$$PARENT.selectedCount',
                        {
                            $match: {
                                $lt: { $expr: '$$PARENT.totalCount' },
                                $ne: 0,
                            },
                        },
                    ],
                },
            },
        });

        result.should.be.eql({
            selectedCount: 0,
            totalCount: 4,
            value: false,
            indeterminate: false,
        });
    });

    it('case 9.1 - adjust obj structure', function () {
        const obj = {
            key1: 'value1',
            key2: 'value2',
            key3: 'value3',
            key4: {
                key5: 'value5',
            },
        };

        const result = Jsx.evaluate(obj, {
            $assign: {
                key3: undefined,
                key4: { $expr: '$$CURRENT.key5' },
            },
        });

        result.should.be.eql({
            key1: 'value1',
            key2: 'value2',
            key4: 'value5',
        });
    });
});
