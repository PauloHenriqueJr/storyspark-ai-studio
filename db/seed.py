from .database import Base, engine, SessionLocal
from . import models

def init_db():
    Base.metadata.create_all(bind=engine)

def migrate_language_data():
    """Migrate old 'pt' language to 'pt-br' in existing projects"""
    db = SessionLocal()
    try:
        # Update projects with language='pt' to 'pt-br'
        projects_to_update = db.query(models.Project).filter(models.Project.language == 'pt').all()
        for project in projects_to_update:
            project.language = 'pt-br'
            print(f"✅ Migrated project '{project.name}' language from 'pt' to 'pt-br'")

        db.commit()
        print(f"✅ Migration completed. Updated {len(projects_to_update)} projects.")
    except Exception as e:
        db.rollback()
        print(f"❌ Migration failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "migrate":
        migrate_language_data()
    else:
        init_db()
        print("✅ Database tables created.")
