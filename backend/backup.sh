#!/bin/bash
# Backup Neon DB
export $(grep -v '^#' /root/mfi-system/backend/.env | xargs)
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="/root/backups"
FILE="$BACKUP_DIR/db_backup_$DATE.sql"
pg_dump $DATABASE_URL > $FILE
find $BACKUP_DIR -type f -name "db_backup_*.sql" -mtime +30 -exec rm {} \;
