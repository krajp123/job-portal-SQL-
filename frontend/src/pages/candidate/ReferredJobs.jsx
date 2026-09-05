import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, Building2, Loader2, MapPin, UserRound } from 'lucide-react';
import CandidateNavbar from '../../components/CandidateNavbar';
import axiosInstance from '../../api/axiosInstance';
import { FONT_BODY, FONT_DISPLAY, BG, MAROON } from '../../theme';

export default function ReferredJobs() {
    const navigate = useNavigate();
    const [referrals, setReferrals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function loadReferrals() {
            try {
                const { data } = await axiosInstance.get('/referral/mine');
                setReferrals(data || []);
            } catch (err) {
                setError(err.response?.data?.error || 'Could not load referred jobs.');
            } finally {
                setLoading(false);
            }
        }
        loadReferrals();
    }, []);

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
                    <h1 className="mt-1 text-2xl font-bold text-stone-900" style={{ fontFamily: FONT_DISPLAY }}>Referred jobs</h1>
                    <p className="mt-1 text-[13px] text-stone-500">Jobs your network has shared with you.</p>
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
                        <p className="mt-3 text-[14px] font-semibold text-stone-800">No referred jobs yet</p>
                        <p className="mt-1 text-[12.5px] text-stone-500">When another candidate refers you, the job will appear here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {referrals.map((referral) => {
                            const job = referral.job;
                            if (!job) return null;
                            return (
                                <article key={referral._id} className="rounded-2xl border border-stone-200/70 bg-white p-5 shadow-[0_18px_45px_-34px_rgba(92,20,32,0.34)]">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <Link to={`/candidate/jobs/${job._id}`} className="text-[16px] font-bold text-stone-900 hover:text-[#8B1E2F] hover:underline" style={{ fontFamily: FONT_DISPLAY }}>
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
                                        <p className="flex items-center gap-1.5 text-[11.5px] text-stone-500"><UserRound size={13} /> Referred by {referral.referrer?.name || 'a candidate'}</p>
                                        <Link to={`/candidate/jobs/${job._id}`} className="rounded-full px-4 py-2 text-[12px] font-semibold text-white" style={{ background: MAROON }}>View job</Link>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
