import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Sparkles, Bot, Zap, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

const Auth = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (type: 'login' | 'register') => {
    setIsLoading(true);
    try {
      if (type === 'login') {
        const email = (document.getElementById('login-email') as HTMLInputElement)?.value;
        const password = (document.getElementById('login-password') as HTMLInputElement)?.value;
        const res = await apiClient.auth.login(email, password);
        localStorage.setItem('token', res.access_token);
        toast({ title: 'Login realizado!', description: 'Redirecionando para o dashboard...' });
        navigate('/app/dashboard');
      } else {
        const email = (document.getElementById('register-email') as HTMLInputElement)?.value;
        const password = (document.getElementById('register-password') as HTMLInputElement)?.value;
        const confirm = (document.getElementById('register-confirm') as HTMLInputElement)?.value;
        if (password !== confirm) throw new Error('As senhas não conferem');
        const res = await apiClient.auth.register(email, password);
        localStorage.setItem('token', res.access_token);
        toast({ title: 'Cadastro realizado!', description: 'Redirecionando para o dashboard...' });
        navigate('/app/dashboard');
      }
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message || 'Falha na autenticação', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent-purple/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden lg:block space-y-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-lg">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold text-heading">StorySpark</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-md">
              Plataforma de automação criativa com IA que democratiza a criação de workflows inteligentes
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="flex items-center justify-center w-10 h-10 bg-accent-purple/20 rounded-lg">
                <Bot className="w-5 h-5 text-accent-purple" />
              </div>
              <div>
                <h3 className="font-semibold text-heading">Agentes Especializados</h3>
                <p className="text-muted-foreground text-sm">Crie agentes de IA com personalidades e ferramentas específicas</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex items-center justify-center w-10 h-10 bg-accent-green/20 rounded-lg">
                <Zap className="w-5 h-5 text-accent-green" />
              </div>
              <div>
                <h3 className="font-semibold text-heading">Automação Inteligente</h3>
                <p className="text-muted-foreground text-sm">Workflows que conectam criatividade humana com IA</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex items-center justify-center w-10 h-10 bg-primary/20 rounded-lg">
                <ArrowRight className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-heading">Execução em Tempo Real</h3>
                <p className="text-muted-foreground text-sm">Monitore e controle suas automações com feedback instantâneo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <Card className="card-notion border-2">
            <CardHeader className="text-center space-y-4">
              <div className="lg:hidden flex items-center justify-center space-x-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold text-heading">StorySpark</h1>
              </div>
              <CardTitle className="text-2xl text-heading">Bem-vindo</CardTitle>
              <CardDescription>
                Entre na sua conta ou crie uma nova para começar a criar automações incríveis
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="login" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Entrar</TabsTrigger>
                  <TabsTrigger value="register">Cadastrar</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4">
                  <form onSubmit={(e) => { e.preventDefault(); handleAuth('login'); }} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        className="input-notion"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">Senha</Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="input-notion pr-10"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
                      {isLoading ? 'Entrando...' : 'Entrar'}
                    </Button>
                  </form>

                  <div className="text-center">
                    <Link to="#" className="text-sm text-primary hover:text-primary-hover">
                      Esqueceu a senha?
                    </Link>
                  </div>
                </TabsContent>

                <TabsContent value="register" className="space-y-4">
                  <form onSubmit={(e) => { e.preventDefault(); handleAuth('register'); }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-name">Nome</Label>
                        <Input
                          id="register-name"
                          placeholder="Seu nome"
                          className="input-notion"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-lastname">Sobrenome</Label>
                        <Input
                          id="register-lastname"
                          placeholder="Sobrenome"
                          className="input-notion"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="seu@email.com"
                        className="input-notion"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-password">Senha</Label>
                      <div className="relative">
                        <Input
                          id="register-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="input-notion pr-10"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-confirm">Confirmar Senha</Label>
                      <Input
                        id="register-confirm"
                        type="password"
                        placeholder="••••••••"
                        className="input-notion"
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
                      {isLoading ? 'Criando conta...' : 'Criar conta'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>

            <CardFooter className="text-center text-sm text-muted-foreground">
              Ao continuar, você concorda com nossos{' '}
              <Link to="#" className="text-primary hover:text-primary-hover">Termos de Uso</Link>
              {' '}e{' '}
              <Link to="#" className="text-primary hover:text-primary-hover">Política de Privacidade</Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
