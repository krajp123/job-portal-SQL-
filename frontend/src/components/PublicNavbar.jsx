import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import CandidateNavbar from './CandidateNavbar';
import RecruiterNavbar from './RecruiterNavbar';
import VideoModal from './VideoModal';

function BrandMark() {
    return <p className="text-sm font-bold text-[#1D181A]" style={{ fontFamily: "'Space Grotesk','Inter',ui-sans-serif,sans-serif" }}>Career Route Portal</p>;
}

export default function PublicNavbar() {
    const { user } = useAuth();
    const [authModal, setAuthModal] = useState({ open: false, role: 'candidate', mode: 'register' });
    const [videoOpen, setVideoOpen] = useState(false);

    if (user) {
        return user.role === 'recruiter' ? <RecruiterNavbar /> : <CandidateNavbar />;
    }

    const openAuthModal = (role, mode = 'register') => setAuthModal({ open: true, role, mode });
    const closeAuthModal = () => setAuthModal((current) => ({ ...current, open: false }));

    return (
        <>
            <header className="portal-navbar-shell relative z-50">
                <nav className="portal-navbar" aria-label="Public navigation">
                    <BrandMark />
                    <div className="hidden items-center gap-1 lg:flex">
                        <button type="button" onClick={() => openAuthModal('candidate')} className="home-showcase-link">Find jobs</button>
                        <button type="button" onClick={() => openAuthModal('recruiter')} className="home-showcase-link">Hire talent</button>
                        <button type="button" onClick={() => setVideoOpen(true)} className="home-showcase-link">Platform tour</button>
                    </div>
                    <button type="button" onClick={() => openAuthModal('candidate', 'login')} className="home-showcase-login">
                        Sign in <ArrowRight size={15} />
                    </button>
                </nav>
            </header>
            <AuthModal
                isOpen={authModal.open}
                role={authModal.role}
                mode={authModal.mode}
                onClose={closeAuthModal}
                onModeChange={(mode) => setAuthModal((current) => ({ ...current, mode }))}
                onRoleChange={(role) => setAuthModal((current) => ({ ...current, role }))}
            />
            <VideoModal isOpen={videoOpen} onClose={() => setVideoOpen(false)} />
        </>
    );
}
