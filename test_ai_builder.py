#!/usr/bin/env python
"""
Script de teste para o AI Builder
Cria um projeto de teste e gera um fluxo de análise de sentimentos
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_ai_builder():
    print("🚀 Testando AI Builder...")
    
    # 1. Criar projeto de teste
    print("\n1️⃣ Criando projeto de teste...")
    project_data = {
        "name": f"Teste AI Builder {int(time.time())}",
        "description": "Projeto para testar o AI Builder",
        "model_provider": "openrouter",
        "model_name": "openrouter/gpt-4o-mini",
        "language": "pt-br"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/projects", json=project_data)
        response.raise_for_status()
        project = response.json()
        project_id = project["id"]
        print(f"✅ Projeto criado: ID={project_id}, Nome='{project['name']}'")
    except Exception as e:
        print(f"❌ Erro ao criar projeto: {e}")
        return
    
    # 2. Testar detecção de fluxo similar (deve retornar não encontrado)
    print("\n2️⃣ Verificando fluxos similares...")
    try:
        response = requests.get(
            f"{BASE_URL}/builder/find-similar",
            params={"project_id": project_id, "prompt": "análise de sentimentos"}
        )
        response.raise_for_status()
        result = response.json()
        if result.get("found"):
            print(f"⚠️ Fluxo similar encontrado: {result.get('message')}")
        else:
            print("✅ Nenhum fluxo similar encontrado (esperado)")
    except Exception as e:
        print(f"❌ Erro ao verificar fluxos similares: {e}")
    
    # 3. Gerar fluxo de análise de sentimentos
    print("\n3️⃣ Gerando fluxo de análise de sentimentos...")
    prompt = "Crie um fluxo para analisar comentários de clientes e separar por sentimento"
    
    try:
        response = requests.post(
            f"{BASE_URL}/builder/generate",
            json={"project_id": project_id, "prompt": prompt}
        )
        response.raise_for_status()
        result = response.json()
        print(f"✅ Fluxo criado com sucesso!")
        print(f"   - Agentes criados: {result['created_agents']}")
        print(f"   - Tarefas criadas: {result['created_tasks']}")
        print(f"\n📋 Plano gerado:")
        print(result['plan'])
    except Exception as e:
        print(f"❌ Erro ao gerar fluxo: {e}")
        return
    
    # 4. Verificar agentes criados
    print("\n4️⃣ Verificando agentes criados...")
    try:
        response = requests.get(f"{BASE_URL}/projects/{project_id}/agents")
        response.raise_for_status()
        agents = response.json()
        print(f"✅ {len(agents)} agentes encontrados:")
        for agent in agents:
            print(f"   - {agent['name']}: {agent['role']}")
            if agent.get('tools'):
                print(f"     Ferramentas: {', '.join(agent['tools'])}")
    except Exception as e:
        print(f"❌ Erro ao buscar agentes: {e}")
    
    # 5. Verificar tarefas criadas
    print("\n5️⃣ Verificando tarefas criadas...")
    try:
        response = requests.get(f"{BASE_URL}/projects/{project_id}/tasks")
        response.raise_for_status()
        tasks = response.json()
        print(f"✅ {len(tasks)} tarefas encontradas:")
        for i, task in enumerate(tasks, 1):
            print(f"   {i}. {task['description'][:60]}...")
            print(f"      Output esperado: {task['expected_output'][:50]}...")
    except Exception as e:
        print(f"❌ Erro ao buscar tarefas: {e}")
    
    # 6. Testar detecção de fluxo similar novamente (agora deve encontrar)
    print("\n6️⃣ Verificando fluxos similares novamente...")
    try:
        response = requests.get(
            f"{BASE_URL}/builder/find-similar",
            params={"project_id": project_id, "prompt": "análise de sentimentos de comentários"}
        )
        response.raise_for_status()
        result = response.json()
        if result.get("found"):
            print(f"✅ Fluxo similar encontrado (esperado): {result.get('message')}")
            print(f"   - Agentes: {result.get('agents_count')}")
            print(f"   - Tarefas: {result.get('tasks_count')}")
        else:
            print("⚠️ Fluxo similar não encontrado (inesperado)")
    except Exception as e:
        print(f"❌ Erro ao verificar fluxos similares: {e}")
    
    print(f"\n✨ Teste completo! Acesse o editor em: http://localhost:5173/app/editor?projectId={project_id}")
    print("🎯 Use o chat 'Build with AI' para interagir com o fluxo criado!")

if __name__ == "__main__":
    print("=" * 60)
    print("🤖 TESTE DO AI BUILDER - CREW AI STUDIO")
    print("=" * 60)
    
    # Verificar se o servidor está rodando
    try:
        response = requests.get(f"{BASE_URL}/health")
        response.raise_for_status()
        print("✅ Servidor backend está rodando!")
    except:
        print("❌ Erro: O servidor backend não está rodando!")
        print("   Execute: python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000")
        exit(1)
    
    test_ai_builder()
    print("\n" + "=" * 60)
