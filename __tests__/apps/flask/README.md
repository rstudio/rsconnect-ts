# Simple Flask application

Recreate the `manifest.json` with:

```bash
python3.11 -m venv env
. ./env/bin/activate
pip install rsconnect-python
rsconnect write-manifest flask --overwrite .
```
