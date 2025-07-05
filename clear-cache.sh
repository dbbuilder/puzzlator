#!/bin/bash

echo "Clearing Vite cache and restarting servers..."

# Kill existing processes
echo "Stopping servers..."
pkill -f "node.*vite" 2>/dev/null
pkill -f "node.*api-server" 2>/dev/null

# Clear Vite cache
echo "Clearing Vite cache..."
rm -rf node_modules/.vite 2>/dev/null

# Clear browser cache hint
echo ""
echo "⚠️  Please also clear your browser cache:"
echo "   - Chrome/Edge: Ctrl+Shift+R (or Cmd+Shift+R on Mac)"
echo "   - Firefox: Ctrl+F5 (or Cmd+Shift+R on Mac)"
echo "   - Safari: Cmd+Option+R"
echo ""

# Restart servers
echo "Starting servers..."
npm run api > /tmp/api-server.log 2>&1 &
echo "API server starting..."
sleep 3

npm run dev > /tmp/vite.log 2>&1 &
echo "Vite server starting..."
sleep 5

echo "✅ Servers restarted. Please refresh your browser with cache cleared."