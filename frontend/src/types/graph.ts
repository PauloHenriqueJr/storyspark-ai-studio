import { Node, Edge } from 'reactflow';
import { Agent } from './agent';
import { Task } from './task';

export type GraphNodeType = 'agent' | 'task';

export interface BaseNodeData {
  refId: string;
  label: string;
  description?: string;
}

export interface AgentNodeData extends BaseNodeData {
  agent: Agent;
  isRunning?: boolean;
  status?: 'idle' | 'running' | 'completed' | 'error';
}

export interface TaskNodeData extends BaseNodeData {
  task: Task;
  agentName?: string;
  isRunning?: boolean;
  status?: 'idle' | 'running' | 'completed' | 'error';
  variables?: string[];
}

export type GraphNode = Node<AgentNodeData | TaskNodeData>;

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  fromRefId: string;
  toRefId: string;
  label?: string;
  type?: string;
  animated?: boolean;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphPosition {
  x: number;
  y: number;
}

// Graph layout options
export interface LayoutOptions {
  direction: 'TB' | 'LR' | 'BT' | 'RL';
  spacing: {
    node: number;
    rank: number;
  };
  align?: 'UL' | 'UR' | 'DL' | 'DR';
}

export const DEFAULT_LAYOUT_OPTIONS: LayoutOptions = {
  direction: 'TB',
  spacing: {
    node: 100,
    rank: 150,
  },
  align: 'UL',
};

// Node styles and dimensions
export const NODE_DIMENSIONS = {
  agent: { width: 280, height: 180 },
  task: { width: 300, height: 160 },
};

// Connection validation
export interface ConnectionValidation {
  isValid: boolean;
  reason?: string;
}

export function validateConnection(
  sourceType: GraphNodeType,
  targetType: GraphNodeType,
  sourceData: any,
  targetData: any
): ConnectionValidation {
  // Agent can connect to Task
  if (sourceType === 'agent' && targetType === 'task') {
    return { isValid: true };
  }
  
  // Task can connect to Agent (for chaining)
  if (sourceType === 'task' && targetType === 'agent') {
    return { isValid: true };
  }
  
  // Agent cannot directly connect to Agent
  if (sourceType === 'agent' && targetType === 'agent') {
    return { 
      isValid: false, 
      reason: 'Agents cannot connect directly. Use a Task between them.' 
    };
  }
  
  // Task cannot directly connect to Task
  if (sourceType === 'task' && targetType === 'task') {
    return { 
      isValid: false, 
      reason: 'Tasks cannot connect directly. Use an Agent between them.' 
    };
  }
  
  return { isValid: false, reason: 'Invalid connection type' };
}

// Convert agents and tasks to graph format
export function createGraphFromProject(agents: Agent[], tasks: Task[]): GraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  
  // Create agent nodes
  agents.forEach((agent, index) => {
    nodes.push({
      id: `agent-${agent.id}`,
      type: 'agent',
      position: { x: index * 350, y: 0 },
      data: {
        refId: agent.id,
        label: agent.name,
        description: agent.role,
        agent,
      },
    });
  });
  
  // Create task nodes and connections
  tasks.forEach((task, index) => {
    const taskNode: GraphNode = {
      id: `task-${task.id}`,
      type: 'task',
      position: { x: index * 350, y: 250 },
      data: {
        refId: task.id,
        label: task.description.slice(0, 50) + '...',
        description: task.expected_output,
        task,
        agentName: agents.find(a => a.id === task.agent_id)?.name,
      },
    };
    nodes.push(taskNode);
    
    // Create edge from agent to task
    if (task.agent_id) {
      edges.push({
        id: `agent-${task.agent_id}-task-${task.id}`,
        source: `agent-${task.agent_id}`,
        target: `task-${task.id}`,
        fromRefId: task.agent_id,
        toRefId: task.id,
        type: 'smoothstep',
        animated: false,
      });
    }
  });
  
  return { nodes, edges };
}

// Auto-layout algorithm
export function applyAutoLayout(
  nodes: GraphNode[], 
  edges: GraphEdge[], 
  options: LayoutOptions = DEFAULT_LAYOUT_OPTIONS
): GraphNode[] {
  // Simple hierarchical layout
  const agentNodes = nodes.filter(n => n.type === 'agent');
  const taskNodes = nodes.filter(n => n.type === 'task');
  
  // Position agents in top row
  const agentY = 0;
  agentNodes.forEach((node, index) => {
    node.position = {
      x: index * (NODE_DIMENSIONS.agent.width + options.spacing.node),
      y: agentY,
    };
  });
  
  // Position tasks in bottom row, aligned with their agents
  const taskY = NODE_DIMENSIONS.agent.height + options.spacing.rank;
  taskNodes.forEach((node) => {
    const task = (node.data as TaskNodeData).task;
    const agentIndex = agentNodes.findIndex(
      agentNode => (agentNode.data as AgentNodeData).agent.id === task.agent_id
    );
    
    if (agentIndex >= 0) {
      node.position = {
        x: agentIndex * (NODE_DIMENSIONS.agent.width + options.spacing.node),
        y: taskY,
      };
    }
  });
  
  return nodes;
}