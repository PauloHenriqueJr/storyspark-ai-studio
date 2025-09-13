import io
import os
import zipfile

ROOT = os.path.dirname(os.path.dirname(__file__))
SAMPLES = os.path.join(ROOT, 'samples')


def main():
    agents_path = os.path.join(SAMPLES, 'agents_basic.yaml')
    tasks_path = os.path.join(SAMPLES, 'tasks_basic.yaml')
    out_zip = os.path.join(SAMPLES, 'sample_project.zip')

    project_json = {
        "name": "Zip Demo Project",
        "description": "Projeto compactado com agents.yaml e tasks.yaml para teste de import.",
        "model_provider": "openrouter",
        "model_name": "openrouter/gpt-4o-mini",
        "language": "pt",
    }

    import yaml  # type: ignore

    with open(agents_path, 'r', encoding='utf-8') as fa:
        agents_content = fa.read()
    with open(tasks_path, 'r', encoding='utf-8') as ft:
        tasks_content = ft.read()

    with zipfile.ZipFile(out_zip, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('project.json', yaml.safe_dump(project_json, allow_unicode=True, sort_keys=False))
        z.writestr('agents.yaml', agents_content)
        z.writestr('tasks.yaml', tasks_content)

    print(f'OK -> {out_zip}')


if __name__ == '__main__':
    main()

