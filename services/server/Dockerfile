FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY pie_server ./pie_server

EXPOSE 8000
# Runs fully offline; tenant secrets and biometric backend come from env.
CMD ["uvicorn", "pie_server.app:app", "--host", "0.0.0.0", "--port", "8000"]
