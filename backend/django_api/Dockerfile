FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/

# Collect static (none by default but safe)
RUN python manage.py collectstatic --noinput || true

CMD gunicorn ntsa_api.wsgi:application --bind 0.0.0.0:${PORT:-8000}
