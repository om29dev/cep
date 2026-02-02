/**
 * Dijkstra's Algorithm for Water Pipeline Pathfinding
 * Server-side version (CommonJS)
 */

const { buildPipelineGraph, getHaversineDistance, PIPELINE_NODES, PIPELINE_EDGES } = require('../data/pcmcPipelineData');

/**
 * Priority Queue implementation using Min-Heap for efficient Dijkstra
 */
class PriorityQueue {
    constructor() {
        this.heap = [];
    }

    push(item, priority) {
        this.heap.push({ item, priority });
        this.bubbleUp(this.heap.length - 1);
    }

    pop() {
        if (this.heap.length === 0) return null;
        const min = this.heap[0];
        const end = this.heap.pop();
        if (this.heap.length > 0) {
            this.heap[0] = end;
            this.bubbleDown(0);
        }
        return min.item;
    }

    isEmpty() {
        return this.heap.length === 0;
    }

    bubbleUp(index) {
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            if (this.heap[parentIndex].priority <= this.heap[index].priority) break;
            [this.heap[parentIndex], this.heap[index]] = [this.heap[index], this.heap[parentIndex]];
            index = parentIndex;
        }
    }

    bubbleDown(index) {
        const length = this.heap.length;
        while (true) {
            const leftChild = 2 * index + 1;
            const rightChild = 2 * index + 2;
            let smallest = index;

            if (leftChild < length && this.heap[leftChild].priority < this.heap[smallest].priority) {
                smallest = leftChild;
            }
            if (rightChild < length && this.heap[rightChild].priority < this.heap[smallest].priority) {
                smallest = rightChild;
            }
            if (smallest === index) break;
            [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
            index = smallest;
        }
    }
}

/**
 * Dijkstra's Algorithm to find shortest path between two nodes
 */
function dijkstra(startNodeId, endNodeId, options = {}) {
    const graph = buildPipelineGraph();

    const {
        avoidNodes = [],        // Nodes to avoid (e.g., under maintenance)
        avoidEdges = [],        // Edges to avoid
        preferLargeDiameter = false, // Weight towards larger pipes
    } = options;

    // Validation
    if (!graph[startNodeId]) {
        return { success: false, error: `Start node '${startNodeId}' not found` };
    }
    if (!graph[endNodeId]) {
        return { success: false, error: `End node '${endNodeId}' not found` };
    }

    const distances = {};
    const previous = {};
    const previousEdge = {};
    const visited = new Set();
    const pq = new PriorityQueue();

    // Initialize distances
    Object.keys(graph).forEach(nodeId => {
        distances[nodeId] = Infinity;
    });
    distances[startNodeId] = 0;
    pq.push(startNodeId, 0);

    while (!pq.isEmpty()) {
        const currentNodeId = pq.pop();

        if (visited.has(currentNodeId)) continue;
        visited.add(currentNodeId);

        // Found destination
        if (currentNodeId === endNodeId) break;

        const currentNode = graph[currentNodeId];

        for (const neighbor of currentNode.neighbors) {
            if (visited.has(neighbor.nodeId)) continue;
            if (avoidNodes.includes(neighbor.nodeId)) continue;
            if (avoidEdges.includes(neighbor.edgeId)) continue;

            // Calculate weight (distance with optional diameter preference)
            let weight = neighbor.distance;
            if (preferLargeDiameter && neighbor.diameter) {
                // Favor larger diameter pipes (scale inversely)
                weight = weight * (1000 / neighbor.diameter);
            }

            const newDistance = distances[currentNodeId] + weight;

            if (newDistance < distances[neighbor.nodeId]) {
                distances[neighbor.nodeId] = newDistance;
                previous[neighbor.nodeId] = currentNodeId;
                previousEdge[neighbor.nodeId] = neighbor.edgeId;
                pq.push(neighbor.nodeId, newDistance);
            }
        }
    }

    // Reconstruct path
    if (distances[endNodeId] === Infinity) {
        return {
            success: false,
            error: 'No path found between the specified nodes'
        };
    }

    const path = [];
    const edges = [];
    let current = endNodeId;

    while (current) {
        path.unshift(current);
        if (previousEdge[current]) {
            edges.unshift(previousEdge[current]);
        }
        current = previous[current];
    }

    // Calculate actual total distance
    let totalDistance = 0;
    edges.forEach(edgeId => {
        const edge = PIPELINE_EDGES.find(e => e.id === edgeId);
        if (edge) totalDistance += edge.distance;
    });

    // Get node details
    const pathNodes = path.map(nodeId => graph[nodeId]);

    // Get edge details
    const pathEdges = edges.map(edgeId =>
        PIPELINE_EDGES.find(e => e.id === edgeId)
    ).filter(Boolean);

    return {
        success: true,
        path,
        pathNodes,
        edges,
        pathEdges,
        totalDistance: Math.round(totalDistance * 100) / 100,
        nodeCount: path.length,
        estimatedCost: calculateConnectionCost(totalDistance, pathEdges),
    };
}

/**
 * Find nearest node to given coordinates and return path from water source
 */
function findOptimalConnectionRoute(lat, lng) {
    const graph = buildPipelineGraph();

    // Find nearest junction or connection point
    const targetTypes = ['junction', 'valve', 'connection'];
    let nearestNode = null;
    let minDistance = Infinity;

    PIPELINE_NODES.forEach(node => {
        if (targetTypes.includes(node.type)) {
            const distance = getHaversineDistance(lat, lng, node.coords[0], node.coords[1]);
            if (distance < minDistance) {
                minDistance = distance;
                nearestNode = node;
            }
        }
    });

    if (!nearestNode) {
        return {
            success: false,
            error: 'No suitable connection point found nearby'
        };
    }

    // Find path from nearest ESR or reservoir to the connection point
    const waterSources = PIPELINE_NODES.filter(n =>
        n.type === 'esr' || n.type === 'reservoir'
    );

    let bestRoute = null;
    let bestTotalDistance = Infinity;

    for (const source of waterSources) {
        const route = dijkstra(source.id, nearestNode.id);
        if (route.success) {
            const totalDist = route.totalDistance + minDistance;
            if (totalDist < bestTotalDistance) {
                bestTotalDistance = totalDist;
                bestRoute = {
                    ...route,
                    waterSource: source,
                    connectionPoint: nearestNode,
                    distanceToNearestNode: Math.round(minDistance * 1000) / 1000,
                    targetCoords: [lat, lng],
                };
            }
        }
    }

    if (!bestRoute) {
        return {
            success: false,
            error: 'Could not find route to any water source'
        };
    }

    // Add new pipe segment details
    bestRoute.newPipeRequired = {
        from: nearestNode.id,
        toCoords: [lat, lng],
        estimatedLength: Math.round(minDistance * 1000), // in meters
        recommendedDiameter: 100, // mm - typical household connection
        estimatedCost: calculateNewPipeCost(minDistance),
    };

    return bestRoute;
}

/**
 * Trace all downstream nodes from a given source
 */
function traceDownstream(sourceNodeId, maxHops = 10) {
    const graph = buildPipelineGraph();

    if (!graph[sourceNodeId]) {
        return { success: false, error: 'Source node not found' };
    }

    const visited = new Set();
    const affectedNodes = [];
    const affectedEdges = [];
    const queue = [{ nodeId: sourceNodeId, depth: 0 }];

    while (queue.length > 0) {
        const { nodeId, depth } = queue.shift();

        if (visited.has(nodeId) || depth > maxHops) continue;
        visited.add(nodeId);

        const node = graph[nodeId];
        affectedNodes.push({
            ...PIPELINE_NODES.find(n => n.id === nodeId),
            depth,
        });

        for (const neighbor of node.neighbors) {
            if (!visited.has(neighbor.nodeId)) {
                affectedEdges.push(neighbor.edgeId);
                queue.push({ nodeId: neighbor.nodeId, depth: depth + 1 });
            }
        }
    }

    return {
        success: true,
        sourceNode: PIPELINE_NODES.find(n => n.id === sourceNodeId),
        affectedNodes,
        affectedEdges: [...new Set(affectedEdges)],
        totalAffectedNodes: affectedNodes.length,
    };
}

/**
 * Find all paths between two nodes (for redundancy analysis)
 */
function findAllPaths(startNodeId, endNodeId, maxPaths = 3) {
    const graph = buildPipelineGraph();
    const paths = [];

    function dfs(current, target, visited, path, edges) {
        if (paths.length >= maxPaths) return;
        if (current === target) {
            paths.push({
                path: [...path],
                edges: [...edges],
                distance: calculatePathDistance(edges),
            });
            return;
        }

        const node = graph[current];
        for (const neighbor of node.neighbors) {
            if (!visited.has(neighbor.nodeId)) {
                visited.add(neighbor.nodeId);
                path.push(neighbor.nodeId);
                edges.push(neighbor.edgeId);
                dfs(neighbor.nodeId, target, visited, path, edges);
                path.pop();
                edges.pop();
                visited.delete(neighbor.nodeId);
            }
        }
    }

    const visited = new Set([startNodeId]);
    dfs(startNodeId, endNodeId, visited, [startNodeId], []);

    return {
        success: paths.length > 0,
        paths: paths.sort((a, b) => a.distance - b.distance),
        pathCount: paths.length,
    };
}

// ============================================================================
// COST ESTIMATION UTILITIES
// ============================================================================

const COST_PER_KM = {
    'DI': 80000,
    'CI': 60000,
    'HDPE': 40000,
    'PVC': 30000,
    'MS': 70000,
};

const INSTALLATION_COST_PER_KM = 50000;

function calculateConnectionCost(distance, edges) {
    const maintenanceFee = 5000;
    const connectionFee = 10000;
    return maintenanceFee + connectionFee;
}

function calculateNewPipeCost(distanceKm) {
    const pipeCost = distanceKm * COST_PER_KM['HDPE'];
    const installCost = distanceKm * INSTALLATION_COST_PER_KM;
    const fittingCost = 5000;
    const laborCost = distanceKm * 20000;

    const total = pipeCost + installCost + fittingCost + laborCost;

    return {
        pipeMaterial: Math.round(pipeCost),
        installation: Math.round(installCost),
        fittings: fittingCost,
        labor: Math.round(laborCost),
        total: Math.round(total),
        formatted: `₹${Math.round(total).toLocaleString('en-IN')}`,
    };
}

function calculatePathDistance(edgeIds) {
    return edgeIds.reduce((total, edgeId) => {
        const edge = PIPELINE_EDGES.find(e => e.id === edgeId);
        return total + (edge ? edge.distance : 0);
    }, 0);
}

module.exports = {
    dijkstra,
    findOptimalConnectionRoute,
    traceDownstream,
    findAllPaths,
};
