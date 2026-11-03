# Health Risk ML Service

## Run on Windows

The model artifact was trained with `scikit-learn==1.6.1`. Use the service
virtual environment rather than a system Python installation:

```powershell
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python app.py
```

Alternatively, run the interpreter directly without activating the environment:

```powershell
.\venv\Scripts\python.exe app.py
```

If the service reports that the runtime has scikit-learn `1.4.0`, the wrong
Python interpreter is being used. The model will remain unavailable until the
service is started with the environment above.

Render uses the Python version in `.python-version`. Keep the service on Python
3.12 because the pinned scientific-package versions provide compatible wheels
for that runtime.
