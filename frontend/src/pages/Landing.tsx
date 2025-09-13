import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { 
  Bot, 
  Zap, 
  Star, 
  Play, 
  Check, 
  ArrowRight, 
  Users, 
  Building,
  Sparkles,
  MessageSquare,
  Workflow,
  Clock,
  BarChart3,
  Palette,
  Brain,
  Globe,
  Shield,
  Rocket,
  Target,
  TrendingUp,
  Quote
} from 'lucide-react';
import { Link } from 'react-router-dom';

const testimonials = [
  {
    name: "Maria Silva",
    role: "Marketing Director",
    company: "TechCorp",
    avatar: "https://avatar.vercel.sh/maria",
    content: "Em 2 semanas automatizei todo meu processo de criação de conteúdo. Meu time agora produz 10x mais em 80% menos tempo.",
    rating: 5
  },
  {
    name: "João Santos",
    role: "Creative Director",
    company: "AgênciaX",
    avatar: "https://avatar.vercel.sh/joao",
    content: "StorySpark mudou completamente como criamos campanhas. Nossos clientes ficaram impressionados com a velocidade e qualidade.",
    rating: 5
  },
  {
    name: "@CreativeAI_Dev",
    role: "Twitter",
    company: "50k followers",
    avatar: "https://avatar.vercel.sh/dev",
    content: "Cara, isso é REVOLUCIONÁRIO! Construí um sistema completo de marketing em 1 hora. É o Zapier dos workflows criativos! 🔥",
    rating: 5
  }
];

const pricingPlans = [
  {
    name: "Free",
    price: "R$ 0",
    period: "para sempre",
    description: "Experimente o poder da automação criativa",
    features: [
      "1 Agente de IA criativo",
      "5 automações por mês",
      "Templates básicos",
      "Comunidade no Discord", 
      "Cartão obrigatório"
    ],
    cta: "Começar Grátis",
    popular: false,
    stripeLink: "#"
  },
  {
    name: "Pro",
    price: "R$ 149",
    period: "por mês",
    description: "Para criadores e pequenas equipes",
    features: [
      "5 Agentes especializados",
      "Automações ilimitadas",
      "Todos os templates premium", 
      "Suporte prioritário",
      "Integrações avançadas",
      "Workflows personalizados",
      "Analytics detalhado"
    ],
    cta: "Começar Teste Grátis",
    popular: true,
    stripeLink: "#pro"
  },
  {
    name: "Business",
    price: "R$ 499",
    period: "por mês",
    description: "Para empresas que querem escalar",
    features: [
      "Agentes ilimitados",
      "Multi-agente workflows",
      "White-label completo",
      "API para integrações",
      "Colaboração em equipe",
      "Treinamento personalizado",
      "Suporte dedicado 24/7",
      "SLA garantido"
    ],
    cta: "Falar com Vendas",
    popular: false,
    stripeLink: "#business"
  }
];

const features = [
  {
    icon: MessageSquare,
    title: "Automação Conversacional",
    description: "Crie workflows complexos apenas conversando com IA. Sem código, sem complicação.",
    highlight: "2 minutos para primeira automação"
  },
  {
    icon: Palette,
    title: "Agentes Criativos Especializados",
    description: "Escritores, designers, marketers e analistas de IA trabalhando 24/7 para você.",
    highlight: "15+ especialidades disponíveis"
  },
  {
    icon: Workflow,
    title: "Editor Visual Drag & Drop",
    description: "Construa fluxos complexos visualmente, como no Figma, mas para automação.",
    highlight: "Interface intuitiva"
  },
  {
    icon: Rocket,
    title: "Deploy em 1 Clique",
    description: "Suas automações funcionam na nuvem 24/7. Configure uma vez, funciona para sempre.",
    highlight: "99.9% uptime garantido"
  },
  {
    icon: Brain,
    title: "Multi-AI Inteligente",
    description: "GPT-4, Claude, Llama - escolha o melhor modelo para cada tarefa automaticamente.",
    highlight: "Otimização de custos automática"
  },
  {
    icon: Globe,
    title: "Integrações Essenciais",
    description: "Slack, Notion, Google Drive, Zapier - conecte com as ferramentas que você já usa.",
    highlight: "Mais integrações em breve"
  }
];

export default function Landing() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    // Apply dark theme by default
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">StorySpark</span>
              <Badge variant="secondary" className="text-xs">AI Studio</Badge>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Recursos
              </a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                Preços
              </a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
                Cases
              </a>
            </div>

            <div className="flex items-center space-x-4">
              {/* Language Selector */}
              <div className="relative group hidden md:block">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Globe className="h-4 w-4" />
                  🇧🇷
                </Button>
                <div className="absolute right-0 top-full mt-1 bg-background border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 min-w-[120px]">
                  <button className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent/50 w-full text-left">
                    <span>🇧🇷</span>
                    <span>Português</span>
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent/50 w-full text-left">
                    <span>🇺🇸</span>
                    <span>English</span>
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent/50 w-full text-left">
                    <span>🇪🇸</span>
                    <span>Español</span>
                  </button>
                </div>
              </div>
              
              <ThemeToggle />
              <Button variant="ghost" size="sm" asChild>
                <Link to="/app/dashboard">Entrar</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/app/dashboard">Começar Grátis</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Storytelling */}
      <section className="py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent-purple/10" />
        <div className="container mx-auto px-4 lg:px-8 relative">
          <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
            <Badge variant="secondary" className="gap-2 animate-pulse">
              <Bot className="h-4 w-4" />
              O futuro da criatividade chegou
            </Badge>
            
            <h1 className={`text-hero transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              Pare de fazer trabalho repetitivo.
              <span className="text-primary block mt-2">Comece a criar o impossível.</span>
            </h1>
            
            <p className={`text-xl text-muted-foreground leading-relaxed max-w-2xl transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              Imagine ter uma equipe de 20 especialistas trabalhando 24/7 para você: escritores, designers, marketers, analistas. 
              <strong className="text-foreground"> Isso é StorySpark.</strong>
            </p>

            <div className={`flex flex-col sm:flex-row gap-4 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <Button size="lg" className="gap-2 text-lg px-8 py-6" asChild>
                <Link to="/app/dashboard">
                  <Rocket className="h-5 w-5" />
                  Criar Primeira Automação
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="gap-2 text-lg px-8 py-6">
                <Play className="h-5 w-5" />
                Ver Demo (2 min)
              </Button>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                Teste gratuito 14 dias
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                Cancele quando quiser
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                Setup em 2 minutos
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 border-y border-border/40">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center space-y-8">
            <p className="text-muted-foreground">Confiado por centenas de criadores e empresas</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, i) => (
                <Card key={i} className="card-notion p-6">
                  <div className="flex items-start gap-4">
                    <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm">{testimonial.name}</span>
                        <Badge variant="secondary" className="text-xs">{testimonial.role}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{testimonial.content}</p>
                      <div className="flex gap-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Story Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <Badge variant="destructive" className="gap-2">
                  <Clock className="h-4 w-4" />
                  O problema que todos enfrentam
                </Badge>
                <h2 className="text-title">
                  Você está perdendo <span className="text-primary">80% do seu tempo</span> com tarefas que um robô faria melhor
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>📝 Escrevendo o mesmo tipo de conteúdo repetidamente</p>
                  <p>🔄 Copiando dados entre 10 ferramentas diferentes</p>
                  <p>⏰ Gastando horas em relatórios que ninguém lê</p>
                  <p>🤯 Fazendo trabalho manual que já era pra ser automático</p>
                </div>
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm">
                    <strong>Resultado:</strong> Você trabalha 12h por dia mas só 2h são realmente criativas. 
                    O resto é só... trabalho robótico.
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square bg-gradient-to-br from-destructive/20 to-destructive/5 rounded-2xl p-8 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <Clock className="h-16 w-16 text-destructive mx-auto" />
                    <p className="text-2xl font-bold text-destructive">80%</p>
                    <p className="text-sm text-muted-foreground">do tempo perdido em tarefas repetitivas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="relative order-2 lg:order-1">
                <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent-purple/20 rounded-2xl p-8 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <Rocket className="h-16 w-16 text-primary mx-auto" />
                    <p className="text-2xl font-bold text-primary">20x</p>
                    <p className="text-sm text-muted-foreground">mais produtivo em 1 semana</p>
                  </div>
                </div>
              </div>
              <div className="space-y-6 order-1 lg:order-2">
                <Badge variant="default" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  A solução que você esperava
                </Badge>
                <h2 className="text-title">
                  E se você pudesse <span className="text-primary">automatizar tudo</span> conversando como se fosse com uma pessoa?
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>💬 "Crie uma campanha de Instagram para meu produto X"</p>
                  <p>🤖 "Analise esses dados e me mande um relatório no Slack"</p>
                  <p>✍️ "Escreva 10 posts para LinkedIn baseados no meu blog"</p>
                  <p>🔄 "Monitore minha concorrência e me avise sobre mudanças"</p>
                </div>
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <p className="text-sm">
                    <strong>Resultado:</strong> Você fala o que quer, a IA faz. 
                    Enquanto isso, você foca no que realmente importa: criar, estratégia, crescimento.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="secondary" className="gap-2">
              <Target className="h-4 w-4" />
              Como funciona na prática
            </Badge>
            <h2 className="text-title">
              Não é só uma ferramenta. <span className="text-primary">É sua nova equipe.</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Cada recurso foi pensado para resolver um problema real que você enfrenta todo dia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <Card key={i} className="card-notion p-6 group hover:scale-105 transition-all duration-300">
                <CardHeader className="p-0 mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <Badge variant="outline" className="text-xs">{feature.highlight}</Badge>
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="secondary" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Preços que fazem sentido
            </Badge>
            <h2 className="text-title">
              Comece grátis. <span className="text-primary">Pague só quando crescer.</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Centenas de usuários já estão automatizando com StorySpark. 
              Comece com 14 dias grátis em qualquer plano.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <Card key={i} className={`card-notion relative ${plan.popular ? 'border-primary scale-105' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="gap-2">
                      <Star className="h-3 w-3" />
                      Mais Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center space-y-4">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground text-sm">/{plan.period}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-3 text-sm">
                        <Check className="h-4 w-4 text-success flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full ${plan.popular ? '' : 'variant-outline'}`}
                    variant={plan.popular ? 'default' : 'outline'}
                    asChild
                  >
                    <Link to="/app/dashboard">
                      {plan.cta}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-sm text-muted-foreground mb-4">
              💳 Cartão obrigatório para todos os planos • 🆓 14 dias grátis • ❌ Cancele quando quiser
            </p>
            <Badge variant="secondary" className="gap-2">
              <Shield className="h-4 w-4" />
              Pagamento 100% seguro com Stripe
            </Badge>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="secondary" className="gap-2">
              <Quote className="h-4 w-4" />
              Resultados reais
            </Badge>
            <h2 className="text-title">
              Resultados <span className="text-primary">comprovados</span> pelos nossos usuários
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="card-notion p-6 bg-gradient-to-br from-success/10 to-success/5 border-success/20">
              <CardContent className="p-0 space-y-4">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">Marketing</Badge>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                </div>
                <blockquote className="text-sm leading-relaxed">
                  "Automatizei toda minha estratégia de conteúdo. De 2h por post para 15 minutos. 
                  Minha audiência cresceu 400% em 3 meses."
                </blockquote>
                <div className="flex items-center gap-3">
                  <img src="https://avatar.vercel.sh/ana" alt="Ana Costa" className="w-10 h-10 rounded-full" />
                  <div>
                    <p className="font-medium text-sm">Ana Costa</p>
                    <p className="text-xs text-muted-foreground">CMO, StartupTech</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-notion p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-0 space-y-4">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">E-commerce</Badge>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                </div>
                <blockquote className="text-sm leading-relaxed">
                  "Integrei com meu Shopify e automatizei descrições de produtos, campanhas e atendimento. 
                  Vendas subiram 250%."
                </blockquote>
                <div className="flex items-center gap-3">
                  <img src="https://avatar.vercel.sh/carlos" alt="Carlos Lima" className="w-10 h-10 rounded-full" />
                  <div>
                    <p className="font-medium text-sm">Carlos Lima</p>
                    <p className="text-xs text-muted-foreground">Founder, ModaOnline</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-notion p-6 bg-gradient-to-br from-accent-purple/10 to-accent-purple/5 border-accent-purple/20">
              <CardContent className="p-0 space-y-4">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">Agência</Badge>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                </div>
                <blockquote className="text-sm leading-relaxed">
                  "Agora entrego projetos em 1 semana que antes levavam 1 mês. 
                  Meus clientes ficam chocados com a velocidade e qualidade."
                </blockquote>
                <div className="flex items-center gap-3">
                  <img src="https://avatar.vercel.sh/pedro" alt="Pedro Souza" className="w-10 h-10 rounded-full" />
                  <div>
                    <p className="font-medium text-sm">Pedro Souza</p>
                    <p className="text-xs text-muted-foreground">CEO, CriativaX</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-transparent to-accent-purple/10">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center space-y-8 max-w-3xl mx-auto">
            <Badge variant="default" className="gap-2">
              <Rocket className="h-4 w-4" />
              Seu momento é agora
            </Badge>
            <h2 className="text-hero">
              Pare de trabalhar <span className="text-primary">PARA</span> a tecnologia.
              <br />Faça ela trabalhar <span className="text-primary">PARA VOCÊ.</span>
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Centenas de criadores já estão vivendo o futuro do trabalho. 
              <strong className="text-foreground"> Quando vai ser sua vez?</strong>
            </p>
            <div className="space-y-4">
              <Button size="lg" className="gap-2 text-lg px-12 py-6" asChild>
                <Link to="/app/dashboard">
                  <Sparkles className="h-5 w-5" />
                  Criar Minha Primeira Automação
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                🆓 14 dias grátis • ⚡ 2 minutos para começar • 💳 Cartão necessário
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/40">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold">StorySpark</span>
              </div>
              <p className="text-sm text-muted-foreground">
                A plataforma que está revolucionando como criadores e empresas trabalham com IA.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Produto</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a href="#features" className="block hover:text-foreground transition-colors">Recursos</a>
                <a href="#pricing" className="block hover:text-foreground transition-colors">Preços</a>
                <Link to="/app/dashboard" className="block hover:text-foreground transition-colors">Demo</Link>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Empresa</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a href="#" className="block hover:text-foreground transition-colors">Sobre</a>
                <a href="#" className="block hover:text-foreground transition-colors">Blog</a>
                <a href="#" className="block hover:text-foreground transition-colors">Carreiras</a>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Suporte</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a href="#" className="block hover:text-foreground transition-colors">Documentação</a>
                <a href="#" className="block hover:text-foreground transition-colors">Discord</a>
                <a href="#" className="block hover:text-foreground transition-colors">Contato</a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border/40 mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2024 StorySpark AI Studio. Feito com ❤️ para revolucionar o futuro do trabalho criativo.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}