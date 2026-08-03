import "../../globals.css";
import { Suspense } from "react";
import ProtectLogin from "./_components/protect-login";

export default function LoginPage() {
  // ProtectLogin (and the LoginForm inside it) now read ?redirect= via
  // useSearchParams, which Next 14 refuses to prerender outside a Suspense
  // boundary — without this the production build fails on /login.
  return (
    <Suspense fallback={null}>
      <ProtectLogin />
    </Suspense>
  );
}
