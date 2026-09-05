import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, X } from "lucide-react";

import { createEntry, getEntries, updateEntry } from "./api";
import BragStackLoader from "./BragStackLoader.jsx";
import "./AccomplishmentsPage.css";

const PAGE_SIZE = 10;
const ENTRY_TYPES = [
  "Current Job",
  "Previous Job",
  "Middle School",
  "High School",
  "College / University",
  "Personal Development",
  "Side Project",
  "Open Source",
  "Learning / Certification",
];
const STUDENT_ENTRY_TYPES = new Set([
  "Middle School",
  "High School",
  "College / University",
]);
const STUDENT_CATEGORIES = [
  "Academic Achievement",
  "Award / Honor",
  "Leadership",
  "Extracurricular Activity",
  "Community Service",
  "Research",
  "STEM / Competition",
  "Arts / Performance",
  "Athletics",
  "Internship / Work Experience",
  "Special Program",
  "Certification / Course",
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

function entryToForm(entry) {
  return {
    title: entry.title || "",
    category: entry.category || "",
    entry_date: entry.entry_date || today(),
    entry_type: entry.entry_type || "Current Job",
    situation: entry.situation || "",
    action: entry.action || "",
    impact: entry.impact || "",
    lesson: entry.lesson || "",
    tags: (entry.tags || []).join(", "),
    is_public: Boolean(entry.is_public),
  };
}

function entryToPayload(entry, isPublic = Boolean(entry.is_public)) {
  return {
    title: entry.title || "",
    category: entry.category || "",
    entry_date: entry.entry_date || today(),
    entry_type: entry.entry_type || "Current Job",
    situation: entry.situation || "",
    action: entry.action || "",
    impact: entry.impact || "",
    lesson: entry.lesson || "",
    tags: Array.isArray(entry.tags) ? entry.tags : [],
    is_public: isPublic,
  };
}

function AccomplishmentsPage() {
  const [entries, setEntries] = useState([]);
  const [page, setPage] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreate, setShowCreate] = useState(
    () => new URLSearchParams(window.location.search).get("create") === "1",
  );
  const [editingEntry, setEditingEntry] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [createError, setCreateError] = useState("");
  const [visibilityUpdatingId, setVisibilityUpdatingId] = useState(null);

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
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(totalEntries / PAGE_SIZE));
  const startEntry = totalEntries === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endEntry = Math.min(page * PAGE_SIZE, totalEntries);

  const visibleEntries = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return entries;
    return entries.filter((entry) =>
      [
        entry.title,
        entry.category,
        entry.entry_type,
        entry.situation,
        entry.action,
        entry.impact,
        entry.lesson,
        ...(entry.tags ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [entries, searchTerm]);

  const pageNumbers = useMemo(() => {
    const first = Math.max(1, page - 2);
    const last = Math.min(totalPages, first + 4);
    const adjustedFirst = Math.max(1, last - 4);
    return Array.from(
      { length: last - adjustedFirst + 1 },
      (_, index) => adjustedFirst + index,
    );
  }, [page, totalPages]);

  function openCreate() {
    setCreateError("");
    setEditingEntry(null);
    setForm(emptyForm());
    setShowCreate(true);
    window.history.replaceState({}, "", "/app/accomplishments?create=1");
  }

  function openEdit(entry) {
    setCreateError("");
    setEditingEntry(entry);
    setForm(entryToForm(entry));
    setShowCreate(true);
    window.history.replaceState(
      {},
      "",
      `/app/accomplishments?edit=${encodeURIComponent(entry.id)}`,
    );
  }

  function closeCreate() {
    setShowCreate(false);
    setEditingEntry(null);
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
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSave(event) {
    event.preventDefault();
    setIsSaving(true);
    setCreateError("");
    try {
      const payload = {
        ...form,
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };
      if (editingEntry) {
        await updateEntry(editingEntry.id, payload);
      } else {
        await createEntry(payload);
      }
      const wasEditing = Boolean(editingEntry);
      setForm(emptyForm());
      closeCreate();
      if (!wasEditing) setPage(1);
      await loadPage(wasEditing ? page : 1);
    } catch (requestError) {
      setCreateError(
        requestError.response?.data?.detail ||
          `Your accomplishment could not be ${editingEntry ? "updated" : "saved"}.`,
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleVisibilityToggle(entry) {
    setVisibilityUpdatingId(entry.id);
    setError("");
    try {
      const updatedEntry = await updateEntry(
        entry.id,
        entryToPayload(entry, !entry.is_public),
      );
      setEntries((current) =>
        current.map((item) => (item.id === entry.id ? updatedEntry : item)),
      );
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        localStorage.removeItem("bragstack_token");
        window.location.assign("/login");
        return;
      }
      setError(
        requestError.response?.data?.detail ||
          "That accomplishment's visibility could not be changed.",
      );
    } finally {
      setVisibilityUpdatingId(null);
    }
  }

  const isStudentEntry = STUDENT_ENTRY_TYPES.has(form.entry_type);

  return (
    <main className="accomplishments-page">
      <header className="accomplishments-hero">
        <div>
          <p className="mini-label">Career & Education Evidence Library</p>
          <h1>Your accomplishments</h1>
          <p>
            Build a private record of meaningful work, education achievements,
            activities, leadership, service, research, awards, and projects
            before the details are forgotten. BragStack accounts are currently
            limited to adults age 18+.
          </p>
        </div>
        <button className="accomplishments-add" type="button" onClick={openCreate}>
          <Plus size={18} /> Add accomplishment
        </button>
      </header>

      {showCreate && (
        <section className="modal-backdrop" onMouseDown={closeCreate}>
          <form
            className="modal-card"
            onSubmit={handleSave}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="mini-label">
                  {editingEntry
                    ? "Edit accomplishment evidence"
                    : "New accomplishment evidence"}
                </p>
                <h2>
                  {editingEntry ? "Edit accomplishment" : "Create accomplishment"}
                </h2>
                {isStudentEntry ? (
                  <p className="edit-window-note">
                    For adults documenting education: capture grade/year, school
                    or program, your role, time commitment, scope, recognition,
                    measurable results, and safe evidence when you know them.
                    BragStack does not currently offer accounts for minors.
                  </p>
                ) : (
                  <p className="edit-window-note">
                    Capture enough context now that you can reuse this story later
                    for resumes, interviews, reviews, promotions, and applications.
                    You can update it whenever your record needs a correction or
                    more context.
                  </p>
                )}
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={closeCreate}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {createError && (
              <div className="notice">
                <strong>Could not save</strong>
                <span>{createError}</span>
              </div>
            )}

            <label>
              Title
              <input
                name="title"
                value={form.title}
                onChange={handleFormChange}
                required
                placeholder={
                  isStudentEntry
                    ? "Led robotics team to state finals, earned science award, organized service project…"
                    : "What did you accomplish?"
                }
              />
            </label>

            <label>
              Category
              <input
                name="category"
                list={isStudentEntry ? "student-accomplishment-categories" : undefined}
                value={form.category}
                onChange={handleFormChange}
                required
                placeholder={
                  isStudentEntry
                    ? "Choose or type an education-friendly category"
                    : "Platform Engineering, Customer Support, Leadership…"
                }
              />
              {isStudentEntry && (
                <datalist id="student-accomplishment-categories">
                  {STUDENT_CATEGORIES.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              )}
            </label>

            <div className="form-grid">
              <label>
                Date
                <input
                  type="date"
                  name="entry_date"
                  value={form.entry_date}
                  onChange={handleFormChange}
                  required
                />
              </label>
              <label>
                Type
                <select
                  name="entry_type"
                  value={form.entry_type}
                  onChange={handleFormChange}
                >
                  {ENTRY_TYPES.map((type) => (
                    <option
                      key={type}
                      value={type}
                      disabled={
                        type === "Middle School" && form.entry_type !== "Middle School"
                      }
                    >
                      {type === "Middle School"
                        ? "Middle School — coming soon for student accounts"
                        : type}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <p className="edit-window-note">
              <s>Middle School student accounts</s> — <strong>Coming soon.</strong>{" "}
              We are keeping the feature visible on the roadmap, but BragStack is
              18+ while youth privacy and parental-consent requirements are reviewed
              with counsel.
            </p>

            <label>
              Situation
              <textarea
                name="situation"
                value={form.situation}
                onChange={handleFormChange}
                required
                placeholder={
                  isStudentEntry
                    ? "What was the class, club, team, school, program, competition, or community need? Include year and organization when useful."
                    : "What was happening?"
                }
              />
            </label>

            <label>
              Action
              <textarea
                name="action"
                value={form.action}
                onChange={handleFormChange}
                required
                placeholder={
                  isStudentEntry
                    ? "What did you personally do, create, lead, research, organize, solve, perform, or contribute?"
                    : "What did you specifically do?"
                }
              />
            </label>

            <label>
              Impact
              <textarea
                name="impact"
                value={form.impact}
                onChange={handleFormChange}
                required
                placeholder={
                  isStudentEntry
                    ? "What changed? Include placement, award level, people served, money raised, growth, time commitment, audience, results, or recognition when available."
                    : "What changed? Add numbers when you have them."
                }
              />
            </label>

            <label>
              Lesson
              <textarea
                name="lesson"
                value={form.lesson}
                onChange={handleFormChange}
                placeholder={
                  isStudentEntry
                    ? "What did you learn, and how did you grow?"
                    : "What did you learn?"
                }
              />
            </label>

            <label>
              Skills / tags
              <input
                name="tags"
                value={form.tags}
                onChange={handleFormChange}
                placeholder={
                  isStudentEntry
                    ? "Research, Leadership, Robotics, Writing, Service"
                    : "Docker, Python, Leadership"
                }
              />
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                name="is_public"
                checked={form.is_public}
                onChange={handleFormChange}
              />
              Make this accomplishment public
            </label>

            {isStudentEntry && (
              <p className="edit-window-note">
                Education records stay private unless you explicitly choose to make
                an accomplishment public. Avoid entering sensitive information you
                would not want included in a public portfolio or application record.
              </p>
            )}

            <div className="modal-actions">
              <button type="button" className="btn secondary" onClick={closeCreate}>
                Cancel
              </button>
              <button type="submit" className="btn primary" disabled={isSaving}>
                {isSaving
                  ? "Saving…"
                  : editingEntry
                    ? "Save changes"
                    : "Create accomplishment"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="accomplishments-toolbar">
        <div className="accomplishments-search">
          <Search size={18} />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Filter by skill, education/work context, category, action, or impact..."
          />
        </div>
        <p>
          Showing <strong>{startEntry}–{endEntry}</strong> of{" "}
          <strong>{totalEntries}</strong> accomplishments
        </p>
      </section>

      {error && <div className="accomplishments-error">{error}</div>}

      {isLoading ? (
        <BragStackLoader
          compact
          message="Loading your proof…"
          detail="Gathering accomplishments, outcomes, skills, and evidence."
        />
      ) : visibleEntries.length === 0 ? (
        <section className="accomplishments-empty">
          <h2>No accomplishments found.</h2>
          <p>
            {searchTerm
              ? "Try a different search on this page."
              : "Add your first accomplishment now so you do not have to reconstruct it from memory later."}
          </p>
          {!searchTerm && (
            <button className="btn primary" type="button" onClick={openCreate}>
              Create accomplishment
            </button>
          )}
        </section>
      ) : (
        <section className="accomplishments-list">
          {visibleEntries.map((entry) => {
            const visibilityUpdating = visibilityUpdatingId === entry.id;
            return (
              <article className="accomplishment-card" key={entry.id}>
                <div className="accomplishment-card-top">
                  <div>
                    <p className="mini-label">
                      {entry.category} • {entry.entry_type} • {entry.entry_date}
                    </p>
                    <h2>{entry.title}</h2>
                  </div>

                  <div className="accomplishment-card-actions">
                    <button
                      type="button"
                      className="accomplishment-edit-button"
                      onClick={() => openEdit(entry)}
                      aria-label={`Edit ${entry.title}`}
                      title="Edit accomplishment"
                    >
                      <Pencil size={16} />
                      Edit
                    </button>

                    <button
                      type="button"
                      className={`proof-visibility-button ${
                        entry.is_public ? "proof-public" : "proof-private"
                      }`}
                      onClick={() => handleVisibilityToggle(entry)}
                      disabled={visibilityUpdating}
                      aria-pressed={entry.is_public}
                      aria-label={
                        entry.is_public
                          ? `Make ${entry.title} private`
                          : `Make ${entry.title} public`
                      }
                      title={
                        entry.is_public
                          ? "Make this accomplishment private"
                          : "Make this accomplishment public"
                      }
                    >
                      {visibilityUpdating
                        ? "Updating…"
                        : entry.is_public
                          ? "Public · Make private"
                          : "Private · Make public"}
                    </button>
                  </div>
                </div>

                <p className="accomplishment-bullet">{entry.resume_bullet}</p>

                <div className="accomplishment-proof-grid">
                  <div>
                    <strong>Situation</strong>
                    <p>{entry.situation}</p>
                  </div>
                  <div>
                    <strong>Action</strong>
                    <p>{entry.action}</p>
                  </div>
                  <div>
                    <strong>Impact</strong>
                    <p>{entry.impact}</p>
                  </div>
                  {entry.lesson && (
                    <div>
                      <strong>Lesson</strong>
                      <p>{entry.lesson}</p>
                    </div>
                  )}
                </div>

                <div className="accomplishment-tags">
                  {entry.tags?.map((tag) => <span key={tag}>{tag}</span>)}
                </div>
              </article>
            );
          })}
        </section>
      )}

      {totalPages > 1 && (
        <nav className="pagination" aria-label="Accomplishments pages">
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={page === 1}
          >
            <ChevronLeft size={17} /> Previous
          </button>
          <div className="pagination-pages">
            {pageNumbers.map((pageNumber) => (
              <button
                type="button"
                key={pageNumber}
                className={pageNumber === page ? "active" : ""}
                onClick={() => goToPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages}
          >
            Next <ChevronRight size={17} />
          </button>
        </nav>
      )}
    </main>
  );
}

export default AccomplishmentsPage;
