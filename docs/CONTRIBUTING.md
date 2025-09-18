# Guia de Contribuição - StorySpark AI Studio

Bem-vindo! Este documento explica como contribuir para o **StorySpark AI Studio**.

## 🚀 Como Começar

### 1. Fork e Clone
```bash
git clone https://github.com/SEU_USERNAME/storyspark-ai-studio.git
cd storyspark-ai-studio
```

### 2. Configuração do Ambiente
```bash
# Backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend
cd frontend
npm install
cd ..
```

### 3. Executar Localmente
```bash
# Backend (porta 8000)
python -m uvicorn api.main:app --reload

# Frontend (porta 5173)
cd frontend && npm run dev
```

## 🛠️ Estrutura do Projeto

```
storyspark-ai-studio/
├── api/                    # Backend FastAPI
│   ├── main.py            # App principal
│   ├── routers_*.py       # Endpoints da API
│   └── schemas.py         # Modelos Pydantic
├── frontend/              # Frontend React
│   ├── src/
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── components/    # Componentes reutilizáveis
│   │   └── lib/           # Utilitários
│   └── public/            # Assets estáticos
├── db/                    # Camada de dados
├── src/                   # Lógica de negócio
└── templates/             # Templates de código
```

## 📝 Padrões de Código

### Backend (Python)
- **Black**: Formatação automática
- **isort**: Organização de imports
- **mypy**: Type checking
- **FastAPI**: Documentação automática de endpoints

### Frontend (TypeScript/React)
- **ESLint**: Linting e formatação
- **Prettier**: Formatação de código
- **TypeScript**: Tipagem estática
- **Tailwind CSS**: Estilização consistente

## 🔄 Fluxo de Desenvolvimento

### 1. Criar Branch
```bash
git checkout -b feature/nome-da-feature
# ou
git checkout -b fix/nome-do-bug
# ou
git checkout -b docs/melhoria-documentacao
```

### 2. Desenvolver
- Siga os padrões estabelecidos
- Mantenha commits pequenos e descritivos
- Teste suas mudanças

### 3. Commit
```bash
git add .
git commit -m "tipo: descrição clara da mudança

- Detalhes adicionais se necessário
- Quebra mudanças em bullet points"
```

#### Tipos de Commit
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação/código que não afeta funcionalidade
- `refactor`: Refatoração de código
- `test`: Testes
- `chore`: Manutenção/tarefas diversas

### 4. Push e Pull Request
```bash
git push origin sua-branch
```
Abra um PR no GitHub com descrição detalhada.

## 🎨 Padrões de Design

### Componentes UI
- Use o design system estabelecido (shadcn/ui + Tailwind)
- Mantenha consistência visual com cards existentes
- Implemente efeitos de hover e transições suaves
- Use ícones do Lucide React

### API Design
- Siga RESTful conventions
- Use Pydantic para validação
- Documente endpoints com docstrings
- Mantenha compatibilidade backward

## 🧪 Testes

### Backend
```bash
pytest tests/
```

### Frontend
```bash
cd frontend
npm test
```

## 📚 Documentação

- Mantenha README.md atualizado
- Documente novas funcionalidades
- Atualize API docs quando necessário
- Use comentários claros no código

## 🤝 Código de Conduta

- Seja respeitoso e colaborativo
- Aceite feedback construtivo
- Foque na qualidade e usabilidade
- Ajude outros contribuidores

## 📞 Suporte

Para dúvidas:
- Abra uma issue no GitHub
- Use discussões para questões gerais
- PRs são sempre bem-vindos!

---

Obrigado por contribuir com o StorySpark AI Studio! 🚀