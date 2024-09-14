# Use an official Python runtime as a parent image
FROM docker.m.daocloud.io/python:3.10-slim-bullseye as builder

# Set the working directory in the container
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Switch to Aliyun mirror for faster downloads in China
RUN sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Configure pip to use Aliyun mirror and increase timeout
RUN mkdir -p ~/.pip && \
    echo "[global]" > ~/.pip/pip.conf && \
    echo "index-url = https://mirrors.aliyun.com/pypi/simple/" >> ~/.pip/pip.conf && \
    echo "trusted-host = mirrors.aliyun.com" >> ~/.pip/pip.conf && \
    echo "timeout = 120" >> ~/.pip/pip.conf

# Upgrade pip and install pip-tools
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir pip-tools

# Copy only the requirements file first
COPY requirements.in .

# Generate requirements.txt from requirements.in
RUN pip-compile requirements.in

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Start a new stage for the final image
FROM docker.m.daocloud.io/python:3.10-slim-bullseye

# Switch to Aliyun mirror for faster downloads in China
RUN sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list

# Install libmagic only in the final stage
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libpq5 \
        poppler-utils \
        tesseract-ocr \
        libreoffice \
        libmagic1 \
        libgl1-mesa-glx \
        libglib2.0-0 \
        libsm6 \
        libxext6 \
        libxrender-dev \
        libgomp1 \
        pandoc \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy installed packages from builder stage
COPY --from=builder /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy the rest of the application
COPY . .

# Create necessary directories and set permissions
RUN mkdir -p /app/uploads /app/vectorstores /app/migrations && \
    chmod 777 /app/uploads /app/vectorstores /app/migrations

# Make port 5000 available to the world outside this container
EXPOSE 5000

# Define environment variable
ENV FLASK_APP=run.py
ENV PATH="/usr/local/bin:${PATH}"

# Copy the start script into the container
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Set the entrypoint to our start script
ENTRYPOINT ["/start.sh"]