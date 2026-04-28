import type { ReactNode } from "react";

import NotFound from "../pages/public/NotFound";

const getTokenPayload = (): Record<string, unknown> | null => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  const tokenParts = token.split(".");
  if (tokenParts.length < 2) return null;

  try {
    const payload = atob(tokenParts[1]);
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return null;
  }
};

export const RequireAuth = ({ children }: { children: ReactNode }) => {
  const payload = getTokenPayload();
  return payload ? children : <NotFound />;
};

export const RequireAdmin = ({ children }: { children: ReactNode }) => {
  const payload = getTokenPayload();
  const role = payload?.role;
  const isAdmin = role === "ADMIN" || role === "SUPERADMIN";

  return payload && isAdmin ? children : <NotFound />;
};
