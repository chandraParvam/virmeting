#!/bin/bash

API_KEY_SECRET="mirotalksfu_default_secret"
MIROTALK_URL="https://meeting.dev.qprofiles.com/api/v1/meeting"
# MIROTALK_URL="http://localhost:3010/api/v1/meeting"

curl $MIROTALK_URL \
    --header "authorization: $API_KEY_SECRET" \
    --header "Content-Type: application/json" \
    --request POST