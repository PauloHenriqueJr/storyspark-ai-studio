# StorySpark AI Studio

Uma plataforma moderna para criação e gerenciamento de agentes CrewAI, com interface web elegante e arquitetura escalável.

[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/PauloHenriqueJr/storyspark-ai-studio)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://github.com/PauloHenriqueJr/storyspark-ai-studio)

## 🚀 Sobre o Projeto

StorySpark AI Studio é uma interface web completa para criar, gerenciar e executar projetos CrewAI. Inspirado no estilo do app.crewai.com, oferece uma experiência moderna e intuitiva para trabalhar com agentes de IA criativos.

### ✨ Funcionalidades Principais

- **📁 Gerenciamento de Projetos**: CRUD completo de projetos com configurações personalizadas
- **🤖 Configuração de Agentes**: Interface visual para criar agentes com roles, objetivos e ferramentas
- **📋 Criação de Tasks**: Sistema de tarefas com parâmetros dinâmicos e ferramentas configuráveis
- **▶️ Execução em Tempo Real**: Execute projetos CrewAI diretamente da interface
- **📊 Histórico de Execuções**: Acompanhe logs e resultados de execuções anteriores
- **📤 Exportação/Importação**: Exporte projetos completos ou importe configurações via YAML/JSON
- **🎨 Interface Moderna**: Design consistente com efeitos visuais elegantes e UX polida

## 🏗️ Arquitetura

### Backend
- **FastAPI**: API REST robusta e performática
- **SQLAlchemy**: ORM para banco de dados com suporte a SQLite/PostgreSQL
- **CrewAI**: Framework de agentes de IA integrado
- **Pydantic**: Validação de dados e schemas

### Frontend
- **React + TypeScript**: Interface moderna e tipada
- **Tailwind CSS**: Estilização utilitária com design system consistente
- **React Query**: Gerenciamento de estado e cache de API
- **Lucide Icons**: Ícones modernos e consistentes

### Infraestrutura
- **Docker**: Containerização completa (backend + frontend + banco)
- **Docker Compose**: Orquestração de serviços
- **PostgreSQL**: Banco de dados relacional (produção)
- **SQLite**: Banco de dados local (desenvolvimento)

## 🧰 Pré-requisitos

- Docker & Docker Compose
- Python 3.10+ (para desenvolvimento local)
- Node.js 18+ (para desenvolvimento frontend)
- PostgreSQL 14+ (opcional, para produção)

## 🚀 Como Executar

### Desenvolvimento Local

1. **Clone o repositório:**
```bash
git clone https://github.com/PauloHenriqueJr/storyspark-ai-studio.git
cd storyspark-ai-studio
```

2. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
# Edite o .env com suas chaves API
```

3. **Execute com Docker Compose:**
```bash
docker-compose up --build
```

4. **Ou execute localmente:**
```bash
# Backend
pip install -r requirements.txt
python -m uvicorn api.main:app --reload

# Frontend (nova aba)
cd frontend
npm install
npm run dev
```

### Produção (VPS)

```bash
# Build das imagens
docker build -f Dockerfile.api -t storyspark-api .
docker build -f Dockerfile.frontend -t storyspark-frontend .

# Execute com docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml up -d
```

## 🔧 Configuração de LLMs

### OpenRouter
```env
OPENROUTER_API_KEY=your_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

### Google Gemini
```env
GEMINI_API_KEY=your_key_here
```

### Outros provedores
O sistema suporta qualquer provedor compatível com a API OpenAI.

## 📚 API Documentation

Acesse `/docs` quando o backend estiver rodando para ver a documentação Swagger/OpenAPI completa.

## 🧪 Funcionalidades Técnicas

- **Execução Sequencial**: Processamento previsível e debugável
- **Tools Integradas**: Serper (web search), FileReadTool, e extensível
- **Import/Export**: YAML para agentes/tasks, JSON para projetos, ZIP para projetos completos
- **Logs Persistentes**: Histórico completo de execuções
- **Configurações Seguras**: API keys criptografadas no banco

## � Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Roadmap

- [ ] Interface visual de fluxo (drag & drop)
- [ ] Suporte a múltiplas execuções simultâneas
- [ ] Integração com Redis para filas
- [ ] Dashboard com métricas avançadas
- [ ] Templates de projetos pré-configurados
- [ ] API de webhooks para integrações externas

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🙏 Agradecimentos

- [CrewAI](https://github.com/joaomdmoura/crewai) - Framework base
- [FastAPI](https://fastapi.tiangolo.com/) - Framework web
- [shadcn/ui](https://ui.shadcn.com/) - Componentes UI
- Comunidade open source

---

**StorySpark AI Studio** - Transformando ideias em agentes inteligentes 🚀
