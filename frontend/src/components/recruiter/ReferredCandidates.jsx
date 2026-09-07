import { useEffect, useState } from 'react';
import { ArrowUpRight, Loader2, UsersRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { FONT_DISPLAY } from '../../theme';

export default function ReferredCandidates() {
    const navigate = useNavigate();
    const [referrals, setReferrals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        axiosInstance.get('/referral/recruiter')
            .then(({ data }) => { if (active) setReferrals(data || []); })
            .catch((requestError) => { if (active) setError(requestError.response?.data?.error || 'Could not load referred candidates.'); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    return (
        <section className="rounded-lg bg-white p-4 ring-1 ring-slate-200" aria-labelledby="dashboard-referred-candidates">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF0E8] text-[#C75560]"><UsersRound size={16} /></span>
                    <div>
                        <h2 id="dashboard-referred-candidates" className="text-sm font-bold text-slate-800" style={{ fontFamily: FONT_DISPLAY }}>Referred candidates</h2>
                        <p className="text-[11px] text-slate-400">Only candidates referred for your jobs</p>
                    </div>
                </div>
                <button type="button" onClick={() => navigate('/recruiter/applicants')} className="inline-flex items-center gap-1 text-xs font-semibold text-[#C75560] hover:underline">View all <ArrowUpRight size={12} /></button>
            </div>
            {loading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-xs text-slate-400"><Loader2 size={15} className="animate-spin" /> Loading referrals...</div>
            ) : error ? (
                <p className="py-5 text-center text-xs text-rose-600">{error}</p>
            ) : referrals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-7 text-center"><UsersRound size={22} className="text-slate-300" /><p className="mt-2 text-xs text-slate-400">No referred candidates yet.</p></div>
            ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {referrals.map((referral) => {
                        const candidate = referral.referredCandidate || {};
                        const referrer = referral.referrer || {};
                        return (
                            <button key={referral._id} type="button" onClick={() => navigate('/recruiter/applicants')} className="rounded-md border border-slate-200 p-3 text-left transition hover:border-[#C75560] hover:shadow-sm">
                                <div className="flex items-start justify-between gap-2"><p className="truncate text-xs font-bold text-slate-800">{candidate.name || 'Candidate'}</p><span className="shrink-0 rounded-full bg-[#FFF0E8] px-2 py-0.5 text-[10px] font-semibold text-[#9A671A]">Referred</span></div>
                                <p className="mt-1 truncate text-[11px] font-semibold text-[#C75560]">{referral.job?.title || 'Job'}</p>
                                <p className="mt-1 truncate text-[11px] text-slate-500">Referred by {referrer.name || 'Candidate'}</p>
                            </button>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
