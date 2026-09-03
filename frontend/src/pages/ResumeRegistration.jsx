import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BriefcaseBusiness, Check } from 'lucide-react';
import RecruiterRegisterForm from '../components/auth/RecruiterRegisterForm';

export default function ResumeRegistration() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const recruiterId = searchParams.get('id');
  const [currentStep, setCurrentStep] = useState(1);

  if (!recruiterId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFFBF8] px-4">
        <div className="w-full max-w-md rounded-[18px] border border-[#EAD4C8] bg-white p-8 text-center shadow-[0_24px_60px_-20px_rgba(62,22,38,0.25)]">
          <h1 className="mb-2 text-[20px] font-bold text-[#1B1418]">Recovery link invalid</h1>
          <p className="mb-7 text-[13.5px] leading-relaxed text-[#80576A]">
            This registration recovery link is invalid or has expired. Start a new registration to pick up where you left off.
          </p>
          <button
            type="button"
            onClick={() => navigate('/', { replace: true })}
            className="w-full rounded-[12px] bg-[#C75560] px-4 py-2.5 text-[13.5px] font-semibold text-white transition hover:bg-[#AB4054]"
          >
            Go to home page
          </button>
        </div>
      </div>
    );
  }

  const steps = ['Personal details', 'Company details', 'Verification', 'Hiring needs', 'Account security'];

  return (
    <div className="min-h-screen bg-[#FFFBF8] lg:flex">
      <aside className="relative hidden min-h-screen shrink-0 flex-col overflow-y-auto bg-[linear-gradient(165deg,#3E1626_0%,#6B2440_62%,#AB4054_130%)] px-10 py-12 lg:flex lg:w-[380px] xl:w-[420px]">
        <div className="relative">
          <div className="mb-10 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-white/10 text-white ring-1 ring-white/20"><BriefcaseBusiness className="h-[18px] w-[18px]" /></div>
            <span className="text-[14px] font-bold tracking-tight text-white">Job Portal <span className="font-medium text-white/60">for Recruiters</span></span>
          </div>
          <h1 className="mb-3 text-[26px] font-bold leading-[1.2] text-white">A few details stand between you and your dashboard.</h1>
          <p className="mb-10 text-[13.5px] leading-relaxed text-white/65">Your payment is confirmed. Complete each step below so our team can verify your company and activate hiring access.</p>
          <div className="space-y-5">
            {steps.map((label, index) => (
              <div key={label} className="flex items-start gap-3.5">
                <div className="flex shrink-0 flex-col items-center">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-semibold ring-1 ring-white/20 ${index + 1 < currentStep ? 'bg-white text-[#3E1626]' : index + 1 === currentStep ? 'bg-white/20 text-white ring-2 ring-white/30' : 'bg-white/10 text-white/50'}`}>
                    {index + 1 < currentStep ? <Check className="h-4 w-4" /> : index + 1}
                  </div>
                  {index < steps.length - 1 && <div className={`h-5 w-px ${index + 1 < currentStep ? 'bg-white' : 'bg-white/20'}`} />}
                </div>
                <p className={`pt-1.5 text-[13px] font-semibold ${index + 1 <= currentStep ? 'text-white' : 'text-white/50'}`}>{label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative mt-10 space-y-2.5">
          <div className="rounded-[10px] bg-white/10 px-3.5 py-2.5 text-[12px] font-medium text-white/80 ring-1 ring-white/15">Payment verified for this registration</div>
          <div className="rounded-[10px] bg-white/10 px-3.5 py-2.5 text-[12px] font-medium text-white/80 ring-1 ring-white/15">Company documents reviewed manually before approval</div>
        </div>
      </aside>
      <div className="flex-1 px-4 py-10 sm:px-8 lg:px-14 lg:py-14">
        <div className="mx-auto max-w-2xl rounded-[18px] border border-[#EAD4C8] bg-white p-6 shadow-[0_20px_50px_-24px_rgba(62,22,38,0.18)] sm:p-8">
          <RecruiterRegisterForm onSwitchToLogin={() => navigate('/recruiter/login')} resumeRecruiterId={recruiterId} onStepChange={setCurrentStep} />
        </div>
      </div>
    </div>
  );
}
