import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Briefcase, Building2, CheckCheck, ChevronRight, Eye, IndianRupee, Loader2, MapPin, Route, Send, Star, CalendarCheck, Award, UserRound, UsersRound } from 'lucide-react';
import CandidateNavbar from '../../components/CandidateNavbar';
import axiosInstance from '../../api/axiosInstance';
import { connectSocket } from '../../socket';
import { FONT_BODY, FONT_DISPLAY, BG, MAROON } from '../../theme';

const REFERRAL_STAGES = [
    { key: 'referred', label: 'Referred' },
    { key: 'viewed', label: 'Viewed' },
    { key: 'shortlisted', label: 'Shortlisted' },
    { key: 'interview_scheduled', label: 'Interview' },
    { key: 'offered', label: 'Offer' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'hired', label: 'Hired' },
];

function referralStageIndex(status) {
    if (status === 'rejected') return -1;
    const index = REFERRAL_STAGES.findIndex((stage) => stage.key === status);
    return index >= 0 ? index : 0;
}

function ReferralPipeline({ referral }) {
    const currentIndex = referralStageIndex(referral.status);
    if (referral.status === 'rejected') return <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">Not selected for this opportunity.</div>;
    const progress = currentIndex <= 0 ? 0 : (currentIndex / (REFERRAL_STAGES.length - 1)) * 100;
    return <div className="overflow-x-auto pb-2"><div className="relative min-w-[600px] px-2 pt-3">
        <div className="absolute left-2 right-2 top-7 h-1 rounded-full bg-[#EDE3DE]" />
        <motion.div className="absolute left-2 top-7 h-1 rounded-full bg-gradient-to-r from-[#F7C56B] to-[#8B1E2F]" animate={{ width: progress ? `calc(${progress}% + 8px)` : 0 }} transition={{ duration: .5 }} />
        <div className="relative flex justify-between">{REFERRAL_STAGES.map((stage, index) => {
            const reached = index <= currentIndex;
            const Icon = [Send, Eye, Star, CalendarCheck, Award, CheckCheck, Award][index];
            const dateValue = referral[`${stage.key === 'referred' ? 'created' : stage.key}At`];
            return <div key={stage.key} className="flex w-[78px] flex-col items-center text-center"><span className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${reached ? 'border-[#8B1E2F] bg-[#8B1E2F] text-white' : 'border-[#DDD0D4] bg-white text-[#B9AAB0]'}`}><Icon size={14} /></span><p className={`mt-2 text-[10.5px] font-semibold ${reached ? 'text-[#54263F]' : 'text-[#B9A2AC]'}`}>{stage.label}</p><p className="mt-0.5 text-[10px] text-[#80576A]">{dateValue ? new Date(dateValue).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : reached ? 'Done' : 'Pending'}</p></div>;
        })}</div>
    </div></div>;
}

export default function ReferredJobs() {
    const navigate = useNavigate();
    const [referrals, setReferrals] = useState([]);
    const [mode, setMode] = useState('received');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedReferral, setSelectedReferral] = useState(null);

    useEffect(() => {
        let active = true;

        async function loadReferrals() {
            setLoading(true);
            setError('');
            try {
                const { data } = await axiosInstance.get(`/referral/${mode === 'received' ? 'mine' : 'made'}`);
                if (active) {
                    const next = data || [];
                    setReferrals(next);
                    setSelectedReferral((current) => next.find((item) => item._id === current?._id) || next[0] || null);
                }
            } catch (err) {
                if (active) setError(err.response?.data?.error || 'Could not load referred jobs.');
            } finally {
                if (active) setLoading(false);
            }
        }
        loadReferrals();
        return () => { active = false; };
    }, [mode]);

    useEffect(() => {
        const socket = connectSocket();
        const refreshReferrals = () => {
            axiosInstance.get('/referral/mine')
                .then(({ data }) => setReferrals(data || []))
                .catch(() => {});
        };
        socket.on('applicationUpdated', refreshReferrals);
        return () => socket.off('applicationUpdated', refreshReferrals);
    }, []);

    const receivedMode = mode === 'received';

    return (
        <div className="portal-theme min-h-screen w-full" style={{ background: BG, fontFamily: FONT_BODY }}>
            <CandidateNavbar />
            <main className="mx-auto max-w-6xl px-6 py-8">
                <button
                    type="button"
                    onClick={() => navigate('/candidate/jobs')}
                    className="mb-5 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-[12.5px] font-semibold text-stone-700 hover:border-[#8B1E2F]/30 hover:text-[#8B1E2F]"
                >
                    <ArrowLeft size={14} />
                    Back to jobs
                </button>

                <div className="mb-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: MAROON }}>Career opportunities</p>
                    <h1 className="mt-1 text-2xl font-bold text-stone-900" style={{ fontFamily: FONT_DISPLAY }}>Referred job status</h1>
                    <p className="mt-1 text-[13px] text-stone-500">
                        {receivedMode ? 'Jobs your network has shared with you.' : 'Jobs you have shared with other candidates.'}
                    </p>
                </div>

                <div className="mb-6 inline-flex rounded-xl border border-stone-200 bg-white p-1 shadow-sm" role="tablist" aria-label="Referral history">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={receivedMode}
                        onClick={() => setMode('received')}
                        className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[12px] font-semibold transition-colors ${receivedMode ? 'bg-[#8B1E2F] text-white' : 'text-stone-600 hover:bg-stone-50'}`}
                    >
                        <UsersRound size={14} /> Referred to me
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={!receivedMode}
                        onClick={() => setMode('made')}
                        className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[12px] font-semibold transition-colors ${!receivedMode ? 'bg-[#8B1E2F] text-white' : 'text-stone-600 hover:bg-stone-50'}`}
                    >
                        <UserRound size={14} /> Referred by me
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center rounded-2xl border border-stone-200/70 bg-white p-12 text-[13px] text-stone-500">
                        <Loader2 size={16} className="mr-2 animate-spin" /> Loading referred jobs...
                    </div>
                ) : error ? (
                    <div className="rounded-2xl border border-red-200 bg-white p-8 text-center text-[13px] text-red-600">{error}</div>
                ) : referrals.length === 0 ? (
                    <div className="rounded-2xl border border-stone-200/70 bg-white p-10 text-center">
                        <Briefcase size={24} className="mx-auto text-stone-300" />
                        <p className="mt-3 text-[14px] font-semibold text-stone-800">No {receivedMode ? 'received' : 'sent'} referrals yet</p>
                        <p className="mt-1 text-[12.5px] text-stone-500">{receivedMode ? 'When another candidate refers you, the job will appear here.' : 'Jobs you refer to other candidates will appear here.'}</p>
                    </div>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="space-y-2.5 lg:col-span-1">
                        {referrals.map((referral) => {
                            const job = referral.job;
                            if (!job) return null;
                            const isSelected = selectedReferral?._id === referral._id;
                            return (
                                <article key={referral._id} onClick={() => setSelectedReferral(referral)} className={`cursor-pointer rounded-xl border p-3.5 transition-all lg:col-span-1 ${isSelected ? 'border-[#8B1E2F] bg-[#FFF0E8]' : 'border-stone-200/70 bg-white'}`}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <Link to={`/candidate/jobs/${job._id}${receivedMode ? '?referral=1' : ''}`} className="text-[16px] font-bold text-stone-900 hover:text-[#8B1E2F] hover:underline" style={{ fontFamily: FONT_DISPLAY }}>
                                                {job.title}
                                            </Link>
                                            <p className="mt-1 flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: MAROON }}>
                                                <Building2 size={13} /> {job.postedBy?.companyName || 'Company'}
                                            </p>
                                        </div>
                                        {job.postedBy?.companyLogoUrl && <img src={job.postedBy.companyLogoUrl} alt="" className="h-11 w-11 rounded-lg border border-stone-100 object-contain p-1" />}
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-stone-600">
                                        {job.location && <span className="flex items-center gap-1.5"><MapPin size={13} className="text-stone-400" />{job.location}</span>}
                                        {job.experienceLevel && <span className="flex items-center gap-1.5"><Briefcase size={13} className="text-stone-400" />{job.experienceLevel}</span>}
                                    </div>
                                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-3">
                                        <p className="flex items-center gap-1.5 text-[11.5px] text-stone-500">
                                            <UserRound size={13} />
                                            {receivedMode ? `Referred by ${referral.referrer?.name || 'a candidate'}` : `Referred to ${referral.referredCandidate?.name || 'a candidate'}`}
                                        </p>
                                        <Link to={`/candidate/jobs/${job._id}${receivedMode ? '?referral=1' : ''}`} className="rounded-full px-4 py-2 text-[12px] font-semibold text-white" style={{ background: MAROON }}>View job</Link>
                                    </div>
                                </article>
                            );
                        })}
                        </div>
                        <AnimatePresence mode="wait">
                            {selectedReferral && <motion.article key={selectedReferral._id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="rounded-2xl border border-stone-200/70 bg-[#FFFDFC] p-6 lg:col-span-2">
                                <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold text-[#54263F]" style={{ fontFamily: FONT_DISPLAY }}>{selectedReferral.job?.title}</h2><div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[12.5px] text-[#80576A]"><span className="inline-flex items-center gap-1"><Building2 size={13} />{selectedReferral.job?.postedBy?.companyName}</span>{selectedReferral.job?.location && <span className="inline-flex items-center gap-1"><MapPin size={13} />{selectedReferral.job.location}</span>}{selectedReferral.job?.salary && <span className="inline-flex items-center gap-1"><IndianRupee size={13} />{selectedReferral.job.salary}</span>}</div><p className="mt-2 text-[12.5px] font-semibold text-[#9A671A]">Referred by {selectedReferral.referrer?.name || 'a candidate'}</p></div><span className="rounded-full bg-[#FFF0E8] px-3 py-1 text-[11.5px] font-bold text-[#9A671A]">{selectedReferral.status === 'rejected' ? 'Not Selected' : REFERRAL_STAGES[referralStageIndex(selectedReferral.status)].label}</span></div>
                                <div className="mt-7"><h3 className="mb-4 flex items-center gap-1.5 text-[13px] font-bold text-[#54263F]"><Route size={15} className="text-[#8B1E2F]" /> Your route on this referral</h3><ReferralPipeline referral={selectedReferral} /></div>
                                <div className="mt-7 flex justify-end"><Link to={`/candidate/jobs/${selectedReferral.job?._id}?referral=1`} className="inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-[13px] font-semibold text-white" style={{ background: MAROON }}>View job <ChevronRight size={15} /></Link></div>
                            </motion.article>}
                        </AnimatePresence>
                    </div>
                )}
            </main>
        </div>
    );
}
