# Exemplo de como usar o Crew AI Studio

## � Configurações Persistentes
As chaves de API são salvas no banco de dados e ficam disponíveis permanentemente:

1. Na **barra lateral**, digite suas chaves de API
2. Clique em **"💾 Salvar Chaves"**
3. As chaves ficam salvas e são carregadas automaticamente em todas as sessões

**Exemplo de chaves:**
- OPENROUTER_API_KEY: `sk-or-v1-xxxxxxxxxxxxx`
- GEMINI_API_KEY: `AIzaSyxxxxxxxxxxxxxx`
- SERPER_API_KEY: `xxxxxxxxxxxxxx`

## �📥 Importação Rápida
Use os arquivos de exemplo na raiz do projeto:
- `example_project.json` - Para importar um projeto
- `example_agents.yaml` - Para importar agentes
- `example_tasks.yaml` - Para importar tasks
- `social_media_management_automation_v1_crewai-project.zip` - Para importar um projeto completo

## 1. Criar um Projeto
- Nome: "Pesquisa de Mercado IA"
- Descrição: "Analisa tendências e oportunidades no mercado de IA"
- Provider: openrouter (ou gemini)
- Modelo: openrouter/gpt-4o-mini

Ou importe um projeto via JSON (veja `example_project.json`):
```json
{
  "name": "Pesquisa de Mercado IA",
  "description": "Analisa tendências e oportunidades no mercado de IA",
  "model_provider": "openrouter",
  "model_name": "openrouter/gpt-4o-mini"
}
```

## 2. Criar Agentes

### Agente 1: Pesquisador
- Nome: "Market Researcher"
- Role: "Especialista em Pesquisa de Mercado"
- Goal: "Encontrar dados precisos e atualizados sobre o mercado de IA"
- Backstory: "Você é um analista experiente com 10 anos de experiência em pesquisa de mercado tecnológico"
- Tools: ["serper"] (para busca na web)

### Agente 2: Analista
- Nome: "Data Analyst" 
- Role: "Analista de Dados"
- Goal: "Processar e interpretar dados de mercado para gerar insights"
- Backstory: "Você é um cientista de dados com expertise em análise de tendências"
- Tools: ["file_read"] (para ler arquivos)

Ou importe agentes via YAML (veja `example_agents.yaml`):
```yaml
- name: "Market Researcher"
  role: "Especialista em Pesquisa de Mercado"
  goal: "Encontrar dados precisos e atualizados sobre o mercado de IA"
  backstory: "Você é um analista experiente com 10 anos de experiência em pesquisa de mercado tecnológico"
  tools: ["serper"]
  verbose: true
  memory: false
  allow_delegation: false

- name: "Data Analyst"
  role: "Analista de Dados"
  goal: "Processar e interpretar dados de mercado para gerar insights"
  backstory: "Você é um cientista de dados com expertise em análise de tendências"
  tools: ["file_read"]
  verbose: true
  memory: false
  allow_delegation: false
```

## 3. Criar Tasks

### Task 1:
- Agente: Market Researcher
- Description: "Pesquisar as principais tendências do mercado de {topic} em 2024-2025"
- Expected Output: "Lista com 5 principais tendências, incluindo dados quantitativos"

### Task 2:
- Agente: Data Analyst
- Description: "Analisar as tendências encontradas e identificar oportunidades de negócio"
- Expected Output: "Relatório com 3 oportunidades principais e análise de viabilidade"

Ou importe tasks via YAML (veja `example_tasks.yaml`):
```yaml
- agent: "Market Researcher"
  description: "Pesquisar as principais tendências do mercado de {topic} em 2024-2025"
  expected_output: "Lista com 5 principais tendências, incluindo dados quantitativos"
  tools: ["serper"]
  async_execution: false
  output_file: ""

- agent: "Data Analyst"
  description: "Analisar as tendências encontradas e identificar oportunidades de negócio"
  expected_output: "Relatório com 3 oportunidades principais e análise de viabilidade"
  tools: ["file_read"]
  async_execution: false
  output_file: ""
```

## 4. Executar
- Input JSON: {"topic": "Inteligência Artificial"}
- Clique em "Executar" e aguarde o resultado

## 5. Exportar
- Baixe o ZIP com todo o código gerado
- Use o código em seus próprios projetos
