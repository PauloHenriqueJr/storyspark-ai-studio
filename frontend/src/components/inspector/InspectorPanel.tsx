import React, { useState } from 'react';
import { X, Edit3, Save, Bot, CheckSquare, Brain, Users, Clock, FileText, Zap, AlertCircle, CheckCircle, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { AgentNodeData } from '@/components/nodes/AgentNode';
import { TaskNodeData } from '@/components/nodes/TaskNode';
import { toast } from 'sonner';

interface InspectorPanelProps {
    selectedNode: {
        id: string;
        type: string;
        data: Record<string, unknown>;
        position: { x: number; y: number };
    };
    onClose: () => void;
    onUpdateNode: (nodeId: string, updates: Record<string, unknown>) => void;
    onDeleteNode: (nodeId: string) => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
    selectedNode,
    onClose,
    onUpdateNode,
    onDeleteNode,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<any>({});

    const isAgentNode = selectedNode?.type === 'agent';
    const isTaskNode = selectedNode?.type === 'task';

    const handleEdit = () => {
        if (isEditing) {
            // Save changes
            onUpdateNode(selectedNode.id, editData);
            setIsEditing(false);
            toast.success('Node updated successfully');
        } else {
            // Start editing
            setEditData(selectedNode.data || {});
            setIsEditing(true);
        }
    };

    const handleCancel = () => {
        setEditData({});
        setIsEditing(false);
    };

    const getStatusIcon = (status?: string) => {
        switch (status) {
            case 'running':
                return <Play className="w-4 h-4 text-blue-500" />;
            case 'completed':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'failed':
                return <AlertCircle className="w-4 h-4 text-red-500" />;
            default:
                return <Pause className="w-4 h-4 text-gray-400" />;
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'running':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
            case 'completed':
                return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
            case 'failed':
                return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    const renderAgentInspector = () => {
        const data = isEditing ? editData : (selectedNode.data as unknown as AgentNodeData);

        return (
            <div className="space-y-6">
                {/* Header Section */}
                <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-lg">{data.name || 'Agent'}</CardTitle>
                                <p className="text-sm text-muted-foreground">{data.role || 'Role not defined'}</p>
                            </div>
                            <Badge className={cn("flex items-center gap-1", getStatusColor(data.status))}>
                                {getStatusIcon(data.status)}
                                {data.status || 'idle'}
                            </Badge>
                        </div>
                    </CardHeader>
                </Card>

                {/* Basic Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Edit3 className="w-4 h-4" />
                            Basic Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Name</label>
                                {isEditing ? (
                                    <Input
                                        value={editData.name || ''}
                                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                        className="mt-1"
                                    />
                                ) : (
                                    <p className="text-sm font-medium mt-1">{data.name || 'Not set'}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Role</label>
                                {isEditing ? (
                                    <Input
                                        value={editData.role || ''}
                                        onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                                        className="mt-1"
                                    />
                                ) : (
                                    <p className="text-sm font-medium mt-1">{data.role || 'Not set'}</p>
                                )}
                            </div>
                        </div>

                        {(!isEditing || editData.goal !== undefined) && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Goal</label>
                                {isEditing ? (
                                    <Textarea
                                        value={editData.goal || ''}
                                        onChange={(e) => setEditData({ ...editData, goal: e.target.value })}
                                        className="mt-1"
                                        rows={2}
                                    />
                                ) : (
                                    <p className="text-sm mt-1">{data.goal || 'No goal defined'}</p>
                                )}
                            </div>
                        )}

                        {(!isEditing || editData.backstory !== undefined) && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Backstory</label>
                                {isEditing ? (
                                    <Textarea
                                        value={editData.backstory || ''}
                                        onChange={(e) => setEditData({ ...editData, backstory: e.target.value })}
                                        className="mt-1"
                                        rows={3}
                                    />
                                ) : (
                                    <p className="text-sm mt-1">{data.backstory || 'No backstory defined'}</p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Capabilities */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            Capabilities
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Tools */}
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">Tools</label>
                            {data.tools && data.tools.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {data.tools.map((tool: string, idx: number) => (
                                        <Badge key={idx} variant="secondary" className="text-xs">
                                            {tool}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No tools assigned</p>
                            )}
                        </div>

                        {/* Features */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                                <Brain className={cn("w-4 h-4", data.memory ? "text-green-500" : "text-gray-400")} />
                                <span className="text-sm">Memory</span>
                                <Badge variant={data.memory ? "default" : "secondary"} className="text-xs">
                                    {data.memory ? 'Enabled' : 'Disabled'}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className={cn("w-4 h-4", data.delegation ? "text-green-500" : "text-gray-400")} />
                                <span className="text-sm">Delegation</span>
                                <Badge variant={data.delegation ? "default" : "secondary"} className="text-xs">
                                    {data.delegation ? 'Enabled' : 'Disabled'}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Status Indicators */}
                {(data.isCreating || data.isRunning) && (
                    <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                                {data.isCreating && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                                        <span className="text-sm font-medium text-purple-600">Being created by AI</span>
                                    </div>
                                )}
                                {data.isRunning && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                        <span className="text-sm font-medium text-blue-600">Currently running</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        );
    };

    const renderTaskInspector = () => {
        const data = isEditing ? editData : (selectedNode.data as unknown as TaskNodeData);

        return (
            <div className="space-y-6">
                {/* Header Section */}
                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                                <CheckSquare className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-lg">Task</CardTitle>
                                <p className="text-sm text-muted-foreground line-clamp-2">{data.description || 'Task description'}</p>
                            </div>
                            <Badge className={cn("flex items-center gap-1", getStatusColor(data.status))}>
                                {getStatusIcon(data.status)}
                                {data.status || 'pending'}
                            </Badge>
                        </div>
                    </CardHeader>
                </Card>

                {/* Task Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Task Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Description</label>
                            {isEditing ? (
                                <Textarea
                                    value={editData.description || ''}
                                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                    className="mt-1"
                                    rows={3}
                                />
                            ) : (
                                <p className="text-sm mt-1">{data.description || 'No description'}</p>
                            )}
                        </div>

                        {(!isEditing || editData.expectedOutput !== undefined) && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Expected Output</label>
                                {isEditing ? (
                                    <Textarea
                                        value={editData.expectedOutput || ''}
                                        onChange={(e) => setEditData({ ...editData, expectedOutput: e.target.value })}
                                        className="mt-1"
                                        rows={2}
                                    />
                                ) : (
                                    <p className="text-sm mt-1">{data.expectedOutput || 'No expected output defined'}</p>
                                )}
                            </div>
                        )}

                        {(!isEditing || editData.outputFile !== undefined) && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Output File</label>
                                {isEditing ? (
                                    <Input
                                        value={editData.outputFile || ''}
                                        onChange={(e) => setEditData({ ...editData, outputFile: e.target.value })}
                                        className="mt-1"
                                        placeholder="e.g., result.txt"
                                    />
                                ) : (
                                    <p className="text-sm mt-1">{data.outputFile || 'No output file specified'}</p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Assignment & Execution */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Assignment & Execution
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">Assigned Agent</span>
                            </div>
                            <Badge variant={data.agentName ? "default" : "secondary"}>
                                {data.agentName || 'Unassigned'}
                            </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock className={cn("w-4 h-4", data.async ? "text-orange-500" : "text-muted-foreground")} />
                                <span className="text-sm">Async Execution</span>
                            </div>
                            <Badge variant={data.async ? "default" : "secondary"}>
                                {data.async ? 'Enabled' : 'Disabled'}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Status Indicators */}
                {(data.isCreating || data.isRunning) && (
                    <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                                {data.isCreating && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                        <span className="text-sm font-medium text-green-600">Being created by AI</span>
                                    </div>
                                )}
                                {data.isRunning && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                        <span className="text-sm font-medium text-blue-600">Currently executing</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        );
    };

    return (
        <div className="w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-xl overflow-y-auto max-h-screen">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 z-10">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Inspector</h2>
                    <div className="flex items-center gap-2">
                        {isEditing && (
                            <Button variant="outline" size="sm" onClick={handleCancel}>
                                Cancel
                            </Button>
                        )}
                        <Button
                            variant={isEditing ? "default" : "outline"}
                            size="sm"
                            onClick={handleEdit}
                            className="flex items-center gap-2"
                        >
                            {isEditing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                            {isEditing ? 'Save' : 'Edit'}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="p-4">
                {isAgentNode && renderAgentInspector()}
                {isTaskNode && renderTaskInspector()}

                {!isAgentNode && !isTaskNode && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center py-8">
                                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h4 className="font-medium mb-2">Unknown Node Type</h4>
                                <p className="text-sm text-muted-foreground">
                                    This node type is not supported by the inspector.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Actions */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDeleteNode(selectedNode.id)}
                        className="w-full"
                    >
                        Delete Node
                    </Button>
                </div>
            </div>
        </div>
    );
};