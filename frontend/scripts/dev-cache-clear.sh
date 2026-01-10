#!/bin/bash
#
# WebWaka Development Cache Clear Script
# P2-A Technical Debt Fix
#
# Usage: ./scripts/dev-cache-clear.sh [--full]
#
# Options:
#   --full    Clear all caches including node_modules/.cache
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(dirname "$SCRIPT_DIR")"

echo "🧹 WebWaka Development Cache Clear"
echo "=================================="
echo ""

# Function to show directory size
show_size() {
    if [ -d "$1" ]; then
        du -sh "$1" 2>/dev/null | cut -f1
    else
        echo "N/A"
    fi
}

echo "Current cache sizes:"
echo "  .next/cache: $(show_size "$FRONTEND_DIR/.next/cache")"
echo "  node_modules/.cache: $(show_size "$FRONTEND_DIR/node_modules/.cache")"
echo ""

# Clear .next cache
if [ -d "$FRONTEND_DIR/.next/cache" ]; then
    echo "📁 Clearing .next/cache..."
    rm -rf "$FRONTEND_DIR/.next/cache"
    echo "   ✓ Cleared"
else
    echo "📁 .next/cache not found (already clean)"
fi

# Full clear includes node_modules/.cache
if [ "$1" = "--full" ]; then
    if [ -d "$FRONTEND_DIR/node_modules/.cache" ]; then
        echo "📁 Clearing node_modules/.cache..."
        rm -rf "$FRONTEND_DIR/node_modules/.cache"
        echo "   ✓ Cleared"
    fi
    
    # Also clear .next build artifacts (not the directory itself)
    if [ -d "$FRONTEND_DIR/.next" ]; then
        echo "📁 Clearing .next build artifacts..."
        rm -rf "$FRONTEND_DIR/.next/server"
        rm -rf "$FRONTEND_DIR/.next/static"
        rm -f "$FRONTEND_DIR/.next/build-manifest.json"
        rm -f "$FRONTEND_DIR/.next/app-build-manifest.json"
        echo "   ✓ Cleared"
    fi
fi

echo ""
echo "✅ Cache clear complete"
echo ""
echo "Next steps:"
echo "  1. Restart the dev server: sudo supervisorctl restart frontend"
echo "  2. Or rebuild: yarn build"
echo ""
