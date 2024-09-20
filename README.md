# RAG Web Application

This is a web application that provides RAG (Retrieval-Augmented Generation) systems for multiple organizations. It allows customers to query product information and administrators to manage the system.

## Features

- User authentication and authorization
- Company-specific RAG systems
- Document upload and processing
- Admin dashboard for user and organization management
- Chat interface for querying product information

## Prerequisites

- Docker and Docker Compose
- Node.js and npm (for local development)
- Python 3.8+ (for local development)

## Setup and Installation

1. Clone the repository:
    git clone https://github.com/your-username/EchoSage.git
    cd EchoSage
2. Build and run the Docker containers:
    docker compose up --build
3. The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Development

For local development:

1. Set up the backend:
    cd backend
    python -m venv venv
    source venv/bin/activate  # On Windows, use venv\Scripts\activate
    pip-compile requirements.in
    pip install -r requirements.txt
    flask run
2. Set up the frontend:
    cd frontend
    npm install
    npm start
## Usage

1. Register a new user or log in with existing credentials.
2. Use the chat interface to query product information.
3. Admins can access the dashboard to manage users, organizations and documents for each organization.

## License

This project is licensed under the MIT License - see the LICENSE.md file for details.