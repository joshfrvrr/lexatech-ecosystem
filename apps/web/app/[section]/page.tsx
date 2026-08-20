"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppSidebar, initials } from "../../components/app-sidebar";
import { Account, api, Dashboard } from "../../lib/api";
import styles from "../page.module.css";

const sections: Record<string, { title: string; eyebrow: string; description: string; noun: string }> = {
  compliance: { title: "Compliance operations", eyebrow: "DAILY WORKSPACE", description: "Manage obligations, deadlines, statuses, and supporting evidence for your organisation.", noun: "compliance records" },
  regulations: { title: "Regulatory intelligence", eyebrow: "SOURCE-BACKED UPDATES", description: "Track laws, regulations, circulars, and amendments relevant to your organisation.", noun: "regulatory updates" },
  documents: { title: "Document intelligence", eyebrow: "EVIDENCE & POLICIES", description: "Store and review contracts, policies, licences, certificates, and audit evidence.", noun: "documents" },
  risk: { title: "Risk register", eyebrow: "CONTROL EXPOSURE", description: "Record compliance risks, assess severity, assign controls, and monitor mitigation.", noun: "risks" },
  audits: { title: "Audit centre", eyebrow: "AUDIT READINESS", description: "Plan reviews, collect evidence, record findings, and track corrective actions.", noun: "audits" },
  reports: { title: "Reports & analytics", eyebrow: "EXECUTIVE VISIBILITY", description: "Generate source-backed compliance, risk, deadline, and audit-readiness reports.", noun: "generated reports" },
  team: { title: "Team & access", eyebrow: "ORGANISATION ADMINISTRATION", description: "Manage departments, team members, responsibilities, roles, and permissions.", noun: "additional team members" },
};

export default function ModulePage() {
  const { section } = useParams<{ section: string }>();
  const router = useRouter();
  const config = sections[section];
  const [account, setAccount] = useState<Account | null>(null);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!config) return;
    Promise.all([api<Account>("/api/auth/me"), api<Dashboard>("/api/compliance/obligations/dashboard")])
      .then(([nextAccount, nextDashboard]) => { setAccount(nextAccount); setDashboard(nextDashboard); })
      .catch((caught) => {
        const message = caught instanceof Error ? caught.message : "Unable to open this module.";
        if (/authentication|session/i.test(message)) router.replace("/login"); else setError(message);
      });
  }, [config, router]);

  if (!config) return <main className={styles.loading}><strong>Module not found</strong><Link href="/">Return to overview</Link></main>;
  if (!account && !error) return <div className={styles.loading}><span className={styles.mark}>L</span><p>Opening {config.title}…</p></div>;

  const complianceItems = section === "compliance" ? dashboard?.obligations ?? [] : [];
  return <div className={styles.shell}>
    <AppSidebar account={account} active={section} obligationCount={dashboard?.total} />
    <main className={styles.main}>
      <header className={styles.topbar}><div className={styles.moduleBreadcrumb}>LexaTech <span>/</span> {config.title}</div><Link className={styles.user} href="/profile"><span className={styles.userAvatar}>{initials(account?.email)}</span><span><strong>{account?.email}</strong><small>Open profile</small></span></Link></header>
      <div className={styles.content}>
        {error && <div className={styles.errorBanner}>{error}</div>}
        <section className={styles.moduleHero}><p className={styles.eyebrow}>{config.eyebrow}</p><h1>{config.title}</h1><p>{config.description}</p></section>
        <section className={`${styles.card} ${styles.moduleCard}`}>
          {complianceItems.length ? <>
            <div className={styles.cardHeading}><div><p className={styles.eyebrow}>LIVE REGISTER</p><h2>{complianceItems.length} recorded obligation{complianceItems.length === 1 ? "" : "s"}</h2></div><Link href="/#obligations">Manage on overview →</Link></div>
            <div className={styles.moduleList}>{complianceItems.map((item) => <div key={item.id}><span className={styles.statusDot} data-status={item.status} /><div><strong>{item.title}</strong><small>{item.description || "No description provided"}</small></div><b>{item.status.replaceAll("_", " ")}</b></div>)}</div>
          </> : <div className={styles.emptyModule}><div className={styles.emptyIcon}>＋</div><strong>No {config.noun} recorded</strong><p>This page intentionally shows no sample data. Records will appear here only when they are created by your organisation or received from a verified source.</p>{section === "compliance" && <Link className={styles.primaryButton} href="/#obligations">Create an obligation</Link>}</div>}
        </section>
      </div>
    </main>
  </div>;
}
