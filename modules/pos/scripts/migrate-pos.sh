#!/bin/bash
# =============================================================================
# POS Database Migration Script
# =============================================================================
# 
# This script prepares and runs the POS module database migrations.
# 
# PREREQUISITES:
# 1. Supabase DATABASE_URL must be set in /app/modules/pos/.env
# 2. Format: postgresql://user:password@host:port/database
#
# USAGE:
#   ./migrate-pos.sh [command]
#
# COMMANDS:
#   generate  - Generate Prisma client without migrating
#   push      - Push schema to database (development)
#   migrate   - Create and apply migrations (production)
#   status    - Check migration status
#   reset     - Reset database (DANGER: drops all data)
#
# =============================================================================

set -e

POS_DIR="/app/modules/pos"
SCHEMA_FILE="$POS_DIR/prisma/schema.prisma"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=======================================${NC}"
echo -e "${GREEN}  POS Database Migration Script${NC}"
echo -e "${GREEN}=======================================${NC}"

# Check if .env exists
if [ ! -f "$POS_DIR/.env" ]; then
  echo -e "${YELLOW}Creating .env file...${NC}"
  cat > "$POS_DIR/.env" << 'EOF'
# POS Module Database Configuration
# 
# Copy the DATABASE_URL from your Supabase project settings:
# Project Settings > Database > Connection string > URI
#
# DATABASE_URL="postgresql://postgres:[password]@[host]:[port]/postgres"
DATABASE_URL=""
EOF
  echo -e "${RED}ERROR: Please configure DATABASE_URL in $POS_DIR/.env${NC}"
  exit 1
fi

# Source environment
source "$POS_DIR/.env"

# Check DATABASE_URL
if [ -z "$DATABASE_URL" ] || [ "$DATABASE_URL" == '""' ]; then
  echo -e "${RED}ERROR: DATABASE_URL is not set in $POS_DIR/.env${NC}"
  echo ""
  echo "To fix this:"
  echo "1. Go to your Supabase project"
  echo "2. Navigate to Project Settings > Database"
  echo "3. Copy the Connection string (URI)"
  echo "4. Paste it in $POS_DIR/.env as DATABASE_URL"
  exit 1
fi

# Navigate to POS directory
cd "$POS_DIR"

# Get command
COMMAND=${1:-"status"}

case $COMMAND in
  "generate")
    echo -e "${YELLOW}Generating Prisma client...${NC}"
    npx prisma generate --schema="$SCHEMA_FILE"
    echo -e "${GREEN}✓ Prisma client generated${NC}"
    ;;

  "push")
    echo -e "${YELLOW}Pushing schema to database...${NC}"
    echo -e "${YELLOW}This will create/update tables without migrations.${NC}"
    npx prisma db push --schema="$SCHEMA_FILE"
    echo -e "${GREEN}✓ Schema pushed to database${NC}"
    ;;

  "migrate")
    echo -e "${YELLOW}Creating and applying migrations...${NC}"
    npx prisma migrate dev --schema="$SCHEMA_FILE" --name "pos_initial"
    echo -e "${GREEN}✓ Migrations applied${NC}"
    ;;

  "status")
    echo -e "${YELLOW}Checking migration status...${NC}"
    npx prisma migrate status --schema="$SCHEMA_FILE"
    ;;

  "reset")
    echo -e "${RED}WARNING: This will drop all POS tables and data!${NC}"
    read -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" == "yes" ]; then
      npx prisma migrate reset --schema="$SCHEMA_FILE" --force
      echo -e "${GREEN}✓ Database reset${NC}"
    else
      echo "Cancelled."
    fi
    ;;

  *)
    echo "Unknown command: $COMMAND"
    echo ""
    echo "Usage: ./migrate-pos.sh [generate|push|migrate|status|reset]"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}=======================================${NC}"
echo -e "${GREEN}  Migration complete!${NC}"
echo -e "${GREEN}=======================================${NC}"
