/**
 * Is phone OTP actually deliverable?
 *
 * No. There is no SMS gateway provisioned, and the backend says so plainly when
 * asked:
 *
 *   "OTP delivery is not configured. An SMS gateway must be set up before phone
 *    login can be used."
 *
 * That is a correct refusal from the server and, until now, three broken
 * promises from the UI:
 *
 *   1. Login — "Sign in with phone number" took a mobile number and then
 *      explained the platform's own missing infrastructure to someone trying to
 *      sign in.
 *   2. The verification banner — on EVERY dashboard screen — told vendors
 *      "Please verify your phone to unlock bookings", which is the platform
 *      blaming the vendor for something the vendor cannot do, about a feature
 *      that is not actually locked.
 *   3. Security settings — offered "Verify phone" as a thing you could go and
 *      do.
 *
 * One constant so all three tell the same story, and so switching phone OTP on
 * when a gateway exists is one edit rather than a hunt.
 *
 * Deliberately NOT an env var. It replaced `NEXT_PUBLIC_FEAT_PHONE_OTP`, and a
 * flag was the wrong shape: whether an SMS gateway exists is a fact about the
 * infrastructure, not a per-deploy preference — and as a flag, production was
 * pointed at a door with nothing behind it, which is exactly what happened.
 *
 * Email verification is unaffected and works: measured on the live outbox,
 * emails are sending today with zero failures.
 */
export const PHONE_OTP_AVAILABLE = false
