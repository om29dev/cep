/**
 * Max-Flow Min-Cut Algorithm for Water Pipeline Network Analysis
 * Uses Edmonds-Karp implementation (BFS for finding augmenting paths)
 */

const { buildPipelineGraph, PIPELINE_EDGES } = require('../data/pcmcPipelineData');

class MaxFlowMinCut {
    constructor() {
        this.graph = null;
        this.residualGraph = {};
    }

    async init() {
        this.graph = await buildPipelineGraph();
        // We need PIPELINE_EDGES for reference in getMinCut, but since data is now in DB/Graph,
        // we might not have the global constant array populated as before.
        // We will rely on graph structure.
    }

    /**
     * Build the residual graph from the pipeline network.
     */
    buildResidualGraph() {
        this.residualGraph = {};

        if (!this.graph) throw new Error("Graph not initialized. Call init() first.");

        // Initialize residual graph structure
        Object.keys(this.graph).forEach(nodeId => {
            this.residualGraph[nodeId] = {};
        });

        // Loop through all nodes and their neighbors to build edges
        Object.values(this.graph).forEach(node => {
            const u = node.id;
            // neighbors is array of { nodeId, edgeId, diameter, distance }
            node.neighbors.forEach(neighbor => {
                const v = neighbor.nodeId;
                // Capacity approx: d^2 / 1000
                const capacity = Math.round((neighbor.diameter * neighbor.diameter) / 1000);

                if (!this.residualGraph[u]) this.residualGraph[u] = {};
                // Ensure target node exists in residual graph keys (should be there from initial loop)
                if (!this.residualGraph[v]) this.residualGraph[v] = {};

                // Initialize if undefined
                if (!this.residualGraph[u][v]) this.residualGraph[u][v] = 0;

                // Add capacity. Since graph is undirected in connectivity but directed in flow possibility:
                // We add capacity u->v. The reverse v->u will be added when we process node v's neighbors.
                this.residualGraph[u][v] = capacity;
            });
        });

        return this.residualGraph;
    }

    /**
     * Standard BFS for Edmonds-Karp
     */
    bfs(source, sink, parent) {
        const visited = new Set();
        const queue = [];

        queue.push(source);
        visited.add(source);
        // parent map tracks the path. 
        // We don't need to clear it every time if we just overwrite, but good practice.

        while (queue.length > 0) {
            const u = queue.shift();

            if (!this.residualGraph[u]) continue;

            for (const v in this.residualGraph[u]) {
                const capacity = this.residualGraph[u][v];

                if (!visited.has(v) && capacity > 0) {
                    queue.push(v);
                    parent[v] = u;
                    visited.add(v);
                    if (v === sink) return true;
                }
            }
        }
        return false;
    }

    async calculateMaxFlow(sourceId, sinkId) {
        if (!this.graph) await this.init();

        this.buildResidualGraph();

        let maxFlow = 0;
        const parent = {};

        // Validating nodes
        if (!this.residualGraph[sourceId] || !this.residualGraph[sinkId]) {
            return { error: `Invalid source (${sourceId}) or sink (${sinkId}) node.` };
        }

        // Edmonds-Karp Loop
        while (this.bfs(sourceId, sinkId, parent)) {
            let pathFlow = Infinity;
            let s = sinkId;

            // Find bottleneck capacity in this path
            while (s !== sourceId) {
                const u = parent[s];
                pathFlow = Math.min(pathFlow, this.residualGraph[u][s]);
                s = u;
            }

            // Update residual capacities
            maxFlow += pathFlow;
            let v = sinkId;
            while (v !== sourceId) {
                const u = parent[v];
                this.residualGraph[u][v] -= pathFlow;

                if (!this.residualGraph[v]) this.residualGraph[v] = {};
                if (!this.residualGraph[v][u]) this.residualGraph[v][u] = 0;

                this.residualGraph[v][u] += pathFlow;
                v = u;
            }

            // Clear parent for next iteration? 
            // Actually JS object `parent` persists, strictly we should clear it or visited set handles it.
            // visited set is new per BFS call, so it's fine.
        }

        return { maxFlow };
    }

    /**
     * Get the Min-Cut (bottleneck edges)
     */
    async getMinCut(sourceId, sinkId) {
        if (!this.graph) await this.init();

        // 1. Run BFS on residual graph to find reachable nodes from source
        const visited = new Set();
        const queue = [];
        queue.push(sourceId);
        visited.add(sourceId);

        while (queue.length > 0) {
            const u = queue.shift();
            if (this.residualGraph[u]) {
                for (const v in this.residualGraph[u]) {
                    if (this.residualGraph[u][v] > 0 && !visited.has(v)) {
                        visited.add(v);
                        queue.push(v);
                    }
                }
            }
        }

        // 2. Identification of Edges
        // Min-Cut edges are those (u, v) where u is is reachable, v is NOT reachable.
        const minCutEdges = [];

        Object.values(this.graph).forEach(node => {
            const u = node.id;
            node.neighbors.forEach(neighbor => {
                const v = neighbor.nodeId;

                if (visited.has(u) && !visited.has(v)) {
                    minCutEdges.push({
                        id: neighbor.edgeId,
                        from: u,
                        to: v,
                        diameter: neighbor.diameter,
                        // distance: neighbor.distance
                    });
                }
            });
        });

        return {
            reachableNodes: Array.from(visited),
            minCutEdges,
            count: minCutEdges.length
        };
    }
}

module.exports = MaxFlowMinCut;
