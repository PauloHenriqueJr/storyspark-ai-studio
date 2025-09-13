import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface FeatureShowcaseProps {
  icon: LucideIcon;
  title: string;
  description: string;
  highlight: string;
  className?: string;
}

export function FeatureShowcase({ icon: Icon, title, description, highlight, className = "" }: FeatureShowcaseProps) {
  return (
    <Card className={`card-notion p-6 group hover:scale-105 transition-all duration-300 ${className}`}>
      <CardHeader className="p-0 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <Badge variant="outline" className="text-xs">{highlight}</Badge>
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}