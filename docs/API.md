# API FastAPI (novo)

Rode a API REST que o novo frontend irá consumir.

## Executar localmente

```bash
uvicorn api.main:app --reload --port 8000 --host 0.0.0.0
```

## Endpoints principais

- Projetos: `GET/POST /projects`, `GET/PUT/DELETE /projects/{id}`
- Agentes: `GET/POST /projects/{id}/agents`, `PUT/DELETE /agents/{id}`
- Tasks: `GET/POST /projects/{id}/tasks`, `PUT/DELETE /tasks/{id}`
- Execuções: `GET /executions`, `GET /executions/{id}`
- Run: `POST /execute/project/{projectId}`, `POST /execute/agent/{agentId}`, `POST /execute/task/{taskId}`
- Import/Export: `POST /import/json`, `POST /import/agents-yaml`, `POST /import/tasks-yaml`, `POST /import/zip`, `GET /export/{projectId}/zip`
- Settings: `GET /settings`, `PUT /settings/{key}`

Documentação automática: `GET /docs` (Swagger), `GET /redoc` e `GET /openapi.json`.
Contrato estático: `openapi.yaml`.

