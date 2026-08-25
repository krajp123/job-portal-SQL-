import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import axiosInstance from '../../api/axiosInstance';
import RecruiterNavbar from '../../components/RecruiterNavbar';
import CandidateNavbar from '../../components/CandidateNavbar';
import { FONT_DISPLAY } from '../../theme';
import {
  Building2,
  Save,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Mail,
  FileText,
  Landmark,
  ShieldCheck,
  CalendarClock,
  Calendar,
  MapPin,
  Edit2,
  X,
  Plus,
  Trash2,
  Briefcase,
  Users,
  Sparkles,
  HeartHandshake,
  Clock,
  ArrowUpRight,
  Tag as TagIcon,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Small controlled input that keeps caret position while typing      */
/* ------------------------------------------------------------------ */
function InfoInput({ value, onChange, placeholder, className = '' }) {
  const inputRef = useRef(null);

  return (
    <input
      ref={inputRef}
      value={value ?? ''}
      onChange={(e) => {
        onChange(e.target.value);
        requestAnimationFrame(() => {
          const node = inputRef.current;
          if (!node) return;
          node.focus();
          const end = node.value.length;
          node.setSelectionRange(end, end);
        });
      }}
      placeholder={placeholder}
      autoComplete="off"
      spellCheck={false}
      className={`w-full min-w-0 border-b border-dashed border-slate-300 bg-transparent pb-0.5 text-sm font-medium text-slate-900 outline-none focus:border-[#C75560] ${className}`}
    />
  );
}

function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.crossOrigin = 'anonymous';
    image.src = url;
  });
}

async function getCroppedImage(imageUrl, pixelCrop) {
  const image = await createImage(imageUrl);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  context.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not adjust image'))), 'image/jpeg', 0.92);
  });
}

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'why-join-us', label: 'Why Join Us' },
  { key: 'diversity', label: 'Diversity' },
  { key: 'jobs', label: 'Jobs' },
];

const HIGHLIGHT_ICONS = [Sparkles, Users, HeartHandshake, Briefcase, ShieldCheck, Globe];

/* Placeholder content shown until the recruiter fills their own copy in */
const DEFAULT_WHY_JOIN_US = [
  {
    title: 'Work that actually moves the needle',
    description: 'Every hire here owns real outcomes from day one — not busywork. You will ship things that customers and colleagues notice.',
  },
  {
    title: 'Growth that keeps pace with you',
    description: 'Clear career ladders, mentorship from senior team members, and budget set aside for courses, certifications, and conferences.',
  },
  {
    title: 'A culture built on trust',
    description: 'Flexible hours, hybrid-friendly teams, and managers who judge output over hours logged at a desk.',
  },
  {
    title: 'Benefits that cover the essentials',
    description: 'Health coverage for you and your family, paid leave that people actually take, and performance-linked rewards.',
  },
];

const DEFAULT_DIVERSITY = [
  {
    title: 'Equal opportunity, always',
    description: 'Hiring decisions are made on skill and potential — regardless of gender, background, religion, disability, or orientation.',
  },
  {
    title: 'Representation in leadership',
    description: 'We track and invest in building a leadership bench that reflects the diversity of the teams we hire.',
  },
  {
    title: 'An accessible workplace',
    description: 'Our offices and hiring process are designed to be accessible, and we accommodate candidates who need it.',
  },
  {
    title: 'Zero tolerance for harassment',
    description: 'A dedicated POSH policy and grievance cell so every employee can raise concerns safely and confidentially.',
  },
];

export default function RecruiterCompanyProfile({ readOnly = false }) {
  const { companyId } = useParams();
  const tabStorageKey = `company-profile-tab-${companyId || 'me'}`;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem(tabStorageKey) || 'overview');

  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyGst, setCompanyGst] = useState('');
  const [companyCin, setCompanyCin] = useState('');
  const [companyDetails, setCompanyDetails] = useState('');
  const [companyLogoUrl, setCompanyLogoUrl] = useState('');
  const [companyLogoError, setCompanyLogoError] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [selectedLogo, setSelectedLogo] = useState(null);
  const [selectedCover, setSelectedCover] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageMenu, setImageMenu] = useState(null);
  const [cropTarget, setCropTarget] = useState(null);
  const [cropPreview, setCropPreview] = useState('');
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [cropZoom, setCropZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [coverAspect, setCoverAspect] = useState(4.35);
  const coverRef = useRef(null);
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [companyType, setCompanyType] = useState('');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState([]);
  const [tagDraft, setTagDraft] = useState('');
  const [whyJoinUs, setWhyJoinUs] = useState([]);
  const [diversityHighlights, setDiversityHighlights] = useState([]);

  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState('');
  const [jobsLoaded, setJobsLoaded] = useState(false);

  const canEdit = !readOnly;

  function selectTab(tabKey) {
    setActiveTab(tabKey);
    sessionStorage.setItem(tabStorageKey, tabKey);
  }

  useEffect(() => {
    async function fetchProfile() {
      try {
        const endpoint = readOnly && companyId
          ? `/recruiter/${companyId}/public-profile?allJobs=true`
          : '/recruiter/me/profile';
        const { data } = await axiosInstance.get(endpoint);
        setProfile(data);
        resetFields(data);
        if (readOnly) {
          setJobs(Array.isArray(data?.jobs) ? data.jobs : []);
          setJobsLoaded(true);
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Could not load profile.');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [readOnly, companyId]);

  function resetFields(data) {
    setCompanyName(data?.companyName || '');
    setCompanyWebsite(data?.companyWebsite || '');
    setCompanyEmail(data?.companyEmail || '');
    setCompanyGst(data?.companyGst || '');
    setCompanyCin(data?.companyCin || '');
    setCompanyDetails(data?.companyDetails || data?.companyDescription || data?.bio || '');
    setCompanyLogoUrl(data?.companyLogoUrl || '');
    setCompanyLogoError(false);
    setCoverImageUrl(data?.coverImageUrl || '');
    setIndustry(data?.industry || '');
    setCompanySize(data?.companySize || '');
    setCompanyType(data?.companyType || '');
    setLocation(data?.location || '');
    setTags(Array.isArray(data?.tags) ? data.tags : []);
    setWhyJoinUs(Array.isArray(data?.whyJoinUs) && data.whyJoinUs.length ? data.whyJoinUs : DEFAULT_WHY_JOIN_US);
    setDiversityHighlights(
      Array.isArray(data?.diversityHighlights) && data.diversityHighlights.length ? data.diversityHighlights : DEFAULT_DIVERSITY
    );
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setStatusMessage('');
    try {
      let nextLogoUrl = companyLogoUrl.trim();
      let nextCoverUrl = coverImageUrl.trim();
      for (const image of [
        { file: selectedLogo, type: 'logo', setUrl: setCompanyLogoUrl },
        { file: selectedCover, type: 'cover', setUrl: setCoverImageUrl },
      ]) {
        if (!image.file) continue;
        setUploadingImage(true);
        const formData = new FormData();
        formData.append('companyImage', image.file);
        formData.append('imageType', image.type);
        const { data } = await axiosInstance.post('/recruiter/me/upload-company-image', formData);
        const uploadedUrl = data?.[image.type === 'logo' ? 'companyLogoUrl' : 'coverImageUrl'];
        if (image.type === 'logo') nextLogoUrl = uploadedUrl || nextLogoUrl;
        else nextCoverUrl = uploadedUrl || nextCoverUrl;
        image.setUrl(uploadedUrl || '');
      }
      setUploadingImage(false);
      const payload = {
        companyName: companyName.trim(),
        companyWebsite: companyWebsite.trim(),
        companyEmail: companyEmail.trim(),
        companyGst: companyGst.trim(),
        companyCin: companyCin.trim(),
        companyDetails: companyDetails.trim(),
        companyLogoUrl: nextLogoUrl,
        coverImageUrl: nextCoverUrl,
        industry: industry.trim(),
        companySize: companySize.trim(),
        companyType: companyType.trim(),
        location: location.trim(),
        tags,
        whyJoinUs,
        diversityHighlights,
      };
      const { data } = await axiosInstance.put('/recruiter/me/profile', payload);
      const savedProfile = {
        ...data,
        companyLogoUrl: data?.companyLogoUrl || nextLogoUrl,
        coverImageUrl: data?.coverImageUrl || nextCoverUrl,
      };
      setProfile(savedProfile);
      resetFields(savedProfile);
      setSelectedLogo(null);
      setSelectedCover(null);
      setEditMode(false);
      setStatusMessage('Company profile updated successfully.');
    } catch (err) {
      setUploadingImage(false);
      setError(err.response?.data?.error || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!statusMessage) return;
    const timer = setTimeout(() => setStatusMessage(''), 2500);
    return () => clearTimeout(timer);
  }, [statusMessage]);

  function handleCancel() {
    if (profile) {
      resetFields(profile);
    }
    setError('');
    setStatusMessage('');
    setSelectedLogo(null);
    setSelectedCover(null);
    setEditMode(false);
  }

  function selectCompanyImage(event, type) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setEditMode(true);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please choose a JPG, PNG, or WEBP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB.');
      return;
    }
    setError('');
    const previewUrl = URL.createObjectURL(file);
    openCropper(type, previewUrl, file);
  }

  function openCropper(type, imageUrl, file = null) {
    setEditMode(true);
    setImageMenu(null);
    if (type === 'cover' && coverRef.current) {
      const { width, height } = coverRef.current.getBoundingClientRect();
      if (width && height) setCoverAspect(width / height);
    }
    setCropTarget({ type, file });
    setCropPreview(imageUrl);
    setCropPosition({ x: 0, y: 0 });
    setCropZoom(1);
    setCroppedAreaPixels(null);
  }

  const onCropComplete = useCallback((_, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  async function applyCrop() {
    if (!cropTarget || !cropPreview || !croppedAreaPixels) return;
    try {
      const blob = await getCroppedImage(cropPreview, croppedAreaPixels);
      const file = new File([blob], cropTarget.file?.name || `${cropTarget.type}-photo.jpg`, { type: 'image/jpeg' });
      const previewUrl = URL.createObjectURL(blob);
      if (cropTarget.type === 'logo') {
        setSelectedLogo(file);
        setCompanyLogoUrl(previewUrl);
        setCompanyLogoError(false);
      } else {
        setSelectedCover(file);
        setCoverImageUrl(previewUrl);
      }
      closeCropper();
    } catch (err) {
      setError(err.message || 'Could not adjust image.');
    }
  }

  function closeCropper() {
    setCropTarget(null);
    setCropPreview('');
    setCroppedAreaPixels(null);
  }

  function removeCompanyImage(type) {
    setEditMode(true);
    setImageMenu(null);
    if (type === 'logo') {
      setSelectedLogo(null);
      setCompanyLogoUrl('');
      setCompanyLogoError(false);
    } else {
      setSelectedCover(null);
      setCoverImageUrl('');
    }
  }

  async function fetchJobs() {
    if (readOnly) return;
    setJobsLoading(true);
    setJobsError('');
    try {
      const { data } = await axiosInstance.get('/jobs/mine/list');
      const list = Array.isArray(data) ? data : data?.jobs || [];
      setJobs(list);
    } catch (err) {
      setJobsError(err.response?.data?.error || 'Could not load jobs posted by your company.');
    } finally {
      setJobsLoading(false);
      setJobsLoaded(true);
    }
  }

  useEffect(() => {
    if (activeTab === 'jobs' && !jobsLoaded) {
      fetchJobs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  function addTag() {
    const value = tagDraft.trim();
    if (!value || tags.includes(value)) {
      setTagDraft('');
      return;
    }
    setTags((prev) => [...prev, value]);
    setTagDraft('');
  }

  function removeTag(index) {
    setTags((prev) => prev.filter((_, i) => i !== index));
  }

  function updateHighlight(list, setList, index, field, value) {
    setList(list.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  function addHighlight(setList) {
    setList((prev) => [...prev, { title: '', description: '' }]);
  }

  function removeHighlight(setList, index) {
    setList((prev) => prev.filter((_, i) => i !== index));
  }

  const isSuspended = profile?.accountStatus === 'suspended';
  const registeredLabel = profile?.registeredAt ? new Date(profile.registeredAt).toLocaleDateString() : '—';
  const renewalLabel = profile?.renewalDueDate ? new Date(profile.renewalDueDate).toLocaleDateString() : '—';
  const lastUpdated = profile?.updatedAt || profile?.modifiedAt || profile?.registeredAt;
  const updatedLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
  const completionPercentage = Math.min(
    100,
    Math.round(
      ([companyName, companyWebsite, companyEmail, companyDetails, companyGst, companyCin, companyLogoUrl, coverImageUrl, industry, companySize, companyType, location, tags.length > 0].filter(
        Boolean
      ).length /
        13) *
        100
    )
  );

  if (loading) {
    return (
      <div className="portal-theme min-h-screen bg-[#FFF8F2]" style={{ fontFamily: FONT_DISPLAY }}>
        {canEdit ? <RecruiterNavbar /> : <CandidateNavbar />}
        <div className="mx-auto max-w-5xl px-4 py-16 text-center text-sm text-slate-500">Loading company profile…</div>
      </div>
    );
  }

  return (
    <div className="portal-theme min-h-screen bg-[#FFF8F2] text-[#1D181A]" style={{ fontFamily: FONT_DISPLAY }}>
      {canEdit ? <RecruiterNavbar /> : <CandidateNavbar />}

      {statusMessage && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="pointer-events-auto flex items-center gap-2.5 rounded-2xl border border-emerald-100 bg-white px-6 py-4 text-sm font-semibold text-emerald-800 shadow-xl shadow-emerald-900/10 animate-in fade-in zoom-in-95 duration-200">
            <CheckCircle2 size={18} className="shrink-0 text-emerald-500" /> {statusMessage}
          </div>
        </div>
      )}

      {cropTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
          <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1D181A]">Adjust photo</h2>
              <button type="button" onClick={closeCropper} title="Close" aria-label="Close" className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className={`relative mt-4 h-72 w-full overflow-hidden rounded-2xl bg-slate-100 ${cropTarget.type === 'logo' ? 'sm:h-80' : ''}`}>
              <Cropper
                image={cropPreview}
                crop={cropPosition}
                zoom={cropZoom}
                aspect={cropTarget.type === 'logo' ? 1 : coverAspect}
                cropShape={cropTarget.type === 'logo' ? 'round' : 'rect'}
                onCropChange={setCropPosition}
                onZoomChange={setCropZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <label className="mt-4 block text-xs font-semibold text-slate-600">
              Zoom
              <input type="range" min="1" max="3" step="0.01" value={cropZoom} onChange={(event) => setCropZoom(Number(event.target.value))} className="mt-2 w-full" />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={closeCropper} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={applyCrop} className="rounded-full bg-[#C75560] px-4 py-2 text-xs font-semibold text-white hover:bg-[#B44852]">Apply</button>
            </div>
          </div>
        </div>
      )}

      <main className="recruiter-page mx-auto w-full max-w-5xl px-4 py-4 sm:px-6 sm:py-5">
        {canEdit && (
          <div className="mb-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C75560]">Recruiter workspace</p>
            <h1 className="mt-2 text-3xl font-bold text-[#1D181A]">Company profile</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B7280]">
              This is exactly what candidates see. Keep your branding, story, and open roles current.
            </p>
          </div>
        )}

        {/* ---------------------------- BANNER + TABS ---------------------------- */}
        <section className="overflow-hidden rounded-lg border border-[#F3E4DC] bg-white shadow-sm shadow-slate-200/40">
          {/* Cover */}
          <div ref={coverRef} className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-[#1D181A] via-[#3A2A2E] to-[#C75560] sm:h-40">
            {coverImageUrl && (
              <img src={coverImageUrl} alt="Company cover" className="absolute inset-0 h-full w-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

            {canEdit && (
              <div className="absolute bottom-4 right-4">
                {!coverImageUrl ? (
                  <label className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/90 text-[#1D181A] shadow-sm backdrop-blur hover:bg-white" title="Upload cover photo" aria-label="Upload cover photo">
                    <Camera size={16} />
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => selectCompanyImage(event, 'cover')} />
                  </label>
                ) : (
                  <div className="relative">
                    <button type="button" onClick={() => setImageMenu(imageMenu === 'cover' ? null : 'cover')} title="Manage cover photo" aria-label="Manage cover photo" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#1D181A] shadow-sm backdrop-blur hover:bg-white"><Camera size={16} /></button>
                    {imageMenu === 'cover' && (
                      <div className="absolute bottom-11 right-0 z-10 w-36 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                        <label className="block cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-[#FFF1EB]">Update photo<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => selectCompanyImage(event, 'cover')} /></label>
                        <button type="button" onClick={() => removeCompanyImage('cover')} className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50">Remove photo</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Header row: logo, name, actions */}
          <div className="px-4 pb-4 sm:px-6">
            <div className="-mt-10 flex flex-col gap-3 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-3">
                <div className="relative shrink-0">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white shadow-md sm:h-24 sm:w-24">
                    {companyLogoUrl && !companyLogoError ? (
                      <img
                        src={companyLogoUrl}
                        alt="Company logo"
                        onError={() => setCompanyLogoError(true)}
                        className="h-full w-full rounded-full object-contain bg-white p-1.5"
                      />
                    ) : (
                      <Building2 size={36} className="text-slate-400" />
                    )}
                  </div>
                    {canEdit && (
                      <div className="absolute bottom-1 right-1">
                        {!companyLogoUrl ? (
                          <label className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-[#C75560] shadow-sm hover:bg-[#FFF1EB]" title="Upload company logo" aria-label="Upload company logo">
                            <Camera size={14} />
                            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => selectCompanyImage(event, 'logo')} />
                          </label>
                        ) : (
                          <div className="relative">
                            <button type="button" onClick={() => setImageMenu(imageMenu === 'logo' ? null : 'logo')} title="Manage company logo" aria-label="Manage company logo" className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-[#C75560] shadow-sm hover:bg-[#FFF1EB]"><Camera size={14} /></button>
                            {imageMenu === 'logo' && (
                              <div className="absolute bottom-10 right-0 z-10 w-36 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                                <label className="block cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-[#FFF1EB]">Update photo<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => selectCompanyImage(event, 'logo')} /></label>
                                <button type="button" onClick={() => removeCompanyImage('logo')} className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50">Remove photo</button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </div>

              <div className="flex items-center gap-2 pb-1">
                <span className="whitespace-nowrap rounded-full border border-slate-200 bg-[#FFF1EB] px-3 py-1 text-xs font-bold text-[#C75560]">
                  {completionPercentage}% complete
                </span>
                {canEdit && editMode && (
                  <>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={saving}
                      aria-label="Cancel"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-60"
                    >
                      <X size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-1 rounded-full bg-[#C75560] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#B44852] disabled:opacity-60"
                    >
                      <Save size={12} /> {saving ? 'Saving...' : 'Save'}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {editMode && canEdit ? (
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Company name"
                  className="min-w-0 flex-1 border-b border-dashed border-slate-300 bg-transparent pb-1 text-2xl font-bold tracking-tight text-[#1D181A] outline-none focus:border-[#C75560] sm:text-3xl"
                />
              ) : (
                <>
                  <h2 className="text-xl font-bold tracking-tight text-[#1D181A] sm:text-2xl">{companyName || 'Company name'}</h2>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setEditMode(true)}
                      aria-label="Edit company name"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFF1EB] text-[#C75560] transition hover:bg-[#F7D9D0]"
                    >
                      <Edit2 size={13} />
                    </button>
                  )}
                  {!isSuspended && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                      <ShieldCheck size={13} /> Verified employer
                    </span>
                  )}
                </>
              )}
            </div>

            <p className="mt-1 text-xs text-slate-500">
              {location || 'Location not added'} {industry ? `· ${industry}` : ''}
            </p>

            {/* Tags */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {tags.map((tag, i) => (
                <span
                  key={`${tag}-${i}`}
                  className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                >
                  {tag}
                  {editMode && canEdit && (
                    <button type="button" onClick={() => removeTag(i)} aria-label={`Remove ${tag}`} className="text-slate-400 hover:text-rose-500">
                      <X size={11} />
                    </button>
                  )}
                </span>
              ))}
              {tags.length === 0 && !(editMode && canEdit) && <span className="text-xs text-slate-400">No tags added yet</span>}
              {editMode && canEdit && (
                <span className="flex items-center gap-1">
                  <TagIcon size={13} className="text-slate-400" />
                  <input
                    value={tagDraft}
                    onChange={(e) => setTagDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Add a tag, e.g. Foreign MNC"
                    className="w-40 rounded-full border border-dashed border-slate-300 bg-transparent px-2 py-1 text-xs text-slate-700 outline-none focus:border-[#C75560]"
                  />
                  <button type="button" onClick={addTag} className="text-[#C75560] hover:text-[#B44852]">
                    <Plus size={14} />
                  </button>
                </span>
              )}
            </div>

            {/* Tabs */}
            <div className="mt-4 flex gap-1.5 overflow-x-auto border-t border-slate-100 pt-2.5">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => selectTab(tab.key)}
                  className={`shrink-0 rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
                    activeTab === tab.key
                      ? 'border-[#F2C5BA] bg-[#FFF1EB] text-[#C75560] shadow-sm'
                      : 'border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-[#1D181A]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        {/* ---------------------------- OVERVIEW TAB ---------------------------- */}
        {activeTab === 'overview' && (
          <div className="border-t border-slate-100 px-4 py-5 sm:px-6 sm:py-6">
            <p className="mb-1 text-xs text-slate-500">
              Profile last updated - <span className="font-semibold text-slate-800">{updatedLabel}</span>
            </p>

            <div className="my-4 border-t border-slate-100" />

            <div className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-xs">
                <Globe size={16} className="shrink-0 text-slate-400" />
                {editMode && canEdit ? (
                  <InfoInput value={companyWebsite} onChange={setCompanyWebsite} placeholder="https://acmetalent.com" />
                ) : (
                  <span className={companyWebsite ? 'font-medium text-slate-900' : 'text-slate-400'}>
                    {companyWebsite || 'No website added yet'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs">
                <Mail size={16} className="shrink-0 text-slate-400" />
                {editMode && canEdit ? (
                  <InfoInput value={companyEmail} onChange={setCompanyEmail} placeholder="hiring@acmetalent.com" />
                ) : (
                  <>
                    <span className={companyEmail ? 'font-medium text-slate-900' : 'text-slate-400'}>
                      {companyEmail || 'No email on file'}
                    </span>
                    {companyEmail && <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />}
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs">
                <FileText size={16} className="shrink-0 text-slate-400" />
                {editMode && canEdit ? (
                  <InfoInput value={companyGst} onChange={setCompanyGst} placeholder="GST number" />
                ) : (
                  <span className={companyGst ? 'font-medium text-slate-900' : 'text-slate-400'}>{companyGst || 'GST not provided'}</span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs">
                <Landmark size={16} className="shrink-0 text-slate-400" />
                {editMode && canEdit ? (
                  <InfoInput value={companyCin} onChange={setCompanyCin} placeholder="CIN" />
                ) : (
                  <span className={companyCin ? 'font-medium text-slate-900' : 'text-slate-400'}>{companyCin || 'CIN not provided'}</span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs">
                <Building2 size={16} className="shrink-0 text-slate-400" />
                {editMode && canEdit ? (
                  <InfoInput value={industry} onChange={setIndustry} placeholder="Industry" />
                ) : (
                  <span className={industry ? 'font-medium text-slate-900' : 'text-slate-400'}>{industry || 'Industry not provided'}</span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs">
                <Landmark size={16} className="shrink-0 text-slate-400" />
                {editMode && canEdit ? (
                  <InfoInput value={companySize} onChange={setCompanySize} placeholder="Company size" />
                ) : (
                  <span className={companySize ? 'font-medium text-slate-900' : 'text-slate-400'}>{companySize || 'Size not provided'}</span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs">
                <ShieldCheck size={16} className="shrink-0 text-slate-400" />
                {editMode && canEdit ? (
                  <InfoInput value={companyType} onChange={setCompanyType} placeholder="Company type" />
                ) : (
                  <span className={companyType ? 'font-medium text-slate-900' : 'text-slate-400'}>{companyType || 'Type not provided'}</span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs">
                <MapPin size={16} className="shrink-0 text-slate-400" />
                {editMode && canEdit ? (
                  <InfoInput value={location} onChange={setLocation} placeholder="Location" />
                ) : (
                  <span className={location ? 'font-medium text-slate-900' : 'text-slate-400'}>{location || 'Location not provided'}</span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs">
                <ShieldCheck size={16} className="shrink-0 text-slate-400" />
                <span className={`font-semibold ${isSuspended ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {isSuspended ? 'Suspended' : 'Active'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <Calendar size={16} className="shrink-0 text-slate-400" />
                <span className="text-slate-700">Registered {registeredLabel}</span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <CalendarClock size={16} className="shrink-0 text-[#C75560]" />
                <span className="font-semibold text-[#C75560]">Renewal due {renewalLabel}</span>
              </div>
            </div>

            <div className="my-4 border-t border-slate-100" />

            {editMode && canEdit ? (
              <div>
                <textarea
                  value={companyDetails}
                  onChange={(e) => setCompanyDetails(e.target.value)}
                  placeholder="Write a short summary that candidates will see when browsing your jobs."
                  rows={5}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-[#1D181A] outline-none transition focus:border-[#C75560] focus:bg-white"
                />
                <p className="mt-2 text-right text-xs text-slate-400">{companyDetails.length} characters</p>
              </div>
            ) : (
              <p className="text-xs leading-6 text-slate-700">
                {companyDetails || <span className="text-slate-400">No description added yet. Click edit to share your company story.</span>}
              </p>
            )}
          </div>
        )}
        {/* ---------------------------- WHY JOIN US TAB ---------------------------- */}
        {activeTab === 'why-join-us' && (
          <div className="border-t border-slate-100 px-4 py-5 sm:px-6 sm:py-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1D181A]">Why join {companyName || 'us'}?</h3>
              {editMode && canEdit && (
                <button
                  type="button"
                  onClick={() => addHighlight(setWhyJoinUs)}
                  className="flex items-center gap-1 rounded-full border border-dashed border-[#C75560] px-3 py-1.5 text-xs font-semibold text-[#C75560] hover:bg-[#FFF1EB]"
                >
                  <Plus size={13} /> Add point
                </button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {whyJoinUs.map((item, i) => {
                const Icon = HIGHLIGHT_ICONS[i % HIGHLIGHT_ICONS.length];
                return (
                  <div key={i} className="relative rounded-lg border border-slate-100 bg-[#FFFDFB] p-3">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF1EB] text-[#C75560]">
                      <Icon size={17} />
                    </div>
                    {editMode && canEdit ? (
                      <>
                        <button
                          type="button"
                          onClick={() => removeHighlight(setWhyJoinUs, i)}
                          aria-label="Remove point"
                          className="absolute right-3 top-3 text-slate-300 hover:text-rose-500"
                        >
                          <Trash2 size={14} />
                        </button>
                        <input
                          value={item.title}
                          onChange={(e) => updateHighlight(whyJoinUs, setWhyJoinUs, i, 'title', e.target.value)}
                          placeholder="Title"
                          className="mb-2 w-full border-b border-dashed border-slate-300 bg-transparent pb-1 text-sm font-bold text-[#1D181A] outline-none focus:border-[#C75560]"
                        />
                        <textarea
                          value={item.description}
                          onChange={(e) => updateHighlight(whyJoinUs, setWhyJoinUs, i, 'description', e.target.value)}
                          placeholder="Description"
                          rows={3}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-700 outline-none focus:border-[#C75560]"
                        />
                      </>
                    ) : (
                      <>
                        <p className="mb-1.5 text-sm font-bold text-[#1D181A]">{item.title}</p>
                        <p className="text-sm leading-6 text-slate-600">{item.description}</p>
                      </>
                    )}
                  </div>
                );
              })}
              {whyJoinUs.length === 0 && <p className="text-sm text-slate-400">Nothing added yet.</p>}
            </div>
          </div>
        )}

        {/* ---------------------------- DIVERSITY TAB ---------------------------- */}
        {activeTab === 'diversity' && (
          <div className="border-t border-slate-100 px-4 py-5 sm:px-6 sm:py-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1D181A]">Diversity &amp; inclusion</h3>
              {editMode && canEdit && (
                <button
                  type="button"
                  onClick={() => addHighlight(setDiversityHighlights)}
                  className="flex items-center gap-1 rounded-full border border-dashed border-[#C75560] px-3 py-1.5 text-xs font-semibold text-[#C75560] hover:bg-[#FFF1EB]"
                >
                  <Plus size={13} /> Add point
                </button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {diversityHighlights.map((item, i) => {
                const Icon = HIGHLIGHT_ICONS[(i + 2) % HIGHLIGHT_ICONS.length];
                return (
                  <div key={i} className="relative rounded-lg border border-slate-100 bg-[#FFFDFB] p-3">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF1EB] text-[#C75560]">
                      <Icon size={17} />
                    </div>
                    {editMode && canEdit ? (
                      <>
                        <button
                          type="button"
                          onClick={() => removeHighlight(setDiversityHighlights, i)}
                          aria-label="Remove point"
                          className="absolute right-3 top-3 text-slate-300 hover:text-rose-500"
                        >
                          <Trash2 size={14} />
                        </button>
                        <input
                          value={item.title}
                          onChange={(e) => updateHighlight(diversityHighlights, setDiversityHighlights, i, 'title', e.target.value)}
                          placeholder="Title"
                          className="mb-2 w-full border-b border-dashed border-slate-300 bg-transparent pb-1 text-sm font-bold text-[#1D181A] outline-none focus:border-[#C75560]"
                        />
                        <textarea
                          value={item.description}
                          onChange={(e) => updateHighlight(diversityHighlights, setDiversityHighlights, i, 'description', e.target.value)}
                          placeholder="Description"
                          rows={3}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-700 outline-none focus:border-[#C75560]"
                        />
                      </>
                    ) : (
                      <>
                        <p className="mb-1.5 text-sm font-bold text-[#1D181A]">{item.title}</p>
                        <p className="text-sm leading-6 text-slate-600">{item.description}</p>
                      </>
                    )}
                  </div>
                );
              })}
              {diversityHighlights.length === 0 && <p className="text-sm text-slate-400">Nothing added yet.</p>}
            </div>
          </div>
        )}

        {/* ---------------------------- JOBS TAB ---------------------------- */}
        {activeTab === 'jobs' && (
          <div className="border-t border-slate-100 px-4 py-5 sm:px-6 sm:py-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1D181A]">Jobs posted by {companyName || 'this company'}</h3>
              {canEdit && (
                <Link
                  to="/recruiter/jobs"
                  className="flex items-center gap-1 rounded-full bg-[#C75560] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#B44852]"
                >
                  <Plus size={13} /> Post a job
                </Link>
              )}
            </div>

            {jobsLoading && <p className="text-sm text-slate-400">Loading jobs…</p>}
            {!jobsLoading && jobsError && (
              <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-800">
                <AlertTriangle size={16} className="shrink-0" /> {jobsError}
              </div>
            )}
            {!jobsLoading && !jobsError && jobs.length === 0 && (
              <p className="text-sm text-slate-400">No jobs posted yet.</p>
            )}

            {!jobsLoading && !jobsError && jobs.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {jobs.map((job) => (
                  <div key={job._id || job.id} className="group rounded-lg border border-slate-300 bg-[#FFFDFB] p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C75560] hover:shadow-md">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-[#1D181A]">{job.title || 'Untitled role'}</p>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          job.status === 'closed' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600'
                        }`}
                      >
                        {job.status === 'closed' ? 'Closed' : 'Active'}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> {job.location}
                        </span>
                      )}
                      {job.jobType && (
                        <span className="flex items-center gap-1">
                          <Briefcase size={12} /> {job.jobType}
                        </span>
                      )}
                      {job.createdAt && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> Posted {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600">
                        {job.applicantsCount ?? job.applicationsCount ?? 0} applicants
                      </span>
                      <Link
                        to={canEdit ? `/recruiter/jobs?jobId=${job._id || job.id}` : `/candidate/jobs/${job._id || job.id}`}
                        className="flex items-center gap-1 text-xs font-semibold text-[#C75560] transition-colors group-hover:text-[#B44852] hover:underline"
                      >
                        {canEdit ? 'Manage' : 'View'} <ArrowUpRight size={12} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        </section>

        {/* ---------------------------- SUCCESS CHECKLIST (recruiter only) ---------------------------- */}
        {canEdit && (
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
            <p className="text-sm font-semibold text-[#1D181A]">Success checklist</p>
            <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className={`mt-0.5 shrink-0 ${companyDetails ? 'text-[#10B981]' : 'text-slate-300'}`} />
                <p>Complete your company description so candidates understand your business.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className={`mt-0.5 shrink-0 ${companyLogoUrl ? 'text-[#10B981]' : 'text-slate-300'}`} />
                <p>Upload a branded logo and cover image for a consistent first impression.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className={`mt-0.5 shrink-0 ${companyGst && companyCin ? 'text-[#10B981]' : 'text-slate-300'}`} />
                <p>Add your GST and CIN so candidates can verify your registration.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className={`mt-0.5 shrink-0 ${tags.length > 0 ? 'text-[#10B981]' : 'text-slate-300'}`} />
                <p>Add a few tags (industry, MNC status) so your profile is easy to scan.</p>
              </div>
            </div>
          </section>
        )}

        {error && (
          <div className="mt-6 flex items-center gap-2 rounded-3xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-800">
            <AlertTriangle size={16} className="shrink-0" /> {error}
          </div>
        )}
      </main>
    </div>
  );
}