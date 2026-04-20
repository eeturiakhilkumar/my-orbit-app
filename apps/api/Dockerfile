FROM python:3.11-slim

WORKDIR /app

# Install dependencies
# Note: we use pip here as it's the standard for python-slim
COPY . .
RUN pip install --no-cache-dir .

# Run the FastAPI app on port 8080 (Cloud Run's default)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
