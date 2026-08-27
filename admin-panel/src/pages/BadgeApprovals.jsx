import { useEffect, useState } from 'react';
import adminAxiosInstance from '../api/adminAxiosInstance';

export default function BadgeApprovals() {
  const [pending, setPending] = useState([]);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await adminAxiosInstance.get('/badges/pending');
    setPending(data);
  }

  async function approve(offerLetterId) {
    await adminAxiosInstance.patch(`/badges/${offerLetterId}/approve`);
    load();
  }

  async function reject() {
    await adminAxiosInstance.patch(`/badges/${rejectTarget}/reject`, { reason: reason.trim() });
    setRejectTarget(null);
    setReason('');
    load();
  }

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>Pending Hired Badge Approvals</h2>

      {pending.length === 0 && <p>No pending approvals.</p>}

      {pending.map((item) => (
        <div key={item._id} style={{ border: '1px solid #ddd', padding: 16, marginBottom: 12 }}>
          <p><strong>Candidate:</strong> {item.application?.candidate?.name}</p>
          <p><strong>Job:</strong> {item.application?.job?.title}</p>
          <a href={item.signedAcceptanceUrl} target="_blank" rel="noreferrer">
            View signed acceptance letter
          </a>
          <div style={{ marginTop: 8 }}>
            <button onClick={() => approve(item._id)}>Approve</button>
            <button onClick={() => reject(item._id)} style={{ marginLeft: 8 }}>Reject</button>
          </div>
        </div>
      ))}

      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="reject-badge-title">
          <div className="w-full max-w-md bg-white p-5 shadow-xl">
            <h3 id="reject-badge-title">Reason for rejection</h3>
            <textarea autoFocus value={reason} onChange={(event) => setReason(event.target.value)} rows={4} className="mt-3 w-full border border-gray-300 p-2" />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => { setRejectTarget(null); setReason(''); }}>Cancel</button>
              <button type="button" onClick={reject} disabled={!reason.trim()}>Submit rejection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
