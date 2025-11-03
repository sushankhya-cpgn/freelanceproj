#!/bin/bash

# Centrifugo Startup Script for WorkLab

echo "🚀 Starting Centrifugo Server for WorkLab..."

# Check if Centrifugo binary exists
if [ ! -f "./centrifugo" ]; then
    echo "Centrifugo binary not found. Please run the setup first."
    exit 1
fi

# Check if config file exists
if [ ! -f "./centrifugo.json" ]; then
    echo "Centrifugo config file not found. Please create centrifugo.json first."
    exit 1
fi

# Start Centrifugo server
echo "Starting Centrifugo with config: centrifugo.json"
echo "📡 WebSocket URL: ws://localhost:8000/connection/websocket"
echo "🔑 API URL: http://localhost:8000/api"
echo "📊 Admin URL: http://localhost:8000"
echo ""

./centrifugo --config=centrifugo.json