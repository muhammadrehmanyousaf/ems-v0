#!/bin/bash
# Run the hourly billing job ONCE against the lab DB at the shifted clock (the lab backend runs with sweepers off).
# usage: FAKE_CLOCK_OFFSET_MS=<ms> bash qa/plans-e2e/sweep.sh
cd /c/Projects/WW-FIX/backend/integration
export DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5434/ww_pay_34 PGSSLMODE=disable NODE_ENV=localDevelopment TZ=UTC DB_POOL_MAX=3
export JWT_SECRET=local-pay-secret-local-pay-secret-123 BILLING_ENFORCE=on BILLING_NOTICES=0 SUBSCRIPTION_TRIAL_DAYS=30
export SAFEPAY_HOST=http://127.0.0.1:19834 SAFEPAY_ENV=sandbox SAFEPAY_SECRET_KEY=labsecretlabsecretlabsecretlabsecretlabsecretlabsecretlabsecret1234 SAFEPAY_WEBHOOK_SECRET=lab_webhook_secret SAFEPAY_PLAN_PRO=plan_lab_pro SAFEPAY_PLAN_PREMIUM=plan_lab_premium SAFEPAY_PLAN_ELITE=plan_lab_elite
export PUBLIC_REVALIDATE_URL=http://localhost:3011/api/revalidate PUBLIC_REVALIDATE_SECRET=lab-revalidate-secret-pl-e
export FRONTEND_URL=http://localhost:3011
exec node -r C:/Projects/WW-PAYMENT-TEST/tools/fake-clock.cjs -e "require('./src/jobs/subscriptionSweeper').runOnce().then(r=>{console.log('SWEEP',JSON.stringify(r));setTimeout(()=>process.exit(0),1500)}).catch(e=>{console.error('SWEEP FAILED',e);process.exit(1)})"
