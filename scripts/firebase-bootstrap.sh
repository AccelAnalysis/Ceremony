#!/usr/bin/env bash
set -euo pipefail
PROJECT_ID="ceremony-d1618"
APP_NAME="Ceremony"
FB="npx -y firebase-tools@latest"

$FB --version
$FB login
$FB use "$PROJECT_ID"
$FB firestore:databases:list --project "$PROJECT_ID"

echo "Inspect the edition of the database returned above with:"
echo "  $FB firestore:databases:get <database-id> --project $PROJECT_ID"
echo

echo "Registering the Ceremony web app if it does not already exist..."
if ! $FB apps:list --project "$PROJECT_ID" | grep -Fq "$APP_NAME"; then
  $FB apps:create WEB "$APP_NAME" --project "$PROJECT_ID"
fi

echo
$FB apps:list --project "$PROJECT_ID"
echo "Copy the APP ID for Ceremony, then run:"
echo "  $FB apps:sdkconfig WEB <APP_ID> --project $PROJECT_ID"
echo "Use the returned apiKey and appId to update config/firebase-config.js."
echo
$FB deploy --only auth,firestore:rules,firestore:indexes --project "$PROJECT_ID"
