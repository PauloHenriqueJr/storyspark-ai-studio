declare module 'dagre' {
  export namespace graphlib {
    class Graph {
      constructor();
      setDefaultEdgeLabel(fn: () => any): void;
      setGraph(config: any): void;
      setNode(id: string, value: any): void;
      setEdge(source: string, target: string): void;
      node(id: string): any;
      nodes(): string[];
      edges(): Array<{ v: string; w: string }>;
    }
  }

  export function layout(graph: graphlib.Graph): void;
}