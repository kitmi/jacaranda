import { bfs, dfs } from '../src';

describe('unit:Search', function () {
    it('dfs', function () {
        // Define the nodes of the graph.
        const nodeA = { id: 'A', children: [] };
        const nodeB = { id: 'B', children: [] };
        const nodeC = { id: 'C', children: [] };
        const nodeD = { id: 'D', children: [] };
        const nodeE = { id: 'E', children: [] };
        const nodeF = { id: 'F', children: [] };

        // Connect the nodes to form a tree.
        nodeA.children = [nodeB, nodeC];
        nodeB.children = [nodeD, nodeE];
        nodeC.children = [nodeF];

        // Define the expected order of visited nodes.
        const expectedOrder = ['A', 'B', 'D', 'E', 'C', 'F'];

        // Create a list to store the order of visited nodes.
        const actualOrder = [];

        // Define the visit function.
        const visit = (node) => {
            actualOrder.push(node.id);
        };

        // Call the dfs function with the root node, visit function, and getChildren function.
        dfs(nodeA, visit, (node) => node.children);

        // Assert that the order of visited nodes matches the expected order.
        console.log('Actual order:', actualOrder);
        console.log('Expected order:', expectedOrder);

        actualOrder.should.be.eql(
            expectedOrder,
            'DFS did not visit nodes in the expected order.'
        );
    });

    it('dfs-multi', function () {
        // Define the nodes of the graph.
        const nodeA = { id: 'A', children: [] };
        const nodeB = { id: 'B', children: [] };
        const nodeC = { id: 'C', children: [] };
        const nodeD = { id: 'D', children: [] };
        const nodeE = { id: 'E', children: [] };
        const nodeF = { id: 'F', children: [] };
        const nodeG = { id: 'G', children: [] };
        const nodeH = { id: 'H', children: [] };

        // Connect the nodes to form a tree.
        nodeA.children = [nodeB, nodeC, nodeD];
        nodeB.children = [nodeE, nodeF, nodeG];
        nodeD.children = [nodeH];

        // Define the expected order of visited nodes.
        const expectedOrder = ['A', 'B', 'E', 'F', 'G', 'C', 'D', 'H'];

        // Create a list to store the order of visited nodes.
        const actualOrder = [];

        // Define the visit function.
        const visit = (node) => {
            actualOrder.push(node.id);
        };

        // Call the dfs function with the root node, visit function, and getChildren function.
        dfs(nodeA, visit, (node) => node.children);

        // Assert that the order of visited nodes matches the expected order.
        console.log('Actual order:', actualOrder);
        console.log('Expected order:', expectedOrder);

        actualOrder.should.be.eql(
            expectedOrder,
            'DFS did not visit nodes in the expected order.'
        );
    });

    it('dfs-found', function () {
        // Define the nodes of the graph.
        const nodeA = { id: 'A', children: [] };
        const nodeB = { id: 'B', children: [] };
        const nodeC = { id: 'C', children: [] };
        const nodeD = { id: 'D', children: [] };
        const nodeE = { id: 'E', children: [] };
        const nodeF = { id: 'F', children: [] };
        const nodeG = { id: 'G', children: [], target: true };
        const nodeH = { id: 'H', children: [] };

        // Connect the nodes to form a tree.
        nodeA.children = [nodeB, nodeC, nodeD];
        nodeB.children = [nodeE, nodeF, nodeG];
        nodeD.children = [nodeH];

        // Define the expected order of visited nodes.
        const expectedOrder = ['A', 'B', 'E', 'F', 'G'];

        // Create a list to store the order of visited nodes.
        const actualOrder = [];

        // Define the visit function.
        const visit = (node) => {
            actualOrder.push(node.id);
            return node.target;
        };

        // Call the dfs function with the root node, visit function, and getChildren function.
        const found = dfs(nodeA, visit, (node) => node.children);

        // Assert that the order of visited nodes matches the expected order.
        console.log('Actual order:', actualOrder);
        console.log('Expected order:', expectedOrder);

        actualOrder.should.be.eql(
            expectedOrder,
            'DFS did not visit nodes in the expected order.'
        );

        found.should.be.eql(nodeG);
    });

    it('bfs', function () {
        // Define the nodes of the graph.
        const nodeA = { id: 'A', children: [] };
        const nodeB = { id: 'B', children: [] };
        const nodeC = { id: 'C', children: [] };
        const nodeD = { id: 'D', children: [] };
        const nodeE = { id: 'E', children: [] };
        const nodeF = { id: 'F', children: [] };

        // Connect the nodes to form a tree.
        nodeA.children = [nodeB, nodeC];
        nodeB.children = [nodeD, nodeE];
        nodeC.children = [nodeF];

        // Define the expected order of visited nodes.
        const expectedOrder = ['A', 'B', 'C', 'D', 'E', 'F'];

        // Create a list to store the order of visited nodes.
        const actualOrder = [];

        // Define the visit function.
        const visit = (node) => {
            actualOrder.push(node.id);
        };

        // Call the dfs function with the root node, visit function, and getChildren function.
        bfs(nodeA, visit, (node) => node.children);

        // Assert that the order of visited nodes matches the expected order.
        console.log('Actual order:', actualOrder);
        console.log('Expected order:', expectedOrder);

        actualOrder.should.be.eql(
            expectedOrder,
            'BFS did not visit nodes in the expected order.'
        );
    });

    it('bfs-found', function () {
        // Define the nodes of the graph.
        const nodeA = { id: 'A', children: [] };
        const nodeB = { id: 'B', children: [] };
        const nodeC = { id: 'C', children: [] };
        const nodeD = { id: 'D', children: [] };
        const nodeE = { id: 'E', children: [] };
        const nodeF = { id: 'F', children: [] };
        const nodeG = { id: 'G', children: [], target: true };
        const nodeH = { id: 'H', children: [] };

        // Connect the nodes to form a tree.
        nodeA.children = [nodeB, nodeC, nodeD];
        nodeB.children = [nodeE, nodeF, nodeG];
        nodeD.children = [nodeH];

        // Define the expected order of visited nodes.
        const expectedOrder = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

        // Create a list to store the order of visited nodes.
        const actualOrder = [];

        // Define the visit function.
        const visit = (node) => {
            actualOrder.push(node.id);
            return node.target;
        };

        // Call the dfs function with the root node, visit function, and getChildren function.
        const found = bfs(nodeA, visit, (node) => node.children);

        // Assert that the order of visited nodes matches the expected order.
        console.log('Actual order:', actualOrder);
        console.log('Expected order:', expectedOrder);

        actualOrder.should.be.eql(
            expectedOrder,
            'DFS did not visit nodes in the expected order.'
        );

        found.should.be.eql(nodeG);
    });
});
