import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  AlertCircle,
  Search,
  ArrowRight,
  ChevronRight,
  ArrowUpDown,
  X,
  RefreshCw,
} from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import CandidateNavbar from '../../components/CandidateNavbar';
import { AMBER_DARK, GOLD, GOLD_DARK, NEAR_BLACK } from '../../theme';

const CORAL = '#C75560';
const RUST = '#D9654A';
const IVORY = '#FFFDFB';
const BORDER = '#EBC2AE';

// Deterministic accent so the same company always gets the same mark color
const ACCENTS = [GOLD_DARK, CORAL, RUST, AMBER_DARK];
const accentFor = (name = '') => {
  const sum = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return ACCENTS[sum % ACCENTS.length];
};
const initialsFor = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || '?';

function CompanyMark({ name, logoUrl, size = 40 }) {
  const color = accentFor(name);
  const [imageError, setImageError] = useState(false);
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-lg font-bold"
      style={{
        width: size,
        height: size,
        backgroundColor: `${color}1A`,
        color,
        fontSize: size * 0.35,
      }}
    >
      {logoUrl && !imageError ? (
        <img
          src={logoUrl}
          alt={`${name || 'Company'} logo`}
          className="h-full w-full rounded-lg object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        initialsFor(name)
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 h-10 w-10 rounded-lg bg-gray-200" />
      <div className="mb-2 h-3.5 w-2/3 rounded bg-gray-200" />
      <div className="mb-4 h-2.5 w-1/3 rounded bg-gray-200" />
      <div className="h-8 w-full rounded-lg bg-gray-200" />
    </div>
  );
}

export default function CandidateCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [industry, setIndustry] = useState('All');
  const [sortBy, setSortBy] = useState('openJobs'); // 'openJobs' | 'name'
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get('/companies/top');
      setCompanies(response.data || []);
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError('Companies did not load. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const industries = useMemo(() => {
    const set = new Set(companies.map((c) => c.industry).filter(Boolean));
    return set.size ? ['All', ...Array.from(set)] : [];
  }, [companies]);

  const totalOpenJobs = useMemo(
    () => companies.reduce((sum, c) => sum + (c.openJobs || 0), 0),
    [companies]
  );

  const filtered = useMemo(() => {
    let list = companies;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) => c.name?.toLowerCase().includes(q));
    }
    if (industry !== 'All') {
      list = list.filter((c) => c.industry === industry);
    }
    return [...list].sort((a, b) =>
      sortBy === 'name'
        ? (a.name || '').localeCompare(b.name || '')
        : (b.openJobs || 0) - (a.openJobs || 0)
    );
  }, [companies, searchQuery, industry, sortBy]);

  const spotlight = useMemo(
    () =>
      !searchQuery.trim() && industry === 'All'
        ? [...companies].sort((a, b) => (b.openJobs || 0) - (a.openJobs || 0)).slice(0, 3)
        : [],
    [companies, searchQuery, industry]
  );

  const handleCompanyClick = (companyId) => navigate(`/candidate/companies/${companyId}`);
  const handleCardKeyDown = (e, companyId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCompanyClick(companyId);
    }
  };

  return (
    <div className="min-h-screen">
      <CandidateNavbar />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: NEAR_BLACK }}>
              Top Hiring Companies
            </h1>
            <p className="mt-1 text-xs" style={{ color: AMBER_DARK }}>
              Explore companies and their open opportunities
            </p>
          </div>

          {!loading && !error && companies.length > 0 && (
            <div className="flex gap-4 rounded-lg border px-4 py-2 text-sm" style={{ borderColor: BORDER, backgroundColor: '#FFF9F3' }}>
              <div>
                <p className="font-bold" style={{ color: NEAR_BLACK }}>
                  {companies.length}
                </p>
                <p className="text-[10px]" style={{ color: AMBER_DARK }}>
                  companies
                </p>
              </div>
              <div className="w-px" style={{ backgroundColor: BORDER }} />
              <div>
                <p className="font-bold" style={{ color: NEAR_BLACK }}>
                  {totalOpenJobs}
                </p>
                <p className="text-[10px]" style={{ color: AMBER_DARK }}>
                  open roles
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Spotlight leaderboard — top 3 most active hirers, hidden while filtering */}
        {!loading && !error && spotlight.length > 0 && (
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-px flex-1" style={{ backgroundColor: BORDER }} />
              <p className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider" style={{ color: GOLD_DARK }}>
                Most active
              </p>
              <div className="h-px flex-1" style={{ backgroundColor: BORDER }} />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {spotlight.map((company, idx) => (
                <div
                  key={company._id}
                  onClick={() => handleCompanyClick(company._id)}
                  onKeyDown={(e) => handleCardKeyDown(e, company._id)}
                  role="button"
                  tabIndex={0}
                  className="group relative cursor-pointer overflow-hidden rounded-lg p-3 transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ backgroundColor: NEAR_BLACK, ringColor: CORAL }}
                >
                  <span
                    className="pointer-events-none absolute -bottom-3 -right-1 select-none text-6xl font-black leading-none opacity-10"
                    style={{ color: GOLD }}
                  >
                    {idx + 1}
                  </span>
                  <div className="relative flex items-center gap-2">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-xs font-bold"
                      style={{ backgroundColor: GOLD, color: NEAR_BLACK }}
                    >
                      {company.companyLogoUrl ? (
                        <img
                          src={company.companyLogoUrl}
                          alt={`${company.name || 'Company'} logo`}
                          className="h-full w-full rounded object-cover"
                        />
                      ) : (
                        initialsFor(company.name)
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-white">{company.name || 'Company'}</h3>
                      <p className="text-[11px] font-medium" style={{ color: GOLD }}>
                        {company.companyType || company.industry || 'Company profile'}
                      </p>
                    </div>
                  </div>
                  <div className="relative mt-2 flex items-center gap-1 text-[10px] font-semibold text-white/70 transition-colors group-hover:text-white">
                    View <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="mb-5 flex flex-col gap-2.5">
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <div className="relative max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: GOLD_DARK }} />
              <input
                type="text"
                aria-label="Search companies"
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-9 text-xs focus:outline-none focus:ring-1"
                style={{ borderColor: '#D1D5DB' }}
                onFocus={(e) => (e.target.style.borderColor = CORAL)}
                onBlur={(e) => (e.target.style.borderColor = '#D1D5DB')}
              />
              {searchQuery && (
                <button
                  aria-label="Clear search"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              onClick={() => setSortBy(sortBy === 'openJobs' ? 'name' : 'openJobs')}
              className="flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors hover:bg-gray-50"
              style={{ borderColor: '#D1D5DB', color: NEAR_BLACK }}
            >
              <ArrowUpDown size={13} style={{ color: GOLD_DARK }} />
              <span className="hidden sm:inline">{sortBy === 'openJobs' ? 'Most open' : 'Name, A–Z'}</span>
            </button>
          </div>

          {industries.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {industries.map((tag) => {
                const active = industry === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => setIndustry(tag)}
                    className="rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors"
                    style={
                      active
                        ? { backgroundColor: NEAR_BLACK, borderColor: NEAR_BLACK, color: '#fff' }
                        : { backgroundColor: '#fff', borderColor: BORDER, color: AMBER_DARK }
                    }
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-5 py-7 text-center">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <p className="text-xs text-red-800">{error}</p>
            <button
              onClick={fetchCompanies}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: GOLD_DARK }}
            >
              <RefreshCw size={12} /> Try again
            </button>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && (
          <>
            {filtered.length > 0 ? (
              <>
                <p className="mb-3 text-xs" style={{ color: AMBER_DARK }}>
                  {filtered.length} compan{filtered.length !== 1 ? 'ies' : 'y'}
                  {searchQuery ? ` matching "${searchQuery}"` : ''}
                </p>
                <motion.div layout className="grid items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3">
                  <AnimatePresence mode="popLayout">
                    {filtered.map((company, i) => (
                      <motion.div
                        key={company._id}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25, delay: Math.min(i, 8) * 0.02 }}
                        onClick={() => handleCompanyClick(company._id)}
                        onKeyDown={(e) => handleCardKeyDown(e, company._id)}
                        role="button"
                        tabIndex={0}
                        className="group h-full cursor-pointer overflow-hidden rounded-lg border border-gray-200 shadow-sm transition-all hover:shadow-lg focus:outline-none focus-visible:ring-2"
                        style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #FBF8F4 100%)', '--tw-ring-color': CORAL }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = CORAL)}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#E5E7EB')}
                      >
                        <div className="relative p-4 pr-14">
                          <div className="mb-3 flex items-center gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <CompanyMark name={company.name} logoUrl={company.companyLogoUrl} size={36} />
                              <h3
                                className="truncate text-sm font-bold transition-colors"
                                style={{ color: NEAR_BLACK }}
                              >
                                {company.name || 'Company'}
                              </h3>
                            </div>
                          </div>

                          <div className="mb-3 grid grid-cols-3 gap-3 text-[10px]">
                            <div className="min-w-0">
                              <p className="font-medium uppercase tracking-wide" style={{ color: AMBER_DARK }}>
                                Industry
                              </p>
                              <p className="truncate font-semibold" style={{ color: NEAR_BLACK }}>
                                {company.industry || 'Not specified'}
                              </p>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium uppercase tracking-wide" style={{ color: AMBER_DARK }}>
                                Company type
                              </p>
                              <p className="truncate font-semibold" style={{ color: NEAR_BLACK }}>
                                {company.companyType || 'Not specified'}
                              </p>
                            </div>
                            <div className="min-w-0">
                              <p className="whitespace-nowrap text-[9px] font-medium uppercase tracking-wide" style={{ color: AMBER_DARK }}>
                                Registration size
                              </p>
                              <p className="truncate font-semibold" style={{ color: NEAR_BLACK }}>
                                {company.companySize || 'Not specified'}
                              </p>
                            </div>
                          </div>

                          <button
                            aria-label={`View ${company.name || 'company'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompanyClick(company._id);
                            }}
                            className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center transition-transform group-hover:translate-x-0.5"
                            style={{ color: NEAR_BLACK }}
                          >
                            <ChevronRight size={17} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-gray-50 py-10 text-center">
                <Building2 className="mx-auto mb-3 h-10 w-10 text-gray-400" />
                <p className="mb-1 text-sm font-semibold" style={{ color: NEAR_BLACK }}>
                  {searchQuery || industry !== 'All' ? 'No companies match that filter.' : 'No companies yet.'}
                </p>
                <p className="mb-3 text-xs text-gray-500">
                  {searchQuery || industry !== 'All'
                    ? 'Try a different name or clear your filters.'
                    : 'Check back soon — new hiring companies are added regularly.'}
                </p>
                {(searchQuery || industry !== 'All') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setIndustry('All');
                    }}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: CORAL }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}