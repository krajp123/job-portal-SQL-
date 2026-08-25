import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import RecruiterNavbar from '../components/RecruiterNavbar';
import CandidateNavbar from '../components/CandidateNavbar';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import {
    ArrowLeft,
    ArrowRight,
    BriefcaseBusiness,
    Building2,
    CheckCircle2,
    ChevronRight,
    CircleHelp,
    Clock,
    CornerDownLeft,
    CreditCard,
    Compass,
    Headset,
    MousePointerClick,
    Mail,
    Phone,
    Search,
    Settings2,
    ShieldCheck,
    ShieldAlert,
    UserRound,
    ThumbsDown,
    ThumbsUp,
    TriangleAlert,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Content — every question ships with its own answer. Categories    */
/*  mirror the candidate / recruiter / billing / security surfaces    */
/*  that actually exist in the product. `personas` marks which side   */
/*  of the Recruiter / Job Seekers toggle a category belongs to —     */
/*  most categories are shared, two are persona-exclusive.            */
/* ------------------------------------------------------------------ */

const CATEGORIES = [
    {
        id: 'candidates',
        title: 'For Candidates',
        description: 'Build your profile and find your next opportunity.',
        icon: BriefcaseBusiness,
        accent: 'coral',
        personas: ['candidate'],
        topics: [
            {
                q: 'How do I create a candidate account?',
                a: 'Select "Sign up as Candidate" from the homepage, verify your email or phone with the OTP we send, and pay the one-time ₹9 registration fee to activate your account. Your Unique ID is generated the moment payment clears — use it along with your password to log in going forward.',
            },
            {
                q: 'How can I complete my profile?',
                a: 'Open Profile from your dashboard and fill in each section — personal details, education, skills, certifications, and projects. Every section saves independently, so you can edit one at a time. A completion badge at the top tracks your progress and tells recruiters your profile is fully verified.',
            },
            {
                q: 'How do I upload or update my resume?',
                a: 'Go to Profile → Resume and upload a PDF or DOCX file up to 5 MB. The new file replaces your previous resume immediately and becomes the version recruiters download when you apply to a job.',
            },
            {
                q: 'How can I search for jobs?',
                a: 'Use Find Jobs to search by title, skill, or company, then narrow results with the sticky filters for location, experience level, salary range, and job type. Save any filter combination so it\'s ready the next time you search.',
            },
            {
                q: 'How do I apply for a job?',
                a: 'Open a job listing and select Apply Now. Your latest resume and profile details are submitted automatically — no need to re-enter anything. You\'ll get a confirmation instantly, and the recruiter is notified the same moment.',
            },
            {
                q: 'How can I track my applications?',
                a: 'Applied Jobs shows every application on a pipeline timeline — Applied, Reviewed, Shortlisted, Interview, and Offer. Filter by status or company to see exactly where each application stands, and you\'ll get a notification the moment a recruiter moves it forward.',
            },
        ],
    },
    {
        id: 'recruiters',
        title: 'For Recruiters',
        description: 'Everything you need to attract and manage talent.',
        icon: Building2,
        accent: 'amber',
        personas: ['recruiter'],
        topics: [
            {
                q: 'How do I create a recruiter account?',
                a: 'Choose "Sign up as Recruiter", verify your work email, and set up your login. You can start browsing the dashboard right away — posting your first job just needs a completed company profile.',
            },
            {
                q: 'How can I complete my company profile?',
                a: 'Under Company Profile, add your logo, industry, team size, and a short description candidates will see on every job you post. Fields save inline as you edit, and a completion badge shows what\'s still missing.',
            },
            {
                q: 'How do I post a job?',
                a: 'From Jobs, select Post a Job and fill in the role, description, required skills, and compensation. Rich formatting — headings, bullet points, bold text — is supported directly in the description editor. The listing goes live as soon as you publish.',
            },
            {
                q: 'How can I edit or close a job?',
                a: 'Open the job from your Jobs list and choose Edit to update any field, or Close Job to stop accepting new applications. Closing a job keeps existing applicants visible in your pipeline — it just hides the listing from candidate search.',
            },
            {
                q: 'How do I manage applicants?',
                a: 'The Applicants workspace gives every job its own pipeline — Applied, Reviewed, Shortlisted, Interview, and Offer. Drag a candidate between stages, leave private notes, and schedule interviews without leaving the page.',
            },
            {
                q: 'How do I download a candidate resume?',
                a: 'Open any candidate\'s profile from your applicant list and select Download Resume. This pulls their most recently uploaded file, so you always get the current version.',
            },
        ],
    },
    {
        id: 'billing',
        title: 'Payments & Billing',
        description: 'Understand payments, invoices, and your wallet.',
        icon: CreditCard,
        accent: 'blue',
        personas: ['candidate', 'recruiter'],
        topics: [
            {
                q: 'What payment methods are supported?',
                a: 'We accept UPI, credit and debit cards, and net banking through Razorpay, plus payments directly from your JobPortal wallet balance. All transactions are encrypted end-to-end.',
            },
            {
                q: 'How does wallet payment work?',
                a: 'Add money to your wallet once through Razorpay, then use that balance to pay for job postings, subscriptions, or upgrades instantly — no repeated checkout. Every deduction and top-up is logged in your wallet ledger in real time.',
            },
            {
                q: 'Where can I view my transaction history?',
                a: 'Go to Wallet → Transactions to see every payment, refund, and wallet top-up with its date, amount, and status. Filter by type or date range to find a specific transaction quickly.',
            },
            {
                q: 'How can I download an invoice?',
                a: 'Open the transaction from your history and select Download Invoice to get a GST-compliant PDF, ready for your records or reimbursement.',
            },
            {
                q: 'What happens if a payment fails?',
                a: 'If a payment fails, no amount is deducted from your account — Razorpay reverses any authorization automatically within a few minutes. You can retry the payment right away from the same checkout screen.',
            },
            {
                q: 'What is the refund policy?',
                a: 'Wallet top-ups are refundable within 7 days if unused. Job posting and subscription charges become non-refundable once the listing goes live or the plan activates. Raise a request from Wallet → Transactions and our team responds within 2 business days.',
            },
        ],
    },
    {
        id: 'account',
        title: 'Account & Security',
        description: 'Keep your account details and data protected.',
        icon: ShieldCheck,
        accent: 'green',
        personas: ['candidate', 'recruiter'],
        topics: [
            {
                q: 'I forgot my password. What should I do?',
                a: 'Select Forgot Password on the login screen and enter your registered email or phone. We\'ll send a reset link or OTP — set a new password and you\'re back in immediately.',
            },
            {
                q: 'How do I change my password?',
                a: 'Go to Settings → Security, enter your current password, then set a new one. You\'ll get an email confirming the change so you know right away if it wasn\'t you.',
            },
            {
                q: 'How can I verify my email or phone?',
                a: 'Under Settings → Account, select Verify next to the unverified field and enter the OTP sent to you. Verified contact details unlock account recovery and important application alerts.',
            },
            {
                q: 'How do I update my account details?',
                a: 'Your name, contact information, and profile details can all be edited directly from Settings or Profile — changes save as soon as you confirm them, no separate approval step needed.',
            },
            {
                q: 'How can I delete my account?',
                a: 'Go to Settings → Account → Delete Account. We\'ll ask you to confirm with your password, and your data is permanently removed within 30 days in line with our privacy policy. This action can\'t be undone once the window closes.',
            },
            {
                q: 'What is your privacy and security policy?',
                a: 'We encrypt data in transit and at rest, never sell your personal information, and only share your profile with recruiters when you apply or make it visible in search. Full details are available in our Privacy Policy, linked in the site footer.',
            },
        ],
    },
    {
        id: 'safety',
        title: 'Report & Safety',
        description: 'Help us keep the JobPortal community trustworthy.',
        icon: TriangleAlert,
        accent: 'rose',
        personas: ['candidate', 'recruiter'],
        topics: [
            {
                q: 'How do I report a fake job?',
                a: 'Open the job listing and select Report Job, then choose "Suspicious or fake listing." Our trust and safety team reviews every report within 24 hours and removes confirmed violations immediately.',
            },
            {
                q: 'How can I report a recruiter or candidate?',
                a: 'Visit their profile and select Report Profile, or reach out to support@jobportal.com with the account name and a description of the issue. Reports are kept confidential from the reported user.',
            },
            {
                q: 'How do I report inappropriate content?',
                a: 'Use the Report option next to the message, job description, or profile section in question. Flag the specific reason so our review team can act on it faster.',
            },
            {
                q: 'What should I do about suspicious activity?',
                a: 'If you notice unusual account activity — logins you don\'t recognize, unexpected messages, or payment requests outside the platform — change your password immediately and contact support so we can lock down the account.',
            },
            {
                q: 'How are reports reviewed?',
                a: 'Every report is triaged by our trust and safety team within 24 hours. Depending on severity, outcomes range from a content takedown to a permanent account ban. You\'ll receive an email once your report has been resolved.',
            },
        ],
    },
];

const category = (id) => CATEGORIES.find((item) => item.id === id);
const HELP_CATEGORIES = [
    { ...category('candidates'), id: 'candidate-profile', title: 'Create JobPortal Profile', description: 'Set up your profile, resume, and skills.', icon: UserRound, topics: category('candidates').topics.slice(0, 3) },
    { ...category('candidates'), id: 'candidate-search', title: 'Search', description: 'Find relevant jobs faster.', icon: Search, topics: [category('candidates').topics[3]] },
    { ...category('candidates'), id: 'candidate-apply', title: 'Apply', description: 'Send applications and follow progress.', icon: MousePointerClick, topics: category('candidates').topics.slice(4, 6) },
    { ...category('candidates'), id: 'candidate-navigation', title: 'Getting around JobPortal', description: 'Use your dashboard and job tools.', icon: Compass, topics: [category('candidates').topics[3], category('candidates').topics[5]] },
    { ...category('account'), id: 'candidate-settings', title: 'Settings', description: 'Manage your account preferences.', icon: Settings2, topics: category('account').topics.slice(1, 5), personas: ['candidate'] },
    { ...category('safety'), id: 'candidate-security', title: 'Security Advice', description: 'Protect your account and personal data.', icon: ShieldAlert, topics: [category('account').topics[0], category('account').topics[5], ...category('safety').topics.slice(3, 5)], personas: ['candidate'] },
    { ...category('account'), id: 'recruiter-account', title: 'Account Management', description: 'Manage your company and recruiter account.', icon: Settings2, topics: [...category('recruiters').topics.slice(0, 2), ...category('account').topics.slice(1, 3)], personas: ['recruiter'] },
    { ...category('recruiters'), id: 'recruiter-posting', title: 'Job Posting', description: 'Create, edit, and manage job listings.', icon: BriefcaseBusiness, topics: category('recruiters').topics.slice(2, 4) },
    { ...category('recruiters'), id: 'recruiter-resdex', title: 'RESDEX', description: 'Review applicants and find candidate resumes.', icon: Search, topics: category('recruiters').topics.slice(4, 6) },
];

const ACCENT_STYLES = {
    coral: {
        icon: 'bg-[#FFF0E8] text-[#C75560]',
        line: 'bg-[#C75560]',
        solid: 'bg-[#C75560]',
        text: 'text-[#C75560]',
        border: 'border-[#C75560]',
        tileHover: 'group-hover:bg-[#C75560] group-hover:text-white',
    },
    amber: {
        icon: 'bg-[#FFF7DF] text-[#9A671A]',
        line: 'bg-[#E8A23A]',
        solid: 'bg-[#CE8A1F]',
        text: 'text-[#9A671A]',
        border: 'border-[#CE8A1F]',
        tileHover: 'group-hover:bg-[#CE8A1F] group-hover:text-white',
    },
    teal: {
        icon: 'bg-[#E7F6F1] text-[#277451]',
        line: 'bg-[#3D9B6D]',
        solid: 'bg-[#277451]',
        text: 'text-[#277451]',
        border: 'border-[#277451]',
        tileHover: 'group-hover:bg-[#277451] group-hover:text-white',
    },
    green: {
        icon: 'bg-[#EAF7F0] text-[#277451]',
        line: 'bg-[#3D9B6D]',
        solid: 'bg-[#277451]',
        text: 'text-[#277451]',
        border: 'border-[#277451]',
        tileHover: 'group-hover:bg-[#277451] group-hover:text-white',
    },
    rose: {
        icon: 'bg-[#FCECF0] text-[#A94658]',
        line: 'bg-[#A94658]',
        solid: 'bg-[#A94658]',
        text: 'text-[#A94658]',
        border: 'border-[#A94658]',
        tileHover: 'group-hover:bg-[#A94658] group-hover:text-white',
    },
};

const PERSONAS = [
    { id: 'recruiter', label: 'Recruiter' },
    { id: 'candidate', label: 'Candidate' },
];
const PERSONA_LABEL = { recruiter: 'Recruiter', candidate: 'Candidate' };

/** Flat, searchable index built once from CATEGORIES — every topic
 *  carries its parent category, persona reach, and its own index so
 *  search, trending links, and the detail panel can all jump to the
 *  exact same place. */
const SEARCH_INDEX = HELP_CATEGORIES.flatMap((category) =>
    category.topics.map((topic, topicIndex) => ({
        id: `${category.id}-${topicIndex}`,
        q: topic.q,
        a: topic.a,
        categoryId: category.id,
        categoryTitle: category.title,
        icon: category.icon,
        accent: category.accent,
        personas: category.personas,
        topicIndex,
    })),
);

const TRENDING_BY_PERSONA = {
    candidate: ['How can I complete my profile?', 'How can I search for jobs?', 'How do I apply for a job?', 'How do I change my password?'],
    recruiter: ['How do I create a recruiter account?', 'How do I post a job?', 'How do I manage applicants?', 'How do I download a candidate resume?'],
};

const CANDIDATE_CONCERN_OPTIONS = ['Account', 'Job search', 'Application / profile', 'Resume & documents', 'Report abuse', 'Other'];
const RECRUITER_CONCERN_OPTIONS = ['Account', 'Billing & payments', 'Job posting', 'Applicants & hiring', 'Team & access', 'Report abuse', 'Other'];

/* ------------------------------------------------------------------ */
/*  Persona toggle — keeps Recruiter and Job Seekers content separate, */
/*  exactly like the reference. Switching resets whichever topic was  */
/*  open, since the two sides don't share every category.             */
/* ------------------------------------------------------------------ */

function PersonaToggle({ persona, onChange }) {
    return (
        <div className="bg-[#FFF9F5] px-6 py-2.5 sm:px-10">
            <div className="mx-auto flex max-w-5xl justify-center">
                <div className="inline-flex rounded-full bg-[#2B2326] p-1 shadow-[0_8px_18px_-12px_rgba(43,35,38,0.8)]" role="group" aria-label="Choose help center audience">
                {PERSONAS.map((item) => {
                    const isActive = persona === item.id;
                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => onChange(item.id)}
                            aria-pressed={isActive}
                            className={`rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-all duration-200 sm:px-5 ${isActive ? 'bg-[#F7C56B] text-[#2B2326] shadow-sm' : 'text-[#F8EDE7] hover:bg-white/10 hover:text-white'}`}
                        >
                            {item.label}
                        </button>
                    );
                })}
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Search — input plus a live suggestion list anchored just below it, */
/*  scoped to whichever persona is currently active.                   */
/* ------------------------------------------------------------------ */

function HelpSearch({ persona, query, onQueryChange, onSelectTopic }) {
    const [isFocused, setIsFocused] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef(null);

    const suggestions = useMemo(() => {
        const trimmed = query.trim().toLowerCase();
        if (!trimmed) return [];
        return SEARCH_INDEX.filter((item) => item.personas.includes(persona) && item.q.toLowerCase().includes(trimmed)).slice(0, 6);
    }, [query, persona]);

    const isOpen = isFocused && query.trim().length > 0;

    useEffect(() => setActiveIndex(0), [query]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsFocused(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    function handleKeyDown(event) {
        if (!isOpen || !suggestions.length) return;
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((current) => (current + 1) % suggestions.length);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((current) => (current - 1 + suggestions.length) % suggestions.length);
        } else if (event.key === 'Enter') {
            event.preventDefault();
            const chosen = suggestions[activeIndex];
            if (chosen) {
                onSelectTopic(chosen);
                setIsFocused(false);
            }
        } else if (event.key === 'Escape') {
            setIsFocused(false);
        }
    }

    return (
        <div ref={containerRef} className="relative w-full">
            <div className="rounded-md bg-[#FFF4EF] p-1 shadow-[0_12px_24px_-16px_rgba(43,35,38,0.7)] ring-1 ring-[#EBC2AE] transition-shadow duration-200 focus-within:shadow-[0_16px_28px_-16px_rgba(247,197,107,0.45)]">
                <label className="flex items-center gap-3 px-3">
                    <Search size={18} className="shrink-0 text-[#8D6072]" />
                    <input
                        type="search"
                        value={query}
                        onChange={(event) => onQueryChange(event.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search by keyword..."
                        aria-label="Search help articles"
                        role="combobox"
                        aria-expanded={isOpen}
                        aria-controls="help-search-suggestions"
                        autoComplete="off"
                        className="min-w-0 flex-1 bg-transparent py-1.5 text-xs text-[#1D181A] outline-none placeholder:text-[#8D6072]"
                    />
                    {query && (
                        <button type="button" onClick={() => onQueryChange('')} className="px-2 text-xs font-bold text-[#A94658] transition-colors hover:text-[#C75560]">
                            Clear
                        </button>
                    )}
                </label>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.ul
                        id="help-search-suggestions"
                        role="listbox"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.16, ease: 'easeOut' }}
                        className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-[#EADBD4] bg-white text-left shadow-[0_18px_35px_-22px_rgba(73,43,49,0.55)]"
                    >
                        {suggestions.length ? (
                            suggestions.map((item, index) => {
                                const Icon = item.icon;
                                const accent = ACCENT_STYLES[item.accent];
                                return (
                                    <li key={item.id} role="option" aria-selected={index === activeIndex}>
                                        <button
                                            type="button"
                                            onMouseEnter={() => setActiveIndex(index)}
                                            onClick={() => {
                                                onSelectTopic(item);
                                                setIsFocused(false);
                                            }}
                                            className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${index === activeIndex ? 'bg-[#FFF4EF]' : 'bg-white'}`}
                                        >
                                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${accent.icon}`}>
                                                <Icon size={15} strokeWidth={2.2} />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-semibold text-[#1D181A]">{item.q}</span>
                                                <span className="block text-[11px] font-medium uppercase tracking-wide text-[#91A0B2]">{item.categoryTitle}</span>
                                            </span>
                                            {index === activeIndex && <CornerDownLeft size={14} className="shrink-0 text-[#8D6072]" />}
                                        </button>
                                    </li>
                                );
                            })
                        ) : (
                            <li className="px-4 py-6 text-center text-sm text-[#80576A]">
                                No matches for "{query}". Try a different word or contact support below.
                            </li>
                        )}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Hero — gradient band housing the headline, search, and the        */
/*  trending-questions strip. Trending picks change with the persona. */
/* ------------------------------------------------------------------ */

function DotGrid({ className }) {
    return (
        <div
            aria-hidden="true"
            className={className}
            style={{
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1px)',
                backgroundSize: '18px 18px',
                maskImage: 'radial-gradient(ellipse at center, black 0%, transparent 75%)',
                WebkitMaskImage: 'radial-gradient(ellipse at center, black 0%, transparent 75%)',
            }}
        />
    );
}

function HelpHero({ persona, query, onQueryChange, onSelectTopic, showTopicSearch }) {
    const trending = useMemo(
        () => TRENDING_BY_PERSONA[persona].map((q) => SEARCH_INDEX.find((item) => item.q === q && item.personas.includes(persona))),
        [persona],
    );

    const heroVariants = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };
    const itemVariants = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } } };

    if (showTopicSearch) {
        return (
            <section className="bg-[#F7F3EF] px-6 py-3 sm:px-10">
                <div className="mx-auto max-w-xl">
                    <HelpSearch persona={persona} query={query} onQueryChange={onQueryChange} onSelectTopic={onSelectTopic} />
                </div>
            </section>
        );
    }

    return (
        <section className="relative overflow-hidden bg-gradient-to-b from-[#C75560] via-[#7A3656] to-[#2B2326] px-6 pb-8 pt-8 sm:px-10 sm:pt-10">
            <DotGrid className="pointer-events-none absolute -right-10 top-10 h-72 w-72" />
            <div className="pointer-events-none absolute -left-24 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full border-[28px] border-white/5" aria-hidden="true" />

            <motion.div key={persona} variants={heroVariants} initial="hidden" animate="show" className="relative mx-auto max-w-3xl text-center">
                <motion.h1 variants={itemVariants} className="text-3xl font-bold leading-tight text-white sm:text-4xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    Hi, how can we help you?
                </motion.h1>
                <motion.p variants={itemVariants} className="mx-auto mt-2 max-w-md text-xs leading-5 text-[#C9D8EA] sm:text-sm">
                    Search our library or jump straight to what {persona === 'recruiter' ? 'recruiters' : 'candidates'} ask us most.
                </motion.p>

                <motion.div variants={itemVariants} className="mx-auto mt-5 max-w-xl">
                    <HelpSearch persona={persona} query={query} onQueryChange={onQueryChange} onSelectTopic={onSelectTopic} />
                </motion.div>
            </motion.div>

            <motion.div key={`${persona}-trending`} variants={heroVariants} initial="hidden" animate="show" className="relative mx-auto mt-7 max-w-5xl border-t border-white/10 pt-5">
                <motion.p variants={itemVariants} className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[#7C97B8]">
                    Popular questions
                </motion.p>
                <motion.div variants={itemVariants} className="mt-3 grid gap-x-5 gap-y-3 sm:grid-cols-2 sm:divide-x sm:divide-white/10 lg:grid-cols-4">
                    {trending.map((item, index) => (
                        <button key={item.id} type="button" onClick={() => onSelectTopic(item)} className={`group flex items-start gap-2.5 text-left ${index > 0 ? 'sm:pl-6' : ''}`}>
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/10 text-[10px] font-bold text-[#F7C56B]">Q</span>
                            <span className="text-[13px] leading-5 text-[#D6E2F0] transition-colors group-hover:text-white">
                                {item.q}
                                <ArrowRight size={12} className="ml-1 inline -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
                            </span>
                        </button>
                    ))}
                </motion.div>
            </motion.div>
        </section>
    );
}

/* ------------------------------------------------------------------ */
/*  Topic tiles — always visible. Clicking one reveals the two-column  */
/*  panel below; the active tile stays highlighted while it's open.   */
/* ------------------------------------------------------------------ */

function TopicTiles({ categories, activeCategoryId, onSelect }) {
    return (
        <section className="bg-[#F7F3EF] px-6 py-4 sm:px-10">
            <div className="mx-auto flex max-w-5xl snap-x gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:justify-center sm:overflow-visible">
                {categories.map((category) => {
                    const Icon = category.icon;
                    const accent = ACCENT_STYLES[category.accent];
                    const isActive = activeCategoryId === category.id;
                    return (
                        <motion.button
                            key={category.id}
                            type="button"
                            onClick={() => onSelect(category.id)}
                            aria-pressed={isActive}
                            whileHover={{ y: -4, scale: 1.02 }}
                            whileTap={{ scale: 0.96 }}
                            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                            className={`group flex w-32 shrink-0 snap-start flex-col items-center gap-1.5 rounded-lg border p-2.5 text-center transition-all duration-200 sm:w-36 ${
                                isActive
                                    ? `${accent.solid} border-transparent shadow-[0_16px_30px_-14px_rgba(29,24,26,0.45)]`
                                    : 'border-[#EADBD4] bg-white hover:-translate-y-1 hover:border-transparent hover:shadow-[0_16px_30px_-18px_rgba(29,24,26,0.35)]'
                            }`}
                        >
                            <motion.span
                                animate={isActive ? { rotate: [0, -6, 6, 0], scale: [1, 1.08, 1] } : { rotate: 0, scale: 1 }}
                                transition={{ duration: 0.35 }}
                                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-200 ${isActive ? 'bg-white/20 text-white' : `${accent.icon} ${accent.tileHover}`}`}
                            >
                                <Icon size={17} strokeWidth={2.2} />
                            </motion.span>
                            <span className={`text-[10px] font-bold leading-tight ${isActive ? 'text-white' : 'text-[#3F3438]'}`}>{category.title}</span>
                        </motion.button>
                    );
                })}
            </div>
        </section>
    );
}

/* ------------------------------------------------------------------ */
/*  Detail panel — breadcrumb + left question list + right answer,    */
/*  exactly the pattern from the reference screenshots.                */
/* ------------------------------------------------------------------ */

function TopicDetailPanel({ persona, category, activeTopicIndex, onSelectTopicIndex, onBack }) {
    const [feedback, setFeedback] = useState(null);
    const accent = ACCENT_STYLES[category.accent];
    const activeTopic = category.topics[activeTopicIndex];

    useEffect(() => setFeedback(null), [activeTopicIndex, category.id]);

    return (
        <motion.div
            id="topic-detail-panel"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="mx-auto max-w-5xl px-6 py-6 sm:px-10 sm:py-8"
        >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-medium text-[#91A0B2]">
                    <Link to="/" className="hover:text-[#277451]">Home</Link>
                    <ChevronRight size={12} />
                    <span>{PERSONA_LABEL[persona]}</span>
                    <ChevronRight size={12} />
                    <span className={accent.text}>{category.title}</span>
                </nav>
                <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#80576A] transition-colors hover:text-[#C75560]">
                    <ArrowLeft size={13} /> All topics
                </button>
            </div>

            <h2 className="mb-4 text-xl font-bold text-[#1D181A]">{category.title}</h2>

            <div className="grid gap-6 md:grid-cols-[280px_1fr]">
                <div className="overflow-hidden rounded-2xl border border-[#EADBD4] bg-white">
                    <ul>
                        {category.topics.map((topic, index) => {
                            const isActive = index === activeTopicIndex;
                            return (
                                <li key={topic.q} className="border-b border-[#F0E1D6] last:border-b-0">
                                    <button
                                        type="button"
                                        onClick={() => onSelectTopicIndex(index)}
                                        aria-current={isActive}
                                        className={`block w-full border-l-[3px] px-4 py-3 text-left text-[13px] leading-5 transition-colors ${
                                            isActive ? `${accent.border} bg-[#FFF9F5] font-semibold text-[#1D181A]` : 'border-transparent text-[#53657D] hover:bg-[#FAF6F2]'
                                        }`}
                                    >
                                        {topic.q}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTopic.q}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="rounded-2xl border border-[#EADBD4] bg-white p-6 sm:p-7"
                    >
                        <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${accent.text}`}>{category.title}</p>
                        <h3 className="mt-1.5 text-lg font-bold leading-6 text-[#1D181A]">{activeTopic.q}</h3>
                        <p className="mt-4 text-[13.5px] leading-6 text-[#3F3438]">{activeTopic.a}</p>

                        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[#F0E1D6] pt-5">
                            {feedback ? (
                                <p className="text-xs font-semibold text-[#277451]">Thanks for your feedback!</p>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-[#91A0B2]">Was this article helpful?</span>
                                    <button type="button" onClick={() => setFeedback('up')} aria-label="Yes, helpful" className="flex h-7 w-7 items-center justify-center rounded-full text-[#80576A] transition-colors hover:bg-[#EAF7F0] hover:text-[#277451]">
                                        <ThumbsUp size={14} />
                                    </button>
                                    <button type="button" onClick={() => setFeedback('down')} aria-label="Not helpful" className="flex h-7 w-7 items-center justify-center rounded-full text-[#80576A] transition-colors hover:bg-[#FCECF0] hover:text-[#A94658]">
                                        <ThumbsDown size={14} />
                                    </button>
                                </div>
                            )}
                            <a href="mailto:support@jobportal.com" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#277451] hover:text-[#A94658]">
                                <Mail size={13} /> Email support
                            </a>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

/* ------------------------------------------------------------------ */
/*  Empty state — shown only if a persona somehow yields no categories */
/*  for the current query (kept for robustness, mirrors the old grid). */
/* ------------------------------------------------------------------ */

function NoTopicSelectedHint() {
    return (
        <div className="w-full bg-[#F7F3EF] px-6 py-7 text-center sm:px-10">
            <CircleHelp className="mx-auto text-[#C75560]" size={28} />
            <p className="mt-3 text-sm text-[#80576A]">Pick a topic above to see its questions, or search for something specific.</p>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Contact band — support info plus a "report a problem" form, in    */
/*  the same navy tone the hero opens with.                            */
/* ------------------------------------------------------------------ */

function ContactSection() {
    const { user } = useAuth();
    const CONCERN_OPTIONS = user?.role === 'recruiter' ? RECRUITER_CONCERN_OPTIONS : CANDIDATE_CONCERN_OPTIONS;
    const [form, setForm] = useState({ name: '', email: '', phone: '', concern: '', message: '' });
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const accountName = user?.name || user?.fullName || '';
    const accountEmail = user?.email || user?.companyEmail || '';
    const accountPhone = user?.phone || '';

    useEffect(() => {
        if (!user) return;
        setForm((current) => ({
            ...current,
            name: current.name || accountName,
            email: current.email || accountEmail,
            phone: current.phone || accountPhone,
        }));
    }, [user, accountName, accountEmail, accountPhone]);

    function updateField(field) {
        return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            await axiosInstance.post('/help-center/reports', form);
            setSubmitted(true);
            setForm({ name: '', email: '', phone: '', concern: '', message: '' });
        } catch (requestError) {
            setError(requestError.response?.data?.error || 'Unable to submit your support request.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative overflow-hidden border-t border-[#EADBD4] bg-[#F7F3EF] px-6 py-8 text-[#1D181A] sm:px-10 sm:py-10"
        >
            <DotGrid className="pointer-events-none absolute -left-10 -top-10 h-64 w-64" />
            <div className="relative mx-auto grid max-w-5xl gap-10 md:grid-cols-2">
                <div>
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F7C56B] text-[#1D181A]">
                        <Headset size={20} />
                    </span>
                    <h2 className="mt-3 text-xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        JobPortal Support
                    </h2>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-[#80576A]">Didn't find your answer? Reach out directly and our team will get back to you.</p>

                    <div className="mt-7 space-y-4">
                        <div>
                            <p className="flex items-center gap-2 text-sm font-semibold text-[#2B2326]">
                                <Phone size={14} /> 1800 123 4567 (toll-free)
                            </p>
                            <p className="mt-1.5 flex items-center gap-2 pl-[22px] text-xs text-[#8D6072]">
                                <Clock size={12} /> Mon–Sat, 9:30 AM – 6:30 PM
                            </p>
                        </div>
                        <div>
                            <a href="mailto:support@jobportal.com" className="flex items-center gap-2 text-sm font-semibold text-[#2B2326] hover:text-[#C75560]">
                                <Mail size={14} /> support@jobportal.com
                            </a>
                            <p className="mt-1.5 flex items-center gap-2 pl-[22px] text-xs text-[#8D6072]">
                                <Clock size={12} /> Replies within 2 business days
                            </p>
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-md justify-self-end rounded-2xl bg-white p-6 text-[#1D181A] sm:p-7">
                    {submitted ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                            <CheckCircle2 className="text-[#277451]" size={34} />
                            <p className="text-sm font-bold">Thanks — we've got it.</p>
                            <p className="max-w-xs text-xs leading-5 text-[#80576A]">Our support team will reach out within 2 business days.</p>
                            <button type="button" onClick={() => setSubmitted(false)} className="mt-1 text-xs font-bold text-[#277451] hover:text-[#A94658]">
                                Submit another request
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <h3 className="text-base font-bold text-[#1D181A]">Report a problem / need assistance</h3>
                            {error && <p className="rounded-lg bg-[#FCECF0] px-3 py-2 text-xs font-semibold text-[#A94658]">{error}</p>}
                            <input
                                type="text"
                                required
                                value={form.name}
                                onChange={updateField('name')}
                                placeholder="Enter your name"
                                name="help-center-contact-name"
                                autoComplete="new-password"
                                className="w-full rounded-lg border border-[#EADBD4] bg-[#FAF6F2] px-3 py-2 text-xs outline-none transition-colors focus:border-[#277451] focus:bg-white"
                            />
                            {accountName && form.name !== accountName && <button type="button" onClick={() => setForm((current) => ({ ...current, name: accountName }))} className="-mt-2 block text-left text-[11px] font-semibold text-[#277451] hover:text-[#A94658]">Use profile name: {accountName}</button>}
                            <input
                                type="text"
                                required
                                value={form.email}
                                onChange={updateField('email')}
                                placeholder="Enter your registered email ID"
                                name="help-center-contact-email"
                                inputMode="email"
                                autoComplete="new-password"
                                className="w-full rounded-lg border border-[#EADBD4] bg-[#FAF6F2] px-3 py-2 text-xs outline-none transition-colors focus:border-[#277451] focus:bg-white"
                            />
                            {accountEmail && form.email !== accountEmail && <button type="button" onClick={() => setForm((current) => ({ ...current, email: accountEmail }))} className="-mt-2 block text-left text-[11px] font-semibold text-[#277451] hover:text-[#A94658]">Use profile email: {accountEmail}</button>}
                            <input
                                type="tel"
                                value={form.phone}
                                onChange={updateField('phone')}
                                placeholder="Enter your contact number"
                                className="w-full rounded-lg border border-[#EADBD4] bg-[#FAF6F2] px-3 py-2 text-xs outline-none transition-colors focus:border-[#277451] focus:bg-white"
                            />
                            <select
                                required
                                value={form.concern}
                                onChange={updateField('concern')}
                                className="w-full rounded-lg border border-[#EADBD4] bg-[#FAF6F2] px-3 py-2 text-xs text-[#1D181A] outline-none transition-colors focus:border-[#277451] focus:bg-white"
                            >
                                <option value="" disabled>Select area of concern</option>
                                {CONCERN_OPTIONS.map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                            <textarea
                                required
                                rows={3}
                                value={form.message}
                                onChange={updateField('message')}
                                placeholder="Enter your feedback"
                                className="w-full resize-none rounded-lg border border-[#EADBD4] bg-[#FAF6F2] px-3 py-2 text-xs outline-none transition-colors focus:border-[#277451] focus:bg-white"
                            />
                            <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-lg bg-[#277451] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#1D181A] disabled:opacity-60">
                                {submitting ? 'Submitting...' : 'Submit'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </motion.section>
    );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function HelpCenter() {
    const { user } = useAuth();
    const [persona, setPersona] = useState('candidate');
    const [query, setQuery] = useState('');
    const [topicSelected, setTopicSelected] = useState(false);
    const [activeCategoryId, setActiveCategoryId] = useState(null);
    const [activeTopicIndex, setActiveTopicIndex] = useState(0);

    const categoriesForPersona = useMemo(() => HELP_CATEGORIES.filter((category) => category.personas.includes(persona)), [persona]);
    const activeCategory = categoriesForPersona.find((category) => category.id === activeCategoryId) || null;

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, []);

    function handlePersonaChange(nextPersona) {
        setPersona(nextPersona);
        setTopicSelected(false);
        setActiveCategoryId(null);
        setActiveTopicIndex(0);
        setQuery('');
    }

    function handleTileSelect(categoryId) {
        setTopicSelected(true);
        setActiveCategoryId((current) => (current === categoryId ? null : categoryId));
        setActiveTopicIndex(0);
    }

    function openTopic(item) {
        setTopicSelected(true);
        setActiveCategoryId(item.categoryId);
        setActiveTopicIndex(item.topicIndex);
    }

    return (
        <div className="min-h-screen bg-[#FFF9F5] text-[#1D181A]">
            {user?.role === 'recruiter' ? <RecruiterNavbar /> : <CandidateNavbar />}
            <PersonaToggle persona={persona} onChange={handlePersonaChange} />
            <main>
                <HelpHero
                    persona={persona}
                    query={query}
                    onQueryChange={setQuery}
                    onSelectTopic={openTopic}
                    showTopicSearch={topicSelected}
                />
                <TopicTiles
                    categories={categoriesForPersona}
                    activeCategoryId={activeCategoryId}
                    onSelect={handleTileSelect}
                />

                {activeCategory ? (
                    <TopicDetailPanel
                        persona={persona}
                        category={activeCategory}
                        activeTopicIndex={activeTopicIndex}
                        onSelectTopicIndex={setActiveTopicIndex}
                        onBack={() => {
                            setActiveCategoryId(null);
                            setTopicSelected(false);
                        }}
                    />
                ) : (
                    <NoTopicSelectedHint />
                )}

                <ContactSection />
            </main>
        </div>
    );
}