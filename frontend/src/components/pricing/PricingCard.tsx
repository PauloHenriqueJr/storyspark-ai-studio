import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, Star } from "lucide-react";
import { Link } from "react-router-dom";

interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
  stripeLink: string;
  stripePriceId?: string; // For Stripe integration
}

export function PricingCard({ 
  name, 
  price, 
  period, 
  description, 
  features, 
  cta, 
  popular = false, 
  stripeLink,
  stripePriceId 
}: PricingCardProps) {
  const handleSubscribe = () => {
    // This will be implemented when Stripe is integrated
    if (stripePriceId) {
      // Stripe checkout logic here
      console.log('Starting Stripe checkout for:', stripePriceId);
    } else {
      // Redirect to app for free plan
      window.location.href = '/app/dashboard';
    }
  };

  return (
    <Card className={`card-notion relative ${popular ? 'border-primary scale-105' : ''}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="gap-2">
            <Star className="h-3 w-3" />
            Mais Popular
          </Badge>
        </div>
      )}
      <CardHeader className="text-center space-y-4">
        <CardTitle className="text-xl">{name}</CardTitle>
        <div className="space-y-2">
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-3xl font-bold">{price}</span>
            <span className="text-muted-foreground text-sm">/{period}</span>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <ul className="space-y-3">
          {features.map((feature, j) => (
            <li key={j} className="flex items-center gap-3 text-sm">
              <Check className="h-4 w-4 text-success flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Button 
          className={`w-full ${popular ? '' : 'variant-outline'}`}
          variant={popular ? 'default' : 'outline'}
          onClick={handleSubscribe}
        >
          {cta}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}