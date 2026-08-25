import { useEffect, useState } from 'react';
import { ArrowLeft, Building2, MapPin, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import RecruiterNavbar from '../../components/RecruiterNavbar';

const DEMO_MEMBERS = [
    { _id: 'demo-recruiter-1', fullName: 'Neha Sharma', designation: 'Senior Talent Partner', location: 'Patna, India' },
    { _id: 'demo-recruiter-2', fullName: 'Rohan Mehta', designation: 'Recruitment Manager', location: 'Bengaluru, India' },
    { _id: 'demo-recruiter-3', fullName: 'Aisha Khan', designation: 'People Operations Lead', location: 'Delhi, India' },
];

function getInitials(name = '') {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    return parts.length > 1
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : (parts[0]?.[0] || '?').toUpperCase();
}

export default function Recruiters() {
    const navigate = useNavigate();
    const [company, setCompany] = useState('');
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let mounted = true;

        async function loadCompanyRecruiters() {
            try {
                const profileResponse = await axiosInstance.get('/recruiter/me/profile');
                const companyName = profileResponse.data?.companyName?.trim();

                if (!companyName) {
                    if (mounted) {
                        setCompany('your company');
                        setMembers([]);
                        setLoading(false);
                    }
                    return;
                }

                const membersResponse = await axiosInstance.get('/recruiter/company-members', {
                    params: { companyName },
                });

                if (mounted) {
                    setCompany(companyName);
                    const loadedMembers = Array.isArray(membersResponse.data) ? membersResponse.data : [];
                    setMembers(import.meta.env.DEV ? [...loadedMembers, ...DEMO_MEMBERS] : loadedMembers);
                    setError('');
                }
            } catch (requestError) {
                console.error('Failed to load company recruiters:', requestError);
                if (mounted) {
                    if (import.meta.env.DEV) {
                        setCompany('Demo Company');
                        setMembers(DEMO_MEMBERS);
                        setError('');
                    } else {
                        setError('Recruiters could not be loaded right now. Please try again.');
                    }
                }
            } finally {
                if (mounted) setLoading(false);
            }
        }

        loadCompanyRecruiters();
        return () => { mounted = false; };
    }, []);

    return (
        <div className="portal-theme min-h-screen bg-[#FFF4EF] text-[#1D181A]">
            <RecruiterNavbar />
            <main className="recruiter-page mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
                <button
                    type="button"
                    onClick={() => navigate('/recruiter/dashboard')}
                    className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#C75560] transition hover:text-[#A0182C]"
                >
                    <ArrowLeft size={17} /> Back to dashboard
                </button>

                <section className="rounded-lg border border-[#EBC2AE] bg-white p-4 shadow-[0_14px_30px_-24px_rgba(73,43,49,0.35)] sm:p-5">
                    <div className="flex items-start justify-between gap-4 border-b border-[#F3E9E3] pb-6">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#C75560]">Company directory</p>
                            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#1D181A] sm:text-3xl">Recruiters at {company || 'your company'}</h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#80576A]">Connect with the recruiters registered under your company and open their professional profiles.</p>
                        </div>
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#FFF0E8] text-[#C75560]">
                            <Users size={21} />
                        </span>
                    </div>

                    {loading ? (
                        <div className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-3">
                            {[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-xl bg-[#FFF4EF]" />)}
                        </div>
                    ) : error ? (
                        <p className="py-10 text-center text-sm text-[#A0182C]">{error}</p>
                    ) : members.length === 0 ? (
                        <div className="py-12 text-center">
                            <Building2 className="mx-auto text-[#C75560]" size={28} />
                            <p className="mt-3 text-sm font-semibold text-[#1D181A]">No other recruiters found for this company.</p>
                            <p className="mt-1 text-sm text-[#80576A]">Recruiters will appear here after they register with the same company name.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-3">
                            {members.map((member) => (
                                <Link
                                    key={member._id}
                                    to={`/recruiter/${member._id}`}
                                    className="flex items-center gap-3 rounded-xl border border-[#EBC2AE] p-4 transition hover:border-[#C75560] hover:bg-[#FFF9F5]"
                                >
                                    {member.profilePictureUrl ? (
                                        <img src={member.profilePictureUrl} alt={member.fullName || 'Recruiter'} className="h-12 w-12 shrink-0 rounded-full border border-[#EBC2AE] object-cover" />
                                    ) : (
                                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FFF0E8] text-sm font-bold text-[#A0182C]">
                                            {getInitials(member.fullName || member.companyName)}
                                        </span>
                                    )}
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-bold text-[#1D181A]">{member.fullName || 'Recruiter'}</span>
                                        <span className="mt-1 block truncate text-xs text-[#6D5961]">{member.companyName || company}</span>
                                        <span className="mt-1 block truncate text-xs font-semibold text-[#C75560]">{member.designation || 'Recruiter'}</span>
                                        <span className="mt-1 flex items-center gap-1 truncate text-xs text-[#80576A]"><MapPin size={12} /> {member.location || 'Remote / India'}</span>
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
