#!/bin/bash
# server-fix.sh - Script to kill processes on port 3000 and restart the server

# Find process on port 3000
echo "Looking for processes on port 3000..."
PID=$(lsof -ti:3000)

if [ -n "$PID" ]; then
  echo "Found process $PID using port 3000. Killing process..."
  kill -9 $PID
  echo "Process killed."
else
  echo "No process found on port 3000."
fi

# Wait a moment to ensure port is released
echo "Waiting for port to be released..."
sleep 2

# Start the server
echo "Starting server..."
npm run dev