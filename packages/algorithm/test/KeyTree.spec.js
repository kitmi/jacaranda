import { KeyTree } from '../src';

describe('unit:tree:key-tree', function () {
    let tree = new KeyTree('/', 'root node');
    let node11 = new KeyTree.Node('l1-1', 'level 1 node 1');
    let node12 = new KeyTree.Node('l1-2', 'level 1 node 2');
    let node111 = new KeyTree.Node('l2-1', 'level 2 node 1');
    let node121 = new KeyTree.Node('l2-2', 'level 2 node 2');
    let node122 = new KeyTree.Node('l2-3', 'level 2 node 3');

    tree.append(node11);
    tree.append(node12);

    node11.append(node111);

    node12.append(node121);
    node12.append(node122);

    it('accessors', function () {
        tree.size.should.be.exactly(2);
    });

    it('find', function () {
        let node = tree.find((n) => n.key === 'l2-2');
        should.exist(node);
        node.data.should.be.exactly('level 2 node 2');

        node = tree.find((n) => n.key === 'l2-4');
        (node == null).should.be.ok;

        node = tree.findByKeyPath(['']);
        (node == null).should.be.ok;
    });

    it('cru', function () {
        tree.children.should.have.keys(node11.key, node12.key);
        node11.children.should.have.keys(node111.key);
        node12.children.should.have.keys(node121.key, node122.key);

        node111.getKeyPath().should.eql(['/', 'l1-1', 'l2-1']);

        let node = tree.findByKeyPath(['/', 'l1-2', 'l2-2']);
        node.data.should.be.exactly('level 2 node 2');

        node11.appendDataByKeyPath(
            ['l1-1', 'l2-4', 'l3-1', 'l4-1'],
            'new leaf'
        );

        node = tree.findByKeyPath(['/', 'l1-1', 'l2-4', 'l3-1', 'l4-1']);
        node.data.should.be.exactly('new leaf');

        node11.appendDataByKeyPath(
            ['l1-1', 'l2-4', 'l3-1', 'l4-2'],
            'new leaf 2'
        );

        node = tree.findByKeyPath(['/', 'l1-1', 'l2-4', 'l3-1', 'l4-2']);
        node.data.should.be.exactly('new leaf 2');

        should.throws(
            () => tree.remove(node121),
            'Removing a node which is not a child of the current node.'
        );

        tree.remove(node12);

        node = tree.findByKeyPath(['/', 'l1-2', 'l2-2']);
        (node == null).should.be.ok;

        should.throws(() => tree.append(node11), 'Duplicate node key: l1-1');
    });
});
