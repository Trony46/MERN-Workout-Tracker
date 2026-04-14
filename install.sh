#!/bin/bash
# ─────────────────────────────────────────────────────────
# FitLog — Quick Install Script
# Run this once after extracting the ZIP.
# ─────────────────────────────────────────────────────────

set -e   # Stop on any error

echo ""
echo "  🔥 FitLog — Installing..."
echo ""

# Install root dev tools (concurrently)
echo "  [1/3] Installing root tools..."
npm install --silent

echo ""

# Install backend
echo "  [2/3] Installing backend (Express + Socket.io)..."
cd backend && npm install --silent && cd ..

echo ""

# Install frontend
echo "  [3/3] Installing frontend (React + Recharts)..."
cd frontend && npm install --silent && cd ..

echo ""
echo "  ✅ Done! Now create your .env file:"
echo ""
echo "     cd backend"
echo "     cp .env.example .env"
echo "     (then edit .env with your MongoDB URI)"
echo ""
echo "  ─────────────────────────────────────────────────"
echo "  To start the app:"
echo ""
echo "     npm run dev          ← starts BOTH servers"
echo ""
echo "  Or manually:"
echo "     Terminal 1: cd backend  && npm run dev"
echo "     Terminal 2: cd frontend && npm run dev"
echo ""
echo "  Then open: http://localhost:5173"
echo "  ─────────────────────────────────────────────────"
echo ""
