import { join, appendQuery } from '../src/url';

describe('url', () => {
    it('manage url', () => {
        const base = '/abc';
        const extra = 'def/';
        const empty_base = '';
        const empty_extra = '';

        const a = join(base, extra);
        const b = join(empty_base, extra);
        const c = join(base, empty_extra);

        a.should.be.eql(base + '/' + extra);
        b.should.be.eql(extra);
        c.should.be.eql(base);
    });

    it('join multi url', () => {
        const base = '/abc';
        const extra = 'def/';
        const extra2 = '/abc/';
        const extra3 = '/abcd';

        const a = join(base, extra, extra2);
        const b = join(base, extra, extra2, extra3);

        a.should.be.eql('/abc/def/abc/');
        b.should.be.eql('/abc/def/abc/abcd');
    });

    it('url append query', () => {
        const url1 = 'https://abc.com/efg';
        const url2 = 'https://abc.com/efg?k1=v1';
        const url3 = 'https://abc.com/efg?k1=v1&k2=v2';
        const url4 = 'https://abc.com/efg?';
        const url5 = 'https://abc.com/efg?k1';

        const query1 = 'k2=v3';
        const query2 = { k2: 'v3' };
        const query3 = {};
        const query4 = { k2: 'v3', k3: 'v4' };
        const query5 = { k3: 'v4' };
        const query6 = { k2: null };

        const cases = [
            { url: url1, query: query1, expected: 'https://abc.com/efg?k2=v3' },
            { url: url1, query: query2, expected: 'https://abc.com/efg?k2=v3' },
            { url: url1, query: query3, expected: 'https://abc.com/efg' },
            {
                url: url1,
                query: query4,
                expected: 'https://abc.com/efg?k2=v3&k3=v4',
            },
            { url: url1, query: query5, expected: 'https://abc.com/efg?k3=v4' },
            { url: url1, query: query6, expected: 'https://abc.com/efg?k2' },

            {
                url: url2,
                query: query1,
                expected: 'https://abc.com/efg?k1=v1&k2=v3',
            },
            {
                url: url2,
                query: query2,
                expected: 'https://abc.com/efg?k1=v1&k2=v3',
            },
            { url: url2, query: query3, expected: 'https://abc.com/efg?k1=v1' },
            {
                url: url2,
                query: query4,
                expected: 'https://abc.com/efg?k1=v1&k2=v3&k3=v4',
            },
            {
                url: url2,
                query: query5,
                expected: 'https://abc.com/efg?k1=v1&k3=v4',
            },
            {
                url: url2,
                query: query6,
                expected: 'https://abc.com/efg?k1=v1&k2',
            },

            {
                url: url3,
                query: query1,
                expected: 'https://abc.com/efg?k1=v1&k2=v3',
            },
            {
                url: url3,
                query: query2,
                expected: 'https://abc.com/efg?k1=v1&k2=v3',
            },
            {
                url: url3,
                query: query3,
                expected: 'https://abc.com/efg?k1=v1&k2=v2',
            },
            {
                url: url3,
                query: query4,
                expected: 'https://abc.com/efg?k1=v1&k2=v3&k3=v4',
            },
            {
                url: url3,
                query: query5,
                expected: 'https://abc.com/efg?k1=v1&k2=v2&k3=v4',
            },
            {
                url: url3,
                query: query6,
                expected: 'https://abc.com/efg?k1=v1&k2',
            },

            { url: url4, query: query1, expected: 'https://abc.com/efg?k2=v3' },
            { url: url4, query: query2, expected: 'https://abc.com/efg?k2=v3' },
            { url: url4, query: query3, expected: 'https://abc.com/efg?' },
            {
                url: url4,
                query: query4,
                expected: 'https://abc.com/efg?k2=v3&k3=v4',
            },
            { url: url4, query: query5, expected: 'https://abc.com/efg?k3=v4' },
            { url: url4, query: query6, expected: 'https://abc.com/efg?k2' },

            {
                url: url5,
                query: query1,
                expected: 'https://abc.com/efg?k1&k2=v3',
            },
            {
                url: url5,
                query: query2,
                expected: 'https://abc.com/efg?k1&k2=v3',
            },
            { url: url5, query: query3, expected: 'https://abc.com/efg?k1' },
            {
                url: url5,
                query: query4,
                expected: 'https://abc.com/efg?k1&k2=v3&k3=v4',
            },
            {
                url: url5,
                query: query5,
                expected: 'https://abc.com/efg?k1&k3=v4',
            },
            { url: url5, query: query6, expected: 'https://abc.com/efg?k1&k2' },
        ];

        cases.forEach((testCase, i) => {
            console.log(`checking case ${i}`);
            appendQuery(testCase.url, testCase.query).should.be.eql(testCase.expected);
        });
    });
});
