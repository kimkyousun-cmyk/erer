"use client";

import { useEffect, useState } from "react";

export function CsrfTokenField() {
  const [token, setToken] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/csrf", { method: "GET", cache: "no-store" })
      .then((res) => res.json() as Promise<{ csrfToken: string }>)
      .then((data) => {
        if (active) setToken(data.csrfToken);
      })
      .catch(() => {
        // Silent failure: server actions will reject without a token.
      });

    return () => {
      active = false;
    };
  }, []);

  return <input type="hidden" name="csrfToken" value={token} readOnly />;
}
