FROM python:3.11-slim

WORKDIR /app

# Copy only the backend requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend code
COPY . .

# Force the container to use Python/Uvicorn, ignoring any Node.js detection
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]
