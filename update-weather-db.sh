#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "Error: .env file not found!"
    exit 1
fi

# Validate required environment variables
required_vars=(
    "REMOTE_USER"
    "REMOTE_HOST"
    "DOCKER_CONTAINER_NAME"
    "DOCKER_VOLUME_PATH"
    "TEMP_PATH"
    "LOCAL_PATH"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Error: Required environment variable $var is not set!"
        exit 1
    fi
done

# Function to find the next backup number
find_next_backup_number() {
    local base_path="$1"
    local dir=$(dirname "$base_path")
    local filename=$(basename "$base_path" .db)
    local max_num=0

    # Find existing backup files and get the highest number
    for file in "$dir"/"$filename".*.db; do
        if [[ -f "$file" && "$file" =~ \.([0-9]+)\.db$ ]]; then
            num="${BASH_REMATCH[1]}"
            if [[ $num -gt $max_num ]]; then
                max_num=$num
            fi
        fi
    done

    echo $((max_num + 1))
}

# Use zsh to ensure the correct environment is used
ssh ${REMOTE_USER}@${REMOTE_HOST} 'zsh --login -c "echo $PATH; which docker; docker --version"'

# Step 1: Copy the SQLite database from Docker volume to a temporary location
ssh ${REMOTE_USER}@${REMOTE_HOST} 'zsh --login -c "docker cp '${DOCKER_CONTAINER_NAME}:${DOCKER_VOLUME_PATH}' '${TEMP_PATH}'"'

# Step 2: Download the SQLite database using scp
scp ${REMOTE_USER}@${REMOTE_HOST}:${TEMP_PATH} ${LOCAL_PATH}

# Step 3: Clean up (optional)
ssh ${REMOTE_USER}@${REMOTE_HOST} "rm ${TEMP_PATH}"

# Step 4: Backup existing database if it exists
if [ -f "${DATABASE_PATH}" ]; then
    backup_num=$(find_next_backup_number "${DATABASE_PATH}")
    backup_path="$(dirname "${DATABASE_PATH}")/$(basename "${DATABASE_PATH}" .db).${backup_num}.db"
    echo "Backing up existing database to ${backup_path}"
    cp "${DATABASE_PATH}" "${backup_path}"
fi

# Step 5: Copy the new database to the DATABASE_PATH location
echo "Copying new database to ${DATABASE_PATH}"
cp "${LOCAL_PATH}" "${DATABASE_PATH}"

# Step 6: Clean up the initially downloaded database file
echo "Cleaning up temporary file ${LOCAL_PATH}"
rm "${LOCAL_PATH}"

echo "Download complete. SQLite database saved to ${DATABASE_PATH}."
echo "Previous database backed up with number ${backup_num:-1}."
