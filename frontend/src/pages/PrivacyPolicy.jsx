import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowLeft,
    ArrowUpRight,
    BadgeCheck,
    Baby,
    Cookie,
    Database,
    FileText,
    Globe,
    Mail,
    Printer,
    RefreshCw,
    Scale,
    ScrollText,
    Share2,
    ShieldCheck,
    Users,
} from 'lucide-react';
import CandidateNavbar from '../components/CandidateNavbar';
import RecruiterNavbar from '../components/RecruiterNavbar';
import { useAuth } from '../context/AuthContext';

const EFFECTIVE_DATE = 'August 24, 2026';
const DOC_ID = 'POL-PRIV-04';

const SECTIONS = [
    {
        id: 'scope',
        num: '01',
        title: 'Scope & Acceptance',
        icon: ScrollText,
        paragraphs: [
            'This Privacy Policy explains how JobHub ("JobHub", "we", "us") collects, uses, shares, and safeguards information when you use roledeck.com as a candidate, a recruiter, or a visitor to the platform.',
            'By creating an account or otherwise using JobHub, you agree to the practices described in this policy. If any part of it is unclear or you disagree with it, please contact us before continuing to use the platform.',
        ],
    },
    {
        id: 'collect',
        num: '02',
        title: 'Information We Collect',
        icon: Database,
        paragraphs: [
            'We collect information directly from you, automatically as you use JobHub, and in limited cases from third parties such as our payment processor.',
        ],
        list: [
            { label: 'Account details', text: 'name, email address, phone number, and password.' },
            { label: 'Candidate profile & resume data', text: 'work history, education, skills, and uploaded resumes, including the data our ATS analysis extracts from a resume to help match you to roles.' },
            { label: 'Recruiter & company information', text: 'company name, size, verification documents, and job postings you publish.' },
            { label: 'Application & communication data', text: 'applications submitted, messages exchanged on the platform, interview scheduling, and offers.' },
            { label: 'Payment information', text: 'subscription and billing details processed by Razorpay; JobHub does not store your full card or bank account numbers.' },
            { label: 'Usage & device data', text: 'IP address, browser type, device information, and pages viewed, collected automatically through log files and cookies.' },
        ],
    },
    {
        id: 'use',
        num: '03',
        title: 'How We Use Your Information',
        icon: BadgeCheck,
        paragraphs: ['We use the information we collect to:'],
        list: [
            { text: 'Operate, secure, and personalize your candidate or recruiter dashboard.' },
            { text: 'Match candidates to relevant roles through our ATS resume analysis.' },
            { text: 'Facilitate applications, messaging, interview scheduling, and offers between candidates and recruiters.' },
            { text: 'Process premium subscription payments through Razorpay.' },
            { text: 'Review and verify recruiter and company accounts before they can post jobs.' },
            { text: 'Send account, application, and billing notifications you\u2019ve opted into.' },
            { text: 'Detect and prevent fraud, spam, and misuse of the platform.' },
            { text: 'Meet our legal, tax, and regulatory obligations.' },
        ],
    },
    {
        id: 'share',
        num: '04',
        title: 'How We Share Information',
        icon: Share2,
        paragraphs: [
            'We do not sell your personal information. We share it only in the following circumstances:',
        ],
        list: [
            { label: 'With recruiters', text: 'when you apply to a job or set your candidate profile to visible.' },
            { label: 'With candidates', text: 'recruiter and company details are shown as part of job listings you view or apply to.' },
            { label: 'With service providers', text: 'hosting, cloud storage, payments (Razorpay), and email/SMS delivery partners, bound by confidentiality and data-protection obligations.' },
            { label: 'For legal reasons', text: 'to comply with applicable law, enforce our Terms of Service, or protect the rights, safety, and property of JobHub, our users, or the public.' },
            { label: 'In a business transfer', text: 'if JobHub is involved in a merger, acquisition, or sale of assets, with notice to affected users.' },
        ],
    },
    {
        id: 'visibility',
        num: '05',
        title: 'Profile Visibility & Candidate Controls',
        icon: Users,
        paragraphs: [
            'Candidates decide how discoverable their profile is. From your account settings you can set your profile to visible so recruiters can find you, switch to private so only recruiters you\u2019ve applied to can view it, withdraw an application at any time, and remove an uploaded resume from your profile.',
            'Applying to a specific role always shares the profile information relevant to that application with the posting recruiter, independent of your general visibility setting.',
        ],
    },
    {
        id: 'cookies',
        num: '06',
        title: 'Cookies & Tracking Technologies',
        icon: Cookie,
        paragraphs: [
            'JobHub uses essential cookies to keep you signed in and to maintain security, along with analytics and preference cookies that help us understand how the platform is used and remember your settings.',
            'You can control or disable non-essential cookies through your browser settings. Blocking essential cookies may prevent parts of JobHub, such as staying signed in, from working correctly.',
        ],
    },
    {
        id: 'retention',
        num: '07',
        title: 'Data Retention',
        icon: FileText,
        paragraphs: [
            'We keep your information for as long as your account is active and as needed to provide our services.',
        ],
        list: [
            { text: 'Application records are kept for the hiring cycle and a reasonable period after, for dispute resolution and audit purposes.' },
            { text: 'Payment and billing records are retained as required under applicable tax and financial regulations.' },
            { text: 'When you delete your account, we remove or anonymize your personal data within 90 days, except where we\u2019re required to retain it by law or to resolve an open dispute.' },
        ],
    },
    {
        id: 'security',
        num: '08',
        title: 'Data Security',
        icon: ShieldCheck,
        paragraphs: [
            'We use industry-standard safeguards to protect your information, including TLS encryption in transit, password hashing, role-based access controls, and restricted, audited access to our recruiter and admin panels.',
            'No system is completely secure. If you believe your account or data has been compromised, contact us immediately at security@roledeck.com.',
        ],
    },
    {
        id: 'rights',
        num: '09',
        title: 'Your Rights & Choices',
        icon: Scale,
        paragraphs: [
            'You can access, correct, or download your profile information at any time from your account settings, and can request deletion of your account and associated data.',
            'If you\u2019re located in India, you may exercise the rights available to you as a data principal under the Digital Personal Data Protection Act, 2023, including the right to withdraw consent and to seek correction or erasure of your personal data, by writing to privacy@roledeck.com.',
        ],
    },
    {
        id: 'children',
        num: '10',
        title: 'Children\u2019s Privacy',
        icon: Baby,
        paragraphs: [
            'JobHub is a job-search platform intended for users who are at least 18 years old or the legal working age in their jurisdiction. We do not knowingly collect information from children, and we remove any such data promptly if we become aware of it.',
        ],
    },
    {
        id: 'international',
        num: '11',
        title: 'International Users & Data Transfers',
        icon: Globe,
        paragraphs: [
            'JobHub primarily serves candidates and recruiters in India. Depending on where our hosting and infrastructure providers operate, your information may be processed or stored outside your home country. Where that happens, we require providers to apply safeguards consistent with this policy.',
        ],
    },
    {
        id: 'changes',
        num: '12',
        title: 'Changes to This Policy',
        icon: RefreshCw,
        paragraphs: [
            'We may update this Privacy Policy from time to time as JobHub evolves. Material changes will be announced by email or an in-app notice before they take effect. The date at the top of this page always reflects the most recent revision.',
        ],
    },
];

export default function PrivacyPolicy() {
    const { user } = useAuth();
    const [activeId, setActiveId] = useState(SECTIONS[0].id);
    const sectionRefs = useRef({});

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible.length > 0) {
                    setActiveId(visible[0].target.dataset.sectionId);
                }
            },
            { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
        );

        Object.values(sectionRefs.current).forEach((el) => {
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    const scrollToSection = (id) => {
        sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="min-h-screen bg-[#FFF9F5] text-[#241A1E]">
            {user?.role === 'recruiter' ? <RecruiterNavbar /> : <CandidateNavbar />}

            <main>
                {/* Masthead */}
                <section
                    className="relative overflow-hidden bg-gradient-to-br from-[#5C1B26] via-[#7A2333] to-[#C75560] px-6 pb-8 pt-6 sm:px-10 sm:pb-10 sm:pt-8"
                    style={{ clipPath: 'ellipse(100% 100% at 50% 0%)' }}
                >
                    <div
                        className="pointer-events-none absolute inset-0 opacity-[0.08]"
                        style={{
                            backgroundImage:
                                'repeating-linear-gradient(135deg, #fff 0px, #fff 1px, transparent 1px, transparent 22px)',
                        }}
                    />
                    <div className="relative mx-auto max-w-5xl">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-white/70 transition-colors hover:text-white"
                        >
                            <ArrowLeft size={14} /> Back to home
                        </Link>

                        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#F3C9AE]">
                                    Data protection notice
                                </p>
                                <h1
                                    className="mt-1 text-2xl font-bold leading-[1.05] text-white sm:text-4xl"
                                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                                >
                                    Privacy Policy
                                </h1>
                                <p className="mt-2 max-w-xl text-xs leading-5 text-white/80 sm:text-sm">
                                    How JobHub collects, uses, shares, and protects your information across
                                    roledeck.com &mdash; for candidates, recruiters, and everyone in between.
                                </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-3 rounded-md border border-white/25 bg-white/10 px-3 py-2 backdrop-blur-sm">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/15 text-white">
                                    <ShieldCheck size={20} />
                                </span>
                                <div className="text-left">
                                    <p
                                        className="text-[11px] uppercase tracking-[0.14em] text-white/60"
                                        style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
                                    >
                                        Doc {DOC_ID}
                                    </p>
                                    <p className="text-sm font-bold text-white">Effective {EFFECTIVE_DATE}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative mx-auto mt-4 h-px max-w-5xl bg-gradient-to-r from-transparent via-[#E7B667]/70 to-transparent" />
                </section>

                {/* Intro strip */}
                <section
                    className="relative mt-4 overflow-hidden border-b border-[#D7DED5] bg-[#EEF1EC] px-6 py-5 sm:mt-6 sm:px-10 sm:py-6"
                    style={{
                        backgroundImage:
                            'linear-gradient(90deg, rgba(92,27,38,0.04) 1px, transparent 1px), linear-gradient(rgba(92,27,38,0.04) 1px, transparent 1px)',
                        backgroundSize: '28px 28px',
                    }}
                >
                    <div className="relative mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-start sm:gap-6">
                        <p
                            className="shrink-0 pt-0.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#7A2333]"
                            style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
                        >
                            At a glance
                        </p>
                        <p className="max-w-4xl text-sm leading-6 text-[#3E4B43]">
                            <strong className="font-bold text-[#241A1E]">JobHub connects candidates and recruiters</strong>{' '}
                            through a trusted hiring marketplace. This notice explains how we handle information for
                            <span className="mx-1 inline-block font-bold text-[#7A2333]">all roledeck.com users</span>
                            and provides a clear reference for each section of this policy, including{' '}
                            <span className="font-bold text-[#7A2333]">&sect; 05, Profile Visibility &amp; Candidate Controls</span>.
                        </p>
                    </div>
                </section>

                {/* Body: index rail + sections */}
                <section className="mx-auto max-w-6xl px-6 py-12 sm:px-10 sm:py-16">
                    {/* Mobile index (horizontal pills) */}
                    <div className="mb-8 -mx-6 flex gap-2 overflow-x-auto px-6 pb-2 lg:hidden">
                        {SECTIONS.map((s) => (
                            <button
                                key={s.id}
                                onClick={() => scrollToSection(s.id)}
                                className={`shrink-0 rounded-md border px-3 py-1 text-xs font-bold transition-colors ${
                                    activeId === s.id
                                        ? 'border-[#5C1B26] bg-[#5C1B26] text-white'
                                        : 'border-[#EADBD4] bg-white text-[#80576A]'
                                }`}
                            >
                                {s.num}&ensp;{s.title}
                            </button>
                        ))}
                    </div>

                    <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
                        {/* Desktop sticky index rail */}
                        <nav className="hidden lg:block">
                            <div className="sticky top-8 border-l border-[#EADBD4] pl-5">
                                <p
                                    className="mb-4 text-[11px] font-bold uppercase tracking-[0.16em] text-[#B08A97]"
                                    style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
                                >
                                    Contents
                                </p>
                                <ul className="space-y-1">
                                    {SECTIONS.map((s) => (
                                        <li key={s.id}>
                                            <button
                                                onClick={() => scrollToSection(s.id)}
                                                className={`group flex w-full items-baseline gap-2.5 rounded-md py-1.5 text-left text-[13px] leading-tight transition-colors ${
                                                    activeId === s.id
                                                        ? 'font-bold text-[#5C1B26]'
                                                        : 'text-[#80576A] hover:text-[#5C1B26]'
                                                }`}
                                            >
                                                <span
                                                    className={`text-[11px] ${
                                                        activeId === s.id ? 'text-[#C75560]' : 'text-[#C9AEB6]'
                                                    }`}
                                                    style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
                                                >
                                                    {s.num}
                                                </span>
                                                <span>{s.title}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => window.print()}
                                    className="mt-6 inline-flex items-center gap-1.5 text-[12px] font-bold text-[#80576A] transition-colors hover:text-[#C75560]"
                                >
                                    <Printer size={13} /> Print this policy
                                </button>
                            </div>
                        </nav>

                        {/* Sections */}
                        <div className="space-y-6">
                            {SECTIONS.map(({ id, num, title, icon: Icon, paragraphs, list }) => (
                                <article
                                    key={id}
                                    id={id}
                                    data-section-id={id}
                                    ref={(el) => (sectionRefs.current[id] = el)}
                                    className="scroll-mt-24 rounded-md border border-[#EADBD4] bg-white p-4 shadow-[0_18px_35px_-28px_rgba(73,43,49,0.35)] sm:scroll-mt-28 sm:p-6"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#FFF0E8] text-[#C75560]">
                                            <Icon size={19} />
                                        </span>
                                        <div>
                                            <p
                                                className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#C9AEB6]"
                                                style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
                                            >
                                                &sect; {num}
                                            </p>
                                            <h2
                                                className="text-lg font-bold text-[#2B2326] sm:text-xl"
                                                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                                            >
                                                {title}
                                            </h2>
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-3 border-t border-[#F3E9E3] pt-4">
                                        {paragraphs.map((p, i) => (
                                            <p key={i} className="text-[14px] leading-7 text-[#4A3E43]">
                                                {p}
                                            </p>
                                        ))}

                                        {list && (
                                            <ul className="mt-2 space-y-2.5">
                                                {list.map((item, i) => (
                                                    <li key={i} className="flex gap-2.5 text-[14px] leading-6 text-[#4A3E43]">
                                                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E7B667]" />
                                                        <span>
                                                            {item.label && (
                                                                <span className="font-bold text-[#2B2326]">{item.label}: </span>
                                                            )}
                                                            {item.text}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </article>
                            ))}

                            {/* Contact / signature block */}
                            <article className="rounded-md border border-[#5C1B26]/15 bg-[#FFF4EF] p-4 sm:p-6">
                                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p
                                            className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#C75560]"
                                            style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
                                        >
                                            Questions about this policy?
                                        </p>
                                        <h2
                                            className="mt-1 text-xl font-bold text-[#2B2326]"
                                            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                                        >
                                            Talk to our privacy team
                                        </h2>
                                        <p className="mt-2 max-w-md text-sm leading-6 text-[#80576A]">
                                            Email us for data requests, corrections, deletions, or any privacy
                                            concern. We aim to respond within 5 business days.
                                        </p>
                                    </div>
                                    <a
                                        href="mailto:privacy@roledeck.com"
                                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-[#5C1B26] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#7A2333]"
                                    >
                                        <Mail size={16} /> privacy@roledeck.com
                                        <ArrowUpRight size={15} />
                                    </a>
                                </div>

                                <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[#EBC2AE] pt-5 text-xs text-[#966A79]">
                                    <span
                                        style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
                                    >
                                        Document {DOC_ID}
                                    </span>
                                    <span className="h-1 w-1 rounded-full bg-[#D8B3BC]" />
                                    <span>Effective {EFFECTIVE_DATE}</span>
                                    <span className="h-1 w-1 rounded-full bg-[#D8B3BC]" />
                                    <span>Applies to all JobHub / roledeck.com users</span>
                                </div>
                            </article>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}