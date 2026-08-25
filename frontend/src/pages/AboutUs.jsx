import { Link } from 'react-router-dom';
import { ArrowRight, Check, HeartHandshake, Search, ShieldCheck, Sparkles, UsersRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CandidateNavbar from '../components/CandidateNavbar';
import RecruiterNavbar from '../components/RecruiterNavbar';
import { FONT_DISPLAY, BG, CORAL, CORAL_HOVER, DUSTY_ROSE, NEAR_BLACK, LIGHT_BORDER, AMBER } from '../theme';

const PRINCIPLES = [
  { icon: Search, title: 'Relevance over noise', text: 'Better signals help candidates find roles worth their time and recruiters focus on people who fit the work.' },
  { icon: ShieldCheck, title: 'Trust by design', text: 'Clear profiles, thoughtful controls, and accountable hiring workflows keep every interaction more dependable.' },
  { icon: HeartHandshake, title: 'Human momentum', text: 'Good hiring is a conversation. We make the steps between first interest and the right decision easier to navigate.' },
];

const JOURNEY = [
  { number: '01', title: 'Build a clear profile', text: 'Candidates show their strengths. Recruiters present the work, context, and culture behind each opportunity.' },
  { number: '02', title: 'Make the right connection', text: 'Search, recommendations, and direct communication bring the most relevant people into the same conversation.' },
  { number: '03', title: 'Move with confidence', text: 'Structured applications and hiring milestones keep both sides informed from shortlist to signed offer.' },
];

function PublicNavbar() {
  const { user } = useAuth();
  return user?.role === 'recruiter' ? <RecruiterNavbar /> : <CandidateNavbar />;
}

export default function AboutUs() {
  return (
    <div className="min-h-screen text-[#1D181A]" style={{ background: BG, fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <PublicNavbar />
      <main>
        <section className="relative overflow-hidden border-b border-[#EBC2AE] bg-[#FFF9F5] px-5 py-9 sm:px-8 sm:py-12">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border-[34px] border-[#F7C56B]/35" />
          <div className="pointer-events-none absolute bottom-[-120px] left-[8%] h-64 w-64 rounded-full border-[24px] border-[#C75560]/10" />
          <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: CORAL }}>About Career Route</p>
              <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-[1.04] sm:text-5xl" style={{ fontFamily: FONT_DISPLAY }}>
                Hiring should feel more human.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6" style={{ color: DUSTY_ROSE }}>
                Career Route brings candidates and recruiters into one thoughtful workspace, where the right opportunity can meet the right person without the usual noise.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link to="/candidate/jobs" className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold text-white transition hover:-translate-y-0.5" style={{ background: CORAL }}>
                  Explore opportunities <ArrowRight size={14} />
                </Link>
                <Link to="/contact" className="inline-flex items-center gap-2 rounded-lg border border-[#EBC2AE] bg-white px-4 py-2.5 text-xs font-bold text-[#54263F] transition hover:border-[#C75560]">
                  Talk to our team
                </Link>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-md">
              <div className="relative overflow-hidden rounded-lg border border-[#EBC2AE] bg-white p-4 shadow-[0_18px_42px_-28px_rgba(139,55,88,0.45)]">
                <div className="flex items-center justify-between border-b border-[#F1DDD4] pb-3">
                  <div><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#9A671A]">The right signal</p><p className="mt-1 text-base font-bold" style={{ fontFamily: FONT_DISPLAY }}>A better match</p></div>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFF0E8] text-[#C75560]"><Sparkles size={15} /></span>
                </div>
                <div className="mt-3 space-y-2">
                  {[['Candidate strengths', 'Skills, goals, and experience'], ['Role context', 'Team, work, and expectations'], ['Shared momentum', 'Clear next steps for both sides']].map(([title, text], index) => (
                    <div key={title} className="flex flex-nowrap items-center gap-2 rounded-md border border-[#F1DDD4] bg-[#FFFDFC] px-3 py-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: index === 1 ? AMBER : CORAL }}>{index + 1}</span>
                      <div className="min-w-0"><p className="truncate text-xs font-bold">{title}</p><p className="mt-0.5 truncate text-[11px] text-[#80576A]">{text}</p></div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-nowrap items-center gap-2 rounded-md bg-[#EEF1EC] px-3 py-2 text-[11px] font-semibold text-[#3E4B43]"><Check size={14} className="shrink-0 text-[#277451]" /> <span className="truncate">Built for clarity at every step</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
          <div className="max-w-2xl"><p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: CORAL }}>What we believe</p><h2 className="mt-2 text-2xl font-bold sm:text-3xl" style={{ fontFamily: FONT_DISPLAY }}>Less friction. More possibility.</h2><p className="mt-3 text-xs leading-5 text-[#80576A]">A career decision carries real weight. Our product is designed around the moments that make hiring feel clearer, fairer, and more useful.</p></div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">{PRINCIPLES.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-lg border border-[#EBC2AE] bg-white p-4 shadow-sm"><span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#FFF0E8] text-[#C75560]"><Icon size={16} /></span><h3 className="mt-3 text-sm font-bold" style={{ fontFamily: FONT_DISPLAY }}>{title}</h3><p className="mt-1.5 text-xs leading-5 text-[#80576A]">{text}</p></article>)}</div>
        </section>

        <section className="border-y border-[#D7DED5] bg-[#EEF1EC] px-5 py-10 sm:px-8 sm:py-12"><div className="mx-auto max-w-6xl"><div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7A2333]">How it works</p><h2 className="mt-2 text-2xl font-bold" style={{ fontFamily: FONT_DISPLAY }}>From possibility to progress.</h2></div><UsersRound className="shrink-0 text-[#7A2333]" size={26} /></div><div className="mt-6 grid gap-5 md:grid-cols-3">{JOURNEY.map((item) => <article key={item.number} className="border-t-2 border-[#C75560] pt-3"><p className="text-[10px] font-bold tracking-[0.16em] text-[#9A671A]">{item.number}</p><h3 className="mt-2 text-base font-bold" style={{ fontFamily: FONT_DISPLAY }}>{item.title}</h3><p className="mt-1.5 text-xs leading-5 text-[#3E4B43]">{item.text}</p></article>)}</div></div></section>

        <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12"><div className="flex flex-col items-start justify-between gap-4 rounded-lg border border-[#EBC2AE] bg-white p-5 shadow-sm sm:flex-row sm:items-center"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: CORAL }}>Ready when you are</p><h2 className="mt-1.5 text-lg font-bold" style={{ fontFamily: FONT_DISPLAY }}>Your next chapter can start here.</h2></div><Link to="/help-center" className="inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold text-white" style={{ background: CORAL_HOVER }}>Visit Help Center <ArrowRight size={14} /></Link></div></section>
      </main>
    </div>
  );
}
