import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, IndianRupee, Bookmark, BookmarkCheck, Briefcase, Sparkles } from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import { FONT_DISPLAY, FONT_BODY, MAROON } from "../../theme";
import CandidateNavbar from "../../components/CandidateNavbar";

function displayExperienceLevel(value) {
  return /^0(?:\s*[-+]\s*0?)?\s*years?/i.test(String(value || '').trim()) ? 'Freshers' : value;
}

export default function RecommendedJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function loadRecommendedJobs() {
      try {
        setLoading(true);
        const [profileResult, jobsResult, savedResult] = await Promise.allSettled([
          axiosInstance.get("/candidate/me/profile"),
          axiosInstance.get("/jobs/recommended"),
          axiosInstance.get("/candidate/saved-jobs"),
        ]);
        if (profileResult.status === "fulfilled") setProfile(profileResult.value.data);
        if (jobsResult.status === "rejected") throw jobsResult.reason;
        setJobs(jobsResult.value.data || []);
        if (savedResult.status === "fulfilled") {
          setSavedJobs(new Set(savedResult.value.data?.map((job) => job._id) || []));
        }
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load recommended jobs");
      } finally {
        setLoading(false);
      }
    }
    loadRecommendedJobs();
  }, []);

  async function toggleSaveJob(jobId) {
    try {
      if (savedJobs.has(jobId)) {
        await axiosInstance.delete(`/candidate/saved-jobs/${jobId}`);
        setSavedJobs((previous) => {
          const updated = new Set(previous);
          updated.delete(jobId);
          return updated;
        });
      } else {
        await axiosInstance.post(`/candidate/saved-jobs/${jobId}`);
        setSavedJobs((previous) => new Set(previous).add(jobId));
      }
    } catch (err) {
      setError(err.response?.data?.error || "Could not update saved jobs.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F8FA]" style={{ fontFamily: FONT_BODY }}>
        <CandidateNavbar profile={profile} />
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="h-7 w-64 animate-pulse rounded bg-[#E5E9EE]" />
          <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-[#E5E9EE]" />
          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => <div key={item} className="h-48 animate-pulse rounded-xl border border-[#E3E8ED] bg-white" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FA]" style={{ fontFamily: FONT_BODY }}>
      <CandidateNavbar profile={profile} />
      <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-[#DCE2E8] pb-5">
          <div>
            <div className="flex items-center gap-2 text-[#C75560]"><Sparkles size={18} strokeWidth={2.2} /><span className="text-[11px] font-bold uppercase tracking-[0.16em]">Personalized feed</span></div>
            <h1 className="mt-2 text-2xl font-bold tracking-[-0.02em] text-[#17212B] sm:text-3xl" style={{ fontFamily: FONT_DISPLAY }}>Recommended for you</h1>
            <p className="mt-1 text-sm text-[#687584]">Roles matched to your profile and preferences.</p>
          </div>
          <span className="rounded-full border border-[#DCE2E8] bg-white px-3 py-1.5 text-xs font-semibold text-[#687584]">{jobs.length} {jobs.length === 1 ? "opportunity" : "opportunities"}</span>
        </div>

        {error && <div className="mb-5 rounded-lg border border-[#F2B8B5] bg-[#FFF5F4] px-4 py-3 text-sm text-[#A63A3A]" role="alert">{error}</div>}

        {jobs.length === 0 ? (
          <div className="rounded-xl border border-[#E1E6EB] bg-white px-6 py-14 text-center shadow-[0_8px_24px_rgba(31,45,61,0.05)]">
            <Briefcase size={30} className="mx-auto mb-3 text-[#9AA6B2]" />
            <h2 className="text-lg font-bold text-[#17212B]" style={{ fontFamily: FONT_DISPLAY }}>No recommended jobs yet</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-[#687584]">Complete your profile to receive more relevant opportunities.</p>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {jobs.map((job) => (
              <motion.div key={job._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="group rounded-xl border border-[#E1E6EB] bg-white p-4 shadow-[0_4px_16px_rgba(31,45,61,0.04)] transition-all hover:-translate-y-0.5 hover:border-[#D4A1A0] hover:shadow-[0_10px_24px_rgba(31,45,61,0.09)] sm:p-5">
                <div className="flex gap-3">
                  {job.postedBy?.companyLogoUrl && <img src={job.postedBy.companyLogoUrl} alt={job.postedBy.companyName} className="h-11 w-11 shrink-0 rounded-lg border border-[#E5E9EE] object-cover" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="cursor-pointer text-base font-bold leading-5 text-[#17212B] transition-colors group-hover:text-[#B34752] hover:underline" style={{ fontFamily: FONT_DISPLAY }} onClick={() => navigate(`/candidate/jobs/${job._id}`)}>{job.title}</h3>
                        <p className="mt-1 text-xs font-medium text-[#687584]">{job.postedBy?.companyName}</p>
                      </div>
                      <button type="button" onClick={() => toggleSaveJob(job._id)} aria-label={savedJobs.has(job._id) ? "Remove saved job" : "Save job"} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#7B8794] transition-colors hover:bg-[#FFF1F0] hover:text-[#C75560]">
                        {savedJobs.has(job._id) ? <BookmarkCheck size={18} color={MAROON} fill={MAROON} /> : <Bookmark size={18} color="#7B8794" />}
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-[#687584]">
                      {job.location && <div className="flex items-center gap-1"><MapPin size={14} className="text-[#8C99A6]" />{job.location}</div>}
                      {job.salary && <div className="flex items-center gap-1"><IndianRupee size={14} className="text-[#8C99A6]" />{job.salary}</div>}
                      {job.experienceLevel && <div className="flex items-center gap-1"><Briefcase size={14} className="text-[#8C99A6]" />{displayExperienceLevel(job.experienceLevel)}</div>}
                    </div>
                    {job.skillsRequired?.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{job.skillsRequired.slice(0, 4).map((skill) => <span key={skill} className="rounded-md bg-[#F1F4F6] px-2 py-1 text-[11px] font-semibold text-[#566473]">{skill}</span>)}</div>}
                    {job.description && <p className="mt-3 line-clamp-2 text-xs leading-5 text-[#687584]">{job.description}</p>}
                  </div>
                </div>
                <button type="button" onClick={() => navigate(`/candidate/jobs/${job._id}`)} className="mt-4 inline-flex items-center rounded-lg bg-[#C75560] px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-[#A94658]">View details</button>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
