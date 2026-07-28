#!/bin/bash
BACKUP_DIR="/root/backups"
DB_URL="postgresql://neondb_owner:F6C3VIfHnsay@ep-holy-boat-axokevhx-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Dump the database
pg_dump "$DB_URL" > "$BACKUP_FILE"

# Keep only the last 7 days of backups
find "$BACKUP_DIR" -type f -name "*.sql" -mtime +7 -exec rm {} \;

# NEW: Verification check
if [ -s "$BACKUP_FILE" ]; then
    echo "$(date) - Backup successful: $BACKUP_FILE" >> "$BACKUP_DIR/backup_success.log"
else
    echo "$(date) - Backup FAILED or empty" >> "$BACKUP_DIR/backup_errors.log"
fi
