#!/bin/bash
# Dev server for PL-E: :3011 -> lab backend :5134, revalidate secret shared with the lab backend (be.sh).
cd /c/Projects/WW-FIX/frontend/pl-e-admin-e2e
export NEXT_PUBLIC_BACKEND_URL=http://localhost:5134/ PUBLIC_REVALIDATE_SECRET=lab-revalidate-secret-pl-e
exec npx next dev -p 3011
