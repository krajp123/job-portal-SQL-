import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Eye, RefreshCcw, ShieldAlert, XCircle } from 'lucide-react';
import adminAxiosInstance from '../api/adminAxiosInstance';

const SEEN_REPORTS_KEY = 'admin-seen-job-reports';

const STATUS_LABELS = {
  pending: 'Pending',
  under_review: 'Under Review',
  valid: 'Valid',
  rejected: 'Rejected',
  resolved: 'Resolved',
};

function statusClass(status) {
  if (status === 'valid' || status === 'resolved') return 'bg-green-50 text-green-700';
  if (status === 'rejected') return 'bg-slate-100 text-slate-600';
  if (status === 'under_review') return 'bg-amber-50 text-amber-700';
  return 'bg-red-50 text-red-700';
}

export default function JobReports() {
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState('');
  const [drafts, setDrafts] = useState({});
  const [deletingId, setDeletingId] = useState('');
  const [confirmingReport, setConfirmingReport] = useState(null);

  async function loadReports() {
    setLoading(true);
    setError('');
    try {
      const { data } = await adminAxiosInstance.get('/moderation/reports', { params: statusFilter ? { status: statusFilter } : {} });
      const nextReports = data.reports || [];
      setReports(nextReports);
      let storedSeenReportIds = [];
      try {
        storedSeenReportIds = JSON.parse(localStorage.getItem(SEEN_REPORTS_KEY) || '[]');
      } catch {
        storedSeenReportIds = [];
      }
      const seenReportIds = new Set(storedSeenReportIds);
      nextReports.filter((report) => report.status === 'pending').forEach((report) => seenReportIds.add(report._id));
      localStorage.setItem(SEEN_REPORTS_KEY, JSON.stringify([...seenReportIds]));
      window.dispatchEvent(new Event('jobReportsViewed'));
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to load job reports.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadReports(); }, [statusFilter]);

  function updateDraft(id, field, value) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], [field]: value } }));
  }

  async function reviewReport(report) {
    const draft = drafts[report._id] || {};
    if (!draft.status) return;
    setSavingId(report._id);
    setError('');
    try {
      const endpoint = report.reportType === 'support'
        ? `/moderation/support-reports/${report._id}`
        : `/moderation/reports/${report._id}`;
      await adminAxiosInstance.patch(endpoint, report.reportType === 'support'
        ? { status: draft.status, reviewNotes: draft.reviewNotes || '' }
        : { status: draft.status, action: draft.action || 'none', reviewNotes: draft.reviewNotes || '' });
      await loadReports();
      setDrafts((current) => ({ ...current, [report._id]: {} }));
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to update this report.');
    } finally {
      setSavingId('');
    }
  }

  function requestDeleteReport(report) {
    setConfirmingReport(report);
  }

  async function deleteReport(report) {
    setDeletingId(report._id);
    setError('');
    try {
      const endpoint = report.reportType === 'support'
        ? `/moderation/support-reports/${report._id}`
        : `/moderation/reports/${report._id}`;
      await adminAxiosInstance.delete(endpoint);
      setReports((current) => current.filter((item) => item._id !== report._id));
      setConfirmingReport(null);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to delete this report.');
    } finally {
      setDeletingId('');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-[#1D181A]">Job Reports</h1>
          <p className="mt-0.5 text-xs text-[#80576A]">Review reported jobs and take moderation action.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="border border-[#EBC2AE] bg-white px-3 py-2 text-xs text-[#1D181A] outline-none">
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <button type="button" onClick={loadReports} className="flex items-center gap-1.5 border border-[#EBC2AE] px-3 py-2 text-xs font-semibold text-[#80576A] hover:bg-[#FFF4EF]"><RefreshCcw size={13} /> Refresh</button>
        </div>
      </div>

      {error && <p className="border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}
      {loading ? <p className="border border-[#EBC2AE] bg-white px-4 py-8 text-center text-xs text-[#80576A]">Loading job reports...</p> : reports.length === 0 ? <p className="border border-[#EBC2AE] bg-white px-4 py-8 text-center text-xs text-[#80576A]">No job reports found.</p> : (
        <div className="space-y-3">
          {reports.map((report) => {
            const draft = drafts[report._id] || {};
            const job = report.job;
            return (
              <article key={report._id} className="border border-[#EBC2AE] bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-semibold text-[#1D181A]">{report.reportType === 'support' ? 'Help Center support request' : (job?.title || 'Job removed')}</h2>
                      <span className={`px-2 py-0.5 text-[10px] font-bold ${statusClass(report.status)}`}>{STATUS_LABELS[report.status] || report.status}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-[#80576A]">Submitted {new Date(report.createdAt).toLocaleString('en-IN')} by {report.reportedBy?.name || report.reportedBy?.fullName || report.reportedBy?.email || report.reportedByType}</p>
                    {report.reportType === 'support' && report.sender && (
                      <div className="mt-2 grid gap-x-5 gap-y-1 text-[11px] text-[#53657D] sm:grid-cols-2">
                        <p><span className="font-semibold text-[#1D181A]">Name:</span> {report.sender.name}</p>
                        <p><span className="font-semibold text-[#1D181A]">Email:</span> {report.sender.email}</p>
                        <p><span className="font-semibold text-[#1D181A]">Phone:</span> {report.sender.phone}</p>
                        {report.sender.role === 'candidate' && <p><span className="font-semibold text-[#1D181A]">Unique ID:</span> {report.sender.uniqueId}</p>}
                        <p><span className="font-semibold text-[#1D181A]">Role:</span> {report.sender.role}</p>
                      </div>
                    )}
                    <p className="mt-3 text-xs leading-5 text-[#1D181A]"><span className="font-semibold">{report.reportType === 'support' ? 'Concern:' : 'Reason:'}</span> {report.reportType === 'support' ? report.concern : report.reason}</p>
                    {report.reportType === 'support' && <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#1D181A]"><span className="font-semibold">Message:</span> {report.message || report.reason}</p>}
                  </div>
                  {report.status === 'pending' && <AlertTriangle size={18} className="shrink-0 text-[#C75560]" />}
                  {['valid', 'rejected', 'resolved'].includes(report.status) && (
                    <button
                      type="button"
                      onClick={() => requestDeleteReport(report)}
                      disabled={deletingId === report._id}
                      aria-label="Delete completed report"
                      title="Delete completed report"
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#7F96B2] transition-colors hover:bg-[#FCECF0] hover:text-[#C75560] disabled:cursor-wait disabled:opacity-50"
                    >
                      {report.status === 'rejected' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                    </button>
                  )}
                </div>
                {report.status === 'pending' || report.status === 'under_review' ? (
                  <div className="mt-4 grid gap-2 border-t border-[#EBC2AE]/60 pt-3 md:grid-cols-[150px_180px_1fr_auto]">
                    <select value={draft.status || ''} onChange={(event) => updateDraft(report._id, 'status', event.target.value)} className="border border-[#EBC2AE] bg-[#FFFDFB] px-2 py-2 text-xs outline-none">
                      <option value="">Review status</option>
                      <option value="under_review">Under Review</option>
                      {report.reportType !== 'support' && <option value="valid">Valid</option>}
                      <option value="rejected">Rejected</option>
                      {report.reportType === 'support' && <option value="resolved">Resolved</option>}
                    </select>
                    {report.reportType !== 'support' && <select value={draft.action || 'none'} onChange={(event) => updateDraft(report._id, 'action', event.target.value)} className="border border-[#EBC2AE] bg-[#FFFDFB] px-2 py-2 text-xs outline-none">
                      <option value="none">No action</option>
                      <option value="warn_recruiter">Warn recruiter</option>
                      <option value="close_job">Close job</option>
                      <option value="suspend_recruiter">Suspend recruiter</option>
                      <option value="remove_job">Remove job</option>
                    </select>}
                    <input value={draft.reviewNotes || ''} onChange={(event) => updateDraft(report._id, 'reviewNotes', event.target.value)} placeholder="Review note for recruiter (optional)" className="border border-[#EBC2AE] bg-[#FFFDFB] px-2 py-2 text-xs outline-none focus:border-[#C75560]" />
                    <button type="button" onClick={() => reviewReport(report)} disabled={!draft.status || savingId === report._id} className="flex items-center justify-center gap-1.5 bg-[#C75560] px-3 py-2 text-xs font-semibold text-white hover:bg-[#D9654A] disabled:opacity-50"><Eye size={13} /> {savingId === report._id ? 'Saving...' : 'Apply review'}</button>
                  </div>
                ) : (
                  <p className="mt-3 border-t border-[#EBC2AE]/60 pt-3 text-[11px] text-[#80576A]">{report.reportType === 'support' ? 'Review' : 'Action'}: {report.reportType === 'support' ? (report.status === 'resolved' ? 'resolved' : 'none') : (report.action || 'none')}{report.reviewNotes ? ` · ${report.reviewNotes}` : ''}</p>
                )}
              </article>
            );
          })}
        </div>
      )}

      {confirmingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1D181A]/35 px-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="delete-report-title" className="w-full max-w-sm border border-[#EBC2AE] bg-white p-5 shadow-xl">
            <div className="flex items-start gap-3">
              <ShieldAlert size={22} className="shrink-0 text-[#C75560]" />
              <div>
                <h2 id="delete-report-title" className="text-sm font-semibold text-[#1D181A]">Delete completed report?</h2>
                <p className="mt-1 text-xs leading-5 text-[#80576A]">This report will be permanently removed.</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmingReport(null)} className="border border-[#EBC2AE] px-3 py-2 text-xs font-semibold text-[#80576A] hover:bg-[#FFF4EF]">Cancel</button>
              <button type="button" onClick={() => deleteReport(confirmingReport)} disabled={deletingId === confirmingReport._id} className="bg-[#C75560] px-3 py-2 text-xs font-semibold text-white hover:bg-[#D9654A] disabled:cursor-wait disabled:opacity-50">{deletingId === confirmingReport._id ? 'Deleting...' : 'Delete report'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
