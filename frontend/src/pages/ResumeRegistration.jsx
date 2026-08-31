import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

const FONT_DISPLAY = "'Space Grotesk','Inter',ui-sans-serif,sans-serif";

const inputBase = 'w-full rounded-[10px] border border-[#EBC2AE] bg-[#FFF9F5] px-3.5 py-2.5 text-[13.5px] text-[#1D181A] placeholder:text-[#A77D8D] outline-none transition focus:border-[#C75560] focus:bg-white focus:ring-2 focus:ring-[#C75560]/15';
const labelBase = 'mb-1.5 block text-[12.5px] font-medium text-[#54263F]';
const errorBase = 'mt-1 text-[11.5px] font-medium text-[#B3261E]';
const buttonBase = 'px-4 py-2.5 rounded-[10px] font-semibold text-[13.5px] transition inline-block';

function TextInput({ error, ...props }) {
  return (
    <input
      className={`${inputBase} ${error ? 'border-[#F28B82]/60 focus:border-[#F28B82] focus:ring-[#F28B82]/20' : ''}`}
      {...props}
    />
  );
}

function NativeSelect({ options, error, placeholder, ...props }) {
  return (
    <select
      className={`${inputBase} appearance-none bg-[right_0.9rem_center] bg-no-repeat pr-9 ${error ? 'border-[#F28B82]/60' : ''}`}
      style={{
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2380576A' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' d='M6 8l4 4 4-4'/%3E%3C/svg%3E\")",
      }}
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

export default function ResumeRegistration() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const recruiterId = searchParams.get('id');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [errors, setErrors] = useState({});

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
    industry: '',
    companySize: '',
    companyType: '',
    companyLocation: '',
    hiringVolume: '',
    hiringFor: [],
    departments: '',
    jobTitle: '',
    recruiterRole: '',
  });

  const hiringForOptions = ['Full-time', 'Part-time', 'Internship', 'Contract', 'Remote'];
  const industryOptions = [
    'Technology', 'Finance', 'Healthcare', 'Education', 'Retail',
    'Manufacturing', 'Consulting', 'Media', 'Hospitality', 'Other'
  ];
  const companySizeOptions = ['1-10', '10-50', '50-200', '200-1000', '1000+'];
  const companyTypeOptions = ['Startup', 'SME', 'MNC', 'Non-profit', 'Government'];
  const hiringVolumeOptions = ['1-5', '5-20', '20-100', '100+'];
  const recruiterRoleOptions = ['HR', 'Talent Acquisition', 'Recruitment Manager', 'Sourcer', 'Other'];

  useEffect(() => {
    if (!recruiterId) {
      setError('Invalid recovery link. Please start fresh registration.');
    }
  }, [recruiterId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleMultiSelect = (option) => {
    setFormData((prev) => ({
      ...prev,
      hiringFor: prev.hiringFor.includes(option)
        ? prev.hiringFor.filter((o) => o !== option)
        : [...prev.hiringFor, option],
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';

    if (formData.password !== formData.passwordConfirm) newErrors.passwordConfirm = 'Passwords do not match';

    if (!formData.fullName?.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.phone?.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.companyName?.trim()) newErrors.companyName = 'Company name is required';
    if (!formData.companyEmail?.trim()) newErrors.companyEmail = 'Company email is required';
    if (!formData.industry) newErrors.industry = 'Industry is required';
    if (!formData.companySize) newErrors.companySize = 'Company size is required';
    if (!formData.hiringVolume) newErrors.hiringVolume = 'Hiring volume is required';
    if (formData.hiringFor.length === 0) newErrors.hiringFor = 'Select at least one hiring type';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data } = await axiosInstance.post(`/recruiter/resume-registration/${recruiterId}`, {
        ...formData,
        departments: formData.departments.split(',').map((d) => d.trim()).filter(Boolean),
      });

      setSuccess(data.message || 'Registration completed successfully!');
      localStorage.removeItem('recruiterId');
      localStorage.removeItem('recruiterEmail');

      setTimeout(() => {
        navigate('/recruiter/login', { state: { email: formData.email, message: 'Registration complete. Please login.' } });
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to complete registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (error && error.includes('Invalid recovery')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF9F5] to-[#FFFDFC] px-4">
        <div className="max-w-md w-full">
          <div className="rounded-2xl border border-[#EBC2AE] bg-white p-8 shadow-lg">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-[#1D181A] mb-2">Recovery Link Invalid</h1>
              <p className="text-[#6B7280]">This registration recovery link is invalid or has expired.</p>
            </div>
            <button
              onClick={() => navigate('/recruiter/register')}
              className={`${buttonBase} w-full bg-[#C75560] text-white hover:bg-[#B0445E]`}
            >
              Start Fresh Registration
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F5] to-[#FFFDFC] px-4 py-8" style={{ fontFamily: FONT_DISPLAY }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#1D181A] mb-2">Complete Your Registration</h1>
          <p className="text-[#6B7280]">Your payment was successful! Now fill in your details to complete registration.</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-[#EBC2AE] bg-white p-8 shadow-lg space-y-6">
          {error && (
            <div className="rounded-lg bg-[#FED7D7] border border-[#F28B82] p-4">
              <p className="text-[#B3261E] text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-[#D4EDDA] border border-[#28A745] p-4">
              <p className="text-[#155724] text-sm">{success}</p>
            </div>
          )}

          {/* Password Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#1D181A]">Account Security</h2>
            <div>
              <label className={labelBase}>Password *</label>
              <TextInput
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a strong password"
                error={errors.password}
              />
              {errors.password && <p className={errorBase}>{errors.password}</p>}
            </div>
            <div>
              <label className={labelBase}>Confirm Password *</label>
              <TextInput
                type="password"
                name="passwordConfirm"
                value={formData.passwordConfirm}
                onChange={handleChange}
                placeholder="Re-enter password"
                error={errors.passwordConfirm}
              />
              {errors.passwordConfirm && <p className={errorBase}>{errors.passwordConfirm}</p>}
            </div>
          </div>

          <hr className="border-[#EBC2AE]" />

          {/* Personal Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#1D181A]">Personal Information</h2>
            <div>
              <label className={labelBase}>Full Name *</label>
              <TextInput
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Your full name"
                error={errors.fullName}
              />
              {errors.fullName && <p className={errorBase}>{errors.fullName}</p>}
            </div>
            <div>
              <label className={labelBase}>Phone Number *</label>
              <TextInput
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 XXXXX XXXXX"
                error={errors.phone}
              />
              {errors.phone && <p className={errorBase}>{errors.phone}</p>}
            </div>
            <div>
              <label className={labelBase}>Job Title</label>
              <TextInput
                type="text"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleChange}
                placeholder="e.g., Talent Manager"
              />
            </div>
            <div>
              <label className={labelBase}>Recruiter Role</label>
              <NativeSelect
                name="recruiterRole"
                value={formData.recruiterRole}
                onChange={handleChange}
                options={recruiterRoleOptions}
                placeholder="Select your role"
              />
            </div>
          </div>

          <hr className="border-[#EBC2AE]" />

          {/* Company Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#1D181A]">Company Information</h2>
            <div>
              <label className={labelBase}>Company Name *</label>
              <TextInput
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Your company name"
                error={errors.companyName}
              />
              {errors.companyName && <p className={errorBase}>{errors.companyName}</p>}
            </div>
            <div>
              <label className={labelBase}>Company Email *</label>
              <TextInput
                type="email"
                name="companyEmail"
                value={formData.companyEmail}
                onChange={handleChange}
                placeholder="company@email.com"
                error={errors.companyEmail}
              />
              {errors.companyEmail && <p className={errorBase}>{errors.companyEmail}</p>}
            </div>
            <div>
              <label className={labelBase}>Company Website</label>
              <TextInput
                type="url"
                name="companyWebsite"
                value={formData.companyWebsite}
                onChange={handleChange}
                placeholder="https://company.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelBase}>GST Number</label>
                <TextInput
                  type="text"
                  name="companyGst"
                  value={formData.companyGst}
                  onChange={handleChange}
                  placeholder="27XXXX0000X1Z5"
                />
              </div>
              <div>
                <label className={labelBase}>CIN Number</label>
                <TextInput
                  type="text"
                  name="companyCin"
                  value={formData.companyCin}
                  onChange={handleChange}
                  placeholder="U12345AB0000000000"
                />
              </div>
            </div>
          </div>

          <hr className="border-[#EBC2AE]" />

          {/* Company Details */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#1D181A]">Company Details</h2>
            <div>
              <label className={labelBase}>Industry *</label>
              <NativeSelect
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                options={industryOptions}
                placeholder="Select industry"
                error={errors.industry}
              />
              {errors.industry && <p className={errorBase}>{errors.industry}</p>}
            </div>
            <div>
              <label className={labelBase}>Company Size *</label>
              <NativeSelect
                name="companySize"
                value={formData.companySize}
                onChange={handleChange}
                options={companySizeOptions}
                placeholder="Select company size"
                error={errors.companySize}
              />
              {errors.companySize && <p className={errorBase}>{errors.companySize}</p>}
            </div>
            <div>
              <label className={labelBase}>Company Type</label>
              <NativeSelect
                name="companyType"
                value={formData.companyType}
                onChange={handleChange}
                options={companyTypeOptions}
                placeholder="Select company type"
              />
            </div>
            <div>
              <label className={labelBase}>Location</label>
              <TextInput
                type="text"
                name="companyLocation"
                value={formData.companyLocation}
                onChange={handleChange}
                placeholder="City, Country"
              />
            </div>
          </div>

          <hr className="border-[#EBC2AE]" />

          {/* Hiring Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#1D181A]">Hiring Information</h2>
            <div>
              <label className={labelBase}>Hiring Volume *</label>
              <NativeSelect
                name="hiringVolume"
                value={formData.hiringVolume}
                onChange={handleChange}
                options={hiringVolumeOptions}
                placeholder="How many people do you hire per year?"
                error={errors.hiringVolume}
              />
              {errors.hiringVolume && <p className={errorBase}>{errors.hiringVolume}</p>}
            </div>
            <div>
              <label className={labelBase}>Types of Hiring *</label>
              <div className="flex flex-wrap gap-3">
                {hiringForOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleMultiSelect(option)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                      formData.hiringFor.includes(option)
                        ? 'bg-[#C75560] text-white'
                        : 'bg-[#F5E9E2] text-[#6B7280] hover:bg-[#EBC2AE]'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {errors.hiringFor && <p className={errorBase}>{errors.hiringFor}</p>}
            </div>
            <div>
              <label className={labelBase}>Departments You Hire For</label>
              <TextInput
                type="text"
                name="departments"
                value={formData.departments}
                onChange={handleChange}
                placeholder="e.g., Engineering, Sales, Marketing (comma-separated)"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={() => navigate('/recruiter/register')}
              className={`${buttonBase} flex-1 bg-[#F5E9E2] text-[#54263F] hover:bg-[#EBC2AE]`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`${buttonBase} flex-1 bg-[#C75560] text-white hover:bg-[#B0445E] disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Completing...' : 'Complete Registration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
