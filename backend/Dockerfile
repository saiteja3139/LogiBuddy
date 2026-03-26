FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY server.py .

# Railway sets PORT env variable
ENV PORT=8001

# Run the application - use shell form to expand $PORT
CMD uvicorn server:app --host 0.0.0.0 --port $PORT
