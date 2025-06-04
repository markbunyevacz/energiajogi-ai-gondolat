export class Graph {
  private nodes: Map<string, any> = new Map();
  private edges: Map<string, Set<{target: string, type: string}>> = new Map();

  addNode(nodeId: string, data?: any): void {
    if (!this.nodes.has(nodeId)) {
      this.nodes.set(nodeId, data || {});
    }
    if (!this.edges.has(nodeId)) {
      this.edges.set(nodeId, new Set());
    }
  }

  addEdge(source: string, target: string, type: string = 'explicit'): void {
    this.addNode(source);
    this.addNode(target);
    this.edges.get(source)?.add({target, type});
  }

  get(nodeId: string): Set<{target: string, type: string}> | undefined {
    return this.edges.get(nodeId);
  }

  entries(): IterableIterator<[string, Set<{target: string, type: string}>]> {
    return this.edges.entries();
  }

  getImpactChain(changedDocId: string, maxDepth: number = 5): string[] {
    const visited = new Set<string>();
    const impactChain: string[] = [];
    const queue: {id: string, depth: number}[] = [{id: changedDocId, depth: 0}];

    while (queue.length > 0) {
      const {id, depth} = queue.shift()!;
      if (visited.has(id) || depth > maxDepth) continue;
      
      visited.add(id);
      impactChain.push(id);
      
      const neighbors = this.edges.get(id) || new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.target)) {
          queue.push({id: neighbor.target, depth: depth + 1});
        }
      }
    }

    return impactChain;
  }

  getReverseImpactChain(targetDocId: string, maxDepth: number = 5): string[] {
    const visited = new Set<string>();
    const impactChain: string[] = [];
    const queue: {id: string, depth: number}[] = [{id: targetDocId, depth: 0}];

    while (queue.length > 0) {
      const {id, depth} = queue.shift()!;
      if (visited.has(id) || depth > maxDepth) continue;
      
      visited.add(id);
      impactChain.push(id);
      
      for (const [sourceId, edges] of this.edges.entries()) {
        for (const edge of edges) {
          if (edge.target === id && !visited.has(sourceId)) {
            queue.push({id: sourceId, depth: depth + 1});
          }
        }
      }
    }

    return impactChain;
  }

  toJSON() {
    return {
      nodes: Object.fromEntries(this.nodes),
      edges: Object.fromEntries(
        Array.from(this.edges.entries()).map(([key, value]) => 
          [key, Array.from(value)]
        )
      )
    };
  }
} 