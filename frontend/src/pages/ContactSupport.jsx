import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Clock3, HelpCircle, Mail, MessageSquare, Phone, Send, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CandidateNavbar from '../components/CandidateNavbar';
import RecruiterNavbar from '../components/RecruiterNavbar';
import axiosInstance from '../api/axiosInstance';
import { FONT_DISPLAY, BG, CORAL, DUSTY_ROSE, NEAR_BLACK, LIGHT_BORDER } from '../theme';

const CANDIDATE_CONCERNS = ['Account', 'Job search', 'Application / profile', 'Resume & documents', 'Report abuse', 'Other'];
const RECRUITER_CONCERNS = ['Account', 'Billing & payments', 'Job posting', 'Applicants & hiring', 'Team & access', 'Report abuse', 'Other'];

function PublicNavbar() {
  const { user } = useAuth();
  return user?.role === 'recruiter' ? <RecruiterNavbar /> : <CandidateNavbar />;
}

const channels = [
  { icon: Mail, title: 'Email support', value: 'support@jobportal.com', detail: 'We reply within two business days.', href: 'mailto:support@jobportal.com' },
  { icon: Phone, title: 'Talk to support', value: '1800 123 4567', detail: 'Monday–Saturday, 9:30 AM–6:30 PM', href: 'tel:18001234567' },
  { icon: HelpCircle, title: 'Browse Help Center', value: 'Find a quick answer', detail: 'Guides for accounts, hiring, and payments.', href: '/help-center' },
];

export default function ContactSupport() {
  const { user } = useAuth();
  const CONCERNS = user?.role === 'recruiter' ? RECRUITER_CONCERNS : CANDIDATE_CONCERNS;
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', concern: '', message: '' });
  const [status, setStatus] = useState({ type: '', text: '' });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const formElement = document.querySelector('form');
    const emailInput = formElement?.querySelector('input[type="email"]');
    if (formElement) formElement.setAttribute('autocomplete', 'off');
    if (emailInput) emailInput.setAttribute('autocomplete', 'new-password');
  }, []);

  function updateField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setStatus({ type: '', text: '' });
    if (!form.name.trim() || !form.email.trim() || !form.concern || !form.message.trim()) {
      setStatus({ type: 'error', text: 'Please complete your name, email, topic, and message.' });
      return;
    }
    setSending(true);
    try {
      await axiosInstance.post('/help-center/reports', form);
      setForm((current) => ({ ...current, concern: '', message: '' }));
      setStatus({ type: 'success', text: 'Thanks. Your message has been sent to our support team.' });
    } catch (error) {
      setStatus({ type: 'error', text: error.response?.data?.error || 'We could not send your message. Please try again.' });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen text-[#1D181A]" style={{ background: BG, fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <PublicNavbar />
      <main>
        <section className="relative overflow-hidden border-b border-[#EBC2AE] bg-[#FFF9F5] px-5 py-9 sm:px-8 sm:py-12"><div className="pointer-events-none absolute right-[8%] top-8 h-28 w-28 rounded-full border-[14px] border-[#F7C56B]/30" /><div className="relative mx-auto max-w-6xl"><p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: CORAL }}>Contact Us / Support</p><h1 className="mt-3 max-w-3xl text-3xl font-bold leading-[1.04] sm:text-5xl" style={{ fontFamily: FONT_DISPLAY }}>Let’s get you moving again.</h1><p className="mt-4 max-w-2xl text-sm leading-6" style={{ color: DUSTY_ROSE }}>Whether something is unclear, stuck, or simply not working as expected, our support team is here to help you make progress.</p></div></section>

        <section className="mx-auto grid max-w-6xl gap-6 px-5 py-10 sm:px-8 sm:py-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: CORAL }}>Choose your route</p><h2 className="mt-2 text-2xl font-bold" style={{ fontFamily: FONT_DISPLAY }}>Support that starts with context.</h2><p className="mt-3 text-xs leading-5 text-[#80576A]">Send us the details below and we’ll route your request to the right team. For quick answers, the Help Center is a good place to start.</p><div className="mt-6 space-y-2">{channels.map(({ icon: Icon, title, value, detail, href }) => <a key={title} href={href} className="group flex flex-nowrap items-center gap-3 rounded-lg border border-[#EBC2AE] bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-[#C75560]"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#FFF0E8] text-[#C75560]"><Icon size={15} /></span><span className="min-w-0"><span className="block truncate text-[10px] font-bold uppercase tracking-[0.1em] text-[#9A671A]">{title}</span><span className="mt-0.5 block truncate text-xs font-bold text-[#1D181A]">{value}</span><span className="mt-0.5 block truncate text-[11px] text-[#80576A]">{detail}</span></span><ArrowRight size={14} className="ml-auto shrink-0 text-[#C75560] transition group-hover:translate-x-1" /></a>)}</div><div className="mt-6 flex flex-nowrap items-start gap-2 border-t border-[#EBC2AE] pt-4 text-[11px] leading-5 text-[#80576A]"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#277451]" /> <span>We keep account and report details private and use them only to resolve your request.</span></div></div>

          <form onSubmit={submit} className="rounded-lg border border-[#EBC2AE] bg-white p-5 shadow-[0_14px_32px_-24px_rgba(139,55,88,0.45)] sm:p-6"><div className="flex items-center justify-between gap-3 border-b border-[#F1DDD4] pb-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: CORAL }}>Send a message</p><h2 className="mt-1.5 text-xl font-bold" style={{ fontFamily: FONT_DISPLAY }}>How can we help?</h2></div><MessageSquare size={20} className="shrink-0 text-[#C75560]" /></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="block"><span className="text-[10px] font-bold uppercase tracking-wide text-[#80576A]">Name</span><input value={form.name} onChange={updateField('name')} className="mt-1 w-full rounded-lg border border-[#EBC2AE] bg-[#FFFDFC] px-3 py-2.5 text-xs outline-none focus:border-[#C75560]" placeholder="Your name" /></label><label className="block"><span className="text-[10px] font-bold uppercase tracking-wide text-[#80576A]">Email</span><input type="email" value={form.email} onChange={updateField('email')} className="mt-1 w-full rounded-lg border border-[#EBC2AE] bg-[#FFFDFC] px-3 py-2.5 text-xs outline-none focus:border-[#C75560]" placeholder="you@example.com" /></label></div><label className="mt-3 block"><span className="text-[10px] font-bold uppercase tracking-wide text-[#80576A]">Phone <span className="font-normal normal-case">(optional)</span></span><input value={form.phone} onChange={updateField('phone')} className="mt-1 w-full rounded-lg border border-[#EBC2AE] bg-[#FFFDFC] px-3 py-2.5 text-xs outline-none focus:border-[#C75560]" placeholder="+91 00000 00000" /></label><label className="mt-3 block"><span className="text-[10px] font-bold uppercase tracking-wide text-[#80576A]">Topic</span><select value={form.concern} onChange={updateField('concern')} className="mt-1 w-full rounded-lg border border-[#EBC2AE] bg-[#FFFDFC] px-3 py-2.5 text-xs outline-none focus:border-[#C75560]"><option value="">Select a topic</option>{CONCERNS.map((concern) => <option key={concern} value={concern}>{concern}</option>)}</select></label><label className="mt-3 block"><span className="text-[10px] font-bold uppercase tracking-wide text-[#80576A]">Message</span><textarea rows={4} value={form.message} onChange={updateField('message')} className="mt-1 w-full resize-y rounded-lg border border-[#EBC2AE] bg-[#FFFDFC] px-3 py-2.5 text-xs leading-5 outline-none focus:border-[#C75560]" placeholder="Tell us what happened and what you need help with." /></label>{status.text && <div role="status" className={`mt-3 rounded-lg border px-3 py-2.5 text-xs ${status.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-[#E9B6AF] bg-[#FFF0EE] text-[#B3261E]'}`}>{status.type === 'success' && <CheckCircle2 size={14} className="mr-1 inline" />}{status.text}</div>}<button type="submit" disabled={sending} className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60" style={{ background: CORAL }}>{sending ? 'Sending…' : 'Send to support'} <Send size={14} /></button><p className="mt-3 flex items-center gap-2 text-[11px] text-[#80576A]"><Clock3 size={13} /> Typical response time: two business days</p></form>
        </section>
      </main>
    </div>
  );
}
