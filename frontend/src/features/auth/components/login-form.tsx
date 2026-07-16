"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { useClientSearchParams } from "@/lib/use-client-search-params";
import { loginSchema, type LoginInput } from "../validation/auth.schema";
import { useAuth } from "../hooks/use-auth";
import {
  AUTH_ERROR_CLASS,
  AUTH_INPUT_CLASS,
  AUTH_INPUT_ERROR_CLASS,
  AUTH_LABEL_CLASS,
  AUTH_SUBMIT_CLASS,
} from "../utils/form-styles";

export function LoginForm() {
  const { login, isLoggingIn } = useAuth();
  const searchParams = useClientSearchParams();
  const redirectTo = searchParams?.get("redirect") ?? null;
  const [showPwd, setShowPwd] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (!searchParams) return;
    reset({
      email: searchParams.get("email")?.trim() ?? "",
      password: "",
    });
  }, [searchParams, reset]);

  const onSubmit = (data: LoginInput) => login({ credentials: data, redirectTo });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-email" className={AUTH_LABEL_CLASS}>
          Email address
        </label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="login-email"
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
            autoCapitalize="none"
            autoFocus
            disabled={isLoggingIn}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "login-email-error" : undefined}
            {...register("email")}
            className={
              AUTH_INPUT_CLASS + (errors.email ? AUTH_INPUT_ERROR_CLASS : "")
            }
          />
        </div>
        {errors.email && (
          <p id="login-email-error" role="alert" className={AUTH_ERROR_CLASS}>
            <span aria-hidden="true">⚠</span> {errors.email.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-password" className={AUTH_LABEL_CLASS}>
          Password
        </label>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="login-password"
            type={showPwd ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={isLoggingIn}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "login-password-error" : undefined}
            {...register("password")}
            className={
              AUTH_INPUT_CLASS +
              " pr-11" +
              (errors.password ? AUTH_INPUT_ERROR_CLASS : "")
            }
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label={showPwd ? "Hide password" : "Show password"}
            onClick={() => setShowPwd((v) => !v)}
            disabled={isLoggingIn}
            className="absolute top-1/2 right-3 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-accent hover:text-foreground active:scale-90"
          >
            {showPwd ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.password && (
          <p id="login-password-error" role="alert" className={AUTH_ERROR_CLASS}>
            <span aria-hidden="true">⚠</span> {errors.password.message}
          </p>
        )}
      </div>

      <button
        id="login-submit"
        type="submit"
        disabled={isLoggingIn}
        className={AUTH_SUBMIT_CLASS}
      >
        {isLoggingIn ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Signing in…
          </>
        ) : (
          <>
            Sign In
            <ArrowRight
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </>
        )}
      </button>

      <p className="pt-1 text-center text-[13px] text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href={ROUTES.register}
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Create one free
        </Link>
      </p>
    </form>
  );
}
