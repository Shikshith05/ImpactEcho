#!/bin/bash

# ImpactEcho - Start with Blockchain Integration
# This script starts both the Flask server and Anvil blockchain

echo "🚀 Starting ImpactEcho with Blockchain Integration"
echo "=================================================="
echo ""

# Check if foundry is installed
if ! command -v anvil &> /dev/null; then
    echo "⚠️  Foundry/Anvil not found!"
    echo "📦 Install Foundry first: https://book.getfoundry.sh/getting-started/installation"
    echo ""
    echo "Quick install:"
    echo "curl -L https://foundry.paradigm.xyz | bash"
    echo "foundryup"
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    kill $ANVIL_PID 2>/dev/null
    kill $FLASK_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start Anvil in background
echo "1️⃣  Starting Anvil (Local Blockchain)..."
cd foundry
anvil > /tmp/anvil.log 2>&1 &
ANVIL_PID=$!
cd ..
sleep 3

if ps -p $ANVIL_PID > /dev/null; then
    echo "   ✅ Anvil running on http://127.0.0.1:8545 (PID: $ANVIL_PID)"
else
    echo "   ❌ Failed to start Anvil"
    exit 1
fi

echo ""
echo "2️⃣  Starting Flask Server..."
python3 app.py &
FLASK_PID=$!
sleep 3

if ps -p $FLASK_PID > /dev/null; then
    echo "   ✅ Flask running on http://localhost:8000 (PID: $FLASK_PID)"
else
    echo "   ❌ Failed to start Flask"
    kill $ANVIL_PID
    exit 1
fi

echo ""
echo "✅ Everything is running!"
echo "=================================================="
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Open MetaMask"
echo "2. Add Network: Anvil Local"
echo "   - RPC URL: http://127.0.0.1:8545"
echo "   - Chain ID: 31337"
echo "   - Currency: ETH"
echo ""
echo "3. Import Test Account (has 10,000 ETH):"
echo "   Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
echo ""
echo "4. Open browser: http://localhost:8000"
echo ""
echo "5. Make a donation and see REAL blockchain transaction! 🎉"
echo ""
echo "=================================================="
echo "📖 See BLOCKCHAIN_INTEGRATION.md for full guide"
echo "=================================================="
echo ""
echo "⏸️  Press Ctrl+C to stop all services"
echo ""

# Wait for user to stop
wait

