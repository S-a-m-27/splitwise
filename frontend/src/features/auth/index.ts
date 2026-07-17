/**
 * Auth feature public API.
 *
 * @module features/auth
 */

export { LoginForm } from "./components/login-form";
export { RegisterForm } from "./components/register-form";
export { AuthLayout } from "./components/auth-layout";
export { AuthGateLoader } from "./components/auth-gate-loader";
export { LogoutButton } from "./components/logout-button";
export { GoogleSignInButton } from "./components/google-sign-in-button";
export { AuthDivider } from "./components/auth-divider";

export { useAuth, useInitializeAuth } from "./hooks/use-auth";
export { useAuthStore } from "./store/auth-store";

export { authService } from "./services/auth.service";
export {
  normalizeAuthError,
  getAuthErrorMessage,
  getAuthQueryErrorMessage,
  type AuthErrorCode,
  type NormalizedAuthError,
} from "./services/auth.errors";

export * from "./types";
export * from "./validation/auth.schema";
