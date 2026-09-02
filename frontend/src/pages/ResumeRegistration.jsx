import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

/* ---------------------------------------------------------------------- */
/* Design tokens                                                          */
/* ---------------------------------------------------------------------- */

const FONT_DISPLAY = "'Space Grotesk','Inter',ui-sans-serif,sans-serif";
const FONT_BODY = "'Inter',ui-sans-serif,sans-serif";

const maroonDeep = '#3E1626';
const maroonMid = '#6B2440';
const brand = '#C75560';
const brandDark = '#AB4054';
const cream = '#FFFBF8';
const panel = '#FFF3EC';
const border = '#EAD4C8';
const muted = '#80576A';
const plum = '#54263F';
const success = '#1F8A5F';
const dangerText = '#B3261E';

const inputBase =
  'w-full rounded-[10px] border bg-[#FFFBF8] px-3.5 py-2.5 text-[13.5px] text-[#1B1418] placeholder:text-[#A77D8D] outline-none transition focus:bg-white focus:ring-4';
const labelBase = 'mb-1.5 flex items-center gap-1 text-[12.5px] font-semibold text-[#54263F]';
const errorBase = 'mt-1.5 flex items-center gap-1 text-[11.5px] font-medium text-[#B3261E]';
const hintBase = 'mt-1.5 text-[11.5px] leading-relaxed text-[#8D6072]';

function fieldStyle(hasError) {
  return { borderColor: hasError ? '#E4A199' : border };
}

function DocumentInput({ label, name, file, error, onChange }) {
  return (
    <div>
      <label className={labelBase}>
        {label} <span className="text-[#C75560]">*</span>
      </label>
      <input
        type="file"
        name={name}
        accept="application/pdf,image/jpeg,image/png"
        onChange={(event) => onChange(event.target.files?.[0] || null)}
        className={`${inputBase} cursor-pointer file:mr-3 file:rounded-[7px] file:border-0 file:bg-[#FFF0E8] file:px-3 file:py-1.5 file:text-[11px] file:font-semibold file:text-[#54263F] ${error ? 'border-[#E4A199]' : ''}`}
      />
      <p className="mt-1 text-[11px] text-[#8D6072]">{file ? file.name : 'PDF, JPG, or PNG up to 5 MB'}</p>
      <FieldError error={error} />
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Icons                                                                  */
/* ---------------------------------------------------------------------- */

const IconBase = (path) => ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    {path}
  </svg>
);

const IconLock = IconBase(
  <>
    <rect x="4.5" y="10.5" width="15" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M7.5 10.5V7.75a4.5 4.5 0 019 0v2.75" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="12" cy="15" r="1.4" fill="currentColor" />
  </>
);
const IconUser = IconBase(
  <>
    <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.6" />
    <path d="M4.8 20c1.2-3.6 4.1-5.4 7.2-5.4s6 1.8 7.2 5.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </>
);
const IconBuilding = IconBase(
  <>
    <rect x="4.5" y="4" width="9.5" height="16" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M14 9h5.5v11H14" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M7.3 7.6h3M7.3 10.6h3M7.3 13.6h3M7.3 16.6h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </>
);
const IconBriefcase = IconBase(
  <>
    <rect x="3.5" y="8" width="17" height="11" rx="1.8" stroke="currentColor" strokeWidth="1.6" />
    <path d="M8.5 8V6.4A1.9 1.9 0 0110.4 4.5h3.2a1.9 1.9 0 011.9 1.9V8" stroke="currentColor" strokeWidth="1.6" />
    <path d="M3.5 12.5h17" stroke="currentColor" strokeWidth="1.6" />
  </>
);
const IconCheck = IconBase(
  <path d="M4.5 12.5l4.5 4.5L19.5 6.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
);
const IconAlert = IconBase(
  <>
    <path d="M12 3.5l9.5 16.5H2.5L12 3.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M12 9.5v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="12" cy="17.4" r="1" fill="currentColor" />
  </>
);
const IconEye = IconBase(
  <>
    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
  </>
);
const IconEyeOff = IconBase(
  <path
    d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A9.4 9.4 0 0112 5c5 0 9 4 10 7-1 2.5-3 4.2-5.4 5.5M6.5 6.5C4.4 8 3 9.9 2 12c1 3 5 7 10 7 1.3 0 2.5-.2 3.6-.6"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
);
const IconArrowRight = IconBase(
  <path d="M4 12h15.5M13 5.5L19.5 12 13 18.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
);
const IconShield = IconBase(
  <>
    <path d="M12 3.5l7.5 3v5.4c0 4.6-3.1 7.7-7.5 9-4.4-1.3-7.5-4.4-7.5-9V6.5l7.5-3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M8.8 12.2l2.2 2.2 4.2-4.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </>
);
const IconSpinner = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={`${className} animate-spin`}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.6" />
    <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);

/* ---------------------------------------------------------------------- */
/* Field primitives                                                       */
/* ---------------------------------------------------------------------- */

function TextInput({ error, className = '', ...props }) {
  return (
    <input
      style={fieldStyle(!!error)}
      className={`${inputBase} ${error ? 'focus:ring-[#E4A199]/25' : 'focus:border-[#C75560] focus:ring-[#C75560]/12'} ${className}`}
      {...props}
    />
  );
}

function PasswordInput({ error, show, onToggle, className = '', ...props }) {
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        style={fieldStyle(!!error)}
        className={`${inputBase} pr-10 ${error ? 'focus:ring-[#E4A199]/25' : 'focus:border-[#C75560] focus:ring-[#C75560]/12'} ${className}`}
        {...props}
      />
      <button
        type="button"
        onClick={onToggle}
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A77D8D] transition hover:text-[#54263F]"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function NativeSelect({ options, error, placeholder, className = '', ...props }) {
  return (
    <select
      style={{
        ...fieldStyle(!!error),
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2380576A' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' d='M6 8l4 4 4-4'/%3E%3C/svg%3E\")",
      }}
      className={`${inputBase} appearance-none bg-[right_0.9rem_center] bg-no-repeat pr-9 ${error ? 'focus:ring-[#E4A199]/25' : 'focus:border-[#C75560] focus:ring-[#C75560]/12'} ${className}`}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

function FieldLabel({ children, required }) {
  return (
    <label className={labelBase}>
      {children} {required && <span className="text-[#C75560]">*</span>}
    </label>
  );
}

function FieldError({ error }) {
  if (!error) return null;
  return (
    <p className={errorBase}>
      <IconAlert className="h-3 w-3 shrink-0" />
      {error}
    </p>
  );
}

/* ---------------------------------------------------------------------- */
/* Password strength — cosmetic helper only, validation stays at 8 chars  */
/* ---------------------------------------------------------------------- */

function passwordScore(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw) && pw.length >= 10) score++;
  return score;
}

function PasswordMeter({ password }) {
  if (!password) return null;
  const score = passwordScore(password);
  const labels = ['Too short', 'Weak', 'Okay', 'Good', 'Strong'];
  const colors = ['#D6493F', '#D6493F', '#C77A2B', '#5C8A3A', '#1F8A5F'];
  return (
    <div className="mb-4 -mt-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-[3px] flex-1 rounded-full transition-colors"
            style={{ backgroundColor: i < score ? colors[score] : '#EAD4C8' }}
          />
        ))}
      </div>
      <p className="mt-1 text-[11px] font-medium" style={{ color: colors[score] }}>
        {labels[score]}
        {score < 4 && <span className="ml-1 font-normal text-[#8D6072]">— add length, a number, and a symbol for a stronger password.</span>}
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Step pipeline                                                          */
/* ---------------------------------------------------------------------- */

const STEPS = [
  { icon: IconUser, title: 'Personal details', desc: 'Who you are and how to reach you' },
  { icon: IconBuilding, title: 'Company details', desc: 'Verify the organization you hire for' },
  { icon: IconBriefcase, title: 'Hiring needs', desc: 'What roles and volume you recruit for' },
  { icon: IconLock, title: 'Account security', desc: "Create your login password" },
];

function ContextRail({ step, onJump }) {
  return (
    <aside
      className="relative hidden shrink-0 flex-col justify-between overflow-hidden px-10 py-12 lg:flex lg:w-[380px] xl:w-[420px]"
      style={{ background: `linear-gradient(165deg, ${maroonDeep} 0%, ${maroonMid} 62%, ${brandDark} 130%)` }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
      />
      <div className="relative">
        <div className="mb-10 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-white/12 text-white ring-1 ring-white/20">
            <IconBriefcase className="h-[18px] w-[18px]" />
          </div>
          <span className="text-[14px] font-bold tracking-tight text-white" style={{ fontFamily: FONT_DISPLAY }}>
            Job Portal <span className="font-medium text-white/60">for Recruiters</span>
          </span>
        </div>

        <h1 className="mb-3 text-[26px] font-bold leading-[1.2] text-white" style={{ fontFamily: FONT_DISPLAY }}>
          A few details stand between you and your dashboard.
        </h1>
        <p className="mb-10 text-[13.5px] leading-relaxed text-white/65">
          Your payment is confirmed. Complete each step below so our team can verify your company and activate hiring access.
        </p>

        <div className="space-y-0">
          {STEPS.map((s, i) => {
            const n = i + 1;
            const completed = n < step;
            const current = n === step;
            const clickable = completed;
            return (
              <div key={s.title} className="flex gap-3.5">
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => clickable && onJump(n)}
                    disabled={!clickable}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
                    style={
                      completed
                        ? { backgroundColor: '#fff', color: maroonDeep }
                        : current
                        ? { backgroundColor: 'rgba(255,255,255,0.16)', color: '#fff', boxShadow: '0 0 0 3px rgba(255,255,255,0.25)' }
                        : { backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }
                    }
                  >
                    {completed ? <IconCheck className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className="relative my-1 w-px flex-1 overflow-hidden bg-white/15">
                      <div
                        className="absolute inset-x-0 top-0 bg-white transition-all duration-500 ease-out"
                        style={{ height: n < step ? '100%' : '0%' }}
                      />
                    </div>
                  )}
                </div>
                <div className={i < STEPS.length - 1 ? 'pb-6' : ''}>
                  <p className={`pt-1 text-[13px] font-semibold transition-colors duration-300 ${current || completed ? 'text-white' : 'text-white/50'}`}>
                    {s.title}
                  </p>
                  <p className={`text-[12px] transition-colors duration-300 ${current ? 'text-white/70' : 'text-white/40'}`}>{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative space-y-2.5">
        <div className="flex items-center gap-2 rounded-[10px] bg-white/8 px-3.5 py-2.5 ring-1 ring-white/15">
          <IconCheck className="h-4 w-4 shrink-0 text-[#7FD9AE]" />
          <span className="text-[12px] font-medium text-white/80">Payment verified for this registration</span>
        </div>
        <div className="flex items-center gap-2 rounded-[10px] bg-white/8 px-3.5 py-2.5 ring-1 ring-white/15">
          <IconShield className="h-4 w-4 shrink-0 text-white/70" />
          <span className="text-[12px] font-medium text-white/80">Company documents reviewed manually before approval</span>
        </div>
      </div>
    </aside>
  );
}

/* Compact horizontal pipeline for mobile, where the rail is hidden */
function MobilePipeline({ step }) {
  return (
    <div className="mb-7 flex items-center lg:hidden">
      {STEPS.map((s, i) => {
        const n = i + 1;
        const completed = n < step;
        const current = n === step;
        return (
          <div key={s.title} className="flex flex-1 items-center last:flex-none">
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors duration-300"
              style={
                completed
                  ? { backgroundColor: brand, color: '#fff' }
                  : current
                  ? { border: `2px solid ${brand}`, color: brand }
                  : { border: `1px solid ${border}`, color: '#A77D8D' }
              }
            >
              {completed ? <IconCheck className="h-3 w-3" /> : n}
            </div>
            {n < STEPS.length && (
              <div className="relative mx-1.5 h-[2px] flex-1 overflow-hidden rounded-full" style={{ backgroundColor: '#F0D1BF' }}>
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
                  style={{ width: n < step ? '100%' : '0%', backgroundColor: brand }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SectionHeader({ index, icon: Icon, title, description }) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#FFF0E8] text-[#C75560]">
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div>
        <p className="flex items-baseline gap-2 text-[16px] font-bold text-[#1B1418]" style={{ fontFamily: FONT_DISPLAY }}>
          <span className="text-[12px] font-semibold text-[#C9A093]">
            0{index}/0{STEPS.length}
          </span>
          {title}
        </p>
        {description && <p className="mt-0.5 text-[12.5px] text-[#80576A]">{description}</p>}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Main component                                                         */
/* ---------------------------------------------------------------------- */

export default function ResumeRegistration() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const recruiterId = searchParams.get('id');

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const [formData, setFormData] = useState({
    password: '',
    passwordConfirm: '',
    fullName: '',
    phone: '',
    companyName: '',
    companyWebsite: '',
    companyEmail: '',
    companyGst: '',
    companyCin: '',
    gstCertificate: null,
    cinCertificate: null,
    businessRegistrationCertificate: null,
    industry: '',
    industryOther: '',
    companySize: '',
    companyType: '',
    companyTypeOther: '',
    companyLocation: '',
    hiringVolume: '',
    hiringFor: [],
    departments: '',
    jobTitle: '',
    recruiterRole: '',
  });

  const hiringForOptions = ['Full-time', 'Part-time', 'Internship', 'Contract', 'Remote'];
  const industryOptions = [
    'Information Technology (IT)', 'Software / SaaS', 'IT Services & Consulting',
    'BPO / KPO', 'Banking / Financial Services', 'Insurance', 'FinTech',
    'E-commerce', 'Retail', 'Manufacturing', 'Automobile', 'Construction',
    'Real Estate', 'Healthcare / Hospitals', 'Pharmaceutical', 'Education / EdTech',
    'Telecommunications', 'Media & Entertainment', 'Advertising & Marketing',
    'Travel & Tourism', 'Hospitality', 'Food & Beverage', 'Logistics & Supply Chain',
    'Transportation', 'Government / Public Sector', 'Legal Services',
    'Human Resources / Recruitment', 'Consulting', 'Agriculture', 'Energy / Oil & Gas',
    'Electronics', 'FMCG / Consumer Goods', 'Textile & Apparel', 'NGO / Non-Profit', 'Other',
  ];
  const companySizeOptions = ['1-10', '10-50', '50-200', '200-1000', '1000+'];
  const companyTypeOptions = [
    'Private Limited Company',
    'Public Limited Company',
    'Startup',
    'MNC (Multinational Company)',
    'Government Organization',
    'PSU (Public Sector Undertaking)',
    'Non-Profit / NGO',
    'Partnership Firm',
    'LLP (Limited Liability Partnership)',
    'Sole Proprietorship',
    'Consulting Firm',
    'Staffing / Recruitment Agency',
    'Educational Institution',
    'Hospital / Healthcare Organization',
    'Other',
  ];
  const hiringVolumeOptions = ['1-5', '5-20', '20-100', '100+'];
  const recruiterRoleOptions = ['HR', 'Talent Acquisition', 'Recruitment Manager', 'Sourcer', 'Other'];

  const invalidLink = !recruiterId;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleMultiSelect = (option) => {
    setFormData((prev) => ({
      ...prev,
      hiringFor: prev.hiringFor.includes(option)
        ? prev.hiringFor.filter((o) => o !== option)
        : [...prev.hiringFor, option],
    }));
    if (errors.hiringFor) setErrors((prev) => ({ ...prev, hiringFor: '' }));
  };

  /* ---------------- Per-step validation ---------------- */

  function validateStep(n) {
    const e = {};
    if (n === 1) {
      if (!formData.fullName?.trim()) e.fullName = 'Full name is required';
      if (!formData.phone?.trim()) e.phone = 'Phone number is required';
    }
    if (n === 2) {
      if (!formData.companyName?.trim()) e.companyName = 'Company name is required';
      if (!formData.companyEmail?.trim()) e.companyEmail = 'Company email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.companyEmail)) e.companyEmail = 'Enter a valid company email.';
      if (!formData.companyGst?.trim()) e.companyGst = 'GST number is required';
      if (!formData.gstCertificate) e.gstCertificate = 'GST certificate is required';
      if (!formData.companyCin?.trim()) e.companyCin = 'CIN is required';
      if (!formData.cinCertificate) e.cinCertificate = 'CIN certificate is required';
      if (!formData.businessRegistrationCertificate) e.businessRegistrationCertificate = 'Business registration certificate is required';
      if (!formData.companyType) e.companyType = 'Company type is required';
      if (formData.companyType === 'Other' && !formData.companyTypeOther?.trim()) e.companyTypeOther = 'Please specify your company type';
      if (!formData.industry) e.industry = 'Industry is required';
      if (formData.industry === 'Other' && !formData.industryOther?.trim()) e.industryOther = 'Please specify your industry';
      if (!formData.companySize) e.companySize = 'Company size is required';
    }
    if (n === 3) {
      if (!formData.hiringVolume) e.hiringVolume = 'Hiring volume is required';
      if (formData.hiringFor.length === 0) e.hiringFor = 'Select at least one hiring type';
    }
    if (n === 4) {
      if (!formData.password) e.password = 'Password is required';
      else if (formData.password.length < 8) e.password = 'Password must be at least 8 characters';
      if (formData.password !== formData.passwordConfirm) e.passwordConfirm = 'Passwords do not match';
    }
    return e;
  }

  function goNext() {
    const e = validateStep(step);
    setErrors(e);
    if (Object.keys(e).length === 0) {
      setError('');
      setStep((s) => Math.min(STEPS.length, s + 1));
    } else {
      setError('Please review the highlighted fields before continuing.');
    }
  }

  function goBack() {
    setErrors({});
    setError('');
    setStep((s) => Math.max(1, s - 1));
  }

  function jumpTo(n) {
    if (n < step) {
      setErrors({});
      setError('');
      setStep(n);
    }
  }

  /* ---------------- Submit (final step) ---------------- */

  const handleSubmit = async (e) => {
    e.preventDefault();

    let firstInvalid = null;
    let combinedErrors = {};
    for (let n = 1; n <= STEPS.length; n++) {
      const e2 = validateStep(n);
      if (Object.keys(e2).length > 0 && firstInvalid === null) {
        firstInvalid = n;
        combinedErrors = e2;
      }
    }
    if (firstInvalid !== null) {
      setStep(firstInvalid);
      setErrors(combinedErrors);
      setError('Please review the highlighted fields before continuing.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value instanceof File) payload.append(key, value);
        else if (key === 'hiringFor') payload.append(key, JSON.stringify(value));
        else if (key === 'departments') payload.append(key, JSON.stringify(value.split(',').map((d) => d.trim()).filter(Boolean)));
        else if (value !== null && value !== undefined) payload.append(key, value);
      });
      const { data } = await axiosInstance.post(`/recruiter/resume-registration/${recruiterId}`, payload);

      setSuccess(data.message || 'Registration completed successfully!');
      localStorage.removeItem('recruiterId');
      localStorage.removeItem('recruiterEmail');

      setTimeout(() => {
        navigate('/recruiter/login', { state: { email: formData.companyEmail, message: 'Registration complete. Please login.' } });
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to complete registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const departmentChips = formData.departments.split(',').map((d) => d.trim()).filter(Boolean);

  /* -------------------------- Invalid link screen -------------------------- */

  if (invalidLink) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4" style={{ backgroundColor: cream, fontFamily: FONT_BODY }}>
        <div className="w-full max-w-md">
          <div className="rounded-[18px] border p-8 text-center shadow-[0_24px_60px_-20px_rgba(62,22,38,0.25)]" style={{ borderColor: border, backgroundColor: '#fff' }}>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: '#FDEDEA' }}>
              <IconAlert className="h-6 w-6" style={{ color: dangerText }} />
            </div>
            <h1 className="mb-2 text-[20px] font-bold text-[#1B1418]" style={{ fontFamily: FONT_DISPLAY }}>
              Recovery link invalid
            </h1>
            <p className="mb-7 text-[13.5px] leading-relaxed text-[#80576A]">
              This registration recovery link is invalid or has expired. Start a new registration to pick up where you left off.
            </p>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="w-full rounded-[12px] px-4 py-2.5 text-[13.5px] font-semibold text-white shadow-[0_10px_24px_-10px_rgba(199,85,96,0.65)] transition hover:-translate-y-0.5"
              style={{ backgroundColor: brand }}
            >
              Go to home page
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* --------------------------------- Page --------------------------------- */

  return (
    <div className="min-h-screen lg:flex" style={{ backgroundColor: cream, fontFamily: FONT_BODY }}>
      <ContextRail step={step} onJump={jumpTo} />

      <div className="flex-1 px-4 py-10 sm:px-8 lg:px-14 lg:py-14">
        <div className="mx-auto max-w-2xl">
          {/* Mobile-only compact header */}
          <div className="mb-6 lg:hidden">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5" style={{ backgroundColor: panel }}>
              <IconCheck className="h-3.5 w-3.5" style={{ color: success }} />
              <span className="text-[11.5px] font-semibold" style={{ color: plum }}>Payment verified</span>
            </div>
            <h1 className="text-[24px] font-bold leading-tight text-[#1B1418]" style={{ fontFamily: FONT_DISPLAY }}>
              Complete your registration
            </h1>
            <p className="mt-1.5 text-[13px] text-[#80576A]">Step {step} of {STEPS.length} — {STEPS[step - 1].title}</p>
          </div>

          <MobilePipeline step={step} />

          <div className="mb-8 hidden lg:block">
            <h2 className="text-[22px] font-bold text-[#1B1418]" style={{ fontFamily: FONT_DISPLAY }}>
              Complete your registration
            </h2>
            <p className="mt-1.5 text-[13.5px] text-[#80576A]">
              This is the last step — the details below are shared with our verification team.
            </p>
          </div>

          {(error || success) && (
            <div
              className="mb-6 flex items-start gap-2.5 rounded-[12px] border px-4 py-3"
              style={success ? { backgroundColor: '#EAF7F0', borderColor: '#B9E4CC' } : { backgroundColor: '#FDEDEA', borderColor: '#F3C3BB' }}
            >
              {success ? (
                <IconCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: success }} />
              ) : (
                <IconAlert className="mt-0.5 h-4 w-4 shrink-0" style={{ color: dangerText }} />
              )}
              <p className="text-[13px] font-medium" style={{ color: success ? '#0F5E3F' : dangerText }}>
                {success || error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="rounded-[18px] border bg-white p-6 shadow-[0_20px_50px_-24px_rgba(62,22,38,0.18)] sm:p-8" style={{ borderColor: border }}>
              {/* Step 1 — Personal details */}
              {step === 1 && (
                <section>
                  <SectionHeader index={1} icon={IconUser} title="Personal details" description="How our team should identify and reach you." />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <FieldLabel required>Full name</FieldLabel>
                      <TextInput type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Your full name" error={errors.fullName} />
                      <FieldError error={errors.fullName} />
                    </div>
                    <div>
                      <FieldLabel required>Phone number</FieldLabel>
                      <TextInput type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 XXXXX XXXXX" error={errors.phone} />
                      <FieldError error={errors.phone} />
                    </div>
                    <div>
                      <FieldLabel>Job title</FieldLabel>
                      <TextInput type="text" name="jobTitle" value={formData.jobTitle} onChange={handleChange} placeholder="e.g. Talent Acquisition Manager" />
                    </div>
                    <div>
                      <FieldLabel>Recruiter role</FieldLabel>
                      <NativeSelect name="recruiterRole" value={formData.recruiterRole} onChange={handleChange} options={recruiterRoleOptions} placeholder="Select your role" />
                    </div>
                  </div>
                </section>
              )}

              {/* Step 2 — Company details */}
              {step === 2 && (
                <section>
                  <SectionHeader index={2} icon={IconBuilding} title="Company details" description="Used to verify the organization you're hiring for." />
                  <div className="mb-4">
                    <FieldLabel required>Company name</FieldLabel>
                    <TextInput type="text" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Your company name" error={errors.companyName} />
                    <FieldError error={errors.companyName} />
                  </div>
                  <div className="mb-4">
                    <FieldLabel required>Company email</FieldLabel>
                    <TextInput type="email" name="companyEmail" value={formData.companyEmail} onChange={handleChange} placeholder="hr@company.com" error={errors.companyEmail} />
                    <FieldError error={errors.companyEmail} />
                    <p className={hintBase}>This is your account's security key — one company email can only be used to register one account.</p>
                  </div>
                  <div className="mb-4">
                    <FieldLabel>Company website</FieldLabel>
                    <TextInput type="url" name="companyWebsite" value={formData.companyWebsite} onChange={handleChange} placeholder="https://company.com" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <FieldLabel required>GST number</FieldLabel>
                      <TextInput type="text" name="companyGst" value={formData.companyGst} onChange={handleChange} placeholder="27XXXX0000X1Z5" />
                      <FieldError error={errors.companyGst} />
                    </div>
                    <div>
                      <DocumentInput label="Upload GST Certificate" name="gstCertificate" file={formData.gstCertificate} error={errors.gstCertificate} onChange={(file) => setFormData((prev) => ({ ...prev, gstCertificate: file }))} />
                    </div>
                    <div>
                      <FieldLabel required>CIN (Corporate Identification Number)</FieldLabel>
                      <TextInput type="text" name="companyCin" value={formData.companyCin} onChange={handleChange} placeholder="U12345AB2020PLC123456" />
                      <FieldError error={errors.companyCin} />
                    </div>
                    <div>
                      <DocumentInput label="Upload CIN Certificate" name="cinCertificate" file={formData.cinCertificate} error={errors.cinCertificate} onChange={(file) => setFormData((prev) => ({ ...prev, cinCertificate: file }))} />
                    </div>
                    <div className="sm:col-span-2">
                      <DocumentInput label="Business Registration Certificate" name="businessRegistrationCertificate" file={formData.businessRegistrationCertificate} error={errors.businessRegistrationCertificate} onChange={(file) => setFormData((prev) => ({ ...prev, businessRegistrationCertificate: file }))} />
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <FieldLabel required>Industry</FieldLabel>
                      <NativeSelect name="industry" value={formData.industry} onChange={handleChange} options={industryOptions} placeholder="Select industry" error={errors.industry} />
                      <FieldError error={errors.industry} />
                      {formData.industry === 'Other' && (
                        <>
                          <TextInput type="text" name="industryOther" value={formData.industryOther} onChange={handleChange} placeholder="Enter your industry" />
                          <FieldError error={errors.industryOther} />
                        </>
                      )}
                    </div>
                    <div>
                      <FieldLabel required>Company size</FieldLabel>
                      <NativeSelect name="companySize" value={formData.companySize} onChange={handleChange} options={companySizeOptions} placeholder="Select company size" error={errors.companySize} />
                      <FieldError error={errors.companySize} />
                    </div>
                    <div>
                      <FieldLabel required>Company type</FieldLabel>
                      <NativeSelect name="companyType" value={formData.companyType} onChange={handleChange} options={companyTypeOptions} placeholder="Select company type" />
                      <FieldError error={errors.companyType} />
                      {formData.companyType === 'Other' && (
                        <>
                          <TextInput type="text" name="companyTypeOther" value={formData.companyTypeOther} onChange={handleChange} placeholder="Enter your company type" />
                          <FieldError error={errors.companyTypeOther} />
                        </>
                      )}
                    </div>
                    <div>
                      <FieldLabel>Location</FieldLabel>
                      <TextInput type="text" name="companyLocation" value={formData.companyLocation} onChange={handleChange} placeholder="City, Country" />
                    </div>
                  </div>
                </section>
              )}

              {/* Step 3 — Hiring needs */}
              {step === 3 && (
                <section>
                  <SectionHeader index={3} icon={IconBriefcase} title="Hiring needs" description="Helps us tailor your dashboard and candidate matches." />
                  <div className="mb-4">
                    <FieldLabel required>Hiring volume</FieldLabel>
                    <NativeSelect name="hiringVolume" value={formData.hiringVolume} onChange={handleChange} options={hiringVolumeOptions} placeholder="How many people do you hire per year?" error={errors.hiringVolume} />
                    <FieldError error={errors.hiringVolume} />
                  </div>
                  <div className="mb-4">
                    <FieldLabel required>Types of hiring</FieldLabel>
                    <div className="flex flex-wrap gap-2">
                      {hiringForOptions.map((option) => {
                        const active = formData.hiringFor.includes(option);
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => handleMultiSelect(option)}
                            className="flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition"
                            style={active ? { backgroundColor: '#FFF0E8', borderColor: brand, color: '#1B1418' } : { backgroundColor: '#FFFBF8', borderColor: border, color: muted }}
                          >
                            {active && <IconCheck className="h-3 w-3" style={{ color: brand }} />}
                            {option}
                          </button>
                        );
                      })}
                    </div>
                    <FieldError error={errors.hiringFor} />
                  </div>
                  <div>
                    <FieldLabel>Departments you hire for</FieldLabel>
                    <TextInput type="text" name="departments" value={formData.departments} onChange={handleChange} placeholder="e.g. Engineering, Sales, Marketing" />
                    <p className={hintBase}>Separate departments with commas.</p>
                    {departmentChips.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {departmentChips.map((d) => (
                          <span key={d} className="rounded-full border px-2.5 py-1 text-[11px] font-medium" style={{ borderColor: border, backgroundColor: panel, color: plum }}>
                            {d}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Step 4 — Account security */}
              {step === 4 && (
                <section>
                  <SectionHeader index={4} icon={IconLock} title="Account security" description="Choose a password you'll use to log in." />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <FieldLabel required>Password</FieldLabel>
                      <PasswordInput
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Create a strong password"
                        error={errors.password}
                        show={showPassword}
                        onToggle={() => setShowPassword((s) => !s)}
                      />
                      <FieldError error={errors.password} />
                    </div>
                    <div>
                      <FieldLabel required>Confirm password</FieldLabel>
                      <PasswordInput
                        name="passwordConfirm"
                        value={formData.passwordConfirm}
                        onChange={handleChange}
                        placeholder="Re-enter password"
                        error={errors.passwordConfirm}
                        show={showPasswordConfirm}
                        onToggle={() => setShowPasswordConfirm((s) => !s)}
                      />
                      <FieldError error={errors.passwordConfirm} />
                    </div>
                  </div>
                  <PasswordMeter password={formData.password} />
                </section>
              )}
            </div>

            {/* Footer actions */}
            <div className="mt-6 flex items-center justify-between gap-3">
              {step === 1 ? (
                <button
                  type="button"
                  onClick={() => navigate('/', { replace: true })}
                  className="rounded-[12px] border px-5 py-2.5 text-[13.5px] font-semibold transition hover:bg-[#FFF0E8]"
                  style={{ borderColor: '#1B1418', color: '#1B1418', backgroundColor: '#FFFBF8' }}
                >
                  Cancel
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goBack}
                  className="rounded-[12px] border px-5 py-2.5 text-[13.5px] font-semibold transition hover:bg-[#FFF0E8]"
                  style={{ borderColor: '#1B1418', color: '#1B1418', backgroundColor: '#FFFBF8' }}
                >
                  Back
                </button>
              )}

              {step < STEPS.length ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="flex items-center gap-2 rounded-[12px] px-6 py-2.5 text-[13.5px] font-semibold text-white shadow-[0_10px_24px_-10px_rgba(199,85,96,0.65)] transition-transform duration-150 hover:-translate-y-0.5"
                  style={{ backgroundColor: brand }}
                >
                  Continue
                  <IconArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1.5 rounded-[10px] px-5 py-2 text-[13px] font-semibold text-white shadow-[0_10px_24px_-10px_rgba(199,85,96,0.65)] transition-transform duration-150 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  style={{ backgroundColor: brand }}
                >
                  {loading ? (
                    <>
                      <IconSpinner className="h-3.5 w-3.5" />
                      Registering…
                    </>
                  ) : (
                    <>
                      Register
                      <IconArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              )}
            </div>

            <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11.5px] text-[#8D6072]">
              <IconShield className="h-3.5 w-3.5 shrink-0" />
              Your information is encrypted in transit and reviewed manually before your account is approved.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}