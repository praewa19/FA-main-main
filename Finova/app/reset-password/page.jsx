"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, KeyRound, ShieldCheck, Sparkles } from "lucide-react";
import "../globals.css";

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text || "The server returned an invalid response." };
  }
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

function passwordChecks(password) {
  return [
    ["8+ characters", password.length >= 8],
    ["Uppercase letter", /[A-Z]/.test(password)],
    ["Lowercase letter", /[a-z]/.test(password)],
    ["Number", /[0-9]/.test(password)],
    ["Symbol", /[^A-Za-z0-9]/.test(password)],
  ];
}

export default function ResetPasswordPage() {
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const checks = useMemo(() => passwordChecks(form.password), [form.password]);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);
    try {
      const result = await api("/api/auth/reset-password", { method: "POST", body: JSON.stringify(form) });
      setNotice(result.message);
      setForm({ password: "", confirmPassword: "" });
      window.setTimeout(() => {
        window.location.href = "/?auth=login";
      }, 1400);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="app-shell recovery-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <Sparkles size={18} />
          </div>
          <span>Finova</span>
        </div>
      </header>

      <div className="container recovery-container">
        <section className="panel auth-panel recovery-panel">
          <div className="auth-heading">
            <KeyRound size={22} />
            <div>
              <h1>Reset Password</h1>
              <p className="hint">Create a stronger password to protect your financial workspace.</p>
            </div>
          </div>

          <form className="form" onSubmit={submit}>
            <div className="field">
              <label>New Password</label>
              <div className="password-field">
                <input type={showPassword ? "text" : "password"} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
                <button type="button" className="field-icon-button" title={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="strength-list">
              {checks.map(([label, passed]) => (
                <span key={label} className={passed ? "passed" : ""}>{label}</span>
              ))}
            </div>

            <div className="field">
              <label>Confirm New Password</label>
              <div className="password-field">
                <input type={showConfirmPassword ? "text" : "password"} value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} required />
                <button type="button" className="field-icon-button" title={showConfirmPassword ? "Hide password" : "Show password"} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {notice && <div className="alert info">{notice}</div>}
            {error && <div className="alert risk">{error}</div>}

            <button className="btn" type="submit" disabled={submitting}>
              <ShieldCheck size={17} />
              {submitting ? "Updating..." : "Update Password"}
            </button>
            <a className="text-link centered" href="/?auth=login">Back to Login</a>
          </form>
        </section>
      </div>
    </main>
  );
}
