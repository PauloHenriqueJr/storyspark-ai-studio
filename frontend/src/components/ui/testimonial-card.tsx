import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

interface TestimonialCardProps {
  name: string;
  role: string;
  company: string;
  avatar: string;
  content: string;
  rating: number;
  category?: string;
  className?: string;
}

export function TestimonialCard({ 
  name, 
  role, 
  company, 
  avatar, 
  content, 
  rating, 
  category,
  className = "" 
}: TestimonialCardProps) {
  return (
    <Card className={`card-notion p-6 ${className}`}>
      <CardContent className="p-0 space-y-4">
        <div className="flex items-center gap-3">
          {category && <Badge variant="secondary">{category}</Badge>}
          <div className="flex gap-1">
            {[...Array(rating)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-primary text-primary" />
            ))}
          </div>
        </div>
        <blockquote className="text-sm leading-relaxed">
          "{content}"
        </blockquote>
        <div className="flex items-center gap-3">
          <img src={avatar} alt={name} className="w-10 h-10 rounded-full" />
          <div>
            <p className="font-medium text-sm">{name}</p>
            <p className="text-xs text-muted-foreground">{role}, {company}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}