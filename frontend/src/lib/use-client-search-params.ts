"use client";

import { useEffect, useState } from "react";

/**
 * Reads URL search params after mount so SSR and hydration render the same HTML.
 */
export function useClientSearchParams(): URLSearchParams | null {
  const [params, setParams] = useState<URLSearchParams | null>(null);

  useEffect(() => {
    setParams(new URLSearchParams(window.location.search));
  }, []);

  return params;
}
