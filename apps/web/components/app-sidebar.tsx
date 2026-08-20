"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Account, api } from "../lib/api";
import styles from "../app/page.module.css";

const navigation = [
  { href: "/", label: "Overview", icon: "⌂", key: "overview" },
  { href: "/compliance", label: "Compliance", icon: "✓", key: "compliance" },
  { href: "/regulations", label: "Regulations", icon: "◫", key: "regulations" },
  { href: "/documents", label: "Documents", icon: "▤", key: "documents" },
  { href: "/risk", label: "Risk register", icon: "◇", key: "risk" },
  { href: "/audits", label: "Audit centre", icon: "◉", key: "audits" },
  { href: "/reports", label: "Reports", icon: "↗", key: "reports" },
  { href: "/team", label: "Team & access", icon: "♙", key: "team" },
] as const;

export function AppSidebar({ account, active, obligationCount }: {
  account: Account | null; active: string; obligationCount?: number;
}) {
  const router = useRouter();
  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    router.replace("/login"); router.refresh();
  }
  return <aside className={styles.sidebar}>
    <Link className={styles.brand} href="/"><span className={styles.mark}>L</span><span>LexaTech</span></Link>
    <p className={styles.workspaceLabel}>Workspace</p>
    <Link className={styles.workspace} href="/profile"><span className={styles.avatar}>{initials(account?.organization.name)}</span><span><strong>{account?.organization.name ?? "Loading workspace"}</strong><small>Organisation workspace</small></span><span>›</span></Link>
    <nav className={styles.nav} aria-label="Main navigation">
      {navigation.map((item) => <Link className={active === item.key ? styles.active : ""} href={item.href} key={item.key}><span>{item.icon}</span>{item.label}{item.key === "compliance" && obligationCount !== undefined && <b>{obligationCount}</b>}</Link>)}
    </nav>
    <div className={styles.navBottom}>
      <Link href="/profile">Profile & settings</Link>
      <div className={styles.boundary}><strong>AI with boundaries</strong><p>Lexa explains and organises. Legal judgment is always escalated to a qualified lawyer.</p></div>
      <button className={styles.logout} onClick={logout}>Sign out</button>
    </div>
  </aside>;
}

export function initials(value?: string) {
  return value?.split(/\s|@/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "LX";
}
