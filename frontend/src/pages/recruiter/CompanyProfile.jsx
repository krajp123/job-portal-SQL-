import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import RecruiterNavbar from "../../components/RecruiterNavbar";
import CandidateNavbar from "../../components/CandidateNavbar";
import axiosInstance from "../../api/axiosInstance";
import { FONT_DISPLAY } from "../../theme";
import Cropper from "react-easy-crop";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Award,
  Banknote,
  BriefcaseBusiness,
  Building2,
  Check,
  CircleHelp,
  Clock3,
  ExternalLink,
  Heart,
  ImagePlus,
  Info,
  MapPin,
  Pencil,
  Plus,
  RotateCw,
  ShieldCheck,
  Sparkles,
  Star,
  Tags,
  Trash2,
  Users,
  X,
  ZoomIn,
} from "lucide-react";

const fallbackCompanyData = {
  name: "Company profile",
  logoUrl: "",
  coverUrl: "",
  rating: 0,
  reviewCount: 0,
  tags: [],
  categories: [],
  followers: 0,
  about: "",
  gallery: [],
  departments: [],
  benefits: [],
  salaries: [],
  moreInfo: { type: "", founded: "", size: "", website: "" },
  ratings: [],
  jobs: [],
};

function getWebsiteHref(value) {
  const website = String(value || "").trim();
  if (!website) return "";
  return /^https?:\/\//i.test(website) ? website : `https://${website}`;
}

function getCompanyInitials(name = "") {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function createCroppedImage(imageSrc, pixelCrop, rotation = 0) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const radians = (rotation * Math.PI) / 180;
      const sin = Math.abs(Math.sin(radians));
      const cos = Math.abs(Math.cos(radians));
      const rotatedWidth = image.width * cos + image.height * sin;
      const rotatedHeight = image.width * sin + image.height * cos;
      const canvas = document.createElement("canvas");
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Could not prepare image crop."));
        return;
      }
      const rotatedCanvas = document.createElement("canvas");
      rotatedCanvas.width = rotatedWidth;
      rotatedCanvas.height = rotatedHeight;
      const rotatedContext = rotatedCanvas.getContext("2d");
      rotatedContext.translate(rotatedWidth / 2, rotatedHeight / 2);
      rotatedContext.rotate(radians);
      rotatedContext.drawImage(image, -image.width / 2, -image.height / 2);
      context.drawImage(
        rotatedCanvas,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height,
      );
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Could not create cropped image."));
          return;
        }
        resolve(new File([blob], "company-image.jpg", { type: "image/jpeg" }));
      }, "image/jpeg", 0.92);
    };
    image.onerror = () => reject(new Error("Could not read the selected image."));
    image.src = imageSrc;
  });
}

function Stars({ value, small = false }) {
  return (
    <span className="inline-flex gap-0.5 text-[#D28A38]">
      {[0, 1, 2, 3, 4].map((star) => (
        <Star
          key={star}
          size={small ? 12 : 14}
          fill={star < Math.round(value) ? "currentColor" : "none"}
        />
      ))}
    </span>
  );
}

function Heading({ children, action, hint }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold">{children}</h2>
        {hint && (
          <CircleHelp size={14} className="text-[#9B7A83]" aria-label={hint} />
        )}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <p className="rounded-xl border border-dashed border-[#EBC2AE] bg-[#FFFDFB] px-4 py-5 text-sm text-[#8D6072]">
      {text}
    </p>
  );
}

function Rail({ children }) {
  const ref = useRef(null);
  const [left, setLeft] = useState(false);
  const [right, setRight] = useState(true);
  const update = () => {
    const node = ref.current;
    if (node) {
      setLeft(node.scrollLeft > 4);
      setRight(node.scrollLeft + node.clientWidth < node.scrollWidth - 4);
    }
  };
  useEffect(() => {
    update();
    const node = ref.current;
    window.addEventListener("resize", update);
    node?.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("resize", update);
      node?.removeEventListener("scroll", update);
    };
  }, []);
  return (
    <div className="relative">
      <div
        ref={ref}
        className="flex snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      {left && (
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() =>
            ref.current?.scrollBy({ left: -270, behavior: "smooth" })
          }
          className="absolute -left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[#F0DCD4] bg-white text-[#8D6072] shadow-sm"
        >
          <ArrowLeft size={15} />
        </button>
      )}
      {right && (
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() =>
            ref.current?.scrollBy({ left: 270, behavior: "smooth" })
          }
          className="absolute -right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[#F0DCD4] bg-white text-[#8D6072] shadow-sm"
        >
          <ArrowRight size={15} />
        </button>
      )}
    </div>
  );
}

function EditCard({ icon: Icon, title, subtitle, action, children }) {
  return (
    <div className="edit-card">
      <div className="edit-card-head">
        <div className="flex items-start gap-3">
          {Icon && (
            <span className="edit-card-icon">
              <Icon size={16} />
            </span>
          )}
          <div>
            <h3 className="text-sm font-bold text-[#1D181A]">{title}</h3>
            {subtitle && (
              <p className="mt-0.5 text-[11px] text-[#8D6072]">{subtitle}</p>
            )}
          </div>
        </div>
        {action}
      </div>
      <div className="edit-card-body">{children}</div>
    </div>
  );
}

function ImageActions({ label, value, onFile, onClear, uploading }) {
  const fileInputRef = useRef(null);
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <span className="profile-image-actions">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="profile-image-action"
          aria-label={`Edit ${label.toLowerCase()}`}
          title={`Upload or replace ${label.toLowerCase()}`}
          disabled={uploading}
        >
          <Pencil size={13} />
        </button>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="profile-image-action profile-image-delete"
          aria-label={`Delete ${label.toLowerCase()}`}
          title={`Delete ${label.toLowerCase()}`}
          disabled={uploading || !value}
        >
          <Trash2 size={13} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onFile}
        />
      </span>
      {confirming && (
        <div className="image-confirm-backdrop" role="presentation">
          <div
            className="image-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="image-confirm-title"
          >
            <h2 id="image-confirm-title">Remove {label}?</h2>
            <p>Are you sure you want to remove this image from your profile?</p>
            <div className="image-confirm-actions">
              <button type="button" onClick={() => setConfirming(false)} className="image-confirm-cancel">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onClear();
                  setConfirming(false);
                }}
                className="image-confirm-remove"
              >
                Remove image
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ImageCropModal({ image, label, onCancel, onConfirm }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [processing, setProcessing] = useState(false);
  const cropAspect = image.type === "cover" ? 16 / 5 : 1;

  async function confirmCrop() {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const croppedFile = await createCroppedImage(
        image.src,
        croppedAreaPixels,
        rotation,
      );
      await onConfirm(croppedFile);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="crop-modal-backdrop" role="presentation">
      <div className="crop-modal" role="dialog" aria-modal="true" aria-labelledby="crop-modal-title">
        <div className="crop-modal-head">
          <div>
            <h2 id="crop-modal-title">Adjust {label}</h2>
            <p>Drag to move, use the slider to zoom, and rotate if needed.</p>
          </div>
          <button type="button" className="crop-close" onClick={onCancel} aria-label="Close crop editor">
            <X size={18} />
          </button>
        </div>
        <div className="cropper-stage">
          <Cropper
            image={image.src}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={cropAspect}
            cropShape="rect"
            showGrid
            restrictPosition={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
          />
        </div>
        <div className="crop-controls">
          <label className="crop-zoom-control">
            <ZoomIn size={15} />
            <span>Zoom</span>
            <input type="range" min="1" max="3" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
          </label>
          <button type="button" className="crop-rotate" onClick={() => setRotation((value) => (value + 90) % 360)}>
            <RotateCw size={14} /> Rotate
          </button>
        </div>
        <div className="crop-modal-actions">
          <button type="button" className="image-confirm-cancel" onClick={onCancel} disabled={processing}>Cancel</button>
          <button type="button" className="image-confirm-remove crop-use-button" onClick={confirmCrop} disabled={processing || !croppedAreaPixels}>
            {processing ? "Preparing..." : "Use cropped image"}
          </button>
        </div>
      </div>
    </div>
  );
}

const BENEFIT_ICONS = [
  {
    key: "ShieldCheck",
    label: "Insurance & Security",
    description: "Health insurance, life cover, or job security",
    Icon: ShieldCheck,
  },
  {
    key: "Clock3",
    label: "Work-Life Balance",
    description: "Flexible hours, remote work, or paid time off",
    Icon: Clock3,
  },
  {
    key: "BriefcaseBusiness",
    label: "Career Growth",
    description: "Training, mentorship, or learning opportunities",
    Icon: BriefcaseBusiness,
  },
  {
    key: "Heart",
    label: "Wellness & Leave",
    description: "Wellness programs, mental health, or family leave",
    Icon: Heart,
  },
];

function IconSelect({ value, onChange }) {
  return (
    <div className="icon-select">
      {BENEFIT_ICONS.map(({ key, label, description, Icon }) => (
        <button
          type="button"
          key={key}
          title={`${label}: ${description}`}
          aria-label={`${label} benefit type`}
          onClick={() => onChange(key)}
          className={`icon-select-option ${value === key ? "active" : ""}`}
        >
          <Icon size={14} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

function JobRow({ job, readOnly }) {
  const href = job.id
    ? readOnly
      ? `/candidate/jobs/${job.id}`
      : `/recruiter/jobs?jobId=${job.id}`
    : "#";
  return (
    <Link
      to={href}
      onClick={(event) => {
        if (!job.id) event.preventDefault();
      }}
      className={`block border-t border-[#EBC2AE] pt-3 ${job.id ? "hover:text-[#C75560]" : "cursor-default"}`}
    >
      <div className="flex justify-between gap-2 text-sm font-bold text-[#1D181A]">
        {job.title}
        <ArrowUpRight size={15} className="text-[#C75560]" />
      </div>
      <p className="mt-1 text-[11px] text-[#8D6072]">
        <BriefcaseBusiness size={12} className="mr-1 inline" />
        {job.exp}
        <MapPin size={12} className="ml-2 mr-1 inline" />
        {job.location}
      </p>
    </Link>
  );
}

function formatJobSalary(value) {
  if (!value) return "";
  if (typeof value === "object") {
    const min = Number(value.min);
    const max = Number(value.max);
    const currency = value.currency === "INR" ? "₹" : value.currency || "";
    if (Number.isFinite(min) && Number.isFinite(max)) {
      return `${currency}${min.toLocaleString()} - ${currency}${max.toLocaleString()}`;
    }
    if (Number.isFinite(min)) return `${currency}${min.toLocaleString()}`;
  }
  return String(value);
}

function CompanyJobCard({ job, readOnly, companyName, companyLogoUrl }) {
  const href = job.id
    ? readOnly
      ? `/candidate/jobs/${job.id}`
      : `/recruiter/jobs?jobId=${job.id}`
    : "#";
  return (
    <article className="company-job-card">
      <div className="flex gap-3">
        {companyLogoUrl ? (
          <img
            src={companyLogoUrl}
            alt=""
            className="h-11 w-11 shrink-0 rounded-lg border border-[#F0DCD4] object-cover"
          />
        ) : (
          <span className="company-job-logo-fallback">
            <BriefcaseBusiness size={18} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <Link to={href} className="company-job-title">
            {job.title}
          </Link>
          <p className="mt-1 text-xs font-medium text-[#8D6072]">{companyName}</p>
        </div>
        <ArrowUpRight size={16} className="shrink-0 text-[#C75560]" />
      </div>
      <div className="company-job-meta">
        <span><MapPin size={14} />{job.location}</span>
        <span><BriefcaseBusiness size={14} />{job.exp}</span>
        {job.salary && <span>{formatJobSalary(job.salary)}</span>}
      </div>
      {job.skills?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.skills.slice(0, 4).map((skill) => (
            <span key={skill} className="company-job-skill">{skill}</span>
          ))}
        </div>
      )}
      {job.description && <p className="company-job-description">{job.description}</p>}
      <Link to={href} className="company-job-action">View details</Link>
    </article>
  );
}

function normalizeCompanyProfile(data) {
  if (!data) return fallbackCompanyData;
  const iconMap = { ShieldCheck, Clock3, BriefcaseBusiness, Heart };
  const benefits =
    Array.isArray(data.companyBenefits) && data.companyBenefits.length
      ? data.companyBenefits.map((item) => ({
          ...item,
          icon: iconMap[item.icon] || ShieldCheck,
        }))
      : fallbackCompanyData.benefits;
  const gallery =
    Array.isArray(data.companyGallery) && data.companyGallery.length
      ? data.companyGallery
          .map((item) => (typeof item === "string" ? item : item.url))
          .filter(Boolean)
      : fallbackCompanyData.gallery;
  const jobs =
    Array.isArray(data.jobs) && data.jobs.length
      ? data.jobs
          .filter(
            (job) => !job.status || ["open", "active"].includes(job.status),
          )
          .map((job) => ({
            id: job._id || job.id,
            title: job.title || "Untitled role",
            exp:
              job.experience ||
              job.experienceLevel ||
              job.exp ||
              "Experience varies",
            location:
              job.location ||
              job.city ||
              job.workMode ||
              "Location not specified",
            salary: job.salary || "",
            skills: Array.isArray(job.skillsRequired) ? job.skillsRequired : [],
            description: job.description || "",
          }))
      : [];
  const ratings =
    data.ratingBreakdown && Object.keys(data.ratingBreakdown).length
      ? [
          ["Salary & Benefits", data.ratingBreakdown.salaryBenefits],
          ["Company Culture", data.ratingBreakdown.culture],
          ["Work Life", data.ratingBreakdown.workLife],
          ["Skill Development", data.ratingBreakdown.skillDev],
          ["Work Satisfaction", data.ratingBreakdown.satisfaction],
          ["Job Security", data.ratingBreakdown.jobSecurity],
          ["Career Growth", data.ratingBreakdown.careerGrowth],
        ]
      : fallbackCompanyData.ratings;
  return {
    ...fallbackCompanyData,
    ...data,
    name: data.companyName || data.name || fallbackCompanyData.name,
    logoUrl: data.companyLogoUrl || fallbackCompanyData.logoUrl,
    coverUrl: data.coverImageUrl || fallbackCompanyData.coverUrl,
    rating: Number(data.rating || 0),
    reviewCount: Number(data.reviewCount ?? data.reviews ?? 0),
    about: data.companyDescription || data.companyDetails || data.bio || "",
    moreInfo: {
      type: data.companyType || fallbackCompanyData.moreInfo.type,
      founded: data.founded || fallbackCompanyData.moreInfo.founded,
      size: data.companySize || fallbackCompanyData.moreInfo.size,
      website: String(
        data.companyWebsite || fallbackCompanyData.moreInfo.website,
      ).replace(/^https?:\/\//i, ""),
    },
    tags:
      Array.isArray(data.tags) && data.tags.length
        ? data.tags
        : fallbackCompanyData.tags,
    categories: Array.isArray(data.companyCategories) ? data.companyCategories : [],
    gallery,
    departments:
      Array.isArray(data.departmentOpenings) && data.departmentOpenings.length
        ? data.departmentOpenings
        : fallbackCompanyData.departments,
    benefits,
    salaries: Array.isArray(data.salaryInsights)
      ? data.salaryInsights.map((item) => {
          const min = Math.max(0, Number(item.min || 0));
          const max = Math.max(min, Number(item.max || 0));
          const avg = Math.min(max, Math.max(min, Number(item.avg || 0)));
          return { ...item, min, max, avg };
        })
      : [],
    ratings,
    reviewProfiles: Array.isArray(data.reviewProfiles)
      ? data.reviewProfiles
      : [],
    jobs,
    followers: Number(data.followerCount || 0),
  };
}

export default function RecruiterCompanyProfile({ readOnly = false }) {
  const { companyId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState("");
  const [tab, setTab] = useState("Overview");
  const [jobsPage, setJobsPage] = useState(1);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showAllBenefits, setShowAllBenefits] = useState(false);
  const [department, setDepartment] = useState("All departments");
  const [shadow, setShadow] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [cropImage, setCropImage] = useState(null);
  const companyData = normalizeCompanyProfile(profile);
  const openingsCount = companyData.jobs.length;
  const jobsPerPage = 4;
  const jobsPageCount = Math.max(1, Math.ceil(companyData.jobs.length / jobsPerPage));
  const visibleCompanyJobs = companyData.jobs.slice(
    (jobsPage - 1) * jobsPerPage,
    jobsPage * jobsPerPage,
  );
  const [draft, setDraft] = useState({});
  const visibleLogoUrl = editMode ? draft.companyLogoUrl : companyData.logoUrl;
  const visibleCoverUrl = editMode ? draft.coverImageUrl : companyData.coverUrl;

  useEffect(() => {
    setJobsPage(1);
  }, [companyData.jobs.length]);

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      setLoading(true);
      setLoadError("");
      try {
        const endpoint =
          readOnly && companyId
            ? `/recruiter/${companyId}/public-profile?allJobs=true`
            : "/recruiter/me/profile";
        const { data } = await axiosInstance.get(endpoint);
        if (!cancelled) setProfile(data);
      } catch (error) {
        if (!cancelled)
          setLoadError(
            error.response?.data?.error || "Could not load company profile.",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [companyId, readOnly]);

  useEffect(() => {
    if (!readOnly) return undefined;
    let cancelled = false;
    async function loadRecommendedJobs() {
      try {
        const { data } = await axiosInstance.get("/jobs/recommended");
        if (!cancelled) setRecommendedJobs((Array.isArray(data) ? data : []).slice(0, 5));
      } catch {
        if (!cancelled) setRecommendedJobs([]);
      }
    }
    loadRecommendedJobs();
    return () => {
      cancelled = true;
    };
  }, [readOnly]);

  useEffect(() => {
    if (!readOnly || !companyId) return undefined;
    let cancelled = false;
    async function loadFollowStatus() {
      try {
        const { data } = await axiosInstance.get(`/candidate/me/following/${companyId}`);
        if (!cancelled) setFollowing(Boolean(data.following));
      } catch {
        if (!cancelled) setFollowing(false);
      }
    }
    loadFollowStatus();
    return () => {
      cancelled = true;
    };
  }, [companyId, readOnly]);

  async function toggleFollow() {
    if (!companyId || followLoading) return;
    setFollowLoading(true);
    try {
      const endpoint = `/candidate/me/following/${companyId}`;
      const { data } = following
        ? await axiosInstance.delete(endpoint)
        : await axiosInstance.post(endpoint);
      setFollowing(Boolean(data.following));
      setProfile((current) => current ? { ...current, followerCount: data.followerCount } : current);
    } catch (error) {
      setSaveError(error.response?.data?.error || "Could not update follow status.");
    } finally {
      setFollowLoading(false);
    }
  }

  useEffect(() => {
    if (readOnly || tab !== "Jobs") return undefined;
    let cancelled = false;
    async function loadRecruiterJobs() {
      setJobsLoading(true);
      setJobsError("");
      try {
        const { data } = await axiosInstance.get("/jobs/mine/list");
        const jobs = Array.isArray(data) ? data : data?.jobs || [];
        if (!cancelled) setProfile((current) => ({ ...(current || {}), jobs }));
      } catch (error) {
        if (!cancelled)
          setJobsError(
            error.response?.data?.error || "Could not load your company jobs.",
          );
      } finally {
        if (!cancelled) setJobsLoading(false);
      }
    }
    loadRecruiterJobs();
    return () => {
      cancelled = true;
    };
  }, [readOnly, tab]);

  function startEditing() {
    setDraft({
      companyName:
        companyData.name === "Company profile" ? "" : companyData.name,
      companyWebsite: companyData.moreInfo.website,
      companyDetails: companyData.about,
      companyType: companyData.moreInfo.type,
      founded: companyData.moreInfo.founded,
      companySize: companyData.moreInfo.size,
      industry: profile?.industry || "",
      location: profile?.location || "",
      tags: Array.isArray(profile?.tags) ? profile.tags.join(", ") : "",
      categories: Array.isArray(profile?.companyCategories)
        ? profile.companyCategories.join(", ")
        : "",
      companyLogoUrl: profile?.companyLogoUrl || "",
      coverImageUrl: profile?.coverImageUrl || "",
      companyBenefits: Array.isArray(profile?.companyBenefits)
        ? profile.companyBenefits.map((item) => ({ ...item }))
        : [],
      salaryInsights: Array.isArray(profile?.salaryInsights)
        ? profile.salaryInsights.map((item) => ({ ...item }))
        : [],
      rating: Number(profile?.rating || 0),
      reviewCount: Number(profile?.reviewCount || profile?.reviews || 0),
      ratingBreakdown: { ...(profile?.ratingBreakdown || {}) },
      reviewProfiles: Array.isArray(profile?.reviewProfiles)
        ? profile.reviewProfiles.map((item) => ({ ...item }))
        : [],
      companyGallery: Array.isArray(profile?.companyGallery)
        ? profile.companyGallery.map((item) =>
            typeof item === "string" ? { url: item, alt: "" } : { ...item },
          )
        : [],
    });
    setSaveError("");
    setEditMode(true);
  }

  async function saveProfile() {
    setSaving(true);
    setSaveError("");
    try {
      const payload = {
        companyName: draft.companyName.trim(),
        companyWebsite: draft.companyWebsite.trim(),
        companyDetails: draft.companyDetails.trim(),
        companyType: draft.companyType.trim(),
        founded: draft.founded.trim(),
        companySize: draft.companySize.trim(),
        industry: draft.industry.trim(),
        location: draft.location.trim(),
        tags: draft.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        companyCategories: draft.categories
          .split(",")
          .map((category) => category.trim())
          .filter(Boolean),
        companyLogoUrl: draft.companyLogoUrl,
        coverImageUrl: draft.coverImageUrl,
        companyBenefits: draft.companyBenefits,
        salaryInsights: draft.salaryInsights,
        rating: Number(draft.rating || 0),
        reviewCount: Number(draft.reviewCount || 0),
        ratingBreakdown: draft.ratingBreakdown,
        reviewProfiles: draft.reviewProfiles,
        companyGallery: draft.companyGallery,
      };
      const { data } = await axiosInstance.put(
        "/recruiter/me/profile",
        payload,
      );
      setProfile(data);
      setEditMode(false);
    } catch (error) {
      setSaveError(
        error.response?.data?.error || "Could not save company profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  function updateDraftList(key, index, field, value) {
    setDraft((current) => ({
      ...current,
      [key]: current[key].map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function addDraftItem(key, item) {
    setDraft((current) => ({
      ...current,
      [key]: [...(current[key] || []), item],
    }));
  }

  function removeDraftItem(key, index) {
    setDraft((current) => ({
      ...current,
      [key]: current[key].filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function uploadCompanyImage(event, type) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setSaveError("Use a JPG, PNG, or WEBP image smaller than 5MB.");
      return;
    }
    if (type === "gallery") {
      uploadCompanyImageFile(file, type);
      return;
    }
    const src = URL.createObjectURL(file);
    setCropImage({ src, type, label: type === "logo" ? "logo" : "cover image" });
  }

  async function uploadCompanyImageFile(file, type) {
    setUploading(true);
    setSaveError("");
    try {
      const body = new FormData();
      body.append("companyImage", file);
      body.append("imageType", type);
      const { data } = await axiosInstance.post(
        "/recruiter/me/upload-company-image",
        body,
      );
      if (type === "logo")
        setDraft((current) => ({
          ...current,
          companyLogoUrl: data.companyLogoUrl,
        }));
      else if (type === "cover")
        setDraft((current) => ({
          ...current,
          coverImageUrl: data.coverImageUrl,
        }));
      else if (data.companyGalleryUrl)
        addDraftItem("companyGallery", {
          url: data.companyGalleryUrl,
          alt: "",
        });
      if (cropImage?.src) URL.revokeObjectURL(cropImage.src);
      setCropImage(null);
    } catch (error) {
      setSaveError(error.response?.data?.error || "Could not upload image.");
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    const onScroll = () => setShadow(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (loading)
    return (
      <div
        className="min-h-screen bg-[#FFF7F2] text-[#1D181A]"
        style={{ fontFamily: FONT_DISPLAY }}
      >
        {readOnly ? <CandidateNavbar /> : <RecruiterNavbar />}
        <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-[#8D6072]">
          Loading company profile...
        </div>
      </div>
    );
  if (loadError)
    return (
      <div
        className="min-h-screen bg-[#FFF7F2] text-[#1D181A]"
        style={{ fontFamily: FONT_DISPLAY }}
      >
        {readOnly ? <CandidateNavbar /> : <RecruiterNavbar />}
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <p className="text-sm text-[#8D6072]">{loadError}</p>
          <Link
            to="/"
            className="mt-4 inline-flex rounded-full bg-[#C75560] px-4 py-2 text-xs font-bold text-white"
          >
            Go home
          </Link>
        </div>
      </div>
    );

  return (
    <div
      className="min-h-screen bg-[#FFF7F2] text-[#1D181A]"
      style={{ fontFamily: FONT_DISPLAY }}
    >
      <div className={`sticky top-0 z-40 ${!readOnly && shadow ? "shadow-md" : ""}`}>
        {readOnly ? <CandidateNavbar /> : <RecruiterNavbar />}
      </div>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <section className="relative overflow-visible rounded-[26px] border border-[#EBC2AE] bg-white shadow-sm">
          <div className="relative aspect-[16/5] w-full overflow-hidden rounded-t-[26px] bg-[#38272C]">
            {visibleCoverUrl && (
              <img
                src={visibleCoverUrl}
                alt="Company office"
                className="h-full w-full object-cover opacity-100"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-[#24191C]/65 via-[#24191C]/15 to-transparent" />
            {!readOnly && editMode && (
              <ImageActions
                label="cover image"
                value={draft.coverImageUrl}
                uploading={uploading}
                onFile={(event) => uploadCompanyImage(event, "cover")}
                onClear={() => setDraft({ ...draft, coverImageUrl: "" })}
              />
            )}
          </div>
          <div className="company-header-body relative px-5 pb-5 pt-0 sm:px-8 sm:pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
              <div className="company-header-logo relative -mt-14 flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-[5px] border-white bg-[#FFF0E8] shadow-lg sm:-mt-[72px] sm:h-36 sm:w-36">
                {visibleLogoUrl ? (
                  <img
                    src={visibleLogoUrl}
                    alt={`${companyData.name} logo`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold tracking-tight text-[#C75560]">
                    {getCompanyInitials(companyData.name)}
                  </span>
                )}
                {!readOnly && editMode && (
                  <ImageActions
                    label="logo"
                    value={draft.companyLogoUrl}
                    uploading={uploading}
                    onFile={(event) => uploadCompanyImage(event, "logo")}
                    onClear={() => setDraft({ ...draft, companyLogoUrl: "" })}
                  />
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-4 pt-1 sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:pt-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="truncate text-2xl font-bold sm:text-3xl">
                      {companyData.name}
                    </h1>
                    {profile?.verificationStatus === "verified" && (
                      <ShieldCheck size={18} className="shrink-0 text-emerald-600" />
                    )}
                  </div>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-[#F0C9BA] bg-[#FFF7F2] px-3 py-1.5 text-xs font-semibold text-[#80576A]">
                    <Stars value={companyData.rating} small />{" "}
                    {companyData.rating || "Not rated"}{" "}
                    <span className="underline">
                      ({companyData.reviewCount} reviews)
                    </span>
                  </div>
                  {(companyData.categories.length > 0 ||
                    companyData.tags.length > 0) && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {companyData.categories.map((category, index) => (
                        <span
                          key={`${category}-${index}`}
                          className="company-category-chip"
                        >
                          {category}
                        </span>
                      ))}
                      {companyData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-[#F8EEE9] px-3 py-1.5 text-[11px] font-semibold text-[#80576A]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-[#8F7B80]">
                    <Users size={14} className="text-[#C75560]" />
                    {companyData.followers.toLocaleString()} followers
                  </span>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={startEditing}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#C75560] text-[#C75560] hover:bg-[#FFF1EB]"
                      aria-label="Edit company profile"
                      title="Edit company profile"
                    >
                      <Pencil size={16} />
                    </button>
                  )}
                  {readOnly && (
                    <button
                      type="button"
                      onClick={toggleFollow}
                      disabled={followLoading}
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold ${following ? "border-[#C75560] bg-[#C75560] text-white" : "border-[#C75560] text-[#C75560] hover:bg-[#FFF1EB]"}`}
                    >
                      <Heart size={14} fill={following ? "currentColor" : "none"} />
                      {followLoading ? "Updating..." : following ? "Following" : "Follow"}
                    </button>
                  )}
                </div>
              </div>
            </div>
            {!readOnly && editMode && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="field">
                  Logo URL
                  <input
                    className="text-input"
                    placeholder="Paste logo image URL"
                    value={draft.companyLogoUrl || ""}
                    onChange={(event) =>
                      setDraft({ ...draft, companyLogoUrl: event.target.value })
                    }
                  />
                </label>
                <label className="field">
                  Cover image URL
                  <input
                    className="text-input"
                    placeholder="Paste cover image URL"
                    value={draft.coverImageUrl || ""}
                    onChange={(event) =>
                      setDraft({ ...draft, coverImageUrl: event.target.value })
                    }
                  />
                </label>
              </div>
            )}
          </div>
        </section>
        {editMode && (
          <section className="mt-5 overflow-hidden rounded-2xl border border-[#EBC2AE] bg-white">
            <div className="edit-topbar">
              <div className="flex items-center gap-2 text-[#1D181A]">
                <Sparkles size={16} className="text-[#C75560]" />
                <div>
                  <h2 className="text-sm font-bold leading-tight">
                    Edit company profile
                  </h2>
                  <p className="text-[11px] font-normal text-[#8D6072]">
                    Changes go live on your public profile once saved
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  disabled={saving || uploading}
                  className="rounded-full border border-[#EBC2AE] px-4 py-2 text-xs font-bold text-[#8D6072] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={saving || uploading || !draft.companyName?.trim()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#C75560] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  <Check size={13} />
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
            {saveError && (
              <p className="mx-5 mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700 sm:mx-7">
                <Info size={14} /> {saveError}
              </p>
            )}
            <div className="space-y-5 p-5 sm:p-7">
            <EditCard
              icon={Building2}
              title="Basic details"
              subtitle="The core information candidates see first"
            >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="field">
                Company name <span className="required">*</span>
                <input
                  placeholder="e.g. JKR Consulting and Services"
                  value={draft.companyName || ""}
                  onChange={(event) =>
                    setDraft({ ...draft, companyName: event.target.value })
                  }
                />
              </label>
              <label className="field">
                Website
                <input
                  placeholder="www.example.com"
                  value={draft.companyWebsite || ""}
                  onChange={(event) =>
                    setDraft({ ...draft, companyWebsite: event.target.value })
                  }
                />
              </label>
              <label className="field">
                Industry
                <input
                  placeholder="e.g. IT Services"
                  value={draft.industry || ""}
                  onChange={(event) =>
                    setDraft({ ...draft, industry: event.target.value })
                  }
                />
              </label>
              <label className="field">
                Company type
                <input
                  placeholder="e.g. Private, MNC, Startup"
                  value={draft.companyType || ""}
                  onChange={(event) =>
                    setDraft({ ...draft, companyType: event.target.value })
                  }
                />
              </label>
              <label className="field">
                Company size
                <input
                  placeholder="e.g. 51-200 employees"
                  value={draft.companySize || ""}
                  onChange={(event) =>
                    setDraft({ ...draft, companySize: event.target.value })
                  }
                />
              </label>
              <label className="field">
                Founded
                <input
                  placeholder="e.g. 2018"
                  value={draft.founded || ""}
                  onChange={(event) =>
                    setDraft({ ...draft, founded: event.target.value })
                  }
                />
              </label>
              <label className="field">
                Location
                <input
                  value={draft.location || ""}
                  onChange={(event) =>
                    setDraft({ ...draft, location: event.target.value })
                  }
                />
              </label>
              <label className="field sm:col-span-2">
                Tags <span className="font-normal text-[#8D6072]">comma separated — shown as chips on your profile</span>
                <input
                  placeholder="e.g. Hybrid, IT Services, Product Based"
                  value={draft.tags || ""}
                  onChange={(event) =>
                    setDraft({ ...draft, tags: event.target.value })
                  }
                />
                {draft.tags?.trim() && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {draft.tags
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter(Boolean)
                      .map((tag, index) => (
                        <span key={`${tag}-${index}`} className="chip">
                          <Tags size={10} /> {tag}
                        </span>
                      ))}
                  </div>
                )}
              </label>
              <label className="field sm:col-span-2">
                Company categories <span className="font-normal text-[#8D6072]">comma separated — shown below the company rating</span>
                <input
                  placeholder="e.g. Auto Components, Automobile, Foreign MNC, B2B"
                  value={draft.categories || ""}
                  onChange={(event) =>
                    setDraft({ ...draft, categories: event.target.value })
                  }
                />
                {draft.categories?.trim() && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {draft.categories
                      .split(",")
                      .map((category) => category.trim())
                      .filter(Boolean)
                      .map((category, index) => (
                        <span key={`${category}-${index}`} className="chip">
                          <Tags size={10} /> {category}
                        </span>
                      ))}
                  </div>
                )}
              </label>
              <label className="field sm:col-span-2">
                <span className="flex items-center justify-between">
                  About company
                  <span className="font-normal text-[#8D6072]">
                    {(draft.companyDetails || "").length}/1000
                  </span>
                </span>
                <textarea
                  rows="5"
                  maxLength={1000}
                  placeholder="Tell candidates what makes your company a great place to work..."
                  value={draft.companyDetails || ""}
                  onChange={(event) =>
                    setDraft({ ...draft, companyDetails: event.target.value })
                  }
                />
              </label>
            </div>
            </EditCard>

            <EditCard
              icon={ImagePlus}
              title="Gallery"
              subtitle="Office photos, team moments, events — candidates browse these on your profile"
              action={
                <label className="add-button-solid">
                  <Plus size={13} /> Add photo
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => uploadCompanyImage(event, "gallery")}
                  />
                </label>
              }
            >
              {draft.companyGallery?.length ? (
                <Rail>
                  {draft.companyGallery.map((item, index) => (
                    <div key={`${item.url}-${index}`} className="gallery-tile gallery-edit-tile">
                      <div className="gallery-thumb">
                        {item.url ? (
                          <img src={item.url} alt={item.alt || ""} />
                        ) : (
                          <span className="gallery-thumb-empty">
                            <ImagePlus size={16} />
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeDraftItem("companyGallery", index)}
                          className="image-drop-remove"
                          aria-label="Remove photo"
                        >
                          <X size={13} />
                        </button>
                      </div>
                      <input
                        className="text-input mt-2"
                        placeholder="Image URL"
                        value={item.url || ""}
                        onChange={(event) =>
                          updateDraftList(
                            "companyGallery",
                            index,
                            "url",
                            event.target.value,
                          )
                        }
                      />
                      <input
                        className="text-input mt-1.5"
                        placeholder="Caption / alt text"
                        value={item.alt || ""}
                        onChange={(event) =>
                          updateDraftList(
                            "companyGallery",
                            index,
                            "alt",
                            event.target.value,
                          )
                        }
                      />
                    </div>
                  ))}
                </Rail>
              ) : (
                <EmptyState text="No photos yet — add a few to show candidates your workplace." />
              )}
            </EditCard>

            <div className="grid gap-5 lg:grid-cols-2">
              <EditCard
                icon={Award}
                title="Benefits"
                subtitle="Perks candidates see on your profile"
                action={
                  <button
                    type="button"
                    onClick={() =>
                      addDraftItem("companyBenefits", {
                        label: "",
                        count: 0,
                        icon: "ShieldCheck",
                      })
                    }
                    className="add-button-solid"
                  >
                    <Plus size={13} /> Add
                  </button>
                }
              >
                {draft.companyBenefits?.length ? (
                  <div className="space-y-2.5">
                    {draft.companyBenefits.map((item, index) => (
                      <div key={`benefit-${index}`} className="benefit-row">
                        <div className="benefit-icon-picker">
                          <span className="benefit-input-label">Benefit category</span>
                          <IconSelect
                            value={item.icon}
                            onChange={(icon) =>
                              updateDraftList("companyBenefits", index, "icon", icon)
                            }
                          />
                        </div>
                        <label className="benefit-input-field">
                          <span className="benefit-input-label">Benefit name</span>
                          <input
                            className="text-input"
                            placeholder="e.g. Health Insurance"
                            value={item.label || ""}
                            onChange={(event) =>
                              updateDraftList(
                                "companyBenefits",
                                index,
                                "label",
                                event.target.value,
                              )
                            }
                          />
                        </label>
                        <label className="benefit-input-field">
                          <span className="benefit-input-label">Employees covered</span>
                          <input
                            className="number-input"
                            type="number"
                            min="0"
                            placeholder="e.g. 25"
                            value={item.count ?? 0}
                            onChange={(event) =>
                              updateDraftList(
                                "companyBenefits",
                                index,
                                "count",
                                Number(event.target.value),
                              )
                            }
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => removeDraftItem("companyBenefits", index)}
                          className="remove-button"
                          aria-label="Remove benefit"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState text="No benefits added yet." />
                )}
              </EditCard>
              <EditCard
                icon={Banknote}
                title="Salary insights"
                subtitle="Pay ranges by role, shown to candidates"
                action={
                  <button
                    type="button"
                    onClick={() =>
                      addDraftItem("salaryInsights", {
                        role: "",
                        department: "",
                        exp: "",
                        avg: 0,
                        min: 0,
                        max: 0,
                        count: 0,
                      })
                    }
                    className="add-button-solid"
                  >
                    <Plus size={13} /> Add
                  </button>
                }
              >
                {draft.salaryInsights?.length ? (
                  <div className="space-y-3">
                    {draft.salaryInsights.map((item, index) => (
                      <div key={`salary-${index}`} className="salary-card">
                        <div className="salary-card-top">
                          <input
                            className="text-input"
                            placeholder="Role"
                            value={item.role || ""}
                            onChange={(event) =>
                              updateDraftList(
                                "salaryInsights",
                                index,
                                "role",
                                event.target.value,
                              )
                            }
                          />
                          <input
                            className="text-input"
                            placeholder="Department"
                            value={item.department || ""}
                            onChange={(event) =>
                              updateDraftList(
                                "salaryInsights",
                                index,
                                "department",
                                event.target.value,
                              )
                            }
                          />
                          <input
                            className="text-input"
                            placeholder="Experience, e.g. 2-4 yrs"
                            value={item.exp || ""}
                            onChange={(event) =>
                              updateDraftList(
                                "salaryInsights",
                                index,
                                "exp",
                                event.target.value,
                              )
                            }
                          />
                          <button
                            type="button"
                            onClick={() => removeDraftItem("salaryInsights", index)}
                            className="remove-button"
                            aria-label="Remove salary insight"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <div className="salary-card-grid">
                          <label className="mini-field">
                            Min (₹ LPA)
                            <input
                              className="number-input"
                              type="number"
                              value={item.min ?? 0}
                              onChange={(event) =>
                                updateDraftList(
                                  "salaryInsights",
                                  index,
                                  "min",
                                  Number(event.target.value),
                                )
                              }
                            />
                          </label>
                          <label className="mini-field">
                            Avg (₹ LPA)
                            <input
                              className="number-input"
                              type="number"
                              value={item.avg ?? 0}
                              onChange={(event) =>
                                updateDraftList(
                                  "salaryInsights",
                                  index,
                                  "avg",
                                  Number(event.target.value),
                                )
                              }
                            />
                          </label>
                          <label className="mini-field">
                            Max (₹ LPA)
                            <input
                              className="number-input"
                              type="number"
                              value={item.max ?? 0}
                              onChange={(event) =>
                                updateDraftList(
                                  "salaryInsights",
                                  index,
                                  "max",
                                  Number(event.target.value),
                                )
                              }
                            />
                          </label>
                          <label className="mini-field">
                            Data points
                            <input
                              className="number-input"
                              type="number"
                              value={item.count ?? 0}
                              onChange={(event) =>
                                updateDraftList(
                                  "salaryInsights",
                                  index,
                                  "count",
                                  Number(event.target.value),
                                )
                              }
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState text="No salary insights added yet." />
                )}
              </EditCard>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <EditCard
                icon={Star}
                title="Rating breakdown"
                subtitle="Average scores out of 5, shown as employee ratings"
              >
                <div className="space-y-1">
                  {Object.entries({
                    salaryBenefits: "Salary & Benefits",
                    culture: "Company Culture",
                    workLife: "Work Life",
                    skillDev: "Skill Development",
                    satisfaction: "Work Satisfaction",
                    jobSecurity: "Job Security",
                    careerGrowth: "Career Growth",
                  }).map(([key, label]) => (
                    <label key={key} className="field-row">
                      {label}
                      <input
                        className="number-input"
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={draft.ratingBreakdown?.[key] ?? 0}
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            ratingBreakdown: {
                              ...draft.ratingBreakdown,
                              [key]: Number(event.target.value),
                            },
                          })
                        }
                      />
                    </label>
                  ))}
                </div>
              </EditCard>
              <EditCard
                icon={Users}
                title="Reviews by job profile"
                subtitle="Aggregate scores per role"
                action={
                  <button
                    type="button"
                    onClick={() =>
                      addDraftItem("reviewProfiles", {
                        role: "",
                        score: 0,
                        count: 0,
                      })
                    }
                    className="add-button-solid"
                  >
                    <Plus size={13} /> Add
                  </button>
                }
              >
                {draft.reviewProfiles?.length ? (
                  <div className="space-y-2.5">
                    {draft.reviewProfiles.map((item, index) => (
                      <div key={`review-${index}`} className="array-row">
                        <input
                          className="text-input"
                          placeholder="Role"
                          value={item.role || ""}
                          onChange={(event) =>
                            updateDraftList(
                              "reviewProfiles",
                              index,
                              "role",
                              event.target.value,
                            )
                          }
                        />
                        <input
                          className="number-input"
                          type="number"
                          min="0"
                          max="5"
                          step="0.1"
                          placeholder="Score"
                          value={item.score ?? 0}
                          onChange={(event) =>
                            updateDraftList(
                              "reviewProfiles",
                              index,
                              "score",
                              Number(event.target.value),
                            )
                          }
                        />
                        <input
                          className="number-input"
                          type="number"
                          min="0"
                          placeholder="Reviews"
                          value={item.count ?? 0}
                          onChange={(event) =>
                            updateDraftList(
                              "reviewProfiles",
                              index,
                              "count",
                              Number(event.target.value),
                            )
                          }
                        />
                        <button
                          type="button"
                          onClick={() => removeDraftItem("reviewProfiles", index)}
                          className="remove-button"
                          aria-label="Remove review profile"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState text="No job-profile reviews added yet." />
                )}
              </EditCard>
            </div>
            </div>
          </section>
        )}
        <div className="profile-tabs mt-4">
          <div className="flex gap-7 overflow-x-auto px-1">
            {[
              "Overview",
              ...(!readOnly || companyData.jobs.length ? ["Jobs"] : []),
            ].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={`relative shrink-0 pb-3 text-sm font-bold ${tab === item ? "text-[#C75560] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#C75560]" : "text-[#907D82]"}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-5 grid items-start gap-7 lg:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)]">
          <div className="min-w-0 space-y-7">
            {tab === "Overview" ? (
              <>
                <section className="panel">
                  <Heading
                    action={
                      <button
                        type="button"
                        onClick={() => setExpanded(!expanded)}
                        className="action-link"
                      >
                        {expanded ? "Show less" : "Read more"}{" "}
                        <ArrowUpRight size={13} className="inline" />
                      </button>
                    }
                  >
                    About us
                  </Heading>
                  <p
                    className={`text-sm leading-7 text-[#8D6072] ${expanded ? "" : "line-clamp-4"}`}
                  >
                    {companyData.about}
                  </p>
                </section>
                <section className="panel">
                  <Heading
                    action={
                      <span className="text-xs text-[#8D6072]">
                        {companyData.gallery.length} photos
                      </span>
                    }
                  >
                    Life at {companyData.name}
                  </Heading>
                  {companyData.gallery.length ? (
                    <Rail>
                      {companyData.gallery.map((image, index) => (
                        <img
                          key={image}
                          src={image}
                          alt={`Office life ${index + 1}`}
                          className="h-44 w-64 shrink-0 snap-start rounded-xl object-cover"
                        />
                      ))}
                    </Rail>
                  ) : (
                    <EmptyState text="No company photos have been added yet." />
                  )}
                </section>
                <section className="panel">
                  <Heading>Departments hiring</Heading>
                  {companyData.departments.length ? (
                    <Rail>
                      {companyData.departments.map((item) => (
                        <div
                          key={item.name}
                          className="group flex min-h-28 w-52 shrink-0 snap-start flex-col justify-between rounded-xl border border-[#EADBD5] bg-[#FFFDFB] p-4 hover:-translate-y-1 hover:shadow-lg"
                        >
                          <b className="line-clamp-2 text-sm">{item.name}</b>
                          <span className="flex justify-between text-xs font-semibold text-[#C75560]">
                            {item.openings} openings <ArrowRight size={15} />
                          </span>
                        </div>
                      ))}
                    </Rail>
                  ) : (
                    <EmptyState text="No hiring departments have been added yet." />
                  )}
                </section>
                <section className="panel">
                  <Heading
                    hint="Benefits reported by employees"
                    action={
                      companyData.benefits.length > 4 ? (
                        <button
                          type="button"
                          onClick={() => setShowAllBenefits(!showAllBenefits)}
                          className="action-link"
                        >
                          {showAllBenefits ? "Show fewer" : "View all benefits"}
                        </button>
                      ) : null
                    }
                  >
                    Benefits
                  </Heading>
                  {companyData.benefits.length ? (
                    <Rail>
                      {companyData.benefits
                        .slice(0, showAllBenefits ? undefined : 4)
                        .map(({ label, count, icon: Icon }) => (
                          <div
                            key={label}
                            className="flex w-32 shrink-0 flex-col items-center rounded-xl border border-[#EADBD5] bg-[#FFFDFB] px-3 py-4 text-center"
                          >
                            <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF0E8] text-[#C75560]">
                              <Icon size={18} />
                            </span>
                            <b className="text-xs">{label}</b>
                            <span className="mt-1 text-[11px] text-[#947F84]">
                              ({count})
                            </span>
                          </div>
                        ))}
                    </Rail>
                  ) : (
                    <EmptyState text="No benefits have been added yet." />
                  )}
                </section>
                <section className="panel">
                  <Heading
                    hint="Salary data is based on employee submissions"
                    action={
                      companyData.salaries.length ? (
                        <select
                          value={department}
                          onChange={(event) =>
                            setDepartment(event.target.value)
                          }
                          className="rounded-lg border border-[#EADBD5] bg-[#FFFDFB] px-2 py-1.5 text-xs"
                        >
                          <option>All departments</option>
                          {[
                            ...new Set(
                              companyData.salaries
                                .map((item) => item.department)
                                .filter(Boolean),
                            ),
                          ].map((item) => (
                            <option key={item}>{item}</option>
                          ))}
                        </select>
                      ) : null
                    }
                  >
                    Employee salaries
                  </Heading>
                  {companyData.salaries.length ? (
                    <Rail>
                      {companyData.salaries
                        .filter(
                          (item) =>
                            department === "All departments" ||
                            item.department === department,
                        )
                        .map((item) => (
                          <div
                            key={item.role}
                            className="w-64 shrink-0 rounded-xl border border-[#EADBD5] bg-[#FFFDFB] p-4"
                          >
                            <b className="line-clamp-2 text-sm">{item.role}</b>
                            <p className="mt-1 text-xs text-[#947F84]">
                              {item.exp} · {item.count} salaries
                            </p>
                            <div className="mt-6 h-1.5 rounded-full bg-[#F0DCD4]">
                              <div
                                className="relative h-full rounded-full bg-[#D58B72]"
                                style={{
                                  width: `${item.max > item.min ? ((item.avg - item.min) / (item.max - item.min)) * 100 : 0}%`,
                                }}
                              >
                                <span className="absolute -right-1.5 -top-1.5 h-4 w-4 rounded-full border-2 border-white bg-[#C75560]" />
                              </div>
                            </div>
                            <div className="mt-2 flex justify-between text-[11px] text-[#947F84]">
                              <span>₹{item.min}L</span>
                              <strong className="text-[#C75560]">
                                ₹{item.avg}L avg
                              </strong>
                              <span>₹{item.max}L</span>
                            </div>
                          </div>
                        ))}
                    </Rail>
                  ) : (
                    <EmptyState text="No salary information has been added yet." />
                  )}
                </section>
                <section className="panel">
                  <Heading>More information</Heading>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {Object.entries({
                      Type: companyData.moreInfo.type,
                      Founded: companyData.moreInfo.founded,
                      "Company size": companyData.moreInfo.size,
                    }).map(([key, value]) => (
                      <div key={key}>
                        <small>{key}</small>
                        <p className="mt-1 text-sm font-semibold">{value}</p>
                      </div>
                    ))}
                    <div>
                      <small>Website</small>
                      <a
                        href={`https://${companyData.moreInfo.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 flex items-center gap-1 text-sm font-semibold text-[#C75560]"
                      >
                        {companyData.moreInfo.website}
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </section>
              </>
            ) : (
              <section className="panel">
                <Heading
                  action={
                    !readOnly && (
                      <Link
                        to="/recruiter/post-job"
                        className="rounded-full bg-[#C75560] px-4 py-2 text-xs font-bold text-white"
                      >
                        Post a job
                      </Link>
                    )
                  }
                >
                  Open roles at {companyData.name}
                </Heading>
                {jobsLoading ? (
                  <EmptyState text="Loading your company jobs..." />
                ) : jobsError ? (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-700">
                    {jobsError}
                  </p>
                ) : companyData.jobs.length ? (
                  <div className="company-job-grid">
                    {visibleCompanyJobs.map((job) => (
                      <CompanyJobCard
                        key={job.id || job.title}
                        job={job}
                        readOnly={readOnly}
                        companyName={companyData.name}
                        companyLogoUrl={companyData.logoUrl}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState text="No active jobs have been posted yet." />
                )}
                {jobsPageCount > 1 && (
                  <div className="company-job-pagination">
                    <button
                      type="button"
                      onClick={() => setJobsPage((page) => Math.max(1, page - 1))}
                      disabled={jobsPage === 1}
                      aria-label="Previous jobs page"
                    >
                      <ArrowLeft size={14} /> Previous
                    </button>
                    <span>Page {jobsPage} of {jobsPageCount}</span>
                    <button
                      type="button"
                      onClick={() => setJobsPage((page) => Math.min(jobsPageCount, page + 1))}
                      disabled={jobsPage === jobsPageCount}
                      aria-label="Next jobs page"
                    >
                      Next <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </section>
            )}
            {readOnly && recommendedJobs.length > 0 && (
              <section className="panel">
                <Heading>Jobs you might be interested in</Heading>
                <div className="grid gap-3 sm:grid-cols-2">
                  {recommendedJobs.map((job) => (
                    <JobRow
                      key={`recommended-${job._id || job.id || job.title}`}
                      job={{
                        id: job._id || job.id,
                        title: job.title || "Untitled role",
                        exp: job.experienceLevel || job.experience || "Experience varies",
                        location: job.location || job.workMode || "Location not specified",
                      }}
                      readOnly
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
          <aside className="space-y-7">
            <div className="rounded-2xl bg-[#3A292D] p-5 text-white">
              <small className="text-[#F5C4A7]">MEET THE PEOPLE</small>
              <h2 className="mt-2 text-xl font-bold">
                Find work that feels like yours.
              </h2>
              <p className="mt-2 text-xs leading-5 text-white/70">
                Explore the active roles and verified information shared by this
                company.
              </p>
              <button
                type="button"
                onClick={() => setTab("Jobs")}
                className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-[#F5C4A7]"
              >
                View active roles <ArrowUpRight size={13} />
              </button>
            </div>
            <section className="panel">
              <Heading>Employee speaks</Heading>
              {companyData.ratings.length ? (
                <div className="employee-rating-grid">
                  {companyData.ratings.map(([label, value]) => (
                    <div key={label} className="employee-rating-card">
                      <div className="employee-rating-score">
                        <Stars value={value} small />
                        <strong>{value}</strong>
                      </div>
                      <small>{label}</small>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="No employee ratings have been added yet." />
              )}
            </section>
            <section className="rounded-2xl border border-[#EBC2AE] bg-[#FFF0E8] p-5">
              <div className="flex items-center gap-3">
                {companyData.logoUrl ? (
                  <img
                    src={companyData.logoUrl}
                    alt=""
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-xs font-bold text-[#C75560]">
                    {getCompanyInitials(companyData.name)}
                  </span>
                )}
                <b className="text-xs uppercase tracking-widest text-[#C75560]">
                  Hiring now
                </b>
              </div>
              <h2 className="mt-4 text-2xl font-bold">
                {openingsCount
                  ? `${openingsCount} job ${openingsCount === 1 ? "opening" : "openings"}`
                  : "No current openings"}
              </h2>
              {openingsCount ? (
                <>
                  <div className="mt-4 space-y-3">
                    {companyData.jobs.map((job) => (
                      <JobRow
                        key={job.id || job.title}
                        job={job}
                        readOnly={readOnly}
                      />
                    ))}
                  </div>
                  <Link
                    to={
                      readOnly
                        ? `/candidate/jobs?company=${profile?._id || companyId}`
                        : "/recruiter/jobs"
                    }
                    className="mt-5 flex justify-center rounded-full bg-[#C75560] py-2.5 text-xs font-bold text-white"
                  >
                    View all openings
                  </Link>
                </>
              ) : (
                <p className="mt-2 text-sm text-[#8D6072]">
                  There are no active jobs posted by this company right now.
                </p>
              )}
            </section>
            <section className="panel">
              <Heading>Reviews by job profile</Heading>
              {companyData.reviewProfiles.length ? (
                <div className="space-y-2">
                  {companyData.reviewProfiles.map((review) => (
                    <div
                      key={review.role}
                      className="flex justify-between rounded-lg bg-[#FFF8F2] px-3 py-2.5 text-xs"
                    >
                      <span>
                        <Star
                          size={13}
                          fill="#D28A38"
                          className="mr-1 inline text-[#D28A38]"
                        />
                        {review.score} {review.role}
                      </span>
                      <span>{review.count} reviews</span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="No job-profile reviews have been published yet." />
              )}
            </section>
          </aside>
        </div>
      </main>
      {cropImage && (
        <ImageCropModal
          image={cropImage}
          label={cropImage.label}
          onCancel={() => {
            URL.revokeObjectURL(cropImage.src);
            setCropImage(null);
          }}
          onConfirm={(file) => uploadCompanyImageFile(file, cropImage.type)}
        />
      )}
      <style>{`.panel{border:1px solid #EBC2AE;border-radius:16px;background:#fff;padding:20px}.panel h2{color:#1D181A}.panel p{color:#8D6072}.panel [class*="border-"]{border-color:#EBC2AE}.action-link,.link{font-size:12px;font-weight:700;color:#C75560}.link:hover,.action-link:hover{text-decoration:underline}.panel small{font-size:11px;color:#8D6072;text-transform:uppercase;letter-spacing:.12em}.field{display:flex;flex-direction:column;gap:6px;font-size:12px;font-weight:700;color:#80576A}.field input,.field textarea,.text-input,.number-input{width:100%;border:1px solid #EBC2AE;border-radius:10px;background:#FFFDFB;padding:10px 12px;font-size:13px;font-weight:500;color:#1D181A;outline:none}.field input:focus,.field textarea:focus,.text-input:focus,.number-input:focus{border-color:#C75560;box-shadow:0 0 0 3px #FFF0E8}.edit-group{border:1px solid #F0DCD4;border-radius:12px;background:#FFFDFB;padding:14px}.edit-group-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;font-size:13px;color:#1D181A}.edit-group-head span{font-size:10px;font-weight:500;color:#8D6072}.array-row{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:8px;align-items:center;margin-top:8px}.array-row-wide{grid-template-columns:repeat(3,minmax(0,1fr)) auto}.number-input{max-width:110px}.remove-button{white-space:nowrap;border:1px solid #F2C5BA;border-radius:999px;padding:8px 10px;font-size:11px;font-weight:700;color:#B42318;background:#FFF8F6}.remove-button:hover{background:#FDECEC}.add-button,.upload-link{border:0;background:transparent;padding:0;font-size:11px;font-weight:700;color:#C75560;cursor:pointer}.upload-box{position:relative;display:flex;align-items:center;justify-content:center;min-height:56px;border:1px dashed #EBC2AE;border-radius:10px;color:#80576A;font-size:12px;font-weight:700;cursor:pointer}.upload-box input,.upload-link input{position:absolute;width:1px;height:1px;overflow:hidden;opacity:0}.field-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:8px;font-size:12px;color:#80576A}.field-row .number-input{max-width:90px}@media (max-width:640px){.array-row,.array-row-wide{grid-template-columns:1fr}.number-input{max-width:none}.remove-button{justify-self:start}}
.edit-topbar{position:sticky;top:0;z-index:20;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;border-bottom:1px solid #F0DCD4;background:rgba(255,255,255,.92);backdrop-filter:blur(6px);padding:16px 20px}
@media (min-width:640px){.edit-topbar{padding:18px 28px}}
.required{color:#C75560}
.edit-card{border:1px solid #F0DCD4;border-radius:16px;background:#FFFDFB;overflow:hidden}
.edit-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:14px 16px;border-bottom:1px solid #F3E4DC;background:#FFF8F2}
.edit-card-icon{display:flex;align-items:center;justify-content:center;width:30px;height:30px;flex:none;border-radius:10px;background:#FFF0E8;color:#C75560}
.edit-card-body{padding:16px}
.add-button-solid{display:inline-flex;align-items:center;gap:5px;border:1px solid #F0C9BA;border-radius:999px;background:#FFF0E8;padding:6px 12px;font-size:11px;font-weight:700;color:#C75560;cursor:pointer;white-space:nowrap}
.add-button-solid:hover{background:#FCE3D5}
.add-button-solid input{position:absolute;width:1px;height:1px;overflow:hidden;opacity:0}
.remove-button{display:inline-flex;align-items:center;justify-content:center}
.chip{display:inline-flex;align-items:center;gap:4px;border-radius:999px;background:#F8EEE9;padding:4px 10px;font-size:11px;font-weight:600;color:#80576A}
.company-category-chip{display:inline-flex;align-items:center;border:1px solid #F0C9BA;border-radius:999px;background:#FFF0E8;padding:5px 10px;font-size:11px;font-weight:600;color:#80576A;white-space:nowrap}
.company-header-logo{transition:transform .18s ease}
.image-drop{display:flex;flex-direction:column}
.image-drop-label{margin-bottom:6px;font-size:12px;font-weight:700;color:#80576A}
.image-drop-zone{position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden;border:1.5px dashed #EBC2AE;border-radius:14px;background:#FFF8F2;cursor:pointer}
.image-drop-zone:hover{border-color:#C75560}
.image-drop-square{height:132px;width:132px}
.image-drop-wide{height:132px;width:100%}
.image-drop-zone.has-image{border-style:solid;background:#000}
.image-drop-zone img{height:100%;width:100%;object-fit:cover;opacity:.95}
.image-drop-empty{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:11px;font-weight:700;color:#9B7A83;text-align:center;padding:0 10px}
.image-drop-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(29,24,26,.55);color:#fff;font-size:11px;font-weight:700}
.image-drop-actions{position:absolute;top:8px;right:8px;z-index:2;display:flex;gap:5px}
.profile-image-actions{position:absolute;top:10px;right:10px;z-index:5;display:flex;gap:6px}
.profile-image-actions input{position:absolute;width:1px;height:1px;overflow:hidden;opacity:0}
.profile-image-action{display:flex;align-items:center;justify-content:center;width:30px;height:30px;border:1px solid rgba(255,255,255,.7);border-radius:8px;background:rgba(29,24,26,.72);color:#fff;cursor:pointer}
.profile-image-action:hover{background:#C75560}
.profile-image-action:disabled{cursor:not-allowed;opacity:.45}
.profile-image-delete:hover{background:#B42318}
.image-confirm-backdrop{position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(29,24,26,.48)}
.image-confirm-dialog{width:min(100%,390px);border:1px solid #EBC2AE;border-radius:16px;background:#fff;padding:22px;box-shadow:0 20px 60px rgba(29,24,26,.2)}
.image-confirm-dialog h2{font-size:17px;font-weight:800;color:#1D181A}
.image-confirm-dialog p{margin-top:8px;font-size:13px;line-height:1.5;color:#8D6072}
.image-confirm-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:20px}
.image-confirm-cancel,.image-confirm-remove{border-radius:999px;padding:9px 14px;font-size:12px;font-weight:700;cursor:pointer}
.image-confirm-cancel{border:1px solid #EBC2AE;background:#fff;color:#8D6072}
.image-confirm-remove{border:1px solid #B42318;background:#B42318;color:#fff}
.image-confirm-remove:hover{background:#941F16}
.crop-modal-backdrop{position:fixed;inset:0;z-index:120;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(29,24,26,.72)}
.crop-modal{width:min(100%,760px);border:1px solid #EBC2AE;border-radius:18px;background:#fff;overflow:hidden;box-shadow:0 24px 80px rgba(29,24,26,.28)}
.crop-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:18px 20px;border-bottom:1px solid #F0DCD4;background:#FFF8F2}
.crop-modal-head h2{font-size:17px;font-weight:800;color:#1D181A}
.crop-modal-head p{margin-top:4px;font-size:12px;color:#8D6072}
.crop-close{display:flex;align-items:center;justify-content:center;width:32px;height:32px;border:1px solid #EBC2AE;border-radius:8px;background:#fff;color:#8D6072;cursor:pointer}
.cropper-stage{position:relative;height:min(58vh,480px);min-height:300px;background:#24191C}
.crop-controls{display:flex;align-items:center;gap:18px;padding:14px 20px;border-top:1px solid #F0DCD4;background:#FFFDFB}
.crop-zoom-control{display:flex;align-items:center;gap:8px;flex:1;font-size:11px;font-weight:700;color:#80576A}
.crop-zoom-control input{width:min(100%,300px);accent-color:#C75560}
.crop-rotate{display:inline-flex;align-items:center;gap:5px;border:1px solid #EBC2AE;border-radius:999px;background:#fff;padding:8px 12px;font-size:11px;font-weight:700;color:#80576A;cursor:pointer}
.crop-modal-actions{display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;background:#FFFDFB}
.crop-use-button{border-color:#C75560;background:#C75560}
.crop-use-button:disabled{cursor:not-allowed;opacity:.55}
@media (max-width:640px){.crop-modal-backdrop{padding:0}.crop-modal{width:100%;height:100%;border:0;border-radius:0}.cropper-stage{height:calc(100vh - 210px);min-height:260px}.crop-controls{flex-wrap:wrap}.crop-zoom-control{min-width:100%}.crop-modal-actions{padding-bottom:calc(14px + env(safe-area-inset-bottom))}}
.image-drop-action{display:flex;align-items:center;justify-content:center;width:28px;height:28px;border:1px solid rgba(255,255,255,.7);border-radius:8px;background:rgba(29,24,26,.72);color:#fff;cursor:pointer}
.image-drop-action:hover{background:#C75560}
.image-drop-delete:hover{background:#B42318}
.image-drop-remove{position:absolute;top:6px;right:6px;display:flex;align-items:center;justify-content:center;height:22px;width:22px;border-radius:999px;border:none;background:rgba(29,24,26,.65);color:#fff;cursor:pointer}
.image-drop-remove:hover{background:#C75560}
.image-drop-zone input[type="file"]{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer}
.image-drop-hint{margin-top:6px;font-size:10px;color:#9B7A83}
.gallery-grid{display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(140px,1fr))}
.gallery-edit-tile{width:220px;flex:none}
.gallery-thumb{position:relative;height:96px;border-radius:12px;overflow:hidden;background:#FFF0E8;border:1px solid #F0DCD4}
.gallery-thumb img{height:100%;width:100%;object-fit:cover}
.gallery-thumb-empty{display:flex;height:100%;width:100%;align-items:center;justify-content:center;color:#C7A4AE}
.icon-select{display:flex;flex-wrap:wrap;gap:4px}
.icon-select-option{display:flex;align-items:center;justify-content:center;gap:4px;height:30px;padding:0 8px;flex:none;border-radius:9px;border:1px solid #EBC2AE;background:#fff;color:#9B7A83;cursor:pointer;font-size:10px;font-weight:700}
.icon-select-option.active{border-color:#C75560;background:#FFF0E8;color:#C75560}
.benefit-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(180px,260px) auto;gap:10px;align-items:end}
.benefit-icon-picker{grid-column:1/-1;display:flex;flex-direction:column;gap:5px}
.benefit-input-field{display:flex;min-width:0;flex-direction:column;gap:5px}
.benefit-input-label{font-size:10px;font-weight:700;color:#80576A;text-transform:uppercase;letter-spacing:.08em}
.benefit-input-field .number-input{max-width:none}
@media (max-width:640px){.benefit-row{grid-template-columns:1fr}}
.salary-card{border:1px solid #F0DCD4;border-radius:12px;background:#fff;padding:12px}
.salary-card-top{display:grid;grid-template-columns:repeat(3,minmax(0,1fr)) auto;gap:8px;align-items:center}
.salary-card-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:10px}
.mini-field{display:flex;flex-direction:column;gap:4px;font-size:10px;font-weight:700;color:#9B7A83;text-transform:uppercase;letter-spacing:.06em}
.mini-field .number-input{max-width:none}
.employee-rating-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.employee-rating-card{min-width:0;border:1px solid #F3E4DC;border-radius:10px;background:#FFF8F2;padding:9px 10px}
.employee-rating-score{display:flex;align-items:center;justify-content:space-between;gap:6px}
.employee-rating-score strong{font-size:14px;line-height:1;color:#A24F63}
.employee-rating-card small{display:block;margin-top:6px;font-size:9px;line-height:1.35;letter-spacing:.1em;white-space:normal}
.company-job-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.company-job-card{border:1px solid #F0DCD4;border-radius:14px;background:#FFFDFB;padding:14px;box-shadow:0 4px 14px rgba(110,67,67,.04);transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}
.company-job-card:hover{transform:translateY(-2px);border-color:#D9A3A0;box-shadow:0 10px 24px rgba(110,67,67,.1)}
.company-job-logo-fallback{display:flex;height:44px;width:44px;flex:none;align-items:center;justify-content:center;border:1px solid #F0DCD4;border-radius:10px;background:#FFF0E8;color:#C75560}
.company-job-title{display:block;overflow:hidden;font-size:15px;font-weight:800;line-height:1.3;color:#1D181A;text-overflow:ellipsis;white-space:nowrap}
.company-job-title:hover{color:#C75560;text-decoration:underline}
.company-job-meta{display:flex;flex-wrap:wrap;gap:8px 12px;margin-top:14px;font-size:11px;color:#8D6072}
.company-job-meta span{display:inline-flex;align-items:center;gap:4px}
.company-job-meta svg{color:#C75560}
.company-job-skill{border-radius:6px;background:#F8EEE9;padding:4px 7px;font-size:10px;font-weight:700;color:#80576A}
.company-job-description{display:-webkit-box;overflow:hidden;margin-top:11px;font-size:11px;line-height:1.55;color:#8D6072;-webkit-box-orient:vertical;-webkit-line-clamp:2}
.company-job-action{display:inline-flex;margin-top:14px;border-radius:8px;background:#C75560;padding:8px 12px;font-size:11px;font-weight:800;color:#fff}
.company-job-action:hover{background:#A94658}
.company-job-pagination{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:18px;font-size:11px;font-weight:700;color:#8D6072}
.company-job-pagination button{display:inline-flex;align-items:center;gap:5px;border:1px solid #EBC2AE;border-radius:999px;background:#fff;padding:7px 11px;color:#C75560;cursor:pointer}
.company-job-pagination button:hover:not(:disabled){background:#FFF0E8}
.company-job-pagination button:disabled{cursor:not-allowed;opacity:.45}
@media (max-width:768px){.company-job-grid{grid-template-columns:1fr}}
@media (max-width:768px){.salary-card-top{grid-template-columns:1fr}.salary-card-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
`}</style>
    </div>
  );
}