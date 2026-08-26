import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    AlertTriangle,
    ArrowLeft,
    ArrowUpRight,
    BadgeCheck,
    BriefcaseBusiness,
    Copyright,
    FileText,
    Gavel,
    HandCoins,
    Landmark,
    Link2,
    ListChecks,
    Mail,
    MessageSquareText,
    Printer,
    RefreshCw,
    Scale,
    ScrollText,
    ShieldAlert,
    UserCheck,
    Zap,
} from 'lucide-react';
import CandidateNavbar from '../components/CandidateNavbar';
import RecruiterNavbar from '../components/RecruiterNavbar';
import { useAuth } from '../context/AuthContext';

const EFFECTIVE_DATE = 'August 24, 2026';
const DOC_ID = 'POL-TERMS-05';

const SECTIONS = [
    {
        id: 'agreement',
        num: '01',
        title: 'Agreement to These Terms',
        icon: ScrollText,
        paragraphs: [
            'These Terms and Services ("Terms") govern your access to and use of JobHub, a hiring marketplace operated through roledeck.com by JobHub ("JobHub", "we", "us", "our"). They apply to candidates, recruiters, and anyone who visits or uses the platform.',
            'By creating an account, browsing job listings, or otherwise using JobHub, you agree to be bound by these Terms and by our Privacy Policy, which is incorporated into these Terms by reference. If you do not agree, please do not access or use the platform.',
        ],
    },
    {
        id: 'eligibility',
        num: '02',
        title: 'Eligibility',
        icon: UserCheck,
        paragraphs: [
            'You must be at least 18 years old, or the legal age of majority and working age in your jurisdiction, to create a JobHub account. By registering, you confirm that you meet this requirement and that you have the legal capacity to enter into a binding agreement.',
            'Recruiter accounts must be created and operated by someone authorized to act on behalf of the company or organization being represented, and who has the authority to post job listings and enter hiring-related agreements on its behalf.',
        ],
    },
    {
        id: 'accounts',
        num: '03',
        title: 'Accounts & Account Security',
        icon: UserCheck,
        paragraphs: [
            'You are responsible for providing accurate, current information when you register and for keeping your profile, company details, and contact information up to date. Each individual may maintain only one personal candidate account unless JobHub approves an additional account in writing.',
            'You are responsible for keeping your password and login credentials confidential and for all activity that occurs through your account, whether or not you authorized it. Notify us immediately at support@jobportal.com if you suspect unauthorized access, a lost device, or any other compromise of your account.',
        ],
    },
    {
        id: 'platform',
        num: '04',
        title: 'Using the Platform',
        icon: BriefcaseBusiness,
        paragraphs: [
            'Candidates may create profiles, upload resumes, discover roles, submit applications, message recruiters, and use our ATS-powered resume matching to find relevant openings. Recruiters may create verified company profiles, publish job listings, review and shortlist applicants, and manage hiring workflows through their dashboard.',
            'JobHub is a facilitator that connects candidates and recruiters &mdash; we are not a party to, and do not guarantee the outcome of, any hiring relationship formed through the platform. We do not guarantee employment, interviews, offers, candidate qualifications, recruiter conduct, or the accuracy of any listing or profile.',
        ],
    },
    {
        id: 'content',
        num: '05',
        title: 'User Content & License',
        icon: FileText,
        paragraphs: [
            'You retain ownership of the content you submit to JobHub, including resumes, profile details, portfolio links, messages, company information, and job listings ("User Content"). By submitting User Content, you grant JobHub a limited, non-exclusive, worldwide, royalty-free license to host, store, reproduce, display, and process it as needed to operate, maintain, and improve the platform, and to make it available to recruiters or candidates as described in our Privacy Policy.',
            'If you send us feedback, suggestions, or ideas about JobHub, you agree we may use them to improve the platform without any obligation or payment to you.',
            'You represent that you own or have the necessary rights to the User Content you submit, and that it does not infringe or violate the rights of any third party.',
        ],
    },
    {
        id: 'listings',
        num: '06',
        title: 'Job Listings & Recruiter Obligations',
        icon: BadgeCheck,
        paragraphs: [
            'Recruiters agree that every job listing posted on JobHub represents a genuine, currently available opportunity that the recruiter or their organization has the authority to advertise and fill. Listings must be accurate, lawful, and free of discriminatory criteria based on protected characteristics such as religion, caste, gender, disability, or similar grounds under applicable law.',
            'Recruiters must not charge candidates any fee to apply for, process, or be considered for a listed role. JobHub reserves the right to edit, unpublish, or reject any listing that appears fraudulent, misleading, non-compliant, or otherwise inconsistent with these Terms, without prior notice.',
        ],
    },
    {
        id: 'conduct',
        num: '07',
        title: 'Prohibited Conduct',
        icon: ShieldAlert,
        paragraphs: ['You agree not to use JobHub to:'],
        list: [
            { text: 'Impersonate another person or organization, misrepresent your identity, employer, or affiliation, or create deceptive profiles or listings.' },
            { text: 'Post fraudulent, discriminatory, unlawful, or misleading jobs, resumes, or applications.' },
            { text: 'Harass, threaten, defame, stalk, or send spam, unsolicited bulk messages, or unwanted commercial communications to another user.' },
            { text: 'Scrape, crawl, mine, or extract platform data or content &mdash; including for training a machine learning or AI model &mdash; without our prior written permission.' },
            { text: 'Reverse engineer, decompile, probe for vulnerabilities, or attempt to gain unauthorized access to JobHub\u2019s systems, accounts, or data.' },
            { text: 'Upload malware, viruses, or any code intended to disrupt or damage the platform or other users\u2019 devices.' },
            { text: 'Use another person\u2019s resume, profile, or personal data for any purpose other than a genuine hiring interaction.' },
            { text: 'Circumvent JobHub to solicit or transact directly in a way that avoids applicable platform fees, where such fees apply.' },
        ],
    },
    {
        id: 'intellectual-property',
        num: '08',
        title: 'Intellectual Property Rights',
        icon: Copyright,
        paragraphs: [
            'JobHub, the roledeck.com name, logo, interface design, and underlying software are owned by JobHub or its licensors and are protected by applicable intellectual property laws. Except for the limited right to use the platform as intended, these Terms do not grant you any ownership interest in JobHub\u2019s trademarks, branding, or technology.',
            'You may not copy, modify, distribute, sell, or create derivative works based on JobHub\u2019s platform, design, or proprietary content without our prior written consent.',
        ],
    },
    {
        id: 'third-party',
        num: '09',
        title: 'Third-Party Links & Services',
        icon: Link2,
        paragraphs: [
            'JobHub may link to or integrate with third-party websites and services, including our payment processor, Razorpay, and other tools used to operate the platform. These links are provided for convenience only, and we do not control or endorse the content, policies, or practices of any third-party site.',
            'Your use of any third-party website or service linked from JobHub is at your own risk and subject to that third party\u2019s own terms and privacy policy.',
        ],
    },
    {
        id: 'payments',
        num: '10',
        title: 'Subscriptions, Payments & Refunds',
        icon: HandCoins,
        paragraphs: [
            'Some JobHub features, such as premium recruiter tools, require a paid subscription. Prices, billing periods, applicable taxes, and included features are shown before you confirm a purchase. By subscribing, you authorize our payment partner, Razorpay, to process the applicable charges to your chosen payment method.',
            'Unless a specific plan states otherwise, subscriptions renew automatically for the same billing period until you cancel before the next renewal date. Except where required by law or explicitly stated at checkout, payments are non-refundable once processed; cancelling a subscription stops future renewals but does not refund the current billing period.',
            'If you believe you have been billed in error, contact support@jobportal.com within 14 days of the charge and we will review the matter in good faith.',
        ],
    },
    {
        id: 'communications',
        num: '11',
        title: 'Communications & Notices',
        icon: MessageSquareText,
        paragraphs: [
            'By creating an account, you consent to receive account, transactional, and service-related communications from JobHub by email, SMS, or in-app notification, including application updates, security alerts, and billing notices. These messages are part of the service and cannot be opted out of while your account is active.',
            'You may manage optional communications, such as job-alert digests and promotional emails, from your account notification settings at any time.',
        ],
    },
    {
        id: 'enforcement',
        num: '12',
        title: 'Moderation, Suspension & Termination',
        icon: Gavel,
        paragraphs: [
            'We may review content, remove listings, restrict features, suspend accounts, or terminate access, with or without notice, when we reasonably believe there has been a violation of these Terms, a security risk, unlawful conduct, or misuse of the platform.',
            'You may stop using JobHub and request deletion of your account at any time through your settings or by contacting support. Provisions that by their nature should continue beyond termination &mdash; including ownership, disclaimers, indemnification, limitations of liability, and dispute-resolution terms &mdash; will survive.',
        ],
    },
    {
        id: 'liability',
        num: '13',
        title: 'Disclaimers & No Guarantee of Employment',
        icon: AlertTriangle,
        paragraphs: [
            'JobHub is provided on an "as available" and "as is" basis. To the extent permitted by law, we disclaim all warranties, express or implied, that the platform will be uninterrupted, error-free, secure, or that it will lead to any particular hiring outcome.',
            'We do not verify the credentials, intentions, or genuineness of every recruiter or candidate on the platform. It is your responsibility to independently verify the authenticity of any listing, application, or communication before acting on it &mdash; including before travelling for an interview or sharing sensitive personal information.',
        ],
    },
    {
        id: 'limitation',
        num: '14',
        title: 'Limitation of Liability',
        icon: Scale,
        paragraphs: [
            'To the fullest extent permitted by applicable law, JobHub and its team will not be liable for any indirect, incidental, special, consequential, or punitive damages, or for any loss of profits, data, goodwill, or employment opportunities, arising out of or related to your use of the platform or your interactions with other users.',
            'Where liability cannot be fully excluded under applicable law, JobHub\u2019s total liability to you for any claim arising from these Terms or your use of the platform is limited to the amount you paid to JobHub, if any, in the 12 months preceding the claim.',
        ],
    },
    {
        id: 'indemnification',
        num: '15',
        title: 'Indemnification',
        icon: HandCoins,
        paragraphs: [
            'You agree to defend, indemnify, and hold harmless JobHub, its team, and affiliates from any claims, damages, losses, and expenses, including reasonable legal fees, arising out of your User Content, your violation of these Terms, or your violation of any law or third-party right in connection with your use of the platform.',
        ],
    },
    {
        id: 'grievance',
        num: '16',
        title: 'Grievance Officer',
        icon: Landmark,
        paragraphs: [
            'In accordance with the Information Technology Act, 2000 and the rules made thereunder, JobHub has designated a Grievance Officer to address complaints regarding content or conduct on the platform.',
            'You may reach our Grievance Officer at grievance@roledeck.com. We will acknowledge complaints within 24 hours and aim to resolve them within the timelines prescribed under applicable law.',
        ],
    },
    {
        id: 'governing-law',
        num: '17',
        title: 'Governing Law & Dispute Resolution',
        icon: Gavel,
        paragraphs: [
            'These Terms are governed by the laws of India, without regard to conflict-of-law principles. Any dispute arising out of or relating to these Terms or your use of JobHub will first be addressed through good-faith discussion with our support team.',
            'If a dispute cannot be resolved informally, it shall be referred to and finally resolved by arbitration conducted by a sole arbitrator appointed by JobHub, in accordance with the Arbitration and Conciliation Act, 1996. The seat and venue of arbitration shall be Patna, Bihar, India, and the proceedings shall be conducted in English. Subject to the arbitration agreement above, the courts at Patna, Bihar shall have exclusive jurisdiction over any matter not subject to arbitration.',
        ],
    },
    {
        id: 'force-majeure',
        num: '18',
        title: 'Force Majeure',
        icon: Zap,
        paragraphs: [
            'JobHub will not be liable for any delay or failure to perform resulting from causes beyond our reasonable control, including natural disasters, internet or telecommunications outages, government action, labor disputes, or cyberattacks such as denial-of-service attacks.',
        ],
    },
    {
        id: 'general',
        num: '19',
        title: 'General Provisions',
        icon: ListChecks,
        paragraphs: [
            'If any provision of these Terms is found unenforceable, the remaining provisions will continue in full force and effect. Our failure to enforce a provision is not a waiver of our right to do so later.',
            'You may not assign or transfer your rights under these Terms without our prior written consent; JobHub may assign these Terms in connection with a merger, acquisition, or sale of assets. These Terms, together with our Privacy Policy, constitute the entire agreement between you and JobHub regarding your use of the platform.',
        ],
    },
    {
        id: 'updates',
        num: '20',
        title: 'Changes to These Terms',
        icon: RefreshCw,
        paragraphs: [
            'We may update these Terms as JobHub evolves or legal requirements change. Material changes will be communicated through email, an in-app notice, or a prominent notice on the platform before they take effect. Your continued use of JobHub after the effective date means you accept the updated Terms.',
        ],
    },
];

export default function TermsAndServices() {
    const { user } = useAuth();
    const [activeId, setActiveId] = useState(SECTIONS[0].id);
    const sectionRefs = useRef({});

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible.length > 0) setActiveId(visible[0].target.dataset.sectionId);
            },
            { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
        );

        Object.values(sectionRefs.current).forEach((element) => {
            if (element) observer.observe(element);
        });
        return () => observer.disconnect();
    }, []);

    const scrollToSection = (id) => {
        sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="min-h-screen overflow-x-hidden bg-[#FFF9F5] text-[#241A1E]">
            {user?.role === 'recruiter' ? <RecruiterNavbar /> : <CandidateNavbar />}

            <main>
                <section
                    className="relative overflow-hidden bg-gradient-to-br from-[#5C1B26] via-[#7A2333] to-[#C75560] px-4 pb-7 pt-5 sm:px-10 sm:pb-10 sm:pt-8"
                    style={{ clipPath: 'ellipse(100% 100% at 50% 0%)' }}
                >
                    <div className="pointer-events-none absolute inset-0 opacity-[0.1]" style={{ backgroundImage: 'repeating-linear-gradient(135deg, #fff 0px, #fff 1px, transparent 1px, transparent 22px)' }} />
                    <div className="relative mx-auto max-w-5xl">
                        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-white/75 transition-colors hover:text-white">
                            <ArrowLeft size={14} /> Back to home
                        </Link>
                        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#F5D7A8]">Legal agreement</p>
                                <h1 className="mt-1 text-2xl font-bold leading-[1.05] text-white sm:text-4xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                                    Terms and Services
                                </h1>
                                <p className="mt-2 max-w-xl text-xs leading-5 text-white/80 sm:text-sm">
                                    The rules and responsibilities that apply when candidates, recruiters, and visitors use JobHub.
                                </p>
                            </div>
                            <div className="flex w-full min-w-0 items-center gap-2 rounded-md border border-white/25 bg-white/10 px-2.5 py-2 backdrop-blur-sm sm:w-auto sm:gap-3 sm:px-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/15 text-white"><Gavel size={20} /></span>
                                <div className="text-left">
                                    <p className="text-[11px] uppercase tracking-[0.14em] text-white/60" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>Doc {DOC_ID}</p>
                                    <p className="break-words text-xs font-bold text-white sm:text-sm">Effective {EFFECTIVE_DATE}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="relative mx-auto mt-4 h-px max-w-5xl bg-gradient-to-r from-transparent via-[#F5D7A8]/70 to-transparent" />
                </section>

                <section className="relative mt-4 overflow-hidden border-b border-[#EADBD4] bg-[#F7F0EA] px-6 py-5 sm:mt-6 sm:px-10 sm:py-6" style={{ backgroundImage: 'linear-gradient(90deg, rgba(92,27,38,0.05) 1px, transparent 1px), linear-gradient(rgba(92,27,38,0.05) 1px, transparent 1px)', backgroundSize: '28px 28px' }}>
                    <div className="relative mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-start sm:gap-6">
                        <p className="shrink-0 pt-0.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#7A2333]" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>At a glance</p>
                        <p className="max-w-4xl text-sm leading-6 text-[#3E4B43]">
                            <strong className="font-bold text-[#241A1E]">Use JobHub responsibly and transparently.</strong>{' '}
                            These Terms cover eligibility, account use, hiring activity, content ownership, payments, prohibited conduct, and how disputes are resolved across <span className="mx-1 inline-block font-bold text-[#7A2333]">roledeck.com</span>.
                        </p>
                    </div>
                </section>

                <section className="mx-auto max-w-6xl px-4 py-8 sm:px-10 sm:py-16">
                    <div className="mb-6 -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 lg:hidden">
                        {SECTIONS.map((section) => (
                            <button key={section.id} onClick={() => scrollToSection(section.id)} className={`shrink-0 rounded-md border px-3 py-1 text-xs font-bold transition-colors ${activeId === section.id ? 'border-[#5C1B26] bg-[#5C1B26] text-white' : 'border-[#EADBD4] bg-white text-[#80576A]'}`}>
                                {section.num}&ensp;{section.title}
                            </button>
                        ))}
                    </div>

                    <div className="grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
                        <nav className="hidden lg:block">
                            <div className="sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto border-l border-[#EADBD4] pl-5">
                                <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.16em] text-[#B08A97]" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>Contents</p>
                                <ul className="space-y-1">
                                    {SECTIONS.map((section) => (
                                        <li key={section.id}>
                                            <button onClick={() => scrollToSection(section.id)} className={`group flex w-full items-baseline gap-2.5 rounded-md py-1.5 text-left text-[13px] leading-tight transition-colors ${activeId === section.id ? 'font-bold text-[#5C1B26]' : 'text-[#80576A] hover:text-[#5C1B26]'}`}>
                                                <span className={`text-[11px] ${activeId === section.id ? 'text-[#C75560]' : 'text-[#C9AEB6]'}`} style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{section.num}</span>
                                                <span>{section.title}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                <button onClick={() => window.print()} className="mt-6 inline-flex items-center gap-1.5 text-[12px] font-bold text-[#80576A] transition-colors hover:text-[#C75560]"><Printer size={13} /> Print these terms</button>
                            </div>
                        </nav>

                        <div className="min-w-0 space-y-4 sm:space-y-6">
                            {SECTIONS.map(({ id, num, title, icon: Icon, paragraphs, list }) => (
                                <article key={id} id={id} data-section-id={id} ref={(element) => (sectionRefs.current[id] = element)} className="scroll-mt-20 rounded-md border border-[#EADBD4] bg-white p-3.5 shadow-[0_18px_35px_-28px_rgba(73,43,49,0.35)] sm:scroll-mt-28 sm:p-6">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#FFF0E8] text-[#C75560]"><Icon size={19} /></span>
                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#C9AEB6]" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>&sect; {num}</p>
                                            <h2 className="break-words text-base font-bold text-[#2B2326] sm:text-xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{title}</h2>
                                        </div>
                                    </div>
                                    <div className="mt-4 space-y-3 border-t border-[#F3E9E3] pt-4">
                                        {paragraphs.map((paragraph, index) => <p key={index} className="break-words text-[13px] leading-6 text-[#4A3E43] sm:text-[14px] sm:leading-7">{paragraph}</p>)}
                                        {list && <ul className="mt-2 space-y-2.5">{list.map((item, index) => <li key={index} className="flex gap-2.5 break-words text-[13px] leading-6 text-[#4A3E43] sm:text-[14px]"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E7B667]" /><span>{item.text}</span></li>)}</ul>}
                                    </div>
                                </article>
                            ))}

                            <article className="rounded-md border border-[#5C1B26]/15 bg-[#FFF4EF] p-4 sm:p-6">
                                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#C75560]" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>Need clarification?</p>
                                        <h2 className="mt-1 text-xl font-bold text-[#2B2326]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Contact our support team</h2>
                                        <p className="mt-2 max-w-md text-sm leading-6 text-[#557065]">Questions about these Terms, subscriptions, or account access can be sent to our support team. For content or conduct complaints, reach our Grievance Officer directly.</p>
                                    </div>
                                    <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                                        <a href="mailto:support@jobportal.com" className="inline-flex items-center justify-center gap-2 rounded-md bg-[#5C1B26] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#7A2333]"><Mail size={16} /> Contact support <ArrowUpRight size={15} /></a>
                                        <a href="mailto:grievance@roledeck.com" className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[#C75560] transition-colors hover:text-[#7A2333]"><Landmark size={13} /> grievance@roledeck.com</a>
                                    </div>
                                </div>
                                <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[#EBC2AE] pt-5 text-xs text-[#966A79]">
                                    <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>Document {DOC_ID}</span>
                                    <span className="h-1 w-1 rounded-full bg-[#A8C7B5]" />
                                    <span>Effective {EFFECTIVE_DATE}</span>
                                    <span className="h-1 w-1 rounded-full bg-[#A8C7B5]" />
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