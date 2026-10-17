#!/bin/bash
# Lab backend for PL-E: slot 34 (port 5134), PL-A + PL-B code, enforcement ON, notices off, fake Safepay on :19834.
# The generic launcher pins FRONTEND_URL/ALLOWED_ORIGINS to 3000-3003; this copy points them at the PL-E dev server (3011-3013).
# usage: [FAKE_CLOCK_OFFSET_MS=...] [SWEEPERS=1] bash qa/plans-e2e/be.sh
SLOT=34; WT=C:/Projects/WW-FIX/backend/integration
sed -e "s#^cd /c/Projects/ems-v0-backend#cd $WT#" \
    -e "s#FRONTEND_URL=http://localhost:3001#FRONTEND_URL=http://localhost:3011#" \
    -e "s#ALLOWED_ORIGINS=[^ ]*#ALLOWED_ORIGINS=http://localhost:3011,http://localhost:3012,http://localhost:3013#" \
    /c/Projects/WW-PAYMENT-TEST/tools/pay-backend.sh > /tmp/ple-backend-$SLOT.sh
export BILLING_ENFORCE=on BILLING_NOTICES=0 SUBSCRIPTION_TRIAL_DAYS=30
export SAFEPAY_HOST=http://127.0.0.1:19834 SAFEPAY_ENV=sandbox SAFEPAY_CHECKOUT_HOST=http://127.0.0.1:19834
export PUBLIC_REVALIDATE_URL=http://localhost:3011/api/revalidate PUBLIC_REVALIDATE_SECRET=lab-revalidate-secret-pl-e
export MANUAL_PAYMENT_METHODS='[{"key":"bank","label":"Bank transfer","accountTitle":"WeddingWala (Pvt) Ltd","accountNumber":"PK00LAB0000000000001","bankName":"Lab Bank","note":"Send the exact amount"},{"key":"jazzcash","label":"JazzCash","accountTitle":"WeddingWala","accountNumber":"0300-0000001","note":""},{"key":"easypaisa","label":"Easypaisa","accountTitle":"WeddingWala","accountNumber":"0345-0000002","note":""}]'
exec bash /tmp/ple-backend-$SLOT.sh $SLOT
