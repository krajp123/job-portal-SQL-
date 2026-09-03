import { useEffect, useState } from 'react';
import { BriefcaseBusiness, LayoutDashboard, MessageCircle, PlusCircle, UsersRound, Wallet } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import RecruiterProfileMenu from './RecruiterProfileMenu';
import { FONT_DISPLAY } from '../theme';
import axiosInstance from '../api/axiosInstance';
import { fetchPlatformBranding, getCachedPlatformBranding } from '../api/platformBranding';
import { connectSocket } from '../socket';
import { useAuth } from '../context/AuthContext';

const links = [
    { to: '/recruiter/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/recruiter/post-job', label: 'Post a job', icon: PlusCircle },
    { to: '/recruiter/jobs', label: 'Jobs', icon: BriefcaseBusiness },
    { to: '/recruiter/applicants', label: 'Applicants', icon: UsersRound },
];

function navClass(isActive, isPostJob = false) {
    if (isPostJob) {
        return `inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-[12.5px] font-bold transition-colors ${
            isActive
                ? 'border-[#A94658] bg-[#A94658] text-white'
                : 'border-[#C75560] bg-[#C75560] text-white hover:border-[#A94658] hover:bg-[#A94658]'
        }`;
    }

    return `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[12.5px] font-semibold transition-colors ${
        isActive
            ? 'bg-[#FFF0E8] text-[#C75560]'
            : 'text-[#80576A] hover:bg-[#FFF0E8] hover:text-[#1D181A]'
    }`;
}

export default function RecruiterNavbar() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isViewer = user?.workspaceAccess?.role === 'viewer';
    const [platformBranding, setPlatformBranding] = useState(getCachedPlatformBranding);
    const [logoError, setLogoError] = useState(false);
    const [brandingLoaded, setBrandingLoaded] = useState(() => {
        const cached = getCachedPlatformBranding();
        return Boolean(cached.siteName || cached.logo);
    });
    const [unreadMessages, setUnreadMessages] = useState(0);

    useEffect(() => {
        let mounted = true;
        const loadUnreadMessages = async () => {
            try {
                const { data } = await axiosInstance.get('/messages/mine');
                if (mounted) setUnreadMessages((data || []).reduce((total, conversation) => total + Number(conversation.unreadCount || 0), 0));
            } catch {
                // The message badge is non-critical.
            }
        };
        loadUnreadMessages();
        const socket = connectSocket();
        const handleNewMessage = () => loadUnreadMessages();
        socket.on('newMessage', handleNewMessage);
        return () => {
            mounted = false;
            socket.off('newMessage', handleNewMessage);
        };
    }, []);

    useEffect(() => {
        let active = true;
        fetchPlatformBranding()
            .then((branding) => {
                if (active) {
                    setPlatformBranding(branding);
                    setBrandingLoaded(true);
                }
            })
            .catch(() => {
                if (active) setBrandingLoaded(true);
            });
        return () => { active = false; };
    }, []);

    const brandName = platformBranding.siteName || 'HireLoop';

    return (
        <header className="sticky top-0 z-50 overflow-visible border-b border-[#EBC2AE] bg-[#FFFDFC]/95 backdrop-blur-md">
            <div className="mx-auto flex w-full max-w-[1400px] items-center gap-4 overflow-visible px-4 py-3 sm:px-6">
                <Link to="/recruiter/dashboard" className="flex min-w-[220px] shrink-0 items-center gap-2.5" aria-label={`${brandName || 'Platform'} recruiter dashboard`}>
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm font-extrabold text-white ${platformBranding.logo && !logoError ? '' : 'bg-[#1D181A]'}`}>
                        {platformBranding.logo && !logoError ? (
                            <img src={platformBranding.logo} alt={`${brandName} logo`} onError={() => setLogoError(true)} className="h-full w-full object-contain" />
                        ) : (
                            brandingLoaded ? brandName.slice(0, 2).toUpperCase() : <BriefcaseBusiness size={19} />
                        )}
                    </span>
                    <span className="flex flex-col">
                        <span className="text-[17px] font-bold tracking-tight text-[#1D181A]" style={{ fontFamily: FONT_DISPLAY }}>
                            {brandName}
                        </span>
                        <span className="hidden text-[10px] font-semibold uppercase tracking-[0.12em] text-[#80576A] sm:block">Recruiter workspace</span>
                    </span>
                </Link>

                <nav className="hidden items-center gap-1 md:flex" aria-label="Recruiter primary navigation">
                    {links.map(({ to, label, icon: Icon }) => (
                            to === '/recruiter/post-job' && isViewer ? (
                                                <span key={to} aria-disabled="true" title="Viewer access is read-only" className={`${navClass(false, true)} cursor-not-allowed opacity-50`}>
                                    <Icon size={15} /> {label}
                                </span>
                            ) : (
                                <NavLink key={to} to={to} className={({ isActive }) => navClass(isActive, to === '/recruiter/post-job')}>
                                    <Icon size={15} /> {label}
                                </NavLink>
                            )
                    ))}
                </nav>

                <div className="ml-auto flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => navigate('/recruiter/messages')}
                        disabled={isViewer}
                        className="inline-flex items-center gap-2 rounded-lg border border-[#EBC2AE] bg-[#FFF0E8] px-4 py-2.5 text-[12px] font-bold text-[#1D181A] transition-all hover:-translate-y-0.5 hover:border-[#C75560]"
                        title="Message"
                        aria-label="Message"
                    >
                        <span className="relative"><MessageCircle size={15} className="text-[#C75560]" />{unreadMessages > 0 && <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C75560] px-1 text-[9px] font-bold text-white">{unreadMessages > 9 ? '9+' : unreadMessages}</span>}</span>
                        <span className="hidden sm:inline">Message</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/recruiter/wallet')}
                        disabled={isViewer}
                        className="inline-flex items-center gap-2 rounded-lg border border-[#EBC2AE] bg-[#FFF0E8] px-4 py-2.5 text-[12px] font-bold text-[#1D181A] transition-all hover:-translate-y-0.5 hover:border-[#C75560]"
                        title="Wallet"
                    >
                        <Wallet size={15} className="text-[#C75560]" />
                        <span className="hidden sm:inline">Wallet</span>
                    </button>

                    <RecruiterProfileMenu />
                </div>
            </div>
            <nav className="mx-auto flex w-full max-w-[1400px] gap-1 overflow-x-auto border-t border-[#F0D1BF] px-4 py-1 md:hidden sm:px-6" aria-label="Recruiter mobile navigation">
                {links.map(({ to, label, icon: Icon }) => (
                    <NavLink key={to} to={to} className={({ isActive }) => navClass(isActive, to === '/recruiter/post-job')}>
                        <Icon size={14} />
                        {label}
                    </NavLink>
                ))}
            </nav>
        </header>
    );
}