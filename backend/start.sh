#!/bin/sh
set -e

echo "Running database initialization..."
python -m app.init_db

echo "Starting Flask application..."
flask run --host=0.0.0.0