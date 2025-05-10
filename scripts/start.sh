#!/bin/bash

# Start the application
echo "Starting Hostel Outpass Management System..."

# Run database initialization script
./scripts/init-db.sh &

# Start the Next.js application
npm run dev
