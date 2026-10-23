import { useState, type SubmitEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/Button";
import { FormField } from "../components/FormField";
import { GoogleButton } from "../components/GoogleButton";
import { Logo } from "../components/Logo";
import { useAuth } from "../auth/AuthContext";
import { useDocumentTitle } from "../lib/useDocumentTitle";

export function Login() {
  useDocumentTitle("Log in — MicroIntern");
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get("redirect") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      navigate(redirect, { replace: true });
    } catch (err) {
      setError((err as Error).message || "Could not log in.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onGoogleCredential(credential: string) {
    setError(null);
    try {
      const res = await loginWithGoogle(credential);
      if ("needs_role" in res) {
        navigate("/signup/complete", {
          state: { pending: res.pending },
        });
      } else {
        navigate(redirect, { replace: true });
      }
    } catch (err) {
      setError((err as Error).message || "Google sign-in failed.");
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-4rem)] md:grid-cols-2">
      {/* Left — brand panel with hero-style image + overlay */}
      <aside className="relative hidden overflow-hidden bg-brand p-12 text-paper md:flex md:flex-col md:justify-between">
        {/* Background image */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/hero1.jpg')" }}
        />
        {/* Faint blue overlay */}
        <div aria-hidden="true" className="absolute inset-0 bg-brand/70" />

        {/* Content floats above */}
        <div className="relative z-10">
          <Logo size="lg" inverted />
        </div>
        <div className="relative z-10 max-w-sm">
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-paper/95">
            Work that proves itself.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-paper/80">
            Short paid tasks, funded up front. Real work, real proof — no
            portfolio to curate.
          </p>
        </div>
        <p className="relative z-10 text-sm text-paper/60">
          © 2026 MicroIntern
        </p>
      </aside>
      {/* Right — form card */}
      <main className="flex items-center justify-center bg-paper px-6 py-16 md:py-20">
        <div className="w-full max-w-md rounded-lg border border-chalk bg-paper p-8 shadow-[0_10px_30px_-12px_rgba(17,23,43,0.18)] md:p-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">
            Welcome back
          </h1>
          <p className="mt-2 text-base text-ink/70">
            New here?{" "}
            <Link
              to={`/signup${
                redirect !== "/dashboard"
                  ? `?redirect=${encodeURIComponent(redirect)}`
                  : ""
              }`}
              className="font-semibold text-brand underline-offset-4 hover:underline"
            >
              Create an account
            </Link>
          </p>

          <form
            onSubmit={onSubmit}
            className="mt-8 flex flex-col gap-5"
            noValidate
          >
            <FormField
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div>
              <FormField
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="mt-1 self-end text-sm font-medium text-ink/60 hover:text-ink"
              >
                {showPassword ? "Hide password" : "Show password"}
              </button>
            </div>

            {error && (
              <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={submitting}
              className="w-full"
            >
              {submitting ? "Logging in…" : "Log in"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-chalk" />
            <span className="text-xs uppercase tracking-wider text-ink/50">
              or
            </span>
            <span className="h-px flex-1 bg-chalk" />
          </div>

          <GoogleButton onCredential={onGoogleCredential} text="signin_with" />
        </div>
      </main>
    </div>
  );
}
