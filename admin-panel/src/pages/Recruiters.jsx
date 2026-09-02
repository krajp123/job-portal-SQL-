import { useEffect, useState, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import adminAxiosInstance from '../api/adminAxiosInstance';

const RECRUITERS_PER_PAGE = 10;

const ALL_RECRUITER_COLUMNS = [
  { key: 'fullName', label: 'Recruiter Name' },
  { key: 'uniqueId', label: 'Recruiter ID' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'companyName', label: 'Company Name' },
  { key: 'companyWebsite', label: 'Website' },
  { key: 'gstNumber', label: 'GST Number' },
  { key: 'accountStatus', label: 'Status' },
];

const PENDING_RECRUITER_COLUMNS = [
  { key: 'email', label: 'Email' },
  { key: 'accountStatus', label: 'Status' },
];

export default function Recruiters() {
  const navigate = useNavigate();
  const location = useLocation();
  const isPendingView = location.pathname.endsWith('/pending');
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await adminAxiosInstance.get('/users/recruiters', {
          params: {
            search: searchTerm.trim(),
            status: statusFilter === 'all' ? undefined : statusFilter,
            registrationStatus: isPendingView ? 'incomplete' : 'complete',
            page: currentPage,
            limit: RECRUITERS_PER_PAGE,
          },
        });

        if (requestId !== requestIdRef.current) {
          return;
        }

        const payload = response.data || {};
        const realData = Array.isArray(payload.recruiters) ? payload.recruiters : payload.recruiters || [];

        setRecruiters(realData);
        setTotalCount(payload.totalCount || realData.length);
        setTotalPages(payload.totalPages || Math.max(1, Math.ceil(realData.length / RECRUITERS_PER_PAGE)));
      } catch (error) {
        if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
          return;
        }

        if (requestId !== requestIdRef.current) {
          return;
        }

        console.error('Failed to load recruiters:', error);
        setError(error.response?.data?.error || error.message || 'Failed to load recruiters');
        setRecruiters([]);
        setTotalCount(0);
        setTotalPages(1);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      requestIdRef.current += 1;
    };
  }, [searchTerm, statusFilter, currentPage, isPendingView, location.pathname]);

  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm('');
    setStatusFilter('all');
    setRecruiters([]);
    setError(null);
    setLoading(true);
  }, [isPendingView]);

  const columns = isPendingView ? PENDING_RECRUITER_COLUMNS : ALL_RECRUITER_COLUMNS;

  const renderCell = (recruiter, key) => {
    if (key === 'companyWebsite') {
      return recruiter.companyWebsite ? (
        <a
          href={recruiter.companyWebsite}
          target="_blank"
          rel="noopener noreferrer"
          className="block max-w-full break-words text-[#C75560] underline decoration-[#EBC2AE] underline-offset-2 hover:text-[#D9654A]"
        >
          {recruiter.companyWebsite}
        </a>
      ) : (
        '—'
      );
    }

    if (key === 'accountStatus') {
      const isPendingRecruiter = isPendingView && recruiter.registrationStatus === 'incomplete';
      const status = isPendingRecruiter ? 'pending' : recruiter.accountStatus || 'unknown';
      const styles =
        status === 'pending'
          ? 'bg-amber-50 text-amber-700 border-amber-200'
          : status === 'active'
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : status === 'suspended'
          ? 'bg-red-50 text-red-700 border-red-200'
          : 'bg-[#FFF4EF] text-[#80576A] border-[#EBC2AE]';

      return (
        <span className={`inline-flex max-w-full items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles}`}>
          {status}
        </span>
      );
    }

    return <span className="block max-w-full break-words whitespace-normal">{recruiter[key] || '—'}</span>;
  };

  return (
    <div className="min-w-0 w-full space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1D181A]">
            {isPendingView ? 'Pending Recruiters' : 'Recruiters'}
          </h1>
          <p className="mt-1 text-sm text-[#80576A]">
            {isPendingView
              ? 'Recruiters who paid but did not complete registration yet.'
              : 'Manage and view all recruiter accounts on the platform.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/recruiters')}
            className={`border px-3 py-2 text-[11px] font-semibold transition ${
              isPendingView
                ? 'border-[#1D181A] bg-[#FFFDFB] text-[#1D181A] hover:bg-[#FFF0E8]'
                : 'border-[#C75560] bg-[#C75560] text-white hover:bg-[#A0182C]'
            }`}
          >
            {isPendingView ? 'View All Recruiters' : 'Recruiters'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/recruiters/pending')}
            className={`border px-3 py-2 text-[11px] font-semibold transition ${
              isPendingView
                ? 'border-[#C75560] bg-[#C75560] text-white hover:bg-[#A0182C]'
                : 'border-[#1D181A] bg-[#FFFDFB] text-[#1D181A] hover:bg-[#FFF0E8]'
            }`}
          >
            Pending Recruiters
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 border border-[#EBC2AE] bg-[#FFF4EF] p-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#80576A]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by name, email, company, phone"
            className="w-full border border-[#1D181A] bg-[#FFFDFB] py-2 pl-9 pr-3 text-xs text-[#1D181A] outline-none placeholder:text-[#80576A]"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-[#1D181A] md:justify-end">
          <label htmlFor="statusFilter" className="font-medium whitespace-nowrap">
            Status
          </label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full border border-[#1D181A] bg-[#FFFDFB] px-2 py-2 text-xs text-[#1D181A] outline-none md:w-auto"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>
        </div>
      </div>

      <div className="w-full max-w-full overflow-x-auto border border-[#1D181A] bg-[#FFFDFB]">
        <table className="min-w-full w-full table-fixed border-collapse text-xs sm:text-[11px] md:min-w-[760px]">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="border border-[#1D181A] bg-[#FFF4EF] px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-[#1D181A] break-words"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="border border-[#1D181A] px-2 py-6 text-center text-[#80576A]">
                  Loading recruiters…
                </td>
              </tr>
            ) : error && recruiters.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="border border-[#1D181A] px-2 py-6 text-center text-red-600">
                  Error: {error}
                </td>
              </tr>
            ) : recruiters.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="border border-[#1D181A] px-2 py-6 text-center text-[#80576A]">
                  No recruiters match your current search.
                </td>
              </tr>
            ) : (
              recruiters.map((recruiter, idx) => {
                const isPendingRow = isPendingView && recruiter.registrationStatus === 'incomplete';

                return (
                <tr
                  key={recruiter._id}
                  onClick={() => {
                    if (!isPendingRow) {
                      navigate(`/recruiters/${recruiter._id}`);
                    }
                  }}
                  className={`${!isPendingRow ? 'cursor-pointer transition hover:bg-[#FFF0E8]' : 'cursor-default'} ${idx % 2 === 0 ? 'bg-[#FFFDFB]' : 'bg-[#FFF4EF]/40'}`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`border border-[#1D181A] overflow-hidden px-2 py-2 align-top text-[#1D181A] break-words ${
                        col.key === 'fullName' || col.key === 'companyName' ? 'font-medium' : ''
                      }`}
                    >
                      {renderCell(recruiter, col.key)}
                    </td>
                  ))}
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && recruiters.length > 0 && (
        <div className="flex flex-col gap-3 border border-[#EBC2AE] bg-[#FFF4EF] p-3 text-xs font-medium text-[#80576A] md:flex-row md:items-center md:justify-between">
          <div>
            Showing {recruiters.length} of {totalCount} recruiter(s)
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 border border-[#1D181A] bg-[#FFFDFB] px-2 py-1 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </button>

            <span className="min-w-[90px] text-center text-[#1D181A]">
              Page {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage >= totalPages}
              className="flex items-center gap-1 border border-[#1D181A] bg-[#FFFDFB] px-2 py-1 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}