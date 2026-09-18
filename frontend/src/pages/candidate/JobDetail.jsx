import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    BadgeCheck,
    Bookmark,
    BookmarkCheck,
    Briefcase,
    Building2,
    CheckCircle2,
    Clock,
    ExternalLink,
    Flag,
    GraduationCap,
    IndianRupee,
    ListChecks,
    Loader2,
    MapPin,
    UserRoundPlus,
    Sparkles,
    Star,
    TrendingUp,
    Users,
} from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import { FONT_DISPLAY, FONT_BODY, MAROON, MAROON_DARK, ACCENT, BG } from '../../theme';
import CandidateNavbar from '../../components/CandidateNavbar';
import { DynamicApplicationForm } from '../../components/ApplicationForm';

/* ------------------------------------------------------------------ */
/* Description parsing                                                 */
/* ------------------------------------------------------------------ */
// Headings match exactly what PostJob.jsx writes into the combined
// `description` string inside buildPayload() (Job Description, Roles &
// responsibilities, Required qualifications, Preferred qualifications,
// Benefits & perks, Working hours, Growth opportunities, About the company).
const KNOWN_SECTION_HEADERS = [
    'about the company', 'about company', 'company overview', 'about us',
    'job description', 'job summary', 'about the role', 'role overview', 'overview',
    'roles and responsibilities', 'roles & responsibilities', 'responsibilities', 'key responsibilities',
    'additional responsibilities',
    'required qualifications', 'requirements', 'qualifications', 'minimum qualifications',
    'preferred qualifications', 'good to have', 'nice to have', 'bonus points',
    'technical and professional requirements', 'primary skills', 'preferred skills',
    'benefits', 'benefits & perks', 'perks', 'what we offer',
    'working hours', 'growth opportunities',
    'education',
];

const SECTION_ICONS = {
    'about the company': Building2,
    'about company': Building2,
    'company overview': Building2,
    'about us': Building2,
    'job description': Sparkles,
    'job summary': Sparkles,
    'about the role': Sparkles,
    'role overview': Sparkles,
    'overview': Sparkles,
    'roles and responsibilities': ListChecks,
    'roles & responsibilities': ListChecks,
    'responsibilities': ListChecks,
    'key responsibilities': ListChecks,
    'additional responsibilities': ListChecks,
    'required qualifications': GraduationCap,
    'requirements': GraduationCap,
    'qualifications': GraduationCap,
    'minimum qualifications': GraduationCap,
    'preferred qualifications': GraduationCap,
    'good to have': GraduationCap,
    'nice to have': GraduationCap,
    'bonus points': GraduationCap,
    'technical and professional requirements': GraduationCap,
    'primary skills': GraduationCap,
    'preferred skills': GraduationCap,
    'education': GraduationCap,
    'benefits': CheckCircle2,
    'benefits & perks': CheckCircle2,
    'perks': CheckCircle2,
    'what we offer': CheckCircle2,
    'working hours': Clock,
    'growth opportunities': TrendingUp,
};

// Headings whose first line makes a good one-line tagline under the job
// title in the header card (mirrors the "Join Spotify's design team..."
// line in the reference design).
const TAGLINE_HEADERS = ['job description', 'job summary', 'about the role', 'role overview', 'overview'];

function displayExperienceLevel(value) {
    return /^0(?:\s*[-+]\s*0?)?\s*years?/i.test(String(value || '').trim()) ? 'Freshers' : value;
}

function getJobLabel(job) {
    if (job?.category && job.category !== 'student' && job.subCategory) {
        const labelMap = {
            labour: 'Labour',
            mason: 'Mason',
            crane_operator: 'Crane / JCB / Heavy Machinery Operator',
            site_supervisor: 'Site Supervisor',
            retired_army: 'Retired Army',
            retired_police: 'Retired Police',
            ex_navy_air_force: 'Ex-Navy / Air Force',
            sme: 'Subject Matter Expert',
        };

        return labelMap[job.subCategory] || String(job.subCategory).replace(/_/g, ' ');
    }

    return displayExperienceLevel(job?.experienceLevel);
}

function getCategoryDetailHighlights(job) {
    if (!job?.category || job.category === 'student') return [];

    const details = job.categoryDetails || {};
    const orderedKeys = [
        'workersRequired',
        'workLocation',
        'accommodationAvailable',
        'foodAvailable',
        'transportAvailable',
        'shiftTiming',
        'projectType',
        'requiredExperience',
        'expertiseArea',
        'expertsRequired',
        'projectDuration',
        'workModePreference',
    ];

    const labelMap = {
        workersRequired: 'Workers required',
        workLocation: 'Work location',
        accommodationAvailable: 'Accommodation',
        foodAvailable: 'Food',
        transportAvailable: 'Transport',
        shiftTiming: 'Shift timing',
        projectType: 'Project type',
        requiredExperience: 'Required experience',
        expertiseArea: 'Expertise area',
        expertsRequired: 'Experts required',
        projectDuration: 'Project duration',
        workModePreference: 'Work mode',
    };

    return orderedKeys
        .filter((key) => details[key] !== undefined && details[key] !== null && details[key] !== '')
        .map((key) => ({ label: labelMap[key] || key, value: details[key] }));
}

function getJobMetaLabel(job) {
    if (job?.category && job.category !== 'student') {
        return 'Job Category';
    }

    return 'Experience Level';
}

const BULLET_PATTERN = /^[-•*]\s+/;

/**
 * Turns a recruiter's raw description text into structured sections.
 * Recognizes common JD headers (About the company, Responsibilities, etc.)
 * as well as short standalone lines that look like headers, and groups
 * bullet-style lines into lists.
 */
function parseDescription(text) {
    if (!text || !text.trim()) return [];

    const rawLines = text.split('\n').map((line) => line.trim());
    const sections = [];
    let current = { heading: null, blocks: [] };
    let bulletBuffer = [];

    const flushBullets = () => {
        if (bulletBuffer.length) {
            current.blocks.push({ type: 'list', items: bulletBuffer });
            bulletBuffer = [];
        }
    };

    const looksLikeHeader = (line) => {
        const normalized = line.toLowerCase().replace(/[:：]+$/, '');
        if (KNOWN_SECTION_HEADERS.includes(normalized)) return true;
        return (
            line.length > 0 &&
            line.length < 48 &&
            !BULLET_PATTERN.test(line) &&
            !/[.,;]$/.test(line) &&
            /^[A-Z]/.test(line) &&
            line === line.replace(/\s+/g, ' ')
        );
    };

    rawLines.forEach((line) => {
        if (!line) return;

        if (looksLikeHeader(line)) {
            flushBullets();
            if (current.heading || current.blocks.length) sections.push(current);
            current = { heading: line.replace(/[:：]+$/, ''), blocks: [] };
            return;
        }

        if (BULLET_PATTERN.test(line)) {
            bulletBuffer.push(line.replace(BULLET_PATTERN, ''));
            return;
        }

        flushBullets();
        current.blocks.push({ type: 'para', text: line });
    });

    flushBullets();
    if (current.heading || current.blocks.length) sections.push(current);

    return sections;
}

// Converts one section's rich-text HTML (e.g. "<p>Intro</p><ul><li>a</li><li>b</li></ul>")
// into the same block shape parseDescription() produces, so real <ul>/<li> markup
// renders as actual bullets instead of being flattened into a single paragraph.
function htmlSectionToBlocks(html) {
    if (!html || !html.trim()) return [];

    const container = document.createElement('div');
    container.innerHTML = html;

    const blocks = [];
    let paraBuffer = [];

    const flushPara = () => {
        const text = paraBuffer.join(' ').replace(/\s+/g, ' ').trim();
        if (text) blocks.push({ type: 'para', text });
        paraBuffer = [];
    };

    Array.from(container.childNodes).forEach((node) => {
        const tag = node.nodeType === Node.ELEMENT_NODE ? node.tagName : null;

        if (tag === 'UL' || tag === 'OL') {
            flushPara();
            const items = Array.from(node.querySelectorAll(':scope > li'))
                .map((li) => li.textContent.replace(/\s+/g, ' ').trim())
                .filter(Boolean);
            if (items.length) blocks.push({ type: 'list', items });
            return;
        }

        if (tag === 'BR') {
            flushPara();
            return;
        }

        const text = node.textContent || '';
        if (text.trim()) paraBuffer.push(text.trim());

        // contentEditable wraps each typed line in its own <div>/<p> — treat
        // each one as its own paragraph rather than merging lines together.
        if (tag === 'DIV' || tag === 'P') flushPara();
    });

    flushPara();
    return blocks;
}

// Prefers the structured, real-HTML sections a job was posted with
// (job.descriptionSections) and falls back to the best-effort text parser
// for older jobs that only have the flattened `description` string.
function buildDescriptionSections(job) {
    if (!job) return [];

    if (job.descriptionSections && Object.keys(job.descriptionSections).length > 0) {
        return Object.entries(job.descriptionSections)
            .map(([heading, html]) => ({ heading, blocks: htmlSectionToBlocks(html) }))
            .filter((section) => section.blocks.length > 0);
    }

    return parseDescription(job.description);
}

// First short paragraph under a "Job Description / About the role"-style
// heading, trimmed down for use as the one-line tagline in the header card.
function extractTagline(sections) {
    const section = sections.find((s) => TAGLINE_HEADERS.includes(s.heading?.toLowerCase()));
    const para = section?.blocks.find((b) => b.type === 'para');
    if (!para) return null;
    return para.text.length > 150 ? `${para.text.slice(0, 147).trim()}…` : para.text;
}

/* ------------------------------------------------------------------ */
/* Keyword bolding — skills + experience figures inside the JD text    */
/* ------------------------------------------------------------------ */
function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildHighlightRegex(skills) {
    const patterns = [];
    if (Array.isArray(skills) && skills.length) {
        [...skills]
            .sort((a, b) => b.length - a.length) // longest first so "React Native" beats "React"
            .forEach((skill) => patterns.push(escapeRegExp(skill)));
    }
    // "3+ years", "2-4 years", "5 yrs of experience", etc.
    patterns.push('\\d+\\s*-\\s*\\d+\\+?\\s*(?:years?|yrs?)(?:\\s+of\\s+experience)?');
    patterns.push('\\d+\\+?\\s*(?:years?|yrs?)(?:\\s+of\\s+experience)?');
    return new RegExp(`(${patterns.join('|')})`, 'gi');
}

// Splits plain text on the highlight regex and wraps matches in <strong>.
// Safe against HTML injection since it only ever renders text nodes.
function highlightText(text, regex) {
    if (!regex) return text;
    const parts = text.split(regex);
    if (parts.length === 1) return text;
    return parts.map((part, i) =>
        i % 2 === 1 ? (
            <strong key={i} className="font-semibold text-stone-900">
                {part}
            </strong>
        ) : (
            part
        )
    );
}

// A single section (heading + its paragraphs/lists) with its own
// independent "Read more" toggle — long sections collapse on their own,
// short sections just render in full with no button.
const SECTION_COLLAPSE_THRESHOLD = 260;

function sectionTextLength(blocks) {
    return blocks.reduce((total, block) => {
        if (block.type === 'list') {
            return total + block.items.join(' ').length;
        }
        return total + block.text.length;
    }, 0);
}

function DescriptionSection({ heading, blocks, highlightRegex }) {
    const [expanded, setExpanded] = useState(false);
    const key = heading?.toLowerCase();
    const Icon = SECTION_ICONS[key] || Sparkles;

    const isLong = sectionTextLength(blocks) > SECTION_COLLAPSE_THRESHOLD;
    const isCollapsed = isLong && !expanded;

    return (
        <div className="mt-6 first:mt-0">
            {heading && (
                <div className="flex items-center gap-2">
                    <span
                        className="flex h-7 w-7 items-center justify-center rounded-lg"
                        style={{ background: `${MAROON}12`, color: MAROON }}
                    >
                        <Icon size={14} />
                    </span>
                    <h2 className="text-[13px] font-semibold text-stone-800">{heading}</h2>
                </div>
            )}
            <div
                className={
                    heading
                        ? `mt-2.5 pl-9 ${isCollapsed ? 'relative max-h-[110px] overflow-hidden' : ''}`
                        : isCollapsed
                          ? 'relative max-h-[110px] overflow-hidden'
                          : ''
                }
            >
                {blocks.map((block, i) =>
                    block.type === 'list' ? (
                        <ul key={i} className="mt-2 space-y-2 first:mt-0">
                            {block.items.map((item, j) => (
                                <li
                                    key={j}
                                    className="flex items-start gap-2.5 text-[13.5px] leading-6 text-stone-700"
                                >
                                    <span
                                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                                        style={{ background: MAROON }}
                                    />
                                    <span>{highlightText(item, highlightRegex)}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p key={i} className="mt-2 text-[13.5px] leading-6 text-stone-700 first:mt-0">
                            {highlightText(block.text, highlightRegex)}
                        </p>
                    )
                )}
                {isCollapsed && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent" />
                )}
            </div>
            {isLong && (
                <button
                    type="button"
                    onClick={() => setExpanded((prev) => !prev)}
                    className={`mt-2 text-[12px] font-semibold hover:underline ${heading ? 'pl-9' : ''}`}
                    style={{ color: MAROON }}
                >
                    {expanded ? 'Read less' : 'Read more'}
                </button>
            )}
        </div>
    );
}

// Some job records have a stray "(Role)" / "(Education UG)" style suffix
// baked into the value itself (a leftover from seed/import data). Strip it
// only when the parenthesised text is clearly a field-name artifact, never
// touching genuine parenthetical content like "Bachelor's (B.Tech)".
const META_NOISE_SUFFIXES = [
    'role', 'role category', 'department', 'industry type', 'employment type',
    'education', 'education ug', 'education pg', 'ug', 'pg',
];

function cleanMetaValue(value) {
    if (!value) return value;
    const match = value.trim().match(/^(.*)\(([^)]+)\)\s*$/);
    if (!match) return value.trim();
    const inner = match[2].trim().toLowerCase();
    return META_NOISE_SUFFIXES.includes(inner) ? match[1].trim() : value.trim();
}

// Naukri-style "Role: Finance & Accounting - Other" label/value row.
// Label is bold+dark; the value's primary keyword (before the first " - ")
// is bolded too, with any qualifier after the dash in regular weight.
// Only renders if the value is actually present, so partial job postings
// degrade gracefully.
function MetaRow({ label, value }) {
    if (!value) return null;
    const cleaned = cleanMetaValue(value);
    const [primary, ...rest] = cleaned.split(' - ');
    return (
        <p className="text-[13px] leading-7 text-stone-700">
            <span className="font-semibold text-stone-900">{label}: </span>
            <span className="font-semibold text-stone-800">{primary}</span>
            {rest.length > 0 && <span> - {rest.join(' - ')}</span>}
        </p>
    );
}

// Single cell in the top "stats strip" (Experience Level / Applicants /
// Matched / Last reviewed style grid from the reference design).
function StatCell({ label, value }) {
    if (!value) return null;
    return (
        <div className="min-w-[110px] flex-1 px-4 py-3.5 first:pl-0 last:pr-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-stone-400">{label}</p>
            <p className="mt-1 text-[13.5px] font-semibold text-stone-900">{value}</p>
        </div>
    );
}

function timeAgo(dateStr, now = Date.now()) {
    if (!dateStr) return null;
    const diffMs = now - new Date(dateStr).getTime();
    if (diffMs < 0) return 'Just now';

    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 10) return 'Just now';
    if (seconds < 60) return `${seconds} seconds ago`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

    const days = Math.floor(hours / 24);
    if (days === 1) return '1 day ago';
    if (days < 30) return `${days} days ago`;

    const months = Math.floor(days / 30);
    return `${months} mo${months === 1 ? '' : 's'} ago`;
}

function normalizeCompanyName(value) {
    return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function getCurrentCompanyName(candidate) {
    return (candidate?.profile?.experience || []).find((item) => item?.current && item.company)?.company?.trim() || '';
}

export default function JobDetail() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const isReferredJob = searchParams.get('referral') === '1';
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [savedIds, setSavedIds] = useState(new Set());
    const [applying, setApplying] = useState(false);
    const [withdrawing, setWithdrawing] = useState(false);
    const [applied, setApplied] = useState(false);
    const [applicationStatus, setApplicationStatus] = useState('');
    const [applyError, setApplyError] = useState('');
    const [applicationFormOpen, setApplicationFormOpen] = useState(false);
    const [externalApplyOpen, setExternalApplyOpen] = useState(false);
    const [candidateProfile, setCandidateProfile] = useState(null);
    const [reporting, setReporting] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportMessage, setReportMessage] = useState('');
    const [followCompany, setFollowCompany] = useState(false);
    const [now, setNow] = useState(() => Date.now());
    const [referralOpen, setReferralOpen] = useState(false);
    const [referralUniqueId, setReferralUniqueId] = useState('');
    const [referralCandidate, setReferralCandidate] = useState(null);
    const [selectedReferralCandidate, setSelectedReferralCandidate] = useState(null);
    const [referralLookupLoading, setReferralLookupLoading] = useState(false);
    const [referralError, setReferralError] = useState('');
    const [referralSubmitting, setReferralSubmitting] = useState(false);
    const [referralSuccess, setReferralSuccess] = useState('');
    const [receivedReferral, setReceivedReferral] = useState(null);

    // Ticks every 30s so "Posted: X seconds/minutes/hours ago" stays live
    // instead of freezing at whatever it showed on page load.
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 30 * 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        async function loadJob() {
            setLoading(true);
            setError('');
            try {
                const [{ data: jobData }, { data: savedData }, { data: appliedData }, { data: profileData }, { data: receivedReferrals }] = await Promise.all([
                    axiosInstance.get(`/jobs/${id}`),
                    axiosInstance.get('/candidate/me/saved-jobs').catch(() => ({ data: [] })),
                    axiosInstance.get('/applications/mine').catch(() => ({ data: [] })),
                    axiosInstance.get('/candidate/me/profile').catch(() => ({ data: null })),
                    isReferredJob ? axiosInstance.get('/referral/mine').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
                ]);

                setJob(jobData);
                setSavedIds(new Set((savedData || []).map((item) => item._id)));
                const jobApplication = (appliedData || []).find(
                    (item) => (item.job?._id || item.jobId || item._id) === jobData._id
                );
                setApplied(!!jobApplication);
                setApplicationStatus(jobApplication?.status || '');
                setCandidateProfile(profileData);
                setReceivedReferral((receivedReferrals || []).find((referral) => (referral.job?._id || referral.job) === jobData._id) || null);
            } catch (err) {
                setError(err.response?.data?.error || 'Could not load this job.');
            } finally {
                setLoading(false);
            }
        }

        loadJob();
    }, [id, isReferredJob]);

    async function toggleSave() {
        if (!job?._id) return;
        const isSaved = savedIds.has(job._id);
        setSavedIds((prev) => {
            const next = new Set(prev);
            isSaved ? next.delete(job._id) : next.add(job._id);
            return next;
        });

        try {
            if (isSaved) {
                await axiosInstance.delete(`/candidate/me/saved-jobs/${job._id}`);
            } else {
                await axiosInstance.post(`/candidate/me/saved-jobs/${job._id}`);
            }
        } catch {
            setSavedIds((prev) => {
                const next = new Set(prev);
                isSaved ? next.add(job._id) : next.delete(job._id);
                return next;
            });
        }
    }

    async function apply() {
        if (!job?._id) return;
        if (isReferredJob) return;
        if (job.status !== 'open') {
            setApplyError('This job is no longer accepting applications.');
            return;
        }
        if (job.applicationForm?.externalApplyLink) {
            setExternalApplyOpen(true);
            return;
        }
        if (job.applicationForm?.enabled && job.applicationForm.fields?.length) {
            setApplicationFormOpen(true);
            return;
        }
        await submitApplication([]);
    }

    function applyViaExternalLink() {
        const externalLink = job?.applicationForm?.externalApplyLink;
        if (!externalLink) return;
        setExternalApplyOpen(false);
        window.open(externalLink, '_blank', 'noopener,noreferrer');
    }

    async function submitApplication(answers) {
        setApplying(true);
        setApplyError('');
        try {
            await axiosInstance.post('/applications', { jobId: job._id, answers });
            setApplied(true);
            setApplicationFormOpen(false);
        } catch (err) {
            console.error('Apply failed:', err.response?.data || err.message);
            setApplyError(err.response?.data?.error || 'Could not apply. Please try again.');
        } finally {
            setApplying(false);
        }
    }

    async function withdraw() {
        if (!job?._id) return;
        if (['shortlisted', 'interview_scheduled', 'offered', 'accepted'].includes(applicationStatus)) return;
        setWithdrawing(true);
        setApplyError('');
        try {
            await axiosInstance.delete(`/applications/job/${job._id}`);
            setApplied(false);
        } catch (err) {
            console.error('Withdraw failed:', err.response?.data || err.message);
            setApplyError(err.response?.data?.error || 'Could not withdraw. Backend route may be missing.');
        } finally {
            setWithdrawing(false);
        }
    }

    async function reportJob() {
        if (!job?._id || reporting) return;
        if (!reportReason.trim()) return;
        setReporting(true);
        setReportMessage('');
        try {
            await axiosInstance.post(`/jobs/${job._id}/report`, { reason: reportReason.trim() });
            setReportReason('');
            setReportOpen(false);
            setReportMessage('Report submitted. Our team will review this job.');
        } catch (err) {
            setReportMessage(err.response?.data?.error || 'Could not submit the report. Please try again.');
        } finally {
            setReporting(false);
        }
    }

    useEffect(() => {
        if (!referralOpen) return undefined;

        const uniqueId = referralUniqueId.trim();
        if (selectedReferralCandidate) return undefined;
        if (uniqueId.length < 3) {
            setReferralCandidate(null);
            setReferralError('');
            return undefined;
        }

        const timer = setTimeout(async () => {
            setReferralLookupLoading(true);
            setReferralError('');
            try {
                const { data } = await axiosInstance.get(`/referral/lookup/${encodeURIComponent(uniqueId)}`);
                setReferralCandidate(data);
            } catch (err) {
                setReferralCandidate(null);
                setReferralError(err.response?.data?.error || 'No candidate found with this unique ID.');
            } finally {
                setReferralLookupLoading(false);
            }
        }, 350);

        return () => clearTimeout(timer);
    }, [referralOpen, referralUniqueId, selectedReferralCandidate]);

    function openReferral() {
        setReferralUniqueId('');
        setReferralCandidate(null);
        setSelectedReferralCandidate(null);
        setReferralError('');
        setReferralSuccess('');
        setReferralOpen(true);
    }

    async function submitReferral() {
        const candidate = selectedReferralCandidate || referralCandidate;
        if (!job?._id || !candidate || referralSubmitting) return;
        setReferralSubmitting(true);
        setReferralError('');
        try {
            const { data } = await axiosInstance.post('/referral', {
                jobId: job._id,
                candidateUniqueId: candidate.uniqueId,
            });
            setReferralSuccess(data.message || 'Referral sent successfully.');
            setReferralUniqueId('');
            setReferralCandidate(null);
            setSelectedReferralCandidate(null);
        } catch (err) {
            setReferralError(err.response?.data?.error || 'Could not send the referral. Please try again.');
        } finally {
            setReferralSubmitting(false);
        }
    }

    const isSaved = job ? savedIds.has(job._id) : false;
    const applicationFields = job?.applicationForm?.enabled ? job.applicationForm.fields || [] : [];
    const profile = candidateProfile?.profile || {};
    const currentCompanyName = getCurrentCompanyName(candidateProfile);
    const jobCompanyName = job?.postedBy?.companyName?.trim() || '';
    const canReferForJob = Boolean(
        currentCompanyName &&
        jobCompanyName &&
        normalizeCompanyName(currentCompanyName) === normalizeCompanyName(jobCompanyName),
    );
    const initialApplicationValues = {
        current_location: profile.location,
        linkedin_url: candidateProfile?.socialLinks?.linkedin,
        github_url: candidateProfile?.socialLinks?.github,
        personal_website: candidateProfile?.socialLinks?.website,
    };
    const descriptionSections = buildDescriptionSections(job);
    const tagline = job ? extractTagline(descriptionSections) : null;
    const highlightRegex = job ? buildHighlightRegex(job.skillsRequired) : null;
    const categoryHighlights = getCategoryDetailHighlights(job);

    const hasMetaGrid =
        job &&
        (job.role || job.industryType || job.department || job.employmentType || job.roleCategory);
    const hasEducation = job && (job.educationUG || job.educationPG);

    // Stats strip — only the cells with real data are shown; the whole
    // strip is skipped if nothing at all is available.
    const statCells = job
        ? [
                { label: getJobMetaLabel(job), value: getJobLabel(job) },
              {
                  label: 'Applicants',
                  value: typeof job.applicantsCount === 'number' ? `${job.applicantsCount}+ applicants` : null,
              },
              {
                  label: 'Key Skills',
                  value: Array.isArray(job.skillsRequired) && job.skillsRequired.length
                      ? `${job.skillsRequired.length} listed`
                      : null,
              },
              { label: 'Posted', value: timeAgo(job.createdAt) },
          ].filter((cell) => cell.value)
        : [];

    return (
        <div className="portal-theme min-h-screen w-full" style={{ background: BG, fontFamily: FONT_BODY }}>
            <CandidateNavbar />

            <main className="mx-auto max-w-3xl px-6 py-8">
                <button
                    type="button"
                    onClick={() => navigate('/candidate/jobs')}
                    className="mb-4 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-[12.5px] font-semibold text-stone-700 transition-colors hover:border-[#8B1E2F]/30 hover:text-[#8B1E2F]"
                >
                    <ArrowLeft size={14} />
                    Back to jobs
                </button>

                {loading ? (
                    <div className="rounded-[22px] border border-stone-200/70 bg-white p-8 text-center text-[13px] text-[#6B6259]">
                        Loading job details...
                    </div>
                ) : error ? (
                    <div className="rounded-[22px] border border-stone-200/70 bg-white p-8 text-center">
                        <p className="text-[13.5px] font-medium text-stone-800">{error}</p>
                    </div>
                ) : job ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                            {/* Header card: title, company, quick facts, apply/save — Naukri-style layout */}
                            <section className="rounded-[20px] border border-stone-200/70 bg-white p-8 shadow-[0_20px_50px_-34px_rgba(92,20,32,0.34)]">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <h1
                                            className="text-[19px] font-bold leading-tight text-stone-900"
                                            style={{ fontFamily: FONT_DISPLAY }}
                                        >
                                            {job.title}
                                        </h1>

                                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[13px]">
                                            {job.postedBy?._id ? (
                                                <Link
                                                    to={`/candidate/companies/${job.postedBy._id}`}
                                                    className="font-semibold hover:underline"
                                                    style={{ color: MAROON }}
                                                >
                                                    {job.postedBy?.companyName || 'Company'}
                                                </Link>
                                            ) : (
                                                <span className="font-semibold" style={{ color: MAROON }}>
                                                    {job.postedBy?.companyName || 'Company'}
                                                </span>
                                            )}
                                            {job.postedBy?.verified && (
                                                <BadgeCheck size={14} className="text-blue-500" />
                                            )}
                                            {job.postedBy?.rating && (
                                                <span className="ml-1 flex items-center gap-1 text-[12.5px] text-stone-500">
                                                    <Star size={12} className="fill-amber-400 text-amber-400" />
                                                    {job.postedBy.rating}
                                                </span>
                                            )}
                                            {job.postedBy?.reviewsCount && (
                                                <>
                                                    <span className="text-stone-300">|</span>
                                                    <span className="text-[12.5px] text-stone-500">
                                                        {job.postedBy.reviewsCount} Reviews
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        {isReferredJob && receivedReferral?.referrer?.name && (
                                            <p className="mt-2 text-[12.5px] font-semibold text-[#9A671A]">
                                                Referred by {receivedReferral.referrer.name}
                                            </p>
                                        )}

                                        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12.5px] text-stone-600">
                                            {job.experienceLevel && (
                                                <span className="flex items-center gap-1.5">
                                                    <Briefcase size={13} className="text-stone-400" />
                                                    {getJobLabel(job)}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <IndianRupee size={13} className="text-stone-400" />
                                                {job.salary || 'Not Disclosed'}
                                            </span>
                                        </div>

                                        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-5 gap-y-1.5">
                                            {job.location && (
                                                <span className="flex items-center gap-1.5 text-[12.5px] text-stone-600">
                                                    <MapPin size={13} className="text-stone-400" />
                                                    {job.location}
                                                </span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    navigate(`/candidate/jobs?search=${encodeURIComponent(job.title)}`)
                                                }
                                                className="text-[12.5px] font-semibold hover:underline"
                                                style={{ color: MAROON }}
                                            >
                                                Send me jobs like this
                                            </button>
                                        </div>

                                        {tagline && (
                                            <p className="mt-3 max-w-xl text-[13px] leading-6 text-stone-500">
                                                {tagline}
                                            </p>
                                        )}
                                    </div>

                                    {job.postedBy?.companyLogoUrl && (
                                        <img
                                            src={job.postedBy.companyLogoUrl}
                                            alt={job.postedBy?.companyName}
                                            className="h-14 w-14 shrink-0 rounded-xl border border-stone-100 object-contain p-1.5"
                                        />
                                    )}
                                </div>

                                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-5">
                                    <div className="flex items-center gap-3 text-[12.5px] text-stone-600">
                                        <span>
                                            <span className="font-semibold text-stone-800">Posted:</span>{' '}
                                            {timeAgo(job.createdAt, now) || 'Just now'}
                                        </span>
                                        <span className="text-stone-300">|</span>
                                        <span>
                                            <span className="font-semibold text-stone-800">Applicants:</span>{' '}
                                            {job.applicantsCount || 0}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={toggleSave}
                                            className="flex items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-[13px] font-semibold text-stone-700 transition-colors hover:border-[#8B1E2F]/30 hover:text-[#8B1E2F]"
                                        >
                                            {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                                            {isSaved ? 'Saved' : 'Save'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => { setReportMessage(''); setReportOpen(true); }}
                                            disabled={reporting}
                                            title="Report this job"
                                            className="flex items-center justify-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-70"
                                        >
                                            <Flag size={14} />
                                            Report
                                        </button>

                                        {!isReferredJob && <button
                                            type="button"
                                            onClick={openReferral}
                                            disabled={!canReferForJob}
                                            title={canReferForJob ? `Refer for ${jobCompanyName}` : 'Referrals are available only for jobs posted by your current company.'}
                                            className="flex items-center justify-center gap-2 rounded-full border border-[#EBC2AE] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#8B1E2F] transition-colors hover:bg-[#FFF5F0] disabled:cursor-not-allowed disabled:border-stone-200 disabled:text-stone-400 disabled:hover:bg-white"
                                        >
                                            <UserRoundPlus size={14} />
                                            Refer candidate
                                        </button>}

                                        {isReferredJob ? (
                                            <span className="inline-flex items-center justify-center rounded-full border border-[#EBC2AE] bg-[#FFF0E8] px-5 py-2.5 text-[13px] font-bold text-[#9A671A]">Referred</span>
                                        ) : applied ? (
                                            <>
                                                <span
                                                    className="flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white"
                                                    style={{ background: '#15803D' }}
                                                >
                                                    <CheckCircle2 size={14} />
                                                    Applied
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={withdraw}
                                                    disabled={
                                                      withdrawing ||
                                                      ['shortlisted', 'interview_scheduled', 'offered', 'accepted', 'rejected'].includes(
                                                        applicationStatus,
                                                      )
                                                    }
                                                    title={
                                                      ['shortlisted', 'interview_scheduled', 'offered', 'accepted', 'rejected'].includes(
                                                        applicationStatus,
                                                      )
                                                        ? 'Cannot withdraw after the recruiter has shortlisted you or the application was rejected.'
                                                        : undefined
                                                    }
                                                    className="flex items-center justify-center gap-2 rounded-full border border-red-200 bg-white px-5 py-2.5 text-[13px] font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-70"
                                                >
                                                    {withdrawing && <Loader2 size={14} className="animate-spin" />}
                                                    {withdrawing ? 'Withdrawing…' : 'Withdraw'}
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={apply}
                                                disabled={applying || job.status !== 'open'}
                                                className="flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-[13px] font-semibold text-white disabled:opacity-70"
                                                style={{ background: `linear-gradient(135deg, ${ACCENT}, ${MAROON})` }}
                                            >
                                                {applying && <Loader2 size={14} className="animate-spin" />}
                                                {job.status !== 'open' ? 'Applications Closed' : applying ? 'Applying…' : 'Apply'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {applyError && (
                                    <p className="mt-3 text-[12.5px] font-medium text-red-600">{applyError}</p>
                                )}
                                {reportMessage && (
                                    <p className={`mt-3 text-[12.5px] font-medium ${reportMessage.startsWith('Report submitted') ? 'text-green-700' : 'text-red-600'}`}>
                                        {reportMessage}
                                    </p>
                                )}

                                <label className="mt-4 flex items-center gap-2 text-[12.5px] text-stone-600">
                                    <input
                                        type="checkbox"
                                        checked={followCompany}
                                        onChange={(e) => setFollowCompany(e.target.checked)}
                                        className="h-3.5 w-3.5 rounded border-stone-300 accent-[#8B1E2F]"
                                    />
                                    Follow {job.postedBy?.companyName || 'this company'} as you apply to stay updated
                                </label>
                            </section>

                            {/* Stats strip — Experience / Applicants / Skills / Posted */}
                            {statCells.length > 0 && (
                                <section className="rounded-[20px] border border-stone-200/70 bg-white px-3 py-2 shadow-[0_20px_50px_-34px_rgba(92,20,32,0.34)]">
                                    <div className="flex flex-wrap divide-x divide-stone-100">
                                        {statCells.map((cell) => (
                                            <StatCell key={cell.label} label={cell.label} value={cell.value} />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {categoryHighlights.length > 0 && (
                                <section className="rounded-[18px] border border-[#E8CFC3] bg-[#FFFDFB] p-4 shadow-[0_10px_24px_-20px_rgba(92,20,32,0.35)]">
                                    <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#9A671A]">
                                        <Briefcase size={12} /> Role requirements
                                    </div>
                                    <div className="grid gap-2.5 sm:grid-cols-2">
                                        {categoryHighlights.map((item) => (
                                            <div key={`${job._id}-${item.label}`} className="rounded-[12px] border border-[#EDD6C9] bg-white/70 p-2.5">
                                                <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#8D6072]">
                                                    {item.label}
                                                </div>
                                                <div className="mt-1 text-[13px] font-semibold leading-5 text-stone-800">
                                                    {item.value}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Job description + structured metadata */}
                            <section className="rounded-[20px] border border-stone-200/70 bg-white p-8 shadow-[0_20px_50px_-34px_rgba(92,20,32,0.34)]">
                                <h2 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-stone-400">
                                    Job description
                                </h2>

                                {descriptionSections.length > 0 ? (
                                    <div className="mt-3">
                                        {descriptionSections.map((section, i) => (
                                            <DescriptionSection
                                                key={`${job._id}-${i}`}
                                                heading={section.heading}
                                                blocks={section.blocks}
                                                highlightRegex={highlightRegex}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="mt-3 text-[13.5px] italic leading-6 text-stone-400">
                                        No description was provided for this role.
                                    </p>
                                )}

                                {/* Naukri-style Role / Industry Type / Department grid */}
                                {hasMetaGrid && (
                                    <div className="mt-6 border-t border-stone-100 pt-5">
                                        <MetaRow label="Role" value={job.role} />
                                        <MetaRow label="Industry Type" value={job.industryType} />
                                        <MetaRow label="Department" value={job.department} />
                                        <MetaRow label="Employment Type" value={job.employmentType} />
                                        <MetaRow label="Role Category" value={job.roleCategory} />
                                    </div>
                                )}

                                {hasEducation && (
                                    <div className="mt-6 border-t border-stone-100 pt-5">
                                        <h2 className="text-[13px] font-semibold text-stone-900">Education</h2>
                                        <div className="mt-2 space-y-1">
                                            <MetaRow label="UG" value={job.educationUG} />
                                            <MetaRow label="PG" value={job.educationPG} />
                                        </div>
                                    </div>
                                )}

                                {Array.isArray(job.skillsRequired) && job.skillsRequired.length > 0 && (
                                    <div className="mt-6 border-t border-stone-100 pt-5">
                                        <h2 className="text-[13px] font-semibold text-stone-900">Key Skills</h2>
                                        <p className="mt-1 text-[11.5px] text-stone-400">
                                            Tap a skill to see other jobs that need it.
                                        </p>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {job.skillsRequired.map((skill) => (
                                                <Link
                                                    key={skill}
                                                    to={`/candidate/jobs?skill=${encodeURIComponent(skill)}`}
                                                    className="rounded-full bg-stone-100 px-3 py-1.5 text-[11.5px] font-semibold text-stone-600 transition-colors hover:bg-[#8B1E2F]/10 hover:text-[#8B1E2F]"
                                                >
                                                    {skill}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </section>

                            {/* About the company */}
                            {(job.postedBy?.companyDetails || job.postedBy?.companyName) && (
                                <section className="rounded-[20px] border border-stone-200/70 bg-white p-8 shadow-[0_20px_50px_-34px_rgba(92,20,32,0.34)]">
                                    <h2 className="text-[13px] font-semibold text-stone-900">Job Highlights</h2>
                                    <div className="mt-3 flex items-center gap-3">
                                        {job.postedBy?.companyLogoUrl && (
                                            <img
                                                src={job.postedBy.companyLogoUrl}
                                                alt={job.postedBy?.companyName}
                                                className="h-10 w-10 rounded-lg border border-stone-100 object-contain p-1"
                                            />
                                        )}
                                        {job.postedBy?._id ? (
                                            <Link
                                                to={`/candidate/companies/${job.postedBy._id}`}
                                                className="text-[13.5px] font-semibold text-stone-800 hover:text-[#8B1E2F] hover:underline"
                                            >
                                                {job.postedBy?.companyName}
                                            </Link>
                                        ) : (
                                            <p className="text-[13.5px] font-semibold text-stone-800">
                                                {job.postedBy?.companyName}
                                            </p>
                                        )}
                                    </div>
                                    {job.postedBy?.companyDetails && (
                                        <p className="mt-3 text-[13.5px] leading-6 text-stone-700">
                                            {job.postedBy.companyDetails}
                                        </p>
                                    )}
                                    <div className="mt-4 space-y-1.5">
                                        {job.postedBy?.website && (
                                            <p className="flex items-center gap-1.5 text-[12.5px] text-stone-600">
                                                <span className="font-semibold text-stone-900">Link:</span>
                                                <a
                                                    href={job.postedBy.website}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-1 hover:underline"
                                                    style={{ color: MAROON }}
                                                >
                                                    Company website <ExternalLink size={11} />
                                                </a>
                                            </p>
                                        )}
                                        {job.location && (
                                            <p className="text-[12.5px] text-stone-600">
                                                <span className="font-semibold text-stone-900">Address:</span>{' '}
                                                {job.location}
                                            </p>
                                        )}
                                    </div>
                                </section>
                            )}
                        </motion.div>
                ) : null}
            </main>

            {reportOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true" aria-labelledby="report-job-title">
                    <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 id="report-job-title" className="text-[17px] font-bold text-stone-900" style={{ fontFamily: FONT_DISPLAY }}>
                                    Report this job
                                </h2>
                                <p className="mt-1 text-[12.5px] leading-5 text-stone-500">
                                    Tell us what looks wrong with this job posting.
                                </p>
                            </div>
                            <button type="button" onClick={() => setReportOpen(false)} aria-label="Close report dialog" className="text-xl leading-none text-stone-400 hover:text-stone-700">×</button>
                        </div>
                        <label className="mt-5 block">
                            <span className="mb-1.5 block text-[12px] font-semibold text-stone-700">Reason</span>
                            <textarea
                                value={reportReason}
                                onChange={(event) => setReportReason(event.target.value)}
                                placeholder="Example: This job asks applicants for money."
                                rows={4}
                                className="w-full resize-none rounded-xl border border-stone-200 px-3 py-2.5 text-[13px] text-stone-800 outline-none focus:border-[#8B1E2F] focus:ring-2 focus:ring-[#8B1E2F]/10"
                            />
                        </label>
                        <div className="mt-5 flex justify-end gap-2">
                            <button type="button" onClick={() => setReportOpen(false)} className="rounded-full border border-stone-200 px-4 py-2 text-[12.5px] font-semibold text-stone-600 hover:bg-stone-50">Cancel</button>
                            <button type="button" onClick={reportJob} disabled={reporting || reportReason.trim().length < 3} className="rounded-full bg-[#8B1E2F] px-5 py-2 text-[12.5px] font-semibold text-white hover:bg-[#701525] disabled:cursor-not-allowed disabled:opacity-50">
                                {reporting ? 'Submitting…' : 'Submit report'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {externalApplyOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true" aria-labelledby="external-apply-title">
                    <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#A51D35]">External application</p>
                                <h2 id="external-apply-title" className="mt-1 text-[19px] font-bold text-stone-900" style={{ fontFamily: FONT_DISPLAY }}>Apply via company link?</h2>
                            </div>
                            <button type="button" onClick={() => setExternalApplyOpen(false)} aria-label="Close external application dialog" className="text-xl leading-none text-stone-400 hover:text-stone-700">×</button>
                        </div>
                        <p className="mt-4 text-[13px] leading-6 text-stone-600">
                            This company collects applications on its own website. Click Apply to continue in a new tab.
                        </p>
                        <div className="mt-5 flex justify-end gap-2">
                            <button type="button" onClick={() => setExternalApplyOpen(false)} className="rounded-full border border-stone-200 px-4 py-2 text-[12.5px] font-semibold text-stone-600 hover:bg-stone-50">Cancel</button>
                            <button type="button" onClick={applyViaExternalLink} className="rounded-full bg-[#8B1E2F] px-5 py-2 text-[12.5px] font-semibold text-white hover:bg-[#701525]">Apply</button>
                        </div>
                    </div>
                </div>
            )}
            {applicationFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true" aria-labelledby="application-form-title">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[16px] border border-stone-200 bg-white p-5 shadow-2xl sm:p-6">
                        <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#A51D35]">Job application</p><h2 id="application-form-title" className="mt-1 text-[19px] font-bold text-stone-900" style={{ fontFamily: FONT_DISPLAY }}>Apply for {job.title}</h2></div><button type="button" onClick={() => setApplicationFormOpen(false)} disabled={applying} aria-label="Close application form" className="text-xl leading-none text-stone-400 hover:text-stone-700">×</button></div>
                        <div className="mt-4 rounded-[10px] border border-[#EBC2AE] bg-[#FFF9F5] p-3.5">
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] bg-[#8B1E2F] text-white"><CheckCircle2 size={16} /></span>
                                <div><p className="text-[12.5px] font-bold text-[#54263F]">Candidate information</p><p className="mt-0.5 text-[10.5px] text-[#80576A]">Pulled from your profile</p></div>
                            </div>
                            <div className="mt-3 grid gap-2 border-t border-[#F0DAD0] pt-3 text-[12px] sm:grid-cols-3">
                                <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#A77D8D]">Name</p><p className="mt-0.5 truncate font-semibold text-[#1D181A]">{candidateProfile?.name || 'Your profile name'}</p></div>
                                <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#A77D8D]">Email</p><p className="mt-0.5 truncate font-semibold text-[#1D181A]">{candidateProfile?.email || 'Your profile email'}</p></div>
                                <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#A77D8D]">Phone</p><p className="mt-0.5 truncate font-semibold text-[#1D181A]">{candidateProfile?.phone || profile.phone || 'Phone from profile'}</p></div>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#F0DAD0] pt-2.5 text-[11px]">
                                <span className="font-semibold uppercase tracking-[0.08em] text-[#A77D8D]">Resume</span>
                                {profile.resumeUrl ? (
                                    <a href={profile.resumeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-[#8B1E2F] hover:underline">
                                        {profile.resumeFilename || 'View resume'} <ExternalLink size={12} />
                                    </a>
                                ) : (
                                    <span className="font-medium text-[#B3261E]">No resume uploaded</span>
                                )}
                            </div>
                        </div>
                        <div className="mt-5"><DynamicApplicationForm fields={applicationFields} initialValues={initialApplicationValues} onSubmit={submitApplication} submitting={applying} /></div>
                        <div className="mt-3 flex justify-end"><button type="button" onClick={() => setApplicationFormOpen(false)} disabled={applying} className="rounded-[8px] border border-stone-200 px-4 py-2 text-[12.5px] font-semibold text-stone-600 hover:bg-stone-50">Cancel</button></div>
                    </div>
                </div>
            )}
            {referralOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true" aria-labelledby="refer-candidate-title">
                    <div className="w-full max-w-md rounded-[10px] border border-stone-200 bg-white p-5 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#A51D35]">Share an opportunity</p>
                                <h2 id="refer-candidate-title" className="mt-1 text-[19px] font-bold text-stone-900" style={{ fontFamily: FONT_DISPLAY }}>Refer a candidate</h2>
                                <p className="mt-1 text-[12.5px] leading-5 text-stone-500">Enter their unique ID to send them this job for {jobCompanyName || 'your company'}.</p>
                            </div>
                            <button type="button" onClick={() => setReferralOpen(false)} disabled={referralSubmitting} aria-label="Close referral dialog" className="text-xl leading-none text-stone-400 hover:text-stone-700">×</button>
                        </div>

                        <label className="mt-5 block">
                            <span className="mb-1.5 block text-[12px] font-semibold text-stone-700">Candidate unique ID</span>
                            <input
                                autoFocus
                                value={referralUniqueId}
                                onChange={(event) => {
                                    setSelectedReferralCandidate(null);
                                    setReferralUniqueId(event.target.value.toUpperCase());
                                }}
                                placeholder="Example: CH23DF437DB"
                                className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-[13px] uppercase text-stone-800 outline-none focus:border-[#8B1E2F] focus:ring-2 focus:ring-[#8B1E2F]/10"
                            />
                        </label>

                        <div className="mt-2 min-h-[42px]">
                            {referralLookupLoading && <p className="text-[12.5px] text-stone-500">Looking up candidate...</p>}
                            {referralCandidate && !referralLookupLoading && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedReferralCandidate(referralCandidate);
                                        setReferralUniqueId(referralCandidate.name);
                                        setReferralError('');
                                    }}
                                    className="w-full rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 text-left transition-colors hover:border-green-300 hover:bg-green-100"
                                >
                                    <p className="text-[13px] font-semibold text-green-900">{referralCandidate.name}</p>
                                    <p className="mt-0.5 text-[11.5px] text-green-700">{referralCandidate.uniqueId}</p>
                                </button>
                            )}
                            {referralError && <p className="text-[12.5px] font-medium text-red-600">{referralError}</p>}
                            {referralSuccess && <p className="text-[12.5px] font-medium text-green-700">{referralSuccess}</p>}
                        </div>

                        <div className="mt-3 flex justify-end gap-2">
                            <button type="button" onClick={() => setReferralOpen(false)} disabled={referralSubmitting} className="rounded-full border border-stone-200 px-4 py-2 text-[12.5px] font-semibold text-stone-600 hover:bg-stone-50">Close</button>
                            <button type="button" onClick={submitReferral} disabled={!(selectedReferralCandidate || referralCandidate) || referralSubmitting} className="inline-flex items-center gap-2 rounded-full bg-[#8B1E2F] px-5 py-2 text-[12.5px] font-semibold text-white hover:bg-[#701525] disabled:cursor-not-allowed disabled:opacity-50">
                                {referralSubmitting && <Loader2 size={13} className="animate-spin" />}
                                {referralSubmitting ? 'Referring...' : 'Refer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}