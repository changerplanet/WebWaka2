#!/bin/bash

# Install dependencies if missing (optional safety)
npm --prefix frontend install

# Build frontend
npm --prefix frontend run build

# Start Next.js frontend
npm --prefix frontend run start -- -p 3000 -H 0.0.0.0 &

# Wait for frontend to boot
sleep 4

# Start FastAPI backend on Replit exposed port
uvicorn backend.server:app --host 0.0.0.0 --port $PORT
