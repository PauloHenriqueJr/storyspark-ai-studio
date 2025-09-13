#!/usr/bin/env python3
"""
Script para adicionar a coluna 'language' à tabela projects
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from db.database import DATABASE_URL

def add_language_column():
    """Adiciona a coluna language à tabela projects"""
    engine = create_engine(DATABASE_URL)

    try:
        with engine.connect() as conn:
            # Verifica se a coluna já existe (SQLite syntax)
            result = conn.execute(text("""
                PRAGMA table_info(projects)
            """))

            columns = result.fetchall()
            column_names = [col[1] for col in columns]  # col[1] é o nome da coluna

            if 'language' in column_names:
                print("✅ Coluna 'language' já existe na tabela projects")
                return

            # Adiciona a coluna language
            conn.execute(text("""
                ALTER TABLE projects ADD COLUMN language VARCHAR(10) DEFAULT 'pt'
            """))

            conn.commit()
            print("✅ Coluna 'language' adicionada com sucesso à tabela projects")

    except Exception as e:
        print(f"❌ Erro ao adicionar coluna language: {e}")
        raise

if __name__ == "__main__":
    add_language_column()