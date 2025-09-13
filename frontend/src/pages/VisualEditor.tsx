import { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import {
  Play,
  RotateCcw,
  RotateCw,
  Download,
  Maximize,
  Users,
  CheckSquare,
  Plus,
  Settings,
  Layers,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';
import { useChatDockStore } from '@/lib/store';

// Mock node types for the visual editor
const initialNodes = [
  {
    id: '1',
    type: 'default',
    position: { x: 250, y: 100 },
    data: {
      label: (
        <div className="p-4 bg-surface border border-border rounded-radius-lg shadow-sm min-w-[280px]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-accent-purple rounded-radius flex items-center justify-center">
              <Users className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Support Specialist</h3>
              <p className="text-xs text-muted-foreground">Customer Support Agent</p>
            </div>
            <Badge variant="secondary" className="ml-auto text-xs">Active</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Handle customer inquiries efficiently and escalate complex issues
          </p>
          <div className="flex gap-1 mb-3">
            <Badge variant="outline" className="text-xs">WebSearch</Badge>
            <Badge variant="outline" className="text-xs">Email</Badge>
            <Badge variant="outline" className="text-xs">Slack</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Memory: ✓</span>
              <span>Delegation: ✓</span>
            </div>
            <Button size="sm" variant="ghost" className="p-1">
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )
    },
  },
  {
    id: '2',
    type: 'default',
    position: { x: 250, y: 350 },
    data: {
      label: (
        <div className="p-4 bg-surface border border-border rounded-radius-lg shadow-sm min-w-[300px]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-accent-green rounded-radius flex items-center justify-center">
              <CheckSquare className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Analyze Customer Inquiry</h3>
              <p className="text-xs text-muted-foreground">Process and categorize support request</p>
            </div>
            <Badge variant="outline" className="text-xs">Required</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Expected: Structured analysis with category, priority, and suggested response
          </p>
          <div className="flex gap-1 mb-3">
            <Badge variant="outline" className="text-xs">WebSearch</Badge>
            <Badge variant="outline" className="text-xs">Email</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Variables: {'{topic}, {customer_email}'}</span>
            <Button size="sm" variant="ghost" className="p-1">
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )
    },
  },
  {
    id: '3',
    type: 'default',
    position: { x: 650, y: 100 },
    data: {
      label: (
        <div className="p-4 bg-surface border border-border rounded-radius-lg shadow-sm min-w-[280px]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-accent-yellow rounded-radius flex items-center justify-center">
              <Users className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Technical Expert</h3>
              <p className="text-xs text-muted-foreground">Technical Support Specialist</p>
            </div>
            <Badge variant="secondary" className="ml-auto text-xs">Idle</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Resolve technical issues and provide detailed guidance
          </p>
          <div className="flex gap-1 mb-3">
            <Badge variant="outline" className="text-xs">CodeTool</Badge>
            <Badge variant="outline" className="text-xs">GitHub</Badge>
            <Badge variant="outline" className="text-xs">Database</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Memory: ✓</span>
              <span>Delegation: ✗</span>
            </div>
            <Button size="sm" variant="ghost" className="p-1">
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )
    },
  },
];

const initialEdges = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'smoothstep',
    animated: true,
    style: { stroke: 'hsl(var(--primary))' },
  },
];

export default function VisualEditor() {
  const location = useLocation();
  const { toast } = useToast();
  const { initializeWithPrompt } = useChatDockStore();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Get project ID from URL
  const projectId = new URLSearchParams(location.search).get('projectId');

  // Check if we received a prompt from Dashboard and auto-start AI Builder
  useEffect(() => {
    const state = location.state as { prompt?: string };
    if (state?.prompt) {
      initializeWithPrompt(state.prompt);
      // Clear the state to prevent reopening on navigation
      window.history.replaceState({}, document.title);
    }
  }, [location.state, initializeWithPrompt]);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onNodeClick = useCallback((_event: any, node: any) => {
    setSelectedNode(node);
    setIsInspectorOpen(true);
  }, []);

  const handleRunWorkflow = async () => {
    if (!projectId) {
      toast({
        title: "Erro",
        description: "ID do projeto não encontrado",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    try {
      const execution = await apiClient.executeProject(projectId, {
        inputs: {},
        language: 'pt-br'
      });

      toast({
        title: "Workflow Executado",
        description: `Execução iniciada com ID: ${(execution as any).id}`,
      });
    } catch (error) {
      console.error('Error running workflow:', error);
      toast({
        title: "Erro",
        description: "Falha ao executar workflow",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleValidate = () => {
    // Basic validation - check if there are nodes and edges
    const hasNodes = nodes.length > 0;
    const hasEdges = edges.length > 0;

    if (hasNodes && hasEdges) {
      toast({
        title: "Workflow Válido",
        description: "O workflow está configurado corretamente",
      });
    } else {
      toast({
        title: "Workflow Inválido",
        description: "Adicione agentes e conexões ao workflow",
        variant: "destructive",
      });
    }
  };

  const handleAutoLayout = () => {
    // Simple auto-layout - arrange nodes in a grid
    const updatedNodes = nodes.map((node, index) => ({
      ...node,
      position: {
        x: (index % 3) * 300 + 100,
        y: Math.floor(index / 3) * 200 + 100,
      },
    }));
    setNodes(updatedNodes);

    toast({
      title: "Layout Aplicado",
      description: "Os nós foram reorganizados automaticamente",
    });
  };

  const handleExportPNG = () => {
    // For now, just show a message - full PNG export would require additional libraries
    toast({
      title: "Export PNG",
      description: "Funcionalidade de export PNG será implementada em breve",
    });
  };

  return (
    <div className="h-[calc(100vh-var(--topbar-height)-3rem)] flex">
      {/* Main Canvas */}
      <div className="flex-1 relative">
        {/* Toolbar */}
        <div className="absolute top-4 left-4 z-10 bg-surface border border-border rounded-radius-lg shadow-lg p-2 flex gap-2">
          <Button onClick={handleRunWorkflow} className="btn-primary gap-2" size="sm" disabled={isRunning}>
            <Play className="h-4 w-4" />
            {isRunning ? 'Executando...' : 'Run'}
          </Button>
          <Button onClick={handleValidate} variant="outline" size="sm">
            Validate
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button onClick={handleAutoLayout} variant="ghost" size="sm">
            <Layers className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Maximize className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button onClick={handleExportPNG} variant="ghost" size="sm">
            <Download className="h-4 w-4" />
          </Button>
        </div>

        {/* Toolbox */}
        <div className="absolute top-4 right-4 z-10 bg-surface border border-border rounded-radius-lg shadow-lg p-4 w-64">
          <h3 className="font-semibold text-sm mb-3">Toolbox</h3>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start gap-2" size="sm">
              <Users className="h-4 w-4" />
              Add Agent
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" size="sm">
              <CheckSquare className="h-4 w-4" />
              Add Task
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" size="sm">
              <Plus className="h-4 w-4" />
              Add Connection
            </Button>
          </div>
        </div>

        {/* React Flow Canvas */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          className="bg-background"
          fitView
          attributionPosition="bottom-left"
        >
          <Controls position="bottom-left" />
          <MiniMap
            position="bottom-right"
            className="bg-surface border border-border rounded-radius"
            nodeColor="hsl(var(--primary))"
            maskColor="hsl(var(--muted) / 0.5)"
          />
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="hsl(var(--border))"
          />
        </ReactFlow>
      </div>

      {/* Inspector Panel */}
      {isInspectorOpen && (
        <div className="w-80 bg-surface border-l border-border p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Inspector</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsInspectorOpen(false)}
            >
              ✕
            </Button>
          </div>

          {selectedNode ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Node Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">ID</label>
                    <p className="text-sm text-muted-foreground">{selectedNode.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <p className="text-sm text-muted-foreground">{selectedNode.type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Position</label>
                    <p className="text-sm text-muted-foreground">
                      x: {selectedNode.position.x}, y: {selectedNode.position.y}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Properties</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Select a node to edit its properties
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8">
              <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="font-medium mb-2">No Selection</h4>
              <p className="text-sm text-muted-foreground">
                Click on a node or edge to inspect and edit its properties
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}