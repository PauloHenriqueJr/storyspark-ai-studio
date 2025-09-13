import os
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from db import models
from .deps import get_db
from .schemas import AIBuilderRequest, AIBuilderResponse
from .utils_settings import get_setting

router = APIRouter(prefix="/builder", tags=["builder"]) 

def parse_sentiment_analysis_prompt(prompt_text: str) -> Dict[str, Any]:
    """Análise especializada para prompt de sentimento"""
    has_sentiment = any(word in prompt_text.lower() for word in ['sentimento', 'sentiment', 'emoção', 'positivo', 'negativo', 'neutro'])
    has_comments = any(word in prompt_text.lower() for word in ['comentário', 'feedback', 'avaliação', 'review', 'opinião', 'cliente'])
    has_separation = any(word in prompt_text.lower() for word in ['separar', 'classificar', 'categorizar', 'dividir', 'agrupar'])
    
    if has_sentiment and (has_comments or has_separation):
        return {
            "detected_type": "sentiment_analysis",
            "agents": [
                {
                    "name": "Coletor de Comentários",
                    "role": "Especialista em Coleta de Dados",
                    "goal": "Coletar e preparar comentários de clientes para análise",
                    "backstory": "Experiência em extração e estruturação de dados de diversas fontes.",
                    "tools": ["WebSearchTool", "FileReaderTool"],
                },
                {
                    "name": "Analista de Sentimentos",
                    "role": "Especialista em Análise de Sentimento",
                    "goal": "Analisar o sentimento e emoções nos comentários coletados",
                    "backstory": "Especialista em processamento de linguagem natural e análise emocional.",
                    "tools": ["TXTSearchTool"],
                },
                {
                    "name": "Gerador de Relatórios",
                    "role": "Especialista em Visualização de Dados",
                    "goal": "Criar relatórios visuais com insights dos sentimentos analisados",
                    "backstory": "Experiência em data storytelling e criação de dashboards.",
                    "tools": ["FileWriterTool"],
                }
            ],
            "tasks": [
                {
                    "agent_idx": 0,
                    "description": "Coletar comentários de clientes sobre {produto} das últimas {periodo} semanas",
                    "expected_output": "Lista estruturada de comentários com data, fonte e conteúdo completo",
                },
                {
                    "agent_idx": 1,
                    "description": "Analisar o sentimento de cada comentário coletado e classificar como Positivo, Negativo ou Neutro",
                    "expected_output": "Tabela com comentário, classificação de sentimento, score de confiança e principais emoções detectadas",
                },
                {
                    "agent_idx": 2,
                    "description": "Criar um relatório detalhado separando comentários por sentimento e gerando insights acionáveis",
                    "expected_output": "Relatório com: 1) Distribuição de sentimentos, 2) Top 5 temas positivos, 3) Top 5 temas negativos, 4) Recomendações de ação",
                }
            ]
        }
    return {"detected_type": "generic"}

def analyze_prompt_with_llm(project, prompt_text: str, db: Session) -> Dict[str, Any]:
    """Analisa o prompt usando LLM se disponível, senão usa heurísticas"""
    try:
        # Primeiro, tentar análise especializada
        specialized = parse_sentiment_analysis_prompt(prompt_text)
        if specialized["detected_type"] != "generic":
            return specialized
            
        # Se não for especializado, usar LLM ou fallback genérico
        openrouter_key = get_setting(db, "OPENROUTER_API_KEY", "")
        gemini_key = get_setting(db, "GEMINI_API_KEY", "")
        
        if openrouter_key or gemini_key:
            # Aqui podemos chamar a LLM para análise mais sofisticada
            # Por ora, vamos usar o fallback genérico mesmo com keys
            pass
    except Exception:
        pass
    
    # Fallback genérico
    return {
        "detected_type": "generic",
        "agents": [
            {
                "name": "Agente Principal",
                "role": "Executor de Tarefas",
                "goal": f"Executar: {prompt_text[:100]}",
                "backstory": "Agente versátil criado para executar diversas tarefas.",
                "tools": [],
            }
        ],
        "tasks": [
            {
                "agent_idx": 0,
                "description": prompt_text,
                "expected_output": "Resultado completo e detalhado da tarefa solicitada.",
            }
        ]
    }

@router.get("/find-similar")
def find_similar_flow(project_id: int, prompt: str, db: Session = Depends(get_db)):
    """Busca fluxos similares existentes no projeto"""
    project = db.query(models.Project).filter_by(id=project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Buscar por palavras-chave no prompt
    keywords = prompt.lower().split()
    agents = db.query(models.Agent).filter_by(project_id=project_id).all()
    tasks = db.query(models.Task).filter_by(project_id=project_id).all()
    
    # Check if we already have sentiment analysis flow
    has_sentiment_flow = False
    for agent in agents:
        if any(word in agent.name.lower() or word in agent.role.lower() 
               for word in ['sentimento', 'analista', 'coletor', 'relatório']):
            has_sentiment_flow = True
            break
    
    if has_sentiment_flow and any(word in prompt.lower() for word in ['sentimento', 'comentário', 'análise']):
        return {
            "found": True,
            "message": "Fluxo de análise de sentimentos já existe neste projeto. Carregando...",
            "agents_count": len(agents),
            "tasks_count": len(tasks)
        }
    
    return {"found": False}

@router.post("/generate", response_model=AIBuilderResponse)
def generate_from_prompt(payload: AIBuilderRequest, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter_by(id=payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Analisar o prompt para determinar tipo de fluxo
    analysis = analyze_prompt_with_llm(project, payload.prompt, db)
    
    created_agents = []
    created_tasks = []
    
    # Criar agentes baseado na análise
    for agent_spec in analysis.get("agents", []):
        agent = models.Agent(
            project_id=project.id,
            name=agent_spec["name"],
            role=agent_spec["role"],
            goal=agent_spec["goal"],
            backstory=agent_spec.get("backstory", ""),
            tools=agent_spec.get("tools", []),
            verbose=True,
            memory=agent_spec.get("memory", False),
            allow_delegation=agent_spec.get("allow_delegation", False),
        )
        db.add(agent)
        db.flush()  # Para obter o ID antes do commit
        created_agents.append(agent)
    
    # Criar tarefas vinculadas aos agentes
    for task_spec in analysis.get("tasks", []):
        agent_idx = task_spec.get("agent_idx", 0)
        if agent_idx < len(created_agents):
            task = models.Task(
                project_id=project.id,
                agent_id=created_agents[agent_idx].id,
                description=task_spec["description"],
                expected_output=task_spec["expected_output"],
                tools=task_spec.get("tools", []),
                async_execution=task_spec.get("async_execution", False),
                output_file=task_spec.get("output_file", ""),
            )
            db.add(task)
            created_tasks.append(task)
    
    db.commit()
    
    # Gerar plano descritivo sem formatação markdown
    if analysis["detected_type"] == "sentiment_analysis":
        plan = (
            "Fluxo de Análise de Sentimentos Criado!\n\n"
            "Estrutura do Workflow:\n"
            f"- {len(created_agents)} agentes especializados\n"
            f"- {len(created_tasks)} tarefas sequenciais\n\n"
            "Agentes Criados:\n"
        )
        for agent in created_agents:
            plan += f"- {agent.name}: {agent.role}\n"
        plan += "\nProcesso:\n"
        plan += "1. Coleta de comentários de múltiplas fontes\n"
        plan += "2. Análise de sentimento com classificação\n"
        plan += "3. Geração de relatório com insights\n\n"
        plan += "Clique em Run para executar o fluxo!"
    else:
        plan = (
            "Fluxo Criado com Sucesso!\n\n"
            f"- {len(created_agents)} agente(s) criado(s)\n"
            f"- {len(created_tasks)} tarefa(s) configurada(s)\n\n"
            "Você pode:\n"
            "- Conectar mais agentes/tarefas no editor\n"
            "- Configurar ferramentas específicas\n"
            "- Executar o workflow clicando em Run"
        )
    
    return AIBuilderResponse(
        created_agents=len(created_agents),
        created_tasks=len(created_tasks),
        plan=plan
    )
