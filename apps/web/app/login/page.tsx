"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { api } from "../../lib/api";
import styles from "../auth.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api("/api/auth/me").then(() => router.replace("/")).catch(() => undefined);
  }, [router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      router.replace("/");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return <AuthFrame>
    <form className={styles.form} onSubmit={submit}>
      <p className={styles.eyebrow}>SECURE WORKSPACE</p><h2>Welcome back.</h2>
      <p className={styles.intro}>Sign in to your organisation&apos;s compliance workspace.</p>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.field}><label htmlFor="email">Work email</label><input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div className={styles.field}><label htmlFor="password">Password</label><input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
      <button className={styles.submit} disabled={submitting}>{submitting ? "Signing in..." : "Sign in securely"}</button>
      <p className={styles.switch}>New to LexaTech? <Link href="/register">Create an organisation</Link></p>
      <p className={styles.legal}>Your session is stored in a secure, HttpOnly cookie and expires after eight hours.</p>
    </form>
  </AuthFrame>;
}

function AuthFrame({ children }: { children: React.ReactNode }) {
  return <main className={styles.page}><section className={styles.story}><div className={styles.brand}><span className={styles.mark}>L</span>LexaTech</div><div><h1>Compliance clarity, <span>every working day.</span></h1><p>One secure operating system for obligations, evidence, deadlines, and regulatory exposure—with legal judgment kept in human hands.</p></div><div className={styles.principles}><span>Built for African businesses</span><span>Bounded AI</span><span>Audit-ready</span></div></section><section className={styles.formSide}>{children}</section></main>;
}
