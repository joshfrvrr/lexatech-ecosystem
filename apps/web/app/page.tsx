"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Account, api, Dashboard, Obligation } from "../lib/api";
import { AppSidebar, initials } from "../components/app-sidebar";
import Link from "next/link";
import styles from "./page.module.css";

const statusLabels = {
  compliant: "Compliant", at_risk: "At risk", non_compliant: "Non-compliant", pending: "Pending",
};

export default function Home() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const [nextAccount, nextDashboard] = await Promise.all([
        api<Account>("/api/auth/me"),
        api<Dashboard>("/api/compliance/obligations/dashboard"),
      ]);
      setAccount(nextAccount); setDashboard(nextDashboard);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unable to load the workspace.";
      if (message.toLowerCase().includes("authentication") || message.toLowerCase().includes("session")) router.replace("/login");
      else setError(message);
    } finally { setLoading(false); }
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return dashboard?.obligations.filter((item) =>
      !normalized || item.title.toLowerCase().includes(normalized) ||
      item.description?.toLowerCase().includes(normalized) ||
      statusLabels[item.status].toLowerCase().includes(normalized)
    ) ?? [];
  }, [dashboard, query]);

  async function setStatus(item: Obligation, status: Obligation["status"]) {
    try {
      await api(`/api/compliance/obligations/${item.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Update failed."); }
  }

  async function remove(item: Obligation) {
    if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`)) return;
    try {
      await api(`/api/compliance/obligations/${item.id}`, { method: "DELETE" });
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Delete failed."); }
  }

  function downloadReport() {
    if (!dashboard || !account) return;
    const rows = [["Title", "Status", "Due date", "Description"], ...dashboard.obligations.map((item) => [
      item.title, statusLabels[item.status], item.dueDate?.slice(0, 10) ?? "", item.description ?? "",
    ])];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.download = `${account.organization.name.replaceAll(" ", "-").toLowerCase()}-compliance-report.csv`;
    link.click(); URL.revokeObjectURL(link.href);
  }

  if (loading) return <div className={styles.loading}><span className={styles.mark}>L</span><p>Opening your secure workspace…</p></div>;

  return <div className={styles.shell}>
    <AppSidebar account={account} active="overview" obligationCount={dashboard?.total} />

    <main className={styles.main}>
      <header className={styles.topbar}>
        <div className={styles.search}>⌕ <input aria-label="Search obligations" placeholder="Search your obligations..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <button className={styles.refresh} onClick={load}>Refresh data</button>
        <Link className={styles.user} href="/profile"><span className={styles.userAvatar}>{initials(account?.email)}</span><span><strong>{account?.email}</strong><small>Open profile</small></span></Link>
      </header>

      <div className={styles.content}>
        {error && <div className={styles.errorBanner} role="alert"><span>{error}</span><button onClick={load}>Try again</button></div>}
        <section className={styles.welcome} id="overview">
          <div><p className={styles.eyebrow}>{new Intl.DateTimeFormat("en-KE", { dateStyle: "full" }).format(new Date()).toUpperCase()}</p><h1>{account?.organization.name}</h1><p>Live compliance data from your organisation workspace.</p></div>
          <div className={styles.actions}><button className={styles.secondaryButton} onClick={downloadReport} disabled={!dashboard?.total}>Download CSV report</button><button className={styles.primaryButton} onClick={() => setShowCreate(true)}>＋ Add obligation</button></div>
        </section>

        <section className={styles.metrics} aria-label="Compliance metrics">
          <Metric label="Compliance health" value={`${dashboard?.score ?? 100}%`} detail={`${dashboard?.compliant ?? 0} verified obligations`} tone="green" />
          <Metric label="Open obligations" value={String((dashboard?.total ?? 0) - (dashboard?.compliant ?? 0))} detail={`${dashboard?.upcoming ?? 0} due in 30 days`} tone="blue" />
          <Metric label="High-risk issues" value={String(dashboard?.atRisk ?? 0)} detail="At risk or non-compliant" tone="red" />
          <Metric label="Overdue" value={String(dashboard?.overdue ?? 0)} detail="Past due and unresolved" tone="amber" />
        </section>

        <section className={styles.grid}>
          <article className={`${styles.card} ${styles.healthCard}`}>
            <div className={styles.cardHeading}><div><p className={styles.eyebrow}>COMPLIANCE HEALTH</p><h2>Calculated from live obligations</h2></div></div>
            <div className={styles.healthBody}><div className={styles.scoreRing} style={{ background: `conic-gradient(#2b8c64 0 ${dashboard?.score ?? 100}%, #e7eee9 ${dashboard?.score ?? 100}%)` }}><div><strong>{dashboard?.score ?? 100}</strong><span>/100</span></div></div><div className={styles.scoreCopy}><p>The score is the percentage of obligations marked compliant. Empty workspaces begin at 100 until obligations are added.</p><ul><li><span className={styles.dotGreen} />{dashboard?.compliant ?? 0} compliant</li><li><span className={styles.dotAmber} />{dashboard?.upcoming ?? 0} approaching deadline</li><li><span className={styles.dotRed} />{dashboard?.overdue ?? 0} overdue</li></ul></div></div>
          </article>
          <article className={`${styles.card} ${styles.copilot}`}><div className={styles.copilotHead}><div className={styles.spark}>✓</div><div><p className={styles.eyebrow}>DATA INTEGRITY</p><h2>No fabricated insights</h2></div></div><p>This workspace now displays only records stored for your authenticated organisation. Regulatory intelligence and AI recommendations will appear only after their source-backed modules are connected.</p><button onClick={() => setShowCreate(true)}>Record a real obligation <span>→</span></button><small>LexaTech provides compliance information, not legal advice.</small></article>
        </section>

        <section className={`${styles.card} ${styles.obligationCard}`} id="obligations">
          <div className={styles.cardHeading}><div><p className={styles.eyebrow}>COMPLIANCE OPERATIONS</p><h2>Your obligations</h2></div><span className={styles.resultCount}>{visible.length} result{visible.length === 1 ? "" : "s"}</span></div>
          {visible.length ? <div className={styles.table}>{visible.map((item) => <div className={styles.tableRow} key={item.id}><div className={styles.check}>{item.status === "compliant" ? "●" : "○"}</div><div className={styles.obligationName}><strong>{item.title}</strong><span>{item.description || "No description provided"}</span></div><div><small>DUE</small><span>{formatDate(item.dueDate)}</span></div><select aria-label={`Status for ${item.title}`} value={item.status} onChange={(e) => setStatus(item, e.target.value as Obligation["status"])}>{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><button className={styles.deleteButton} onClick={() => remove(item)} aria-label={`Delete ${item.title}`}>Delete</button></div>)}</div> : <div className={styles.empty}><strong>{query ? "No matching obligations" : "No obligations recorded yet"}</strong><p>{query ? "Try another search term." : "Add your first real compliance obligation to begin tracking health and deadlines."}</p>{!query && <button className={styles.primaryButton} onClick={() => setShowCreate(true)}>Add first obligation</button>}</div>}
        </section>
      </div>
    </main>
    {showCreate && <CreateDialog onClose={() => setShowCreate(false)} onCreated={async () => { setShowCreate(false); await load(); }} />}
  </div>;
}

function Metric({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) {
  return <article className={styles.metric}><div className={styles.metricTop}><p>{label}</p><span className={styles[tone]} /></div><strong>{value}</strong><small>{detail}</small></article>;
}

function CreateDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => Promise<void> }) {
  const [form, setForm] = useState({ title: "", description: "", dueDate: "", status: "pending" });
  const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      await api("/api/compliance/obligations", { method: "POST", body: JSON.stringify({ ...form, dueDate: form.dueDate ? new Date(`${form.dueDate}T12:00:00Z`).toISOString() : undefined }) });
      await onCreated();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to save."); setSaving(false); }
  }
  return <div className={styles.modalBackdrop} role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div className={styles.modalHead}><div><p className={styles.eyebrow}>NEW RECORD</p><h2 id="dialog-title">Add compliance obligation</h2></div><button onClick={onClose} aria-label="Close">×</button></div><form onSubmit={submit}>{error && <p className={styles.formError}>{error}</p>}<label>Title<input required minLength={3} maxLength={255} autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label><label>Description<textarea maxLength={5000} rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label><div className={styles.formGrid}><label>Due date<input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></label><label>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></div><div className={styles.modalActions}><button type="button" className={styles.secondaryButton} onClick={onClose}>Cancel</button><button className={styles.primaryButton} disabled={saving}>{saving ? "Saving..." : "Save obligation"}</button></div></form></div></div>;
}

function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat("en-KE", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)) : "No deadline"; }
