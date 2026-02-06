# SLM-fineTuning

A lightweight compliance mapping dataset and simple web explorer for frameworks, policies, and controls.

## Run the web app

Because the app loads JSON via `fetch`, you need to serve it from a local web server.

```bash
python -m http.server 8000
```

Then open <http://localhost:8000/app/>.

## Data

The knowledge base lives at `data/knowledge_base.json` and includes:
- Frameworks
- Policies
- Controls
- Mappings between all three entities
