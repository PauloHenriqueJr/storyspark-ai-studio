import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play } from 'lucide-react';

export default function Run() {
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = () => {
    setIsRunning(!isRunning);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-title">Executar Projetos</h1>
        <p className="text-muted-foreground">Teste mínimo</p>
      </div>

      <Card className="card-notion">
        <CardContent className="p-6">
          <Button onClick={handleRun} className="w-full btn-primary gap-2 h-12 text-base">
            <Play className="h-5 w-5" /> {isRunning ? 'Parar' : 'Executar'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
