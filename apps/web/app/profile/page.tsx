"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar, initials } from "../../components/app-sidebar";
import { Account, api, Dashboard } from "../../lib/api";
import styles from "../page.module.css";

export default function ProfilePage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [count, setCount] = useState<number>();
  const [profile, setProfile] = useState({ orgName: "", email: "" });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [profileMessage, setProfileMessage] = useState({ text: "", error: false });
  const [passwordMessage, setPasswordMessage] = useState({ text: "", error: false });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    Promise.all([api<Account>("/api/auth/me"), api<Dashboard>("/api/compliance/obligations/dashboard")])
      .then(([nextAccount, dashboard]) => {
        setAccount(nextAccount); setCount(dashboard.total);
        setProfile({ orgName: nextAccount.organization.name, email: nextAccount.email });
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  async function saveProfile(event: FormEvent) {
    event.preventDefault(); setSavingProfile(true); setProfileMessage({ text: "", error: false });
    try {
      const updated = await api<Account>("/api/auth/me", { method: "PATCH", body: JSON.stringify(profile) });
      setAccount(updated); setProfileMessage({ text: "Profile changes saved.", error: false });
    } catch (caught) {
      setProfileMessage({ text: caught instanceof Error ? caught.message : "Unable to save your profile.", error: true });
    } finally { setSavingProfile(false); }
  }

  async function savePassword(event: FormEvent) {
    event.preventDefault(); setPasswordMessage({ text: "", error: false });
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordMessage({ text: "The new passwords do not match.", error: true }); return;
    }
    setSavingPassword(true);
    try {
      await api("/api/auth/password", { method: "PATCH", body: JSON.stringify({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword }) });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordMessage({ text: "Password updated successfully.", error: false });
    } catch (caught) {
      setPasswordMessage({ text: caught instanceof Error ? caught.message : "Unable to update your password.", error: true });
    } finally { setSavingPassword(false); }
  }

  if (!account) return <div className={styles.loading}><span className={styles.mark}>L</span><p>Opening your profile…</p></div>;

  return <div className={styles.shell}>
    <AppSidebar account={account} active="profile" obligationCount={count} />
    <main className={styles.main}>
      <header className={styles.topbar}><div className={styles.moduleBreadcrumb}>LexaTech <span>/</span> Profile & settings</div><div className={styles.user}><span className={styles.userAvatar}>{initials(account.email)}</span><span><strong>{account.email}</strong><small>Administrator</small></span></div></header>
      <div className={styles.content}>
        <section className={styles.moduleHero}><p className={styles.eyebrow}>ACCOUNT & WORKSPACE</p><h1>Profile settings</h1><p>Manage the identity used across your organisation workspace.</p></section>
        <div className={styles.profileGrid}>
          <section className={`${styles.card} ${styles.profileCard}`}>
            <div className={styles.profileHeading}><span className={styles.profileAvatar}>{initials(account.email)}</span><div><h2>Account details</h2><p>Changes apply immediately to your workspace.</p></div></div>
            <form onSubmit={saveProfile}>
              {profileMessage.text && <p className={profileMessage.error ? styles.formError : styles.formSuccess}>{profileMessage.text}</p>}
              <label>Organisation name<input required minLength={2} maxLength={255} value={profile.orgName} onChange={(e) => setProfile({ ...profile, orgName: e.target.value })} /></label>
              <label>Work email<input required type="email" maxLength={255} value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></label>
              <div className={styles.readonlyField}><span>Account created</span><strong>{new Intl.DateTimeFormat("en-KE", { dateStyle: "long" }).format(new Date(account.createdAt))}</strong></div>
              <button className={styles.primaryButton} disabled={savingProfile}>{savingProfile ? "Saving..." : "Save profile"}</button>
            </form>
          </section>
          <section className={`${styles.card} ${styles.profileCard}`}>
            <div className={styles.profileHeading}><span className={styles.securityIcon}>⌾</span><div><h2>Change password</h2><p>Use a unique password you do not use elsewhere.</p></div></div>
            <form onSubmit={savePassword}>
              {passwordMessage.text && <p className={passwordMessage.error ? styles.formError : styles.formSuccess}>{passwordMessage.text}</p>}
              <label>Current password<input required type="password" autoComplete="current-password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} /></label>
              <label>New password<input required type="password" minLength={12} maxLength={128} autoComplete="new-password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} /><small>At least 12 characters with uppercase, lowercase, and a number.</small></label>
              <label>Confirm new password<input required type="password" minLength={12} maxLength={128} autoComplete="new-password" value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} /></label>
              <button className={styles.primaryButton} disabled={savingPassword}>{savingPassword ? "Updating..." : "Update password"}</button>
            </form>
          </section>
        </div>
      </div>
    </main>
  </div>;
}
