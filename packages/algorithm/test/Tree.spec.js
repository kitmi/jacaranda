import { Tree } from '../src';

describe('unit:tree:tree', function () {
    let tree = new Tree('root node');
    let node11 = new Tree.Node('level 1 node 1');
    let node12 = new Tree.Node('level 1 node 2');
    let node111 = new Tree.Node('level 2 node 1');
    let node121 = new Tree.Node('level 2 node 2');
    let node122 = new Tree.Node('level 2 node 3');

    tree.append(node11);
    tree.append(node12);

    node11.append(node111);

    node12.append(node121);
    node12.append(node122);

    it('accessors', function () {
        tree.size.should.be.exactly(2);
    });

    it('find', function () {
        let node = tree.find((n) => n.data === 'level 2 node 2');
        (node != null).should.be.ok;

        node = tree.find((n) => n.data === 'level 2 node 4');
        (node != null).should.not.be.ok;
    });

    it('cru', function () {
        tree.children.length.should.be.exactly(2);
        node11.children.length.should.be.exactly(1);
        node12.children.length.should.be.exactly(2);

        tree.remove(node12);

        tree.size.should.be.exactly(1);
        (node12.parent == null).should.be.ok;

        should.throws(
            () => tree.remove(node12),
            'Removing a node which is not a child of the current node.'
        );
    });

    it('insert and remove by index', function () {
        tree.insert(0, node12);
        tree.size.should.be.exactly(2);

        tree.children[1].should.be.equal(node11);

        tree.removeAtIndex(0);
        (node12.parent == null).should.be.ok;
    });
});
