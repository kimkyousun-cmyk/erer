import { cookies } from "next/headers";

const CSRF_COOKIE = "csrf_token";

export function verifyCsrfToken(formData: FormData) {
  const jar = cookies();
  const cookieToken = jar.get(CSRF_COOKIE)?.value;
  const formToken = formData.get("csrfToken");
  if (!cookieToken || typeof formToken !== "string") return false;
  return cookieToken === formToken;
}

export function csrfCookieName() {
  return CSRF_COOKIE;
}
