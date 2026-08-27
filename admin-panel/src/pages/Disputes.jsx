import { useEffect, useState } from 'react';
import adminAxiosInstance from '../api/adminAxiosInstance';

export default function Disputes() {
  const [disputes, setDisputes] = useState([]);
  const [resolveTarget, setResolveTarget] = useState(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await adminAxiosInstance.get('/disputes');
    setDisputes(data);
  }

  async function resolve() {
    await adminAxiosInstance.patch(`/disputes/${resolveTarget}/resolve`, { status: 'resolved', resolutionNotes: notes.trim() });
    setResolveTarget(null);
    setNotes('');
    load();
  }

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>Disputes</h2>

      {disputes.length === 0 && <p>No disputes.</p>}

      {disputes.map((d) => (
        <div key={d._id} style={{ border: '1px solid #ddd', padding: 16, marginBottom: 12 }}>
          <p><strong>{d.subject}</strong> — {d.status}</p>
          <p>{d.description}</p>
          {d.status !== 'resolved' && (
            <button onClick={() => setResolveTarget(d._id)}>Mark Resolved</button>
          )}
        </div>
      ))}

      {resolveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="resolve-dispute-title">
          <div className="w-full max-w-md bg-white p-5 shadow-xl">
            <h3 id="resolve-dispute-title">Resolution notes</h3>
            <textarea autoFocus value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} className="mt-3 w-full border border-gray-300 p-2" />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => { setResolveTarget(null); setNotes(''); }}>Cancel</button>
              <button type="button" onClick={resolve} disabled={!notes.trim()}>Submit resolution</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
