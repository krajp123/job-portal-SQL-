import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  IndianRupee,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Loader2,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Star,
  EyeOff,
  Building2,
  Clock,
  GraduationCap,
  Undo2,
  X,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import {
  FONT_DISPLAY,
  FONT_BODY,
  MAROON,
  MAROON_DARK,
  ACCENT,
  BG,
} from "../../theme";
import CandidateNavbar from "../../components/CandidateNavbar";

function displayExperienceLevel(value) {
  return /^0(?:\s*[-+]\s*0?)?\s*years?/i.test(String(value || '').trim()) ? 'Freshers' : value;
}

const EXPERIENCE_LEVELS = ["Fresher", "1-3 years", "3-5 years", "5+ years"];

const SALARY_OPTIONS = [
  { label: "Any salary", value: "" },
  { label: "₹3 - 6 LPA", value: "3-6" },
  { label: "₹6 - 10 LPA", value: "6-10" },
  { label: "₹10 - 15 LPA", value: "10-15" },
  { label: "₹15 - 25 LPA", value: "15-25" },
  { label: "₹25 LPA+", value: "25+" },
];

const DATE_POSTED_OPTIONS = [
  { label: "Any time", value: "" },
  { label: "Last 24 hours", value: "1" },
  { label: "Last 3 days", value: "3" },
  { label: "Last week", value: "7" },
  { label: "Last month", value: "30" },
];

// Debounce hook — delays firing the search until the user pauses typing.
function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);
  return debounced;
}

// Ticks every 60s so "posted X ago" labels keep advancing without a refresh.
function useClockTick() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60 * 1000);
    return () => clearInterval(id);
  }, []);
}

function formatRelativeTime(dateInput) {
  if (!dateInput) return "";
  const then = new Date(dateInput).getTime();
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function CompanyLogo({ name, logoUrl, className = "" }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className={`h-12 w-12 shrink-0 rounded-[12px] border border-stone-200 object-cover ${className}`}
      />
    );
  }
  return (
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] text-[13px] font-bold text-white ${className}`}
      style={{ background: `linear-gradient(135deg, ${ACCENT}, ${MAROON})` }}
    >
      {getInitials(name)}
    </div>
  );
}

function CompanyRating({ rating }) {
  if (!rating) return null;
  return (
    <span className="flex items-center gap-0.5 text-[11.5px] font-semibold text-stone-600">
      <Star size={11} fill={ACCENT} color={ACCENT} />
      {rating.toFixed ? rating.toFixed(1) : rating}
    </span>
  );
}

// Multi-value input used for job titles and locations.
function MultiValueInput({ values, onChange, placeholder, suggestions = [], datalistId }) {
  const [draft, setDraft] = useState("");

  function addValues(rawValue) {
    const newValues = rawValue
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .filter((value) => !values.some((existing) => existing.toLowerCase() === value.toLowerCase()));
    if (newValues.length) onChange([...values, ...newValues]);
    setDraft("");
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addValues(draft);
    }
    if (event.key === "Backspace" && !draft && values.length) {
      onChange(values.slice(0, -1));
    }
  }

  return (
    <div className="rounded-[10px] border border-stone-200 bg-white px-2.5 py-2 focus-within:border-[#8B1E2F]/40">
      <div className="flex flex-wrap items-center gap-1.5">
        {values.map((value) => (
          <span key={value} className="flex items-center gap-1 rounded-full bg-[#8B1E2F0F] px-2 py-1 text-[11.5px] font-medium text-[#8B1E2F]">
            {value}
            <button type="button" onClick={() => onChange(values.filter((item) => item !== value))} className="leading-none text-[#8B1E2F]/60 hover:text-[#8B1E2F]" aria-label={`Remove ${value}`}>&times;</button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => draft.trim() && addValues(draft)}
          {...(datalistId ? { list: datalistId } : {})}
          placeholder={values.length ? "Add another…" : placeholder}
          className="min-w-[120px] flex-1 border-0 px-1 py-1 text-[13px] text-stone-700 outline-none"
        />
      </div>
      {datalistId && (
        <datalist id={datalistId}>
          {[...new Set(suggestions)].map((suggestion) => <option key={suggestion} value={suggestion} />)}
        </datalist>
      )}
    </div>
  );
}

function RoleAutocomplete({ value, onChange, suggestions = [] }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const matches = [...new Set(suggestions)].filter((role) =>
    role.toLowerCase().includes(value.trim().toLowerCase()),
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleKeyDown(event) {
    if (!value.trim() || matches.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index + 1) % matches.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index <= 0 ? matches.length - 1 : index - 1));
    } else if (event.key === "Enter" && open && activeIndex >= 0) {
      event.preventDefault();
      onChange(matches[activeIndex]);
      setOpen(false);
      setActiveIndex(-1);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(Boolean(event.target.value.trim()));
          setActiveIndex(-1);
        }}
        onFocus={() => value.trim() && setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Type a role"
        className="w-full rounded-[10px] border border-stone-200 px-3 py-2.5 text-[13px] text-stone-700 outline-none focus:border-[#8B1E2F]/40"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open && Boolean(value.trim())}
        aria-activedescendant={activeIndex >= 0 ? `role-option-${activeIndex}` : undefined}
      />
      {open && value.trim() && matches.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-52 overflow-y-auto rounded-[10px] border border-stone-200 bg-white p-1.5 shadow-lg">
          {matches.map((role, index) => (
            <button
              key={role}
              id={`role-option-${index}`}
              type="button"
              onClick={() => {
                onChange(role);
                setOpen(false);
                setActiveIndex(-1);
              }}
              className={`block w-full rounded-[8px] px-3 py-2 text-left text-[12.5px] font-medium text-stone-800 transition-colors hover:bg-stone-100 hover:text-stone-950 ${activeIndex === index ? "bg-stone-100 text-stone-950" : ""}`}
            >
              {role}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function JobCardSkeleton() {
  return (
    <div className="animate-pulse rounded-[16px] border border-stone-200/70 bg-white p-5">
      <div className="flex gap-3">
        <div className="h-12 w-12 rounded-[12px] bg-stone-200" />
        <div className="flex-1">
          <div className="mb-2 h-4 w-1/3 rounded bg-stone-200" />
          <div className="mb-2 h-3 w-1/4 rounded bg-stone-100" />
          <div className="h-3 w-full rounded bg-stone-100" />
        </div>
      </div>
    </div>
  );
}

export default function JobSearch() {
  useClockTick();
  const navigate = useNavigate();

  // Filters
  const [keyword, setKeyword] = useState([]);
  const [roles, setRoles] = useState("");
  const [location, setLocation] = useState([]);
  const [experienceLevel, setExperienceLevel] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [datePosted, setDatePosted] = useState("");
  const [suggestions, setSuggestions] = useState({ titles: [], roles: [], categories: [], industries: [], locations: [] });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [jobs, setJobs] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [hiddenIds, setHiddenIds] = useState(new Set());
  const [applyingIds, setApplyingIds] = useState(new Set());
  const [appliedIds, setAppliedIds] = useState(new Set());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null); // { message, onUndo? }

  const debouncedKeyword = useDebouncedValue(keyword, 400);
  const debouncedLocation = useDebouncedValue(location, 400);
  const debouncedSuggestionQuery = useDebouncedValue(keyword[0] || roles || location[0] || "", 250);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axiosInstance.get("/jobs", {
        params: {
          title: debouncedKeyword.length ? debouncedKeyword.join(",") : undefined,
          role: roles || undefined,
          location: debouncedLocation.length ? debouncedLocation.join(",") : undefined,
          experienceLevel: experienceLevel || undefined,
          salary: salaryRange || undefined,
          datePosted: datePosted || undefined,
        },
      });
      // Sort jobs by createdAt in descending order (most recent first)
      const sortedJobs = (data || []).sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
      setJobs(sortedJobs);
    } catch (err) {
      setError(
        err.response?.data?.error || "Could not load jobs. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    debouncedKeyword,
    roles,
    debouncedLocation,
    experienceLevel,
    salaryRange,
    datePosted,
  ]);

  async function loadSavedJobIds() {
    try {
      const { data } = await axiosInstance.get("/candidate/me/saved-jobs");
      setSavedIds(new Set((data || []).map((j) => j._id)));
    } catch {
      // Non-fatal — saved state just won't be pre-highlighted.
    }
  }

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    loadSavedJobIds();
  }, []);

  useEffect(() => {
    let active = true;
    axiosInstance.get("/jobs/suggestions", { params: { q: debouncedSuggestionQuery.trim() || undefined } })
      .then(({ data }) => {
        if (active) setSuggestions(data || { titles: [], roles: [], categories: [], industries: [], locations: [] });
      })
      .catch(() => {
        if (active) setSuggestions({ titles: [], roles: [], categories: [], industries: [], locations: [] });
      });
    return () => { active = false; };
  }, [debouncedSuggestionQuery]);

  function showToast(message, onUndo) {
    setToast({ message, onUndo });
    setTimeout(() => setToast(null), onUndo ? 3500 : 2200);
  }

  async function toggleSave(jobId) {
    const isSaved = savedIds.has(jobId);
    setSavedIds((prev) => {
      const next = new Set(prev);
      isSaved ? next.delete(jobId) : next.add(jobId);
      return next;
    });

    try {
      if (isSaved) {
        await axiosInstance.delete(`/candidate/me/saved-jobs/${jobId}`);
      } else {
        await axiosInstance.post(`/candidate/me/saved-jobs/${jobId}`);
        showToast("Saved to your bookmarks");
      }
    } catch (err) {
      setSavedIds((prev) => {
        const next = new Set(prev);
        isSaved ? next.add(jobId) : next.delete(jobId);
        return next;
      });
      showToast(err.response?.data?.error || "Could not update saved jobs");
    }
  }

  function hideJob(jobId) {
    setHiddenIds((prev) => new Set(prev).add(jobId));
    showToast("Job hidden", () =>
      setHiddenIds((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      }),
    );
  }

  async function apply(jobId) {
    setApplyingIds((prev) => new Set(prev).add(jobId));

    try {
      await axiosInstance.post("/applications", { jobId });
      setAppliedIds((prev) => new Set(prev).add(jobId));
      showToast("Application submitted!");
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to apply");
    } finally {
      setApplyingIds((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    }
  }

  const hasActiveFilters =
    keyword.length > 0 ||
    roles ||
    location.length > 0 ||
    experienceLevel ||
    salaryRange ||
    datePosted;

  function clearAllFilters() {
    setKeyword([]);
    setRoles("");
    setLocation([]);
    setExperienceLevel("");
    setSalaryRange("");
    setDatePosted("");
  }

  const filterChips = useMemo(() => {
    const chips = [];
    keyword.forEach((value) => chips.push({ key: `title-${value}`, label: `Title: ${value}`, clear: () => setKeyword((prev) => prev.filter((item) => item !== value)) }));
    if (roles) chips.push({ key: "role", label: `Role: ${roles}`, clear: () => setRoles("") });
    location.forEach((value) => chips.push({ key: `location-${value}`, label: `Location: ${value}`, clear: () => setLocation((prev) => prev.filter((item) => item !== value)) }));
    if (experienceLevel)
      chips.push({
        key: "exp",
        label: experienceLevel,
        clear: () => setExperienceLevel(""),
      });
    if (salaryRange) {
      const opt = SALARY_OPTIONS.find((o) => o.value === salaryRange);
      chips.push({
        key: "salary",
        label: opt?.label || salaryRange,
        clear: () => setSalaryRange(""),
      });
    }
    if (datePosted) {
      const opt = DATE_POSTED_OPTIONS.find((o) => o.value === datePosted);
      chips.push({
        key: "date",
        label: opt?.label || datePosted,
        clear: () => setDatePosted(""),
      });
    }
    return chips;
  }, [
    keyword,
    roles,
    location,
    experienceLevel,
    salaryRange,
    datePosted,
  ]);

  const visibleJobs = jobs.filter((j) => !hiddenIds.has(j._id));

  return (
    <div
      className="portal-theme min-h-[100dvh] w-full"
      style={{ background: "#FFF7F2", fontFamily: FONT_BODY }}
    >
      <CandidateNavbar />

      <main className="mx-auto max-w-7xl px-4 py-4 lg:px-6 lg:py-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1
              className="text-[22px] font-bold text-stone-900"
              style={{ fontFamily: FONT_DISPLAY }}
            >
              Find your next role
            </h1>
            <p className="mt-0.5 text-[12.5px] text-[#6B6259]">
              {loading
                ? "Loading jobs…"
                : `${visibleJobs.length} Job${visibleJobs.length === 1 ? "" : "s"} Found`}
            </p>
          </div>
          <button
            onClick={() => setMobileFiltersOpen((s) => !s)}
            className="flex items-center gap-1.5 rounded-[12px] border border-stone-200 bg-white px-4 py-2.5 text-[12.5px] font-semibold text-[#6B6259] lg:hidden"
          >
            <SlidersHorizontal size={14} />
            Filters
          </button>
        </div>

        {filterChips.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {filterChips.map((chip) => (
              <button
                key={chip.key}
                onClick={chip.clear}
                className="flex items-center gap-1 rounded-full bg-[#8B1E2F0F] px-3 py-1 text-[11.5px] font-medium text-[#8B1E2F]"
              >
                {chip.label}
                <span className="text-[13px] leading-none">×</span>
              </button>
            ))}
            <button
              onClick={clearAllFilters}
              className="text-[11.5px] font-semibold text-stone-400 hover:text-stone-600"
            >
              Clear all
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
          {/* ── LEFT: job list ───────────────────────────────────────────── */}
          <div className="order-2 lg:order-1">
            <div className="pr-0 lg:pr-2">
              {loading ? (
                <div className="flex flex-col gap-3">
                  {[0, 1, 2, 3].map((i) => (
                    <JobCardSkeleton key={i} />
                  ))}
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-[18px] border border-stone-200/70 bg-white py-16 text-center">
                <AlertTriangle size={26} color={ACCENT} />
                <p className="text-[13.5px] font-medium text-stone-800">
                  {error}
                </p>
                <button
                  onClick={loadJobs}
                  className="mt-1 flex items-center gap-1.5 rounded-[10px] px-4 py-2 text-[12.5px] font-semibold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${ACCENT}, ${MAROON})`,
                  }}
                >
                  <RefreshCw size={13} />
                  Try again
                </button>
              </div>
            ) : visibleJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-[18px] border border-stone-200/70 bg-white py-16 text-center">
                <Briefcase size={26} className="text-stone-300" />
                <p className="text-[13.5px] font-medium text-stone-800">
                  {hasActiveFilters
                    ? "No jobs match your filters."
                    : "No open jobs right now."}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="text-[12.5px] font-semibold"
                    style={{ color: MAROON }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <AnimatePresence>
                  {visibleJobs.map((job, i) => {
                    const isSaved = savedIds.has(job._id);
                    const isApplying = applyingIds.has(job._id);
                    const isApplied = appliedIds.has(job._id);
                    return (
                      <motion.div
                        key={job._id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{
                          duration: 0.25,
                          delay: Math.min(i * 0.03, 0.3),
                        }}
                        onClick={() => navigate(`/candidate/jobs/${job._id}`)}
                        className="relative cursor-pointer rounded-xl border border-stone-200/70 bg-white p-4 transition-shadow hover:shadow-[0_10px_26px_-18px_rgba(139,30,47,0.35)]"
                      >
                        {job.featured && (
                          <span
                            className="absolute left-5 top-5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white"
                            style={{
                              background: `linear-gradient(135deg, ${ACCENT}, ${MAROON})`,
                            }}
                          >
                            Featured
                          </span>
                        )}
                        <CompanyLogo
                          name={job.postedBy?.companyName}
                          logoUrl={job.postedBy?.companyLogoUrl}
                          className="absolute right-5 top-5"
                        />

                        <div className="min-w-0">
                          {" "}
                          <p
                            className="text-[18px] font-bold leading-snug text-stone-900"
                            style={{ fontFamily: FONT_DISPLAY }}
                          >
                            {job.title}
                          </p>
                          <p className="mt-1 text-[14.5px] font-semibold text-stone-700">
                            {job.postedBy?.companyName || "Company"}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-[13.5px] text-[#6B6259]">
                            Posted by {job.postedBy?.companyName || "Company"}
                            <CompanyRating
                              rating={job.postedBy?.companyRating}
                            />
                          </p>
                          <div className="mt-2.5 flex flex-wrap items-center text-[14px] text-stone-600">
                            {job.experienceLevel && (
                              <>
                                <span className="flex items-center gap-1">
                                  <Briefcase
                                    size={14}
                                    className="text-stone-400"
                                  />
                                  {displayExperienceLevel(job.experienceLevel)}
                                </span>
                                <span className="mx-3 text-stone-300">|</span>
                              </>
                            )}

                            {job.salary && (
                              <>
                                <span className="flex items-center gap-1">
                                  <IndianRupee
                                    size={14}
                                    className="text-stone-400"
                                  />
                                  {job.salary}
                                </span>
                                <span className="mx-3 text-stone-300">|</span>
                              </>
                            )}

                            {job.location && (
                              <span className="flex items-center gap-1">
                                <MapPin size={14} className="text-stone-400" />
                                {job.location}
                              </span>
                            )}
                          </div>
                          {job.description && (
                            <p className="mt-2 line-clamp-1 text-[14px] text-stone-500">
                              {job.description}
                            </p>
                          )}
                          {Array.isArray(job.skillsRequired) &&
                            job.skillsRequired.length > 0 && (
                              <p className="mt-2 line-clamp-1 text-[13px] text-stone-400">
                                {job.skillsRequired.slice(0, 6).join(" • ")}
                              </p>
                            )}
                          <div className="mt-3 flex items-center justify-between">
                            <p className="flex items-center gap-1 text-[12.5px] text-stone-400">
                              <Clock size={13} />
                              {formatRelativeTime(job.createdAt)}
                            </p>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  hideJob(job._id);
                                }}
                                aria-label="Hide job"
                                className="rounded-[10px] p-2 text-stone-300 transition-colors hover:bg-stone-50 hover:text-stone-500"
                              >
                                <EyeOff size={18} />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSave(job._id);
                                }}
                                aria-label={isSaved ? "Unsave job" : "Save job"}
                                className="rounded-[10px] p-2 transition-colors hover:bg-stone-50"
                              >
                                {isSaved ? (
                                  <BookmarkCheck size={18} color={MAROON} />
                                ) : (
                                  <Bookmark
                                    size={18}
                                    className="text-stone-300"
                                  />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
          </div>

          {/* ── RIGHT: filter panel ──────────────────────────────────────── */}
          <aside
            className={`order-1 lg:order-2 ${mobileFiltersOpen ? "block" : "hidden lg:block"}`}
          >
            <div className="sticky top-[92px] z-10 rounded-xl border border-stone-200/70 bg-white p-4">
              <p
                className="text-[14px] font-bold text-stone-900"
                style={{ fontFamily: FONT_DISPLAY }}
              >
                Add preferences to get matching jobs
              </p>
              {/* <p className="mt-0.5 text-[11.5px] text-[#6B6259]">
                                Fine-tune your search to see the most relevant openings first.
                            </p> */}

              <div className="mt-4 flex flex-col gap-3">
                <div>
                  <label className="mb-1 block text-[11.5px] font-semibold text-stone-500">
                    Job titles <span className="font-normal text-stone-400">(add up to 3 or more)</span>
                  </label>
                  <MultiValueInput
                    values={keyword}
                    onChange={setKeyword}
                    placeholder="Type a title, then press Enter"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11.5px] font-semibold text-stone-500">
                    Preferred job role
                  </label>
                  <RoleAutocomplete value={roles} onChange={setRoles} suggestions={suggestions.roles} />
                </div>

                <div>
                  <label className="mb-1 block text-[11.5px] font-semibold text-stone-500">
                    Preferred work location <span className="font-normal text-stone-400">(add up to 3 or more)</span>
                  </label>
                  <MultiValueInput
                    values={location}
                    onChange={setLocation}
                    suggestions={suggestions.locations}
                    datalistId="job-location-suggestions"
                    placeholder="Type a location, then press Enter"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11.5px] font-semibold text-stone-500">
                    Preferred salary
                  </label>
                  <select
                    value={salaryRange}
                    onChange={(e) => setSalaryRange(e.target.value)}
                    className="w-full rounded-[10px] border border-stone-200 px-3 py-2.5 text-[13px] text-stone-700 outline-none focus:border-[#8B1E2F]/40"
                  >
                    {SALARY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11.5px] font-semibold text-stone-500">
                    Experience level
                  </label>
                  <input
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    placeholder="e.g. 2 - 4 years"
                    className="w-full rounded-[10px] border border-stone-200 px-3 py-2.5 text-[13px] text-stone-700 outline-none focus:border-[#8B1E2F]/40"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11.5px] font-semibold text-stone-500">
                    Date posted
                  </label>
                  <select
                    value={datePosted}
                    onChange={(e) => setDatePosted(e.target.value)}
                    className="w-full rounded-[10px] border border-stone-200 px-3 py-2.5 text-[13px] text-stone-700 outline-none focus:border-[#8B1E2F]/40"
                  >
                    {DATE_POSTED_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="mt-1 flex items-center justify-center gap-1.5 rounded-[10px] border border-stone-200 py-2.5 text-[12.5px] font-semibold text-stone-500 transition-colors hover:border-[#8B1E2F]/30 hover:text-[#8B1E2F]"
                  >
                    <X size={13} />
                    Clear all filters
                  </button>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-[12px] px-4 py-2.5 text-[12.5px] font-semibold text-white shadow-lg"
            style={{ background: MAROON_DARK }}
          >
            {toast.message}
            {toast.onUndo && (
              <button
                onClick={() => {
                  toast.onUndo();
                  setToast(null);
                }}
                className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11.5px] font-semibold hover:bg-white/25"
              >
                <Undo2 size={12} />
                Undo
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}