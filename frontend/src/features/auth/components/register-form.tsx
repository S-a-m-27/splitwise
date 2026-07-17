"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";
import { User, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { getSafeRedirect } from "@/lib/safe-redirect";
import { useClientSearchParams } from "@/lib/use-client-search-params";
import { resolveAuthenticatedRegisterVisit } from "@/lib/invitation-register";
import { AuthGateLoader } from "@/features/auth/components/auth-gate-loader";
import { AuthDivider } from "@/features/auth/components/auth-divider";
import { GoogleSignInButton } from "@/features/auth/components/google-sign-in-button";
import { registerSchema, type RegisterInput } from "../validation/auth.schema";
import { useAuth } from "../hooks/use-auth";
import { authService } from "../services/auth.service";
import { useAuthStore } from "../store/auth-store";
import {
  AUTH_ERROR_CLASS,
  AUTH_INPUT_CLASS,
  AUTH_INPUT_ERROR_CLASS,
  AUTH_LABEL_CLASS,
  AUTH_SUBMIT_CLASS,
} from "../utils/form-styles";

type StrengthResult = {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  labelClass: string;
};

function getStrength(pwd: string): StrengthResult {
  if (!pwd) return { score: 0, label: "", labelClass: "" };
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[a-z]/.test(pwd)) s++;
  if (/\d/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  const score = Math.min(s, 4) as 0 | 1 | 2 | 3 | 4;
  const map: Record<1 | 2 | 3 | 4, { label: string; labelClass: string }> = {
    1: { label: "Very weak", labelClass: "text-red-500" },
    2: { label: "Weak", labelClass: "text-orange-500" },
    3: { label: "Fair", labelClass: "text-yellow-500" },
    4: { label: "Strong", labelClass: "text-emerald-500" },
  };
  return score === 0 ? { score: 0, label: "", labelClass: "" } : { score, ...map[score] };
}

const segColour: Record<1 | 2 | 3 | 4, string> = {
  1: "bg-red-500",
  2: "bg-orange-400",
  3: "bg-yellow-400",
  4: "bg-emerald-500",
};

export function RegisterForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useClientSearchParams();
  const invitedEmailParam = searchParams?.get("email")?.trim() ?? "";
  const redirectParam = searchParams?.get("redirect") ?? null;
  const redirectTo = getSafeRedirect(redirectParam);
  const { register: signUp, isRegistering, isAuthenticated, isLoading, user, isSigningInWithGoogle } =
    useAuth();
  const [showPwd, setShowPwd] = useState(false);
  const [pwdValue, setPwdValue] = useState("");
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);
  const authBusy = isRegistering || isSigningInWithGoogle;

  const {
    register: field,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!searchParams) return;
    reset({
      fullName: "",
      email: searchParams.get("email")?.trim() ?? "",
      password: "",
      confirmPassword: "",
    });
  }, [searchParams, reset]);

  useEffect(() => {
    if (!searchParams || isLoading || !isAuthenticated) return;

    const registerDecision = resolveAuthenticatedRegisterVisit({
      pathname: ROUTES.register,
      invitedEmail: searchParams.get("email"),
      redirectParam: searchParams.get("redirect"),
      sessionEmail: user?.email,
    });

    if (registerDecision.action === "to_invitation") {
      router.replace(registerDecision.path);
      return;
    }

    if (registerDecision.action !== "wrong_account" || isSwitchingAccount) return;

    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;
      setIsSwitchingAccount(true);
    });

    void (async () => {
      const result = await authService.signOut();
      if (cancelled) return;

      if (result.error) {
        setIsSwitchingAccount(false);
        toast.error("Could not sign out. Please try again.");
        return;
      }

      useAuthStore.getState().clearAuth();
      queryClient.clear();
      setIsSwitchingAccount(false);
      toast.message("Signed out", {
        description: `Create an account for ${registerDecision.invitedEmail} to accept the invitation.`,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [
    searchParams,
    isLoading,
    isAuthenticated,
    isSwitchingAccount,
    user?.email,
    router,
    queryClient,
  ]);

  if (!searchParams || isLoading || isSwitchingAccount) {
    return (
      <AuthGateLoader
        message={isSwitchingAccount ? "Preparing sign up…" : "Loading sign up…"}
      />
    );
  }

  const loginHref =
    redirectTo || invitedEmailParam
      ? `${ROUTES.login}?${new URLSearchParams({
          ...(invitedEmailParam ? { email: invitedEmailParam } : {}),
          ...(redirectTo ? { redirect: redirectTo } : {}),
        }).toString()}`
      : ROUTES.login;

  const onSubmit = (data: RegisterInput) => signUp({ fields: data, redirectTo });
  const strength = getStrength(pwdValue);

  return (
    <div className="flex flex-col gap-4">
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="reg-full-name" className={AUTH_LABEL_CLASS}>
          Full name
        </label>
        <div className="relative">
          <User
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="reg-full-name"
            type="text"
            placeholder="John Doe"
            autoComplete="name"
            autoFocus
            disabled={authBusy}
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? "reg-full-name-error" : undefined}
            {...field("fullName")}
            className={AUTH_INPUT_CLASS + (errors.fullName ? AUTH_INPUT_ERROR_CLASS : "")}
          />
        </div>
        {errors.fullName && (
          <p id="reg-full-name-error" role="alert" className={AUTH_ERROR_CLASS}>
            <span aria-hidden="true">⚠</span> {errors.fullName.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="reg-email" className={AUTH_LABEL_CLASS}>
          Email address
        </label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="reg-email"
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
            autoCapitalize="none"
            readOnly={!!invitedEmailParam}
            disabled={authBusy}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "reg-email-error" : undefined}
            {...field("email")}
            className={AUTH_INPUT_CLASS + (errors.email ? AUTH_INPUT_ERROR_CLASS : "")}
          />
        </div>
        {errors.email && (
          <p id="reg-email-error" role="alert" className={AUTH_ERROR_CLASS}>
            <span aria-hidden="true">⚠</span> {errors.email.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="reg-password" className={AUTH_LABEL_CLASS}>
          Password
        </label>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="reg-password"
            type={showPwd ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={authBusy}
            aria-invalid={!!errors.password}
            aria-describedby={
              errors.password || pwdValue
                ? "reg-password-feedback"
                : undefined
            }
            {...field("password")}
            onChange={(e) => {
              setPwdValue(e.target.value);
              field("password").onChange(e);
            }}
            className={
              AUTH_INPUT_CLASS + " pr-11" + (errors.password ? AUTH_INPUT_ERROR_CLASS : "")
            }
          />
          <button
            type="button"
            aria-label={showPwd ? "Hide password" : "Show password"}
            onClick={() => setShowPwd((v) => !v)}
            disabled={authBusy}
            className="absolute top-1/2 right-3 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-accent hover:text-foreground active:scale-90"
          >
            {showPwd ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>

        <div id="reg-password-feedback" aria-live="polite">
          {pwdValue && (
            <div className="space-y-1">
              <div className="flex gap-1.5">
                {([1, 2, 3, 4] as const).map((seg) => (
                  <div
                    key={seg}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      strength.score >= seg && strength.score > 0
                        ? segColour[strength.score as 1 | 2 | 3 | 4]
                        : "bg-border"
                    }`}
                  />
                ))}
              </div>
              {strength.label && (
                <p className={`text-[11px] font-semibold ${strength.labelClass}`}>
                  {strength.label}
                </p>
              )}
            </div>
          )}
          {errors.password && (
            <p role="alert" className={AUTH_ERROR_CLASS}>
              <span aria-hidden="true">⚠</span> {errors.password.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="reg-confirm" className={AUTH_LABEL_CLASS}>
          Confirm password
        </label>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="reg-confirm"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={authBusy}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={
              errors.confirmPassword ? "reg-confirm-error" : undefined
            }
            {...field("confirmPassword")}
            className={
              AUTH_INPUT_CLASS +
              (errors.confirmPassword ? AUTH_INPUT_ERROR_CLASS : "")
            }
          />
        </div>
        {errors.confirmPassword && (
          <p id="reg-confirm-error" role="alert" className={AUTH_ERROR_CLASS}>
            <span aria-hidden="true">⚠</span> {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <button
        id="register-submit"
        type="submit"
        disabled={authBusy}
        className={AUTH_SUBMIT_CLASS}
      >
        {isRegistering ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Creating account…
          </>
        ) : (
          <>
            Create Account
            <ArrowRight
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </>
        )}
      </button>
      </form>

      <AuthDivider />
      <GoogleSignInButton redirectTo={redirectTo} disabled={authBusy} />

      <p className="pt-1 text-center text-[13px] text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={loginHref}
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
