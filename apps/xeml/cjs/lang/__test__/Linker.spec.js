'use strict';
const winston = require('winston');
const path = require('path');
const Linker = require('../Linker');
const SOURCE_PATH = path.resolve(__dirname, '../../../test/data/unit/linker');
describe('unit:lang:Linker', function() {
    let linker;
    let logger = winston.createLogger({
        "level": "info",
        "transports": [
            new winston.transports.Console({
                "format": winston.format.combine(winston.format.colorize(), winston.format.simple())
            })
        ]
    });
    beforeEach(function() {
        linker = new Linker(logger, {
            gemlPath: SOURCE_PATH,
            schemas: {
                product: {},
                manyToMany: {}
            } /*, saveIntermediate: true */ 
        });
    });
    describe('load module', function() {
        it('compile product schema', function() {
            let mod = linker.loadModule('product.geml');
            let expected = {
                "namespace": [
                    path.join(SOURCE_PATH, 'entities', 'organization.geml'),
                    path.join(SOURCE_PATH, 'entities', 'product.geml'),
                    path.join(SOURCE_PATH, 'entities', 'types.geml'),
                    path.join(SOURCE_PATH, 'entities', 'user.geml')
                ],
                "schema": {
                    "product": {
                        "entities": [
                            {
                                "entity": "product"
                            },
                            {
                                "entity": "user"
                            }
                        ]
                    }
                },
                "id": "./product.geml",
                "name": "product"
            };
            should.exists(mod);
            mod.should.be.eql(expected);
        });
        it('compile product entity', function() {
            let mod = linker.loadModule('entities/product.geml');
            let expected = {
                "namespace": [
                    path.join(SOURCE_PATH, 'entities', 'types.geml')
                ],
                entity: {
                    product: {
                        features: [
                            'autoId',
                            {
                                name: 'atLeastOneNotNull',
                                args: [
                                    [
                                        'name',
                                        'email'
                                    ]
                                ]
                            }
                        ],
                        fields: {
                            name: {
                                name: 'name',
                                type: 'name'
                            },
                            email: {
                                name: 'email',
                                type: 'email'
                            },
                            desc: {
                                name: 'desc',
                                type: 'desc',
                                comment: 'Description'
                            },
                            attr: {
                                name: 'attr',
                                type: 'nonEmptyText',
                                modifiers: [
                                    {
                                        oolType: 'Activator',
                                        name: 'defaultGenerator',
                                        args: [
                                            {
                                                oolType: 'ObjectReference',
                                                name: 'latest.email'
                                            }
                                        ]
                                    },
                                    {
                                        oolType: 'Processor',
                                        name: 'processBeforeValidation'
                                    },
                                    {
                                        oolType: 'Validator',
                                        name: 'isSomething'
                                    },
                                    {
                                        oolType: 'Processor',
                                        name: 'someProcess',
                                        args: [
                                            'text'
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                },
                id: './entities/product.geml',
                name: 'product'
            };
            should.exists(mod);
            mod.should.be.eql(expected);
        });
    });
    describe('load element', function() {
        it('load product entity from schema', function() {
            let schemaMod = linker.loadModule('product.geml');
            let refId = 'entity:product<-' + schemaMod.id;
            let productMod = linker.loadModule('entities/product.geml');
            let selfId = 'entity:product@' + productMod.id;
            linker._elementsCache.should.not.have.key(refId);
            linker._elementsCache.should.not.have.key(selfId);
            let productEntity = linker.loadElement(schemaMod, 'entity', 'product');
            should.exists(productEntity);
            productEntity.name.should.eql('product');
            linker._elementsCache.should.have.key(refId);
            linker._elementsCache.should.have.key(selfId);
            linker._elementsCache[refId].should.eql(productEntity);
            linker._elementsCache[selfId].should.eql(productEntity);
        });
    });
    describe('link a schema', function() {
        it('linker.link', function() {
            linker.link('product.geml', 'product');
            linker.schemas.should.have.key('product');
            let linked = linker.schemas['product'].toJSON();
            linked.displayName.should.equal('Product');
            linked.entities.should.have.key('product');
            let product = linked.entities['product'];
            product.should.have.key('name', 'displayName', 'fields', 'key');
            product.name.should.equal('product');
            product.displayName.should.equal('Product');
            product.fields.should.have.key('id', 'name', 'email', 'desc');
            product.key.should.equal('id');
        });
    });
    describe('manyToMany', function() {
        it('linker.link', function() {
            linker.link('manyToMany.geml', 'manyToMany');
            linker.schemas.should.have.key('manyToMany');
            let linked = linker.schemas['manyToMany'].toJSON();
            linked.entities.should.have.key('company', 'companyRelation', 'companyRelationType');
            let company = linker.schemas['manyToMany'].entities['company'];
            company.should.have.key('name', 'displayName', 'fields', 'key', 'info');
        });
    });
});

//# sourceMappingURL=Linker.spec.js.map