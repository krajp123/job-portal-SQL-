import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import RecruiterNavbar from '../../components/RecruiterNavbar';
import { FONT_DISPLAY } from '../../theme';
import { Check, Clock3, Mail, UserRound, X } from 'lucide-react';

export default function RecruiterInvites() {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    let mounted = true;
    async function fetchInvites() {
      setLoading(true);
      try {
        const { data } = await axiosInstance.get('/recruiter/me/invites');
        if (!mounted) return;
        setInvites(Array.isArray(data.invites) ? data.invites : []);
        setError('');
      } catch (err) {
        setError(err?.response?.data?.error || 'Failed to load invites.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchInvites();
    return () => {
      mounted = false;
    };
  }, []);

  async function respond(invite, accept = true) {
    setActionLoading(`${accept ? 'accept' : 'decline'}:${invite.inviterEmail}`);
    setError('');
    try {
      const path = accept ? '/recruiter/me/invites/accept' : '/recruiter/me/invites/decline';
      await axiosInstance.post(path, { inviterEmail: invite.inviterEmail });
      setInvites((prev) => prev.filter((item) => item.inviterEmail !== invite.inviterEmail));
    } catch (err) {
      setError(err?.response?.data?.error || 'Action failed.');
    } finally {
      setActionLoading('');
    }
  }

  return (
    <div className="portal-theme min-h-screen bg-[#FFF8F2] text-[#1D181A]" style={{ fontFamily: FONT_DISPLAY }}>
      <RecruiterNavbar />

      <main className="recruiter-page mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
        <div className="mb-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#C75560]">Team access</p>
          <h1 className="mt-1 text-2xl font-bold text-[#1D181A]" style={{ fontFamily: FONT_DISPLAY }}>Invites</h1>
          <p className="mt-1.5 text-sm text-[#80576A]">Review invitations from recruiters who want you to join their team.</p>
        </div>

        <section className="rounded-2xl border border-[#EBC2AE] bg-white p-4 shadow-[0_16px_34px_-28px_rgba(73,43,49,0.5)] sm:p-6">
          {loading ? (
            <div className="space-y-3" aria-label="Loading invites">
              {[1, 2].map((item) => <div key={item} className="h-28 animate-pulse rounded-xl bg-[#FFF4EF]" />)}
            </div>
          ) : invites.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF0E8] text-[#C75560]"><Mail size={21} /></span>
              <h2 className="mt-4 text-sm font-bold text-[#1D181A]">No pending invites</h2>
              <p className="mt-1 max-w-sm text-sm text-[#80576A]">New team invitations will appear here when another recruiter invites you.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {invites.map((inv) => (
                <li key={inv.inviterEmail} className="flex flex-col gap-4 rounded-xl border border-[#EBC2AE] bg-[#FFFDFC] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF0E8] text-[#C75560]"><UserRound size={18} /></span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-[#1D181A]">{inv.inviterCompany || 'Your company team'}</div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-[#80576A]"><Mail size={12} /> {inv.inviterEmail}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#80576A]"><span className="font-semibold text-[#C75560]">{inv.role || 'Recruiter'}</span><span>·</span><span className="inline-flex items-center gap-1"><Clock3 size={12} /> {inv.invitedAt ? new Date(inv.invitedAt).toLocaleDateString() : 'Recently'}</span></div>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2 sm:justify-end">
                    <button
                      type="button"
                      onClick={() => respond(inv, true)}
                      disabled={Boolean(actionLoading)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#C75560] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#A94658] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Check size={14} /> {actionLoading === `accept:${inv.inviterEmail}` ? 'Accepting…' : 'Accept'}
                    </button>
                    <button
                      type="button"
                      onClick={() => respond(inv, false)}
                      disabled={Boolean(actionLoading)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#EBC2AE] px-3.5 py-2 text-xs font-bold text-[#80576A] transition hover:border-[#C75560] hover:text-[#C75560] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <X size={14} /> {actionLoading === `decline:${inv.inviterEmail}` ? 'Declining…' : 'Decline'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {error && <div className="mt-4 text-sm text-rose-600">{error}</div>}
        </section>
      </main>
    </div>
  );
}
