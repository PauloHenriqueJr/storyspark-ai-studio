#!/bin/bash

# Script de inicialização para o Crew AI Studio

echo "🚀 Iniciando setup do Crew AI Studio..."

# Verificar se o .env existe
if [ ! -f .env ]; then
    echo "📝 Copiando .env.example para .env..."
    cp .env.example .env
    echo "⚠️  Por favor, edite o arquivo .env com suas chaves de API!"
fi

# Instalar dependências
echo "📦 Instalando dependências..."
pip install -r requirements.txt

# Criar tabelas do banco
echo "🗄️  Criando tabelas do banco de dados..."
python -c "from db.seed import init_db; init_db(); print('✅ Tabelas criadas com sucesso!')"

echo "✅ Setup completo!"
echo "🏃 Para rodar o app: streamlit run app.py --server.port=8501 --server.address=0.0.0.0"
