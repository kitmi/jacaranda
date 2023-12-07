'use strict';

import diff from '../src/diff';

const obj1 = {
    'id': 108,
    'name': 'Vantage Test',
    'headline': 'VANTAGE APARTMENTS',
    'desc': null,
    'longDesc': null,
    'itemNo': null,
    'sku': null,
    'barcode': null,
    'status': 'draft',
    'underOffer': null,
    'depositTaken': null,
    'showTextForPrice': null,
    'numOfView': 0,
    'numOfEnquiry': 0,
    'highlightTags': null,
    'copiedFromDev': null,
    'revision': 0,
    'agency': 1,
    'type': 'PROPERTY_SALE',
    'mainCategory': 100,
    'resourceGroup': 'kKyh9QEij',
    'supplier': null,
    'vendor': 2,
    'vendorSolicitor': 2,
    'createdBy': 200,
    'updatedBy': null,
    ':resourceGroup': {
        'id': 'kKyh9QEij',
        'entityName': 'product',
        ':resources': [],
    },
};

const obj2 = {
    'name': 'Vantage Test',
    'headline': 'VANTAGE APARTMENTS',
    'desc': null,
    'longDesc': null,
    'itemNo': null,
    'sku': null,
    'barcode': null,
    'underOffer': null,
    'depositTaken': null,
    'showTextForPrice': null,
    'numOfView': 0,
    'numOfEnquiry': 0,
    'highlightTags': null,
    'copiedFromDev': null,
    'revision': 0,
    'type': 'PROPERTY_SALE',
    'mainCategory': 100,
    'supplier': null,
    'vendor': 2,
    'vendorSolicitor': 2,
    ':resourceGroup': { 'entityName': 'product', ':resources': [] },
    ':attributes': [],
    ':categories': [],
    ':prices': [],
};

describe('diff', function () {
    it('scalar', async function () {
        const result = diff({ k: 10, k2: 30 }, { k: 20, k2: 30 });
        result.should.be.eql({ k: 20 });
    });

    it('obj', async function () {
        const result = diff(obj1, obj2);
        result.should.be.eql({ ':attributes': [], ':categories': [], ':prices': [] });
    });

    it('array', async function () {
        const result = diff({ k: [10, 20, 30] }, { k: [10, 30, 40] });
        result.should.be.eql({ k: [40] });
    });

    it('equal', async function () {
        const result = diff({ k: 10 }, { k: 10 });
        should.not.exist(result);
    });

    it('null base', async function () {
        const result = diff(null, { k: 10 });
        result.should.be.eql({ k: 10 });
    });

    it('null target', async function () {
        const result = diff({ k: 10 }, null);
        should.not.exist(result);
    });

    it('null child', async function () {
        const result = diff({ k: 10 }, { k: null });
        result.should.be.eql({ k: null });
    });
});
