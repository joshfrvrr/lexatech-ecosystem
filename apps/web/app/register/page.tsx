"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { api } from "../../lib/api";
import styles from "../auth.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ orgName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(""); setSubmitting(true);
    try {
      await api("/api/auth/register", { method: "POST", body: JSON.stringify(form) });
      router.replace("/"); router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create the account.");
    } finally { setSubmitting(false); }
  }

  return <main className={styles.page}>
    <section className={styles.story}><div className={styles.brand}><span className={styles.mark}>L</span>LexaTech</div><div><h1>Build a proactive <span>compliance culture.</span></h1><p>Create a private organisation workspace. Your data is isolated by your authenticated tenant identity at every API boundary.</p></div><div className={styles.principles}><span>Organisation-scoped</span><span>Secure sessions</span><span>Human accountable</span></div></section>
    <section className={styles.formSide}><form className={styles.form} onSubmit={submit}>
      <p className={styles.eyebrow}>CREATE WORKSPACE</p><h2>Start testing LexaTech.</h2><p className={styles.intro}>Set up your organisation and first administrator.</p>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.field}><label htmlFor="org">Organisation name</label><input id="org" required minLength={2} maxLength={255} autoComplete="organization" value={form.orgName} onChange={(e) => setForm({ ...form, orgName: e.target.value })} /></div>
      <div className={styles.field}><label htmlFor="email">Work email</label><input id="email" required type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
      <div className={styles.field}><label htmlFor="password">Password</label><input id="password" required type="password" minLength={12} maxLength={128} autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /><span className={styles.hint}>At least 12 characters with uppercase, lowercase, and a number.</span></div>
      <button className={styles.submit} disabled={submitting}>{submitting ? "Creating workspace..." : "Create secure workspace"}</button>
      <p className={styles.switch}>Already registered? <Link href="/login">Sign in</Link></p>
    </form></section>
  </main>;
}
