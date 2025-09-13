from typing import Dict, List


def detect_n8n_integrations(n8n_data: Dict) -> List[str]:
    integrations = set()

    for node in n8n_data.get("nodes", []):
        node_type = node.get("type", "")
        integration_mapping = {
            "n8n-nodes-base.httpRequest": "HTTP/API Requests",
            "n8n-nodes-base.chatOpenAi": "OpenAI API",
            "n8n-nodes-base.chatAnthropic": "Anthropic API",
            "n8n-nodes-base.googleCloudStorage": "Google Cloud Storage",
            "n8n-nodes-base.awsS3": "AWS S3",
            "n8n-nodes-base.discord": "Discord API",
            "n8n-nodes-base.slack": "Slack API",
            "n8n-nodes-base.telegram": "Telegram API",
            "n8n-nodes-base.twitter": "Twitter API",
            "n8n-nodes-base.github": "GitHub API",
            "n8n-nodes-base.gitlab": "GitLab API",
            "n8n-nodes-base.jira": "Jira API",
            "n8n-nodes-base.notion": "Notion API",
            "n8n-nodes-base.airtable": "Airtable API",
            "n8n-nodes-base.googleSheets": "Google Sheets API",
            "n8n-nodes-base.mysql": "MySQL Database",
            "n8n-nodes-base.postgres": "PostgreSQL Database",
            "n8n-nodes-base.mongoDb": "MongoDB Database",
            "n8n-nodes-base.redis": "Redis Database",
            "n8n-nodes-base.emailSend": "Email Service (SMTP)",
            "n8n-nodes-base.sendGrid": "SendGrid API",
            "n8n-nodes-base.twilio": "Twilio API",
            "n8n-nodes-base.stripe": "Stripe API",
            "n8n-nodes-base.paypal": "PayPal API",
            "n8n-nodes-base.shopify": "Shopify API",
            "n8n-nodes-base.wooCommerce": "WooCommerce API",
            "n8n-nodes-base.zapier": "Zapier API",
            "n8n-nodes-base.webhook": "Webhooks",
            "n8n-nodes-base.scheduleTrigger": "Scheduled Triggers",
            "n8n-nodes-base.formTrigger": "Form Triggers",
        }

        if node_type in integration_mapping:
            integrations.add(integration_mapping[node_type])

        if "parameters" in node:
            params = node["parameters"]
            if "url" in params:
                url = str(params["url"]).lower()
                if "openai" in url or "api.openai.com" in url:
                    integrations.add("OpenAI API")
                elif "anthropic" in url or "api.anthropic.com" in url:
                    integrations.add("Anthropic API")
                elif "github" in url or "api.github.com" in url:
                    integrations.add("GitHub API")
                elif "slack" in url or "hooks.slack.com" in url:
                    integrations.add("Slack API")
                elif "discord" in url or "discord.com" in url:
                    integrations.add("Discord API")
                elif "telegram" in url or "api.telegram.org" in url:
                    integrations.add("Telegram API")
                elif "stripe" in url or "api.stripe.com" in url:
                    integrations.add("Stripe API")
                elif "paypal" in url:
                    integrations.add("PayPal API")
                elif "shopify" in url:
                    integrations.add("Shopify API")
                elif "sendgrid" in url or "api.sendgrid.com" in url:
                    integrations.add("SendGrid API")
                elif "twilio" in url or "api.twilio.com" in url:
                    integrations.add("Twilio API")

    return sorted(list(integrations))


def convert_n8n_to_crewai(n8n_data: Dict) -> Dict:
    project_name = n8n_data.get("name", "Workflow Importado")

    agents = []
    tasks = []

    node_type_mapping = {
        "n8n-nodes-base.httpRequest": "API Caller",
        "n8n-nodes-base.chatOpenAi": "AI Assistant",
        "n8n-nodes-base.function": "Code Executor",
        "n8n-nodes-base.set": "Data Processor",
        "n8n-nodes-base.if": "Decision Maker",
        "n8n-nodes-base.wait": "Timer",
        "n8n-nodes-base.formTrigger": "Form Handler",
    }

    for i, node in enumerate(n8n_data.get("nodes", [])):
        node_type = node.get("type", "")
        node_name = node.get("name", f"Node {i+1}")
        role = node_type_mapping.get(node_type, "Task Executor")
        backstory = f"Processa dados do tipo {node_type}"
        if "parameters" in node:
            params = node["parameters"]
            if "method" in params and "url" in params:
                backstory = f"Faz requisições {params['method']} para {params['url']}"
            elif "model" in params:
                backstory = f"Usa modelo de IA {params.get('model', 'desconhecido')}"

        agent = {
            "name": node_name,
            "role": role,
            "goal": f"Executar a funcionalidade do node '{node_name}'",
            "backstory": backstory,
            "tools": [],
            "verbose": True,
            "memory": False,
            "allow_delegation": False,
        }
        agents.append(agent)

    connections = n8n_data.get("connections", {})
    for source_node, connection_data in connections.items():
        for connection_list in connection_data.get("main", []):
            for connection in connection_list:
                target_node = connection.get("node")
                task = {
                    "agent": target_node,
                    "description": f"Processar dados vindos de '{source_node}'",
                    "expected_output": f"Resultado do processamento do node '{target_node}'",
                    "tools": [],
                    "async_execution": False,
                    "output_file": "",
                }
                tasks.append(task)

    return {
        "name": project_name,
        "description": f"Workflow n8n convertido: {project_name}",
        "model_provider": "openrouter",
        "model_name": "openrouter/gpt-4o-mini",
        "agents": agents,
        "tasks": tasks,
    }

