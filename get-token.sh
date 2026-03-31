#!/bin/bash
echo "Veuillez coller ce code dans Hostinger pour récupérer le vrai token :"
echo "docker exec vdf-db-dev sh -c 'psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"SELECT token FROM \\\"FcmToken\\\" LIMIT 1;\"'"
