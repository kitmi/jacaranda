import { Graph } from '../src';

describe('unit:graph', function () {
    let graph = new Graph();
    graph.setNode('node1', { data: 1 });
    graph.setNode('node2', { data: 2 });
    graph.setNode('node3', { data: 3 });
    graph.setNode('node4', { data: 4 });
    graph.setNode('node5', { data: 5 });
    graph.setNode('node6', { data: 6 });

    graph.setEdge('node1', 'node2');
    graph.setEdge('node1', 'node3');
    graph.setEdge('node1', 'node4');
    graph.setEdge('node2', 'node5');
    graph.setEdge('node3', 'node5');
    graph.setEdge('node4', 'node5');
    graph.setEdge('node5', 'node6');

    graph.calcStartEnd();

    let json;

    it('startAndEnd', function () {
        graph.startNodes.length.should.be.exactly(1);
        graph.startNodes[0].should.be.equal('node1');

        graph.endNodes.length.should.be.exactly(1);
        graph.endNodes[0].should.be.equal('node6');
    });

    it('to json', function () {
        json = graph.toJSON();
        json.should.has.keys('nodes', 'edges', 'startNodes', 'endNodes');
        json.startNodes.length.should.be.exactly(1);
        json.startNodes[0].should.be.equal('node1');

        json.endNodes.length.should.be.exactly(1);
        json.endNodes[0].should.be.equal('node6');
    });

    it('from json', function () {
        let g2 = new Graph(json);
        g2.startNodes.length.should.be.exactly(1);
        g2.startNodes[0].should.be.equal('node1');

        g2.endNodes.length.should.be.exactly(1);
        g2.endNodes[0].should.be.equal('node6');

        Object.keys(g2.nodes).should.be.eql(Object.keys(graph.nodes));
    });
});
