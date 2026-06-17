import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { signIn, signUp, confirmSignUp } from "../utils/cognito";
import { Globe, Loader2, ArrowRight, Mail } from "lucide-react";
import { motion } from "framer-motion";

type Mode = "signin" | "signup" | "confirm";

export default function SignIn() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setToken, setUser } = useStore();

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const result = await signIn({ email: email.trim(), password });
      setToken(result.idToken);
      setUser({
        id: email.trim(),
        email: email.trim(),
        plan: "explorer",
      });
      navigate("/", { replace: true });
    } catch (e: any) {
      setError(e.message || "Sign in failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    if (password.length < 12) {
      setError("Password must be at least 12 characters long.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signUp({ email: email.trim(), password });
      setMode("confirm");
    } catch (e: any) {
      setError(e.message || "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!confirmationCode.trim()) return;
    setError(null);
    setLoading(true);
    try {
      await confirmSignUp(email.trim(), confirmationCode.trim());
      const result = await signIn({ email: email.trim(), password });
      setToken(result.idToken);
      setUser({
        id: email.trim(),
        email: email.trim(),
        plan: "explorer",
      });
      navigate("/", { replace: true });
    } catch (e: any) {
      setError(e.message || "Confirmation failed. Please check your code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex items-center justify-center min-h-screen min-h-dvh px-6"
      style={{ background: "var(--bg)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Brand Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background:
                "linear-gradient(135deg, var(--accent), var(--accent-hover))",
            }}
          >
            <Globe size={32} color="white" />
          </div>
          <h1
            className="text-2xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Plan Your Journey
          </h1>
          <p
            className="mt-2 text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            Your AI-powered travel planning assistant
          </p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="p-8 rounded-2xl shadow-lg border"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <h2
            className="text-xl font-semibold mb-2 text-center"
            style={{ color: "var(--text-primary)" }}
          >
            {mode === "confirm"
              ? "Confirm your email"
              : mode === "signup"
                ? "Create an account"
                : "Sign in"}
          </h2>
          <p
            className="text-sm text-center mb-6"
            style={{ color: "var(--text-secondary)" }}
          >
            {mode === "confirm"
              ? `Enter the verification code sent to ${email}`
              : mode === "signup"
                ? "Start planning your trips today"
                : "Welcome back"}
          </p>

          {mode === "confirm" ? (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleConfirm}
              className="flex flex-col gap-4"
            >
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-tertiary)" }}
                />
                <input
                  type="text"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  placeholder="Verification code"
                  required
                  autoFocus
                  className="w-full pl-12 pr-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                    background: "var(--surface)",
                  }}
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm px-4 py-3 rounded-lg"
                  style={{
                    color: "var(--danger)",
                    background: "#fee2e2",
                  }}
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={loading || !confirmationCode.trim()}
                className="w-full text-sm font-medium py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg flex items-center justify-center gap-2"
                style={{
                  background:
                    "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                  color: "white",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    Confirm
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setMode("signup")}
                className="text-sm transition-colors"
                style={{ color: "var(--text-secondary)" }}
              >
                Back
              </button>
            </motion.form>
          ) : (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={mode === "signin" ? handleSignIn : handleSignUp}
              className="flex flex-col gap-4"
            >
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-tertiary)" }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus
                  className="w-full pl-12 pr-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                    background: "var(--surface)",
                  }}
                />
              </div>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                  background: "var(--surface)",
                }}
              />

              {mode === "signup" && (
                <p
                  className="text-xs"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Password must be at least 12 characters with uppercase,
                  lowercase, and numbers.
                </p>
              )}

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm px-4 py-3 rounded-lg"
                  style={{
                    color: "var(--danger)",
                    background: "#fee2e2",
                  }}
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim() || !password.trim()}
                className="w-full text-sm font-medium py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg flex items-center justify-center gap-2"
                style={{
                  background:
                    "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                  color: "white",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {mode === "signup"
                      ? "Creating account..."
                      : "Signing in..."}
                  </>
                ) : (
                  <>
                    {mode === "signup" ? "Create account" : "Sign in"}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  setError(null);
                }}
                className="text-sm transition-colors text-center"
                style={{ color: "var(--text-secondary)" }}
              >
                {mode === "signin"
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </motion.form>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
