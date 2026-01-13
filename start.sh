#!/bin/bash

# Install dependencies
npm --prefix frontend install

# Build frontend
npm --prefix frontend run build || exit 1

# Start Next.js frontend (Replit uses $PORT)
npm --prefix frontend run start -- -p $PORT -H 0.0.0.0 &

# Wait for frontend
sleep 4

# Start FastAPI backend
uvicorn backend.server:app --host 0.0.0.0 --port $PORT
