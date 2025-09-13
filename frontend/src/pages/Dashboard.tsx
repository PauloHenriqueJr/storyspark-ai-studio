import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Upload,
  FolderPlus,
  Workflow,
  TrendingUp,
  Clock,
  Users,
  CheckSquare,
  Play,
  ArrowRight,
  Zap,
  FileText,
  Github
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useChatDockStore } from '@/lib/store';

const templates = [
  {
    id: 'github-triage',
    title: 'Triage GitHub Issues',
    description: 'Automatically categorize and prioritize GitHub issues using AI',
    icon: Github,
    tags: ['Development', 'Productivity'],
  },
  {
    id: 'lead-scoring',
    title: 'Score Inbound Leads',
    description: 'Evaluate and score sales leads based on multiple criteria',
    icon: TrendingUp,
    tags: ['Sales', 'CRM'],
  },
  {
    id: 'content-pipeline',
    title: 'Content Marketing Pipeline',
    description: 'Research, create, and distribute content automatically',
    icon: FileText,
    tags: ['Marketing', 'Content'],
  },
  {
    id: 'customer-support',
    title: 'Customer Support Bot',
    description: 'Handle customer inquiries and escalate complex issues',
    icon: Users,
    tags: ['Support', 'Customer Service'],
  },
];

const mockProjects = [
  {
    id: '1',
    name: 'Customer Support AI',
    description: 'Automated customer support system',
    lastRun: '2 hours ago',
    status: 'active',
    agents: 3,
    tasks: 5,
  },
  {
    id: '2',
    name: 'Content Marketing Pipeline',
    description: 'AI-powered content creation workflow',
    lastRun: '1 day ago',
    status: 'idle',
    agents: 4,
    tasks: 8,
  },
  {
    id: '3',
    name: 'Data Analysis Crew',
    description: 'Automated data analysis and reporting',
    lastRun: '3 days ago',
    status: 'idle',
    agents: 2,
    tasks: 4,
  },
];

export default function Dashboard() {
  const [prompt, setPrompt] = useState('');
  const navigate = useNavigate();
  const { setOpen: setChatOpen } = useChatDockStore();

  const handlePromptSubmit = () => {
    if (prompt.trim()) {
      // Navigate to editor and open AI Builder with the prompt
      navigate('/app/editor', { state: { prompt } });
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      const templatePrompt = `Create a ${template.title} automation: ${template.description}`;
      navigate('/app/editor', { state: { prompt: templatePrompt } });
    }
  };

  const handleCreateNew = () => {
    navigate('/app/projects');
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'import':
        navigate('/app/import');
        break;
      case 'editor':
        navigate('/app/editor');
        break;
      case 'new-project':
        navigate('/app/projects');
        break;
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-12">
        <h1 className="text-hero mb-6 bg-gradient-to-r from-heading to-primary bg-clip-text text-transparent">
          Build Creative AI Automations
        </h1>
        <p className="text-subtitle mb-8 max-w-2xl mx-auto">
          Design intelligent storytelling workflows with visual tools. Create AI agents that work together to automate creative content, stories, and narrative-driven processes.
        </p>

        {/* Main Prompt Input */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="relative">
            <Textarea
              placeholder="Descreva sua automação criativa... Ex: 'Criar um sistema que gera histórias personalizadas baseadas no perfil dos usuários e automatiza a distribuição'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px] text-base resize-none pr-20 input-notion"
            />
            <Button
              onClick={handlePromptSubmit}
              disabled={!prompt.trim()}
              className="absolute bottom-4 right-4 btn-primary gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Criar com IA
            </Button>
          </div>
        </div>

        {/* Template Chips */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {templates.map((template) => (
            <Button
              key={template.id}
              variant="outline"
              size="sm"
              onClick={() => handleTemplateSelect(template.id)}
              className="gap-2 hover:bg-muted-hover"
            >
              <template.icon className="h-4 w-4" />
              {template.title}
            </Button>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="card-notion cursor-pointer" onClick={() => handleQuickAction('import')}>
            <CardContent className="p-6 text-center">
              <Upload className="h-8 w-8 text-accent-purple mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Import Workflow</h3>
              <p className="text-sm text-muted-foreground">
                Import JSON, n8n, or ZIP files
              </p>
            </CardContent>
          </Card>

          <Card className="card-notion cursor-pointer" onClick={() => handleQuickAction('new-project')}>
            <CardContent className="p-6 text-center">
              <FolderPlus className="h-8 w-8 text-accent-green mx-auto mb-3" />
              <h3 className="font-semibold mb-2">New Project</h3>
              <p className="text-sm text-muted-foreground">
                Start from scratch with custom agents
              </p>
            </CardContent>
          </Card>

          <Card className="card-notion cursor-pointer" onClick={() => handleQuickAction('editor')}>
            <CardContent className="p-6 text-center">
              <Workflow className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Visual Editor</h3>
              <p className="text-sm text-muted-foreground">
                Design workflows with drag & drop
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Recent Projects */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-title">Recent Projects</h2>
          <Button
            variant="outline"
            onClick={() => navigate('/app/projects')}
            className="gap-2"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockProjects.map((project) => (
            <Card key={project.id} className="card-notion cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {project.description}
                    </CardDescription>
                  </div>
                  <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {project.agents}
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckSquare className="h-4 w-4" />
                      {project.tasks}
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {project.lastRun}
                  </span>
                </div>
                <Button className="w-full btn-secondary gap-2">
                  <Play className="h-4 w-4" />
                  Run Project
                </Button>
              </CardContent>
            </Card>
          ))}

          {/* Create New Card */}
          <Card
            className="card-notion cursor-pointer border-dashed border-2 hover:border-primary transition-colors"
            onClick={handleCreateNew}
          >
            <CardContent className="p-6 text-center flex flex-col items-center justify-center min-h-[200px]">
              <FolderPlus className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Create New Project</h3>
              <p className="text-sm text-muted-foreground">
                Start building your AI automation
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Templates Section */}
      <section>
        <h2 className="text-title mb-6">Popular Templates</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="card-notion cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-muted rounded-radius flex items-center justify-center">
                    <template.icon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {template.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {template.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    className="btn-primary gap-2"
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <Zap className="h-4 w-4" />
                    Use Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}