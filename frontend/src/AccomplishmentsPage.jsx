import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Search, X } from "lucide-react";

import { createEntry, getEntries } from "./api";
import "./AccomplishmentsPage.css";

const PAGE_SIZE = 10;
const ENTRY_TYPES = [
  "Current Job",
  "Previous Job",
  "Personal Development",
  "Side Project",
  "Open Source",
  "Learning / Certification",
];

const today = () => new Date().toISOString().slice(0, 10);
const emptyForm = () => ({
  title: "",
  category: "",
  entry_date: today(),
  entry_type: "Current Job",
  situation: "",
  action: "",
  impact: "",
  lesson: "",
  tags: "",
  is_public: false,
});

function AccomplishmentsPage() {
  const [entries, setEntries] = useState([]);
  const [page, setPage] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreate, setShowCreate] = useState(() => new URLSearchParams(window.location.search).get("create") === "1");
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [createError, setCreateError] = useState("");

  async function loadPage(targetPage = page) {
    setIsLoading(true);
    setError("");
    try {
      const data = await getEntries(PAGE_SIZE, (targetPage - 1) * PAGE_SIZE);
      setEntries(data.entries ?? []);
      setTotalEntries(data.total_entries ?? 0);
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        localStorage.removeItem("bragstack_token");
        window.location.assign("/login");
        return;
      }
      setError("BragStack could not load your accomplishments.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadPage(page);
    }, 0);
    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(totalEntries / PAGE_SIZE));
  const startEntry = totalEntries === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endEntry = Math.min(page * PAGE_SIZE, totalEntries);

  const visibleEntries = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return entries;
    return entries.filter((entry) => [
      entry.title,
      entry.category,
      entry.entry_type,
      entry.situation,
      entry.action,
      entry.impact,
      entry.lesson,
      ...(entry.tags ?? []),
    ].filter(Boolean).join(" ").toLowerCase().includes(query));
  }, [entries, searchTerm]);

  const pageNumbers = useMemo(() => {
    const first = Math.max(1, page - 2);
    const last = Math.min(totalPages, first + 4);
    const adjustedFirst = Math.max(1, last - 4);
    return Array.from({ length: last - adjustedFirst + 1 }, (_, index) => adjustedFirst + index);
  }, [page, totalPages]);

  function openCreate() {
    setCreateError("");
    setForm(emptyForm());
    setShowCreate(true);
    window.history.replaceState({}, "", "/app/accomplishments?create=1");
  }

  function closeCreate() {
    setShowCreate(false);
    setCreateError("");
    window.history.replaceState({}, "", "/app/accomplishments");
  }

  function goToPage(nextPage) {
    const safePage = Math.min(Math.max(nextPage, 1), totalPages);
    setPage(safePage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleFormChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleCreate(event) {
    event.preventDefault();
    setIsSaving(true);
    setCreateError("");
    try {
      await createEntry({
        ...form,
        tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      });
      setForm(emptyForm());
      closeCreate();
      setPage(1);
      await loadPage(1);
    } catch (requestError) {
      setCreateError(requestError.response?.data?.detail || "Your accomplishment could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="accomplishments-page">
      <header className="accomplishments-hero">
        <div>
          <p className="mini-label">Career Evidence Library</p>
          <h1>Your accomplishments</h1>
          <p>Browse the complete record of situations, actions, outcomes, skills, and public proof you have captured in BragStack.</p>
        </div>

        <button className="accomplishments-add" type="button" onClick={openCreate}>
          <Plus size={18} /> Add accomplishment
        </button>
      </header>

      {showCreate && (
        <section className="modal-backdrop" onMouseDown={closeCreate}>
          <form className="modal-card" onSubmit={handleCreate} onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="mini-label">New career proof</p>
                <h2>Create accomplishment</h2>
              </div>
              <button type="button" className="icon-button" onClick={closeCreate} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            {createError && <div className="notice"><strong>Could not save</strong><span>{createError}</span></div>}

            <label>Title<input name="title" value={form.title} onChange={handleFormChange} required placeholder="What did you accomplish?" /></label>
            <label>Category<input name="category" value={form.category} onChange={handleFormChange} required placeholder="Platform Engineering, Customer Support, Leadership…" /></label>
            <div className="form-grid">
              <label>Date<input type="date" name="entry_date" value={form.entry_date} onChange={handleFormChange} required /></label>
              <label>Type<select name="entry_type" value={form.entry_type} onChange={handleFormChange}>{ENTRY_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
            </div>
            <label>Situation<textarea name="situation" value={form.situation} onChange={handleFormChange} required placeholder="What was happening?" /></label>
            <label>Action<textarea name="action" value={form.action} onChange={handleFormChange} required placeholder="What did you specifically do?" /></label>
            <label>Impact<textarea name="impact" value={form.impact} onChange={handleFormChange} required placeholder="What changed? Add numbers when you have them." /></label>
            <label>Lesson<textarea name="lesson" value={form.lesson} onChange={handleFormChange} placeholder="What did you learn?" /></label>
            <label>Skills / tags<input name="tags" value={form.tags} onChange={handleFormChange} placeholder="Docker, Python, Leadership" /></label>
            <label className="checkbox-row"><input type="checkbox" name="is_public" checked={form.is_public} onChange={handleFormChange} /> Make this accomplishment public</label>

            <div className="modal-actions">
              <button type="button" className="btn secondary" onClick={closeCreate}>Cancel</button>
              <button type="submit" className="btn primary" disabled={isSaving}>{isSaving ? "Saving…" : "Create accomplishment"}</button>
            </div>
          </form>
        </section>
      )}

      <section className="accomplishments-toolbar">
        <div className="accomplishments-search">
          <Search size={18} />
          <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Filter this page by skill, category, action, or impact..." />
        </div>
        <p>Showing <strong>{startEntry}–{endEntry}</strong> of <strong>{totalEntries}</strong> accomplishments</p>
      </section>

      {error && <div className="accomplishments-error">{error}</div>}

      {isLoading ? (
        <section className="accomplishments-empty">Loading accomplishments…</section>
      ) : visibleEntries.length === 0 ? (
        <section className="accomplishments-empty">
          <h2>No accomplishments found.</h2>
          <p>{searchTerm ? "Try a different search on this page." : "Add your first accomplishment here to start building career proof."}</p>
          {!searchTerm && <button className="btn primary" type="button" onClick={openCreate}>Create accomplishment</button>}
        </section>
      ) : (
        <section className="accomplishments-list">
          {visibleEntries.map((entry) => (
            <article className="accomplishment-card" key={entry.id}>
              <div className="accomplishment-card-top">
                <div><p className="mini-label">{entry.category} • {entry.entry_type} • {entry.entry_date}</p><h2>{entry.title}</h2></div>
                <span className={entry.is_public ? "proof-public" : "proof-private"}>{entry.is_public ? "Public proof" : "Private proof"}</span>
              </div>
              <p className="accomplishment-bullet">{entry.resume_bullet}</p>
              <div className="accomplishment-proof-grid">
                <div><strong>Situation</strong><p>{entry.situation}</p></div>
                <div><strong>Action</strong><p>{entry.action}</p></div>
                <div><strong>Impact</strong><p>{entry.impact}</p></div>
                {entry.lesson && <div><strong>Lesson</strong><p>{entry.lesson}</p></div>}
              </div>
              <div className="accomplishment-tags">{entry.tags?.map((tag) => <span key={tag}>{tag}</span>)}</div>
            </article>
          ))}
        </section>
      )}

      {totalPages > 1 && (
        <nav className="pagination" aria-label="Accomplishments pages">
          <button type="button" onClick={() => goToPage(page - 1)} disabled={page === 1}><ChevronLeft size={17} /> Previous</button>
          <div className="pagination-pages">{pageNumbers.map((pageNumber) => <button type="button" key={pageNumber} className={pageNumber === page ? "active" : ""} onClick={() => goToPage(pageNumber)}>{pageNumber}</button>)}</div>
          <button type="button" onClick={() => goToPage(page + 1)} disabled={page === totalPages}>Next <ChevronRight size={17} /></button>
        </nav>
      )}
    </main>
  );
}

export default AccomplishmentsPage;
