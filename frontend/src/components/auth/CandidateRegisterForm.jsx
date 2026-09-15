import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import FormField from "./FormField";
import PasswordField from "./PasswordField";

const FONT_DISPLAY = "'Space Grotesk','Inter',ui-sans-serif,sans-serif";

// same visual language as FormField, but without the bottom margin so it
// can sit flush next to a "Send OTP" / "Verify" button in a row
const inlineInputClass =
  "block w-full rounded-[12px] border border-[#EBC2AE] bg-[#FFF9F5] px-3.5 py-2.5 text-[13.5px] text-[#1D181A] placeholder:text-[#A77D8D] outline-none transition-all duration-150 focus:border-[#C75560] focus:bg-white focus:shadow-[0_0_0_3px_rgba(199,85,96,0.14)] disabled:bg-[#F6E7DE] disabled:opacity-70";

const otpInputClass =
  "w-[120px] shrink-0 rounded-[12px] border border-[#EBC2AE] bg-[#FFF9F5] px-3.5 py-2.5 text-center text-[13.5px] tracking-[0.2em] text-[#1D181A] placeholder:tracking-normal placeholder:text-[#A77D8D] outline-none transition-all duration-150 focus:border-[#C75560] focus:bg-white focus:shadow-[0_0_0_3px_rgba(199,85,96,0.14)]";

const actionBtnClass =
  "shrink-0 whitespace-nowrap rounded-[12px] border border-[#1D181A] bg-[#1D181A] px-3.5 text-[12px] font-semibold text-white transition-colors duration-150 hover:bg-[#3A3034] disabled:opacity-40 disabled:hover:bg-[#1D181A]";

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPhone = (v) => /^[0-9]{10}$/.test(v.replace(/\D/g, ""));

const candidateMainCategories = [
  { value: "student", label: "Student" },
  { value: "construction", label: "Construction" },
  { value: "security", label: "Security " },
  { value: "technical", label: " Professional" },
];

const candidateSubCategories = {
  student: [{ value: "student", label: "Student" }],
  construction: [
    { value: "labour", label: "Labour (Unskilled/Helper)" },
    { value: "mason", label: "Mason (Rajmistri)" },
    { value: "crane_operator", label: "Crane / JCB / Heavy Machinery Operator" },
    { value: "site_supervisor", label: "Site Supervisor" },
  ],
  security: [
    { value: "retired_army", label: "Retired Army" },
    { value: "retired_police", label: "Retired Police" },
    { value: "ex_navy_air_force", label: "Ex-Navy / Air Force" },
  ],
  technical: [
    { value: "sme", label: "Subject Matter Expert" },
  ],
};

const dynamicFieldClass =
  "block w-full rounded-[10px] border border-[#EBC2AE] bg-[#FFF9F5] px-2.5 py-2 text-[12.5px] text-[#1D181A] placeholder:text-[#A77D8D] outline-none transition-all duration-150 focus:border-[#C75560] focus:bg-white focus:shadow-[0_0_0_3px_rgba(199,85,96,0.14)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

function CustomSelect({ value, placeholder, options, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`${dynamicFieldClass} flex min-h-[38px] w-full items-center justify-between text-left ${
          selected ? "text-[#1D181A]" : "text-[#A77D8D]"
        }`}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <span className="ml-2 text-[11px] text-[#80576A]">▾</span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-[10px] border border-[#EBC2AE] bg-white shadow-[0_8px_22px_rgba(29,24,26,0.10)]">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`block w-full px-2.5 py-2 text-left text-[12.5px] leading-snug transition-colors duration-150 ${
                value === option.value
                  ? "bg-[#FFF0E8] text-[#1D181A]"
                  : "bg-white text-[#1D181A] hover:bg-[#FFF9F5]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const getCategorySpecificFields = (category, subCategory) => {
  const baseCommon = [
    { key: "age", label: "Age", type: "number", placeholder: "Age" },
    { key: "height", label: "Height (cm)", type: "number", placeholder: "170" },
    { key: "weight", label: "Weight (kg)", type: "number", placeholder: "65" },
    { key: "medicalCertificate", label: "Medical certificate", type: "select", options: ["No", "Yes"] },
    { key: "willingToRelocate", label: "Willing to relocate?", type: "select", options: ["No", "Yes"] },
    { key: "currentLocation", label: "Current location", type: "text", placeholder: "City / state / country" },
  ];

  switch (subCategory) {
    case "student":
      return [
        { key: "qualification", label: "Qualification", type: "text", placeholder: "12th / Diploma / Graduation" },
        { key: "schoolName", label: "School / College / University", type: "text", placeholder: "Institute name" },
        { key: "course", label: "Course / Stream", type: "text", placeholder: "B.Tech / Arts / Commerce" },
        { key: "yearOfStudy", label: "Year of study", type: "text", placeholder: "1st / 2nd / final year" },
        { key: "studentSkills", label: "Skills / Interests", type: "text", placeholder: "Excel, CAD, Computer skills" },
      ];
    case "labour":
      return [
        ...baseCommon,
        { key: "typeOfWorkDoneBefore", label: "Type of work done before", type: "text", placeholder: "Construction helper, loading, site work" },
      ];
    case "mason":
      return [
        ...baseCommon,
      ];
    case "plumber":
      return [
        { key: "age", label: "Age", type: "number", placeholder: "Age" },
        { key: "height", label: "Height (cm)", type: "number", placeholder: "170" },
        { key: "weight", label: "Weight (kg)", type: "number", placeholder: "65" },
        { key: "willingToRelocate", label: "Willing to relocate?", type: "select", options: ["No", "Yes"] },
        { key: "currentLocation", label: "Current location", type: "text", placeholder: "City / state / country" },
      ];
    case "painter":
      return [
        ...baseCommon,
        { key: "paintingType", label: "Painting type", type: "select", options: ["Interior", "Exterior", "Texture", "Spray"] },
        { key: "ownEquipment", label: "Own equipment?", type: "select", options: ["No", "Yes"] },
      ];
    case "welder":
      return [
        ...baseCommon,
        { key: "weldingType", label: "Welding type", type: "select", options: ["Arc", "MIG", "TIG", "Gas"] },
        { key: "tradeCertificate", label: "Certificate / ITI / Trade", type: "text", placeholder: "ITI / Welding trade" },
        { key: "ownEquipment", label: "Own equipment?", type: "select", options: ["No", "Yes"] },
      ];
    case "tile_marble_worker":
      return [
        ...baseCommon,
      ];
    case "crane_operator":
      return [
        ...baseCommon,
        { key: "machineryTypeKnown", label: "Machinery type known", type: "text", placeholder: "Crane, JCB, Excavator" },
        { key: "operatingLicenseNumber", label: "Operating license number & category", type: "text", placeholder: "License no / category" },
        { key: "experiencePerMachine", label: "Years of experience per machine", type: "text", placeholder: "Crane 3 yrs, JCB 2 yrs" },
      ];
    case "site_supervisor":
      return [
        ...baseCommon,
        { key: "qualification", label: "Qualification", type: "text", placeholder: "ITI / Diploma / Degree" },
        { key: "supervisoryExperience", label: "Years of supervisory experience", type: "text", placeholder: "5 years" },
        { key: "workersManaged", label: "Number of workers managed", type: "text", placeholder: "30 workers" },
      ];
    case "retired_army":
      return [
        ...baseCommon,
        { key: "serviceIdDischargeCertificate", label: "Service ID / Discharge certificate", type: "text", placeholder: "Certificate no / service ID" },
        { key: "rankHeld", label: "Rank held", type: "text", placeholder: "Captain / Havildar" },
        { key: "yearsOfService", label: "Years of service", type: "text", placeholder: "12 years" },
        { key: "areaOfExpertise", label: "Area of expertise", type: "text", placeholder: "Security, logistics, training" },
        { key: "retirementYear", label: "Retirement year", type: "text", placeholder: "2019" },
      ];
    case "retired_police":
      return [
        ...baseCommon,
        { key: "serviceIdRetirementCertificate", label: "Service ID / Retirement certificate", type: "text", placeholder: "ID/Certificate" },
        { key: "rankHeld", label: "Rank held", type: "text", placeholder: "Inspector / Head Constable" },
        { key: "yearsOfService", label: "Years of service", type: "text", placeholder: "15 years" },
        { key: "departmentStateCadre", label: "Department / state cadre", type: "text", placeholder: "Delhi Police / UP Cadre" },
      ];
    case "ex_navy_air_force":
      return [
        ...baseCommon,
        { key: "serviceIdDischargeCertificate", label: "Service ID / Discharge certificate", type: "text", placeholder: "Service ID / discharge certificate" },
        { key: "branchAndRank", label: "Branch & rank", type: "text", placeholder: "Navy / Air Force / rank" },
        { key: "yearsOfService", label: "Years of service", type: "text", placeholder: "10 years" },
      ];
    case "sme":
      return [
        { key: "fieldOfExpertise", label: "Field of Expertise", type: "text", placeholder: "Enter your subject matter expertise" },
        { key: "qualification", label: "Qualification / Degree", type: "text", placeholder: "Degree / certification" },
        { key: "portfolioResume", label: "Portfolio Link", type: "text", placeholder: "Upload link or note" },
      ];
    case "civil_engineer":
      return [
        { key: "qualification", label: "Qualification", type: "text", placeholder: "B.E. / B.Tech / Diploma" },
        { key: "experienceYears", label: "Years of experience", type: "text", placeholder: "5 years" },
        { key: "softwareKnowledge", label: "Software knowledge", type: "text", placeholder: "AutoCAD / STAAD / Revit" },
        { key: "licenseRegistrationNumber", label: "License / registration number", type: "text", placeholder: "Registration no" },
      ];
    case "electrician":
      return [
        { key: "height", label: "Height (cm)", type: "number", placeholder: "170" },
        { key: "medicalCertificate", label: "Medical certificate", type: "select", options: ["No", "Yes"] },
        { key: "tradeCertificate", label: "Certificate / ITI / Trade license", type: "text", placeholder: "ITI / license no" },
      ];
    case "solar_technician":
      return [
        { key: "height", label: "Height (cm)", type: "number", placeholder: "170" },
        { key: "medicalCertificate", label: "Medical certificate", type: "select", options: ["No", "Yes"] },
        { key: "solarCertification", label: "Solar installation certification", type: "text", placeholder: "Certification name" },
        { key: "systemsWorkedOn", label: "Type of systems worked on", type: "text", placeholder: "On-grid / off-grid / rooftop" },
      ];
    case "cctv_networking_technician":
      return [
        { key: "height", label: "Height (cm)", type: "number", placeholder: "170" },
        { key: "medicalCertificate", label: "Medical certificate", type: "select", options: ["No", "Yes"] },
        { key: "brandsFamiliar", label: "Brands / systems familiar", type: "text", placeholder: "Hikvision / CP Plus / Cisco" },
        { key: "certificateIfAny", label: "Certificate", type: "text", placeholder: "If any" },
      ];
    case "interior_designer":
      return [
        { key: "qualification", label: "Qualification", type: "text", placeholder: "Diploma / Degree / Course" },
        { key: "experienceYears", label: "Years of experience", type: "text", placeholder: "3 years" },
        { key: "portfolioResume", label: "Portfolio / Resume", type: "text", placeholder: "Portfolio link or note" },
      ];
    default:
      return [
        ...baseCommon,
        { key: "qualification", label: "Qualification", type: "text", placeholder: "Add qualification" },
      ];
  }
};

export default function CandidateRegisterForm({ onSwitchToLogin, onSuccess }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [paymentStatus, setPaymentStatus] = useState("idle"); // 'idle' | 'awaiting-payment' | 'verifying'
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    workStatus: "", // 'fresher' | 'experienced' — Student only
    candidateCategory: "",
    candidateSubCategory: "",
  });
  const [certificate, setCertificate] = useState(null);
  const [medicalCertificateFile, setMedicalCertificateFile] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  const [fieldNames] = useState(() => {
    const suffix = Math.random().toString(36).slice(2);
    return {
      fullName: `fullName-${suffix}`,
      email: `email-${suffix}`,
      phone: `phone-${suffix}`,
      password: `password-${suffix}`,
      confirmPassword: `confirmPassword-${suffix}`,
    };
  });

  const [emailOtp, setEmailOtp] = useState({
    code: "",
    sent: false,
    verified: false,
    sending: false,
    verifying: false,
    error: "",
  });
  const [phoneOtp, setPhoneOtp] = useState({
    code: "",
    sent: false,
    verified: false,
    sending: false,
    verifying: false,
    error: "",
  });

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    const mappedName = {
      [fieldNames.email]: "email",
      [fieldNames.phone]: "phone",
      [fieldNames.password]: "password",
      [fieldNames.confirmPassword]: "confirmPassword",
    }[name] || name;

    setForm((f) => {
      if (mappedName === "candidateCategory") {
        const nextMainCategory = value;
        return {
          ...f,
          candidateCategory: nextMainCategory,
          candidateSubCategory: "",
          workStatus: nextMainCategory === "student" ? "fresher" : "",
        };
      }
      return { ...f, [mappedName]: value };
    });

    // editing a verified field resets its verification
    if (mappedName === "email" && emailOtp.verified) {
      setEmailOtp({
        code: "",
        sent: false,
        verified: false,
        sending: false,
        verifying: false,
        error: "",
      });
    }
    if (mappedName === "phone" && phoneOtp.verified) {
      setPhoneOtp({
        code: "",
        sent: false,
        verified: false,
        sending: false,
        verifying: false,
        error: "",
      });
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation || locating) {
      setLocationError("Current location is not supported by this browser.");
      return;
    }

    setLocating(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`,
          );
          if (!response.ok) throw new Error("Location lookup failed");
          const data = await response.json();
          const location = [
            data.city || data.locality,
            data.principalSubdivision,
            data.countryName,
          ]
            .filter(Boolean)
            .join(", ");

          setForm((currentForm) => ({
            ...currentForm,
            currentLocation: location || `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`,
          }));
        } catch {
          setForm((currentForm) => ({
            ...currentForm,
            currentLocation: `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`,
          }));
          setLocationError("City lookup unavailable. Coordinates added instead.");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocationError("Location permission was denied. You can enter it manually.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 },
    );
  }

  // ---------- email OTP ----------
  async function sendEmailOtp() {
    if (!isValidEmail(form.email)) {
      setEmailOtp((s) => ({ ...s, error: "Enter a valid email first" }));
      return;
    }
    setEmailOtp((s) => ({ ...s, sending: true, error: "" }));
    try {
      await axiosInstance.post("/candidate/verify/email/send", {
        email: form.email,
      });
      setEmailOtp((s) => ({ ...s, sending: false, sent: true }));
    } catch (err) {
      setEmailOtp((s) => ({
        ...s,
        sending: false,
        error: err.response?.data?.error || "Could not send OTP",
      }));
    }
  }

  async function verifyEmailOtp() {
    if (!emailOtp.code) return;
    setEmailOtp((s) => ({ ...s, verifying: true, error: "" }));
    try {
      await axiosInstance.post("/candidate/verify/email/confirm", {
        email: form.email,
        code: emailOtp.code,
      });
      setEmailOtp((s) => ({ ...s, verifying: false, verified: true }));
    } catch (err) {
      setEmailOtp((s) => ({
        ...s,
        verifying: false,
        error: err.response?.data?.error || "Incorrect or expired code",
      }));
    }
  }

  // ---------- phone OTP ----------
  async function sendPhoneOtp() {
    if (!isValidPhone(form.phone)) {
      setPhoneOtp((s) => ({
        ...s,
        error: "Enter a valid 10-digit phone number first",
      }));
      return;
    }
    setPhoneOtp((s) => ({ ...s, sending: true, error: "" }));
    try {
      await axiosInstance.post("/candidate/verify/phone/send", {
        phone: form.phone,
      });
      setPhoneOtp((s) => ({ ...s, sending: false, sent: true }));
    } catch (err) {
      setPhoneOtp((s) => ({
        ...s,
        sending: false,
        error: err.response?.data?.error || "Could not send OTP",
      }));
    }
  }

  async function verifyPhoneOtp() {
    if (!phoneOtp.code) return;
    setPhoneOtp((s) => ({ ...s, verifying: true, error: "" }));
    try {
      await axiosInstance.post("/candidate/verify/phone/confirm", {
        phone: form.phone,
        code: phoneOtp.code,
      });
      setPhoneOtp((s) => ({ ...s, verifying: false, verified: true }));
    } catch (err) {
      setPhoneOtp((s) => ({
        ...s,
        verifying: false,
        error: err.response?.data?.error || "Incorrect or expired code",
      }));
    }
  }

  const passwordsMismatch =
    form.confirmPassword.length > 0 && form.password !== form.confirmPassword;

  const categorySpecificFields = getCategorySpecificFields(
    form.candidateCategory,
    form.candidateSubCategory,
  );

  // Password strength — checks length + character variety, used for both
  // the visual meter and the strong/not-strong alert below the field.
  const passwordStrength = useMemo(() => {
    const pw = form.password;
    const checks = {
      length: pw.length >= 8,
      lower: /[a-z]/.test(pw),
      upper: /[A-Z]/.test(pw),
      number: /[0-9]/.test(pw),
      special: /[^A-Za-z0-9]/.test(pw),
    };
    const score = Object.values(checks).filter(Boolean).length; // 0-5
    const isStrong = checks.length && score >= 4;
    let label = "Weak";
    if (score === 3) label = "Fair";
    else if (score === 4) label = "Good";
    else if (score === 5) label = "Strong";
    return { checks, score, label, isStrong };
  }, [form.password]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!emailOtp.verified) return setError("Please verify your email first.");
    // if (!phoneOtp.verified) return setError('Please verify your phone number first.');
    if (form.password !== form.confirmPassword)
      return setError("Passwords do not match.");
    if (!passwordStrength.isStrong)
      return setError("Please choose a stronger password before continuing.");
    if (form.candidateCategory === "student" && form.workStatus === "experienced" && !certificate) {
      return setError("Please upload your experience certificate.");
    }
    if (!agreeTerms || !agreePrivacy) {
      return setError(
        "Please agree to the Terms & Conditions and the Privacy Policy to continue.",
      );
    }

    const candidateProfile = {};
    Object.entries(form).forEach(([key, value]) => {
      if (
        [
          "fullName",
          "email",
          "phone",
          "password",
          "confirmPassword",
          "workStatus",
          "candidateCategory",
          "agreeTerms",
          "agreePrivacy",
        ].includes(key)
      ) {
        return;
      }
      if (value !== "" && value !== null && value !== undefined) {
        candidateProfile[key] = value;
      }
    });

    setSubmitting(true);
    try {
      // ---- Step 1: create-order. No account exists yet — this just
      // validates the form and stashes the data server-side until payment lands.
      let payload;
      let headers;

      if ((form.candidateCategory === "student" && form.workStatus === "experienced" && certificate) || medicalCertificateFile) {
        payload = new FormData();
        payload.append("name", form.fullName);
        payload.append("email", form.email);
        payload.append("phone", form.phone);
        payload.append("password", form.password);
        if (form.candidateCategory === "student") {
          payload.append("workStatus", form.workStatus);
        }
        payload.append("candidateCategory", form.candidateCategory);
        payload.append("candidateSubCategory", form.candidateSubCategory);
        payload.append("candidateProfile", JSON.stringify(candidateProfile));
        if (certificate) {
          payload.append("experienceCertificate", certificate);
        }
        if (medicalCertificateFile) {
          payload.append("medicalCertificate", medicalCertificateFile);
        }
        headers = { "Content-Type": "multipart/form-data" };
      } else {
        payload = {
          name: form.fullName,
          email: form.email,
          phone: form.phone,
          password: form.password,
          ...(form.candidateCategory === "student" ? { workStatus: form.workStatus } : {}),
          candidateCategory: form.candidateCategory,
          candidateSubCategory: form.candidateSubCategory,
          candidateProfile,
        };
      }

      const { data: order } = await axiosInstance.post(
        "/candidate/register/create-order",
        payload,
        { headers },
      );

      if (order.devMode) {
        setPaymentStatus("verifying");
        try {
          const { data } = await axiosInstance.post("/candidate/register/verify-payment", {
            razorpay_order_id: order.orderId,
            razorpay_payment_id: "dev_payment",
            razorpay_signature: "dev_signature",
          });
          login({ token: data.token, role: 'candidate', name: data.name });
          setMessage(`Payment successful! Your login ID (${data.uniqueId}) has also been emailed to you.`);
          onSuccess?.();
          navigate('/candidate/dashboard');
        } catch (err) {
          setError(err.response?.data?.error || 'Payment succeeded but account setup failed. Please contact support.');
        } finally {
          setPaymentStatus('idle');
          setSubmitting(false);
        }
        return;
      }

      if (typeof window.Razorpay !== "function") {
        setError(
          "Payment gateway failed to load. Please check your connection and try again.",
        );
        setPaymentStatus('idle');
        setSubmitting(false);
        return;
      }

      setPaymentStatus("awaiting-payment");

      // ---- Step 2: Razorpay Checkout. Blocks are defined explicitly in the
      // order Card -> UPI/QR -> Wallet, with show_default_blocks:false so
      // Razorpay's own "Recommended" section and Netbanking/Pay Later never
      // get injected.
      //
      // Two things were fixed here vs the earlier version:
      //  1. UPI's `apps` list has been removed. Restricting UPI to specific
      //     app icons only works for the mobile intent flow — on desktop,
      //     with no app installed, Razorpay was hiding the whole UPI block
      //     instead of falling back to a QR code. Now we only set
      //     flows: ['intent', 'qr'], so mobile shows app icons and desktop
      //     shows a scannable QR automatically.
      //  2. Block keys are renamed away from the reserved words
      //     ('upi', 'card', 'wallet') to custom names (cardsBlock,
      //     upiBlock, walletBlock). Using the reserved names could make
      //     Razorpay merge in its own default "Recommended" section.
      const razorpay = new window.Razorpay({
        key: order.key,
        amount: order.amount * 100,
        currency: order.currency,
        order_id: order.orderId,
        name: 'Job Portal',
        // "J" avatar ki jagah apna logo dikhane ke liye yaha ek public HTTPS image URL daalo:
        // image: 'https://yourdomain.com/logo.png',
        description: 'Candidate registration fee (base amount plus applicable GST)',
        prefill: {
          name: order.name,
          email: order.email,
          contact: order.phone,
        },
        theme: { color: '#C75560' },
        config: {
          display: {
            blocks: {
              cardsBlock: {
                name: 'Cards',
                instruments: [{ method: 'card' }],
              },
              upiBlock: {
                name: 'Pay using UPI',
                instruments: [
                  { method: 'upi', flows: ['intent', 'qr'] },
                ],
              },
              walletBlock: {
                name: 'Wallets',
                instruments: [
                  { method: 'wallet', wallets: ['freecharge', 'mobikwik', 'payzapp', 'phonepe'] },
                ],
              },
            },
            // sirf yehi 3 blocks dikhenge, is exact order me — Netbanking,
            // Pay Later aur "Recommended" automatically gayab ho jayenge
            sequence: ['block.cardsBlock', 'block.upiBlock', 'block.walletBlock'],
            preferences: { show_default_blocks: false },
          },
        },
        handler: async (response) => {
          setPaymentStatus('verifying');
          try {
            const { data } = await axiosInstance.post('/candidate/register/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            login({ token: data.token, role: 'candidate', name: data.name });
            setMessage(`Payment successful! Your login ID (${data.uniqueId}) has also been emailed to you.`);
            onSuccess?.();
            navigate('/candidate/dashboard');
          } catch (err) {
            setError(err.response?.data?.error || 'Payment succeeded but account setup failed. Please contact support.');
          } finally {
            setPaymentStatus('idle');
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentStatus('idle');
            setSubmitting(false);
            setError('Payment was cancelled. Your account will be created only after payment is completed.');
          },
        },
      });

      razorpay.on("payment.failed", () => {
        setPaymentStatus("idle");
        setSubmitting(false);
        setError("Payment failed. Please try again.");
      });

      razorpay.open();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Could not start payment. Please try again.",
      );
      setPaymentStatus("idle");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} autoComplete="off">
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', height: 0, width: 0, overflow: 'hidden' }}>
        <input type="text" name="username" autoComplete="username" tabIndex={-1} />
        <input type="password" name="current-password" autoComplete="current-password" tabIndex={-1} />
      </div>
      <h2
        className="mb-1 text-[22px] font-bold text-[#1D181A]"
        style={{ fontFamily: FONT_DISPLAY }}
      >
        Candidate Sign Up
      </h2>
      <p className="mb-5 text-[13px] text-[#80576A]">
        Registration fee: base amount plus applicable GST — pay via UPI, QR code, debit card, or
        wallet. Your account is created only after payment succeeds.
      </p>

      {/* Full name */}
      <FormField
        name="fullName"
        placeholder="Full name"
        value={form.fullName}
        autoComplete="off"
        onChange={handleChange}
        required
      />

      {/* Email + OTP verification */}
      <div className="mb-1 flex gap-2">
        <input
          name={fieldNames.email}
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          disabled={emailOtp.verified}
          required
          autoComplete="off"
          className={inlineInputClass}
        />
        {emailOtp.verified ? (
          <span
            className={`${actionBtnClass} flex items-center gap-1 !border-[#E8A23A] !bg-[#FFF5D9] !text-[#9A671A]`}
          >
            ✓ Verified
          </span>
        ) : (
          <button
            type="button"
            onClick={sendEmailOtp}
            disabled={emailOtp.sending}
            className={actionBtnClass}
          >
            {emailOtp.sending
              ? "Sending…"
              : emailOtp.sent
                ? "Resend OTP"
                : "Send OTP"}
          </button>
        )}
      </div>
      <p className="mb-2 text-[11.5px] leading-snug text-[#8D6072]">
        We'll verify this by OTP. Once verified, your login ID will be emailed
        to this address.
      </p>

      {emailOtp.sent && !emailOtp.verified && (
        <div className="mb-1 flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter OTP"
            value={emailOtp.code}
            onChange={(e) =>
              setEmailOtp((s) => ({ ...s, code: e.target.value }))
            }
            className={otpInputClass}
          />
          <button
            type="button"
            onClick={verifyEmailOtp}
            disabled={emailOtp.verifying || !emailOtp.code}
            className={actionBtnClass}
          >
            {emailOtp.verifying ? "Verifying…" : "Verify"}
          </button>
        </div>
      )}
      {emailOtp.error && (
        <p className="mb-2 text-[11.5px] font-medium text-[#B3261E]">
          {emailOtp.error}
        </p>
      )}
      <div className="mb-3" />

      {/* Phone + OTP verification
            <div className="mb-1 flex gap-2">
                <input
                    name="phone"
                    type="tel"
                    placeholder="Phone number"
                    value={form.phone}
                    onChange={handleChange}
                    disabled={phoneOtp.verified}
                    required
                    className={inlineInputClass}
                />
                {phoneOtp.verified ? (
                    <span className={`${actionBtnClass} flex items-center gap-1 !border-[#81C995]/40 !bg-[#81C995]/10 !text-[#81C995]`}>
                        ✓ Verified
                    </span>
                ) : (
                    <button
                        type="button"
                        onClick={sendPhoneOtp}
                        disabled={phoneOtp.sending}
                        className={actionBtnClass}
                    >
                        {phoneOtp.sending ? 'Sending…' : phoneOtp.sent ? 'Resend OTP' : 'Send OTP'}
                    </button>
                )}
            </div>

            {phoneOtp.sent && !phoneOtp.verified && (
                <div className="mb-1 mt-2 flex gap-2">
                    <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="Enter OTP"
                        value={phoneOtp.code}
                        onChange={(e) => setPhoneOtp((s) => ({ ...s, code: e.target.value }))}
                        className={otpInputClass}
                    />
                    <button
                        type="button"
                        onClick={verifyPhoneOtp}
                        disabled={phoneOtp.verifying || !phoneOtp.code}
                        className={actionBtnClass}
                    >
                        {phoneOtp.verifying ? 'Verifying…' : 'Verify'}
                    </button>
                </div>
            )}
            {phoneOtp.error && <p className="mb-2 mt-1 text-[11.5px] font-medium text-[#F28B82]">{phoneOtp.error}</p>}
            <div className="mb-3" /> */}

      {/* Phone (no OTP) */}
      <FormField
        name={fieldNames.phone}
        type="tel"
        placeholder="Phone number"
        value={form.phone}
        onChange={handleChange}
        required
        autoComplete="off"
      />

      {/* Password */}
      <PasswordField
        name={fieldNames.password}
        placeholder="Password"
        value={form.password}
        onChange={handleChange}
        onFocus={(e) => e.target.removeAttribute('readonly')}
        readOnly
        required
        autoComplete="new-password"
        spellCheck="false"
      />

      {form.password.length > 0 && (
        <div className="-mt-2 mb-3">
          {/* 5-segment strength bar */}
          <div className="mb-1.5 flex gap-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                  i < passwordStrength.score
                    ? passwordStrength.score <= 2
                      ? "bg-[#F28B82]"
                      : passwordStrength.score === 3
                        ? "bg-[#F5B942]"
                        : passwordStrength.score === 4
                          ? "bg-[#9BCB6C]"
                          : "bg-[#81C995]"
                    : "bg-[#F1D7CB]"
                }`}
              />
            ))}
          </div>

          {passwordStrength.isStrong ? (
            <p className="flex items-center gap-1.5 text-[11.5px] font-medium text-[#9A671A]">
              ✓ Strong password — accepted
            </p>
          ) : (
            <p className="text-[11.5px] font-medium text-[#B3261E]">
              Not a strong password — use 8+ characters with uppercase,
              lowercase, a number &amp; a symbol.
            </p>
          )}
        </div>
      )}

      <PasswordField
        name={fieldNames.confirmPassword}
        placeholder="Confirm password"
        value={form.confirmPassword}
        onChange={handleChange}
        onFocus={(e) => e.target.removeAttribute('readonly')}
        readOnly
        required
        autoComplete="new-password"
        spellCheck="false"
      />
      {passwordsMismatch && (
        <p className="-mt-2 mb-3 text-[11.5px] font-medium text-[#B3261E]">
          Passwords do not match.
        </p>
      )}

      {/* Candidate category hierarchy */}
      <div className="mb-4">
        <label className="mb-1.5 block text-[12.5px] font-semibold text-[#54263F]">
          Main category
        </label>
        <CustomSelect
          value={form.candidateCategory}
          placeholder="Select your category"
          options={candidateMainCategories}
          onChange={(value) => {
            setForm((f) => ({
              ...f,
              candidateCategory: value,
              candidateSubCategory: "",
            }));
          }}
        />
      </div>

      {form.candidateCategory !== "student" && (
        <div className="mb-4">
          <label className="mb-1.5 block text-[12.5px] font-semibold text-[#54263F]">
            Sub category
          </label>
          <CustomSelect
            value={form.candidateSubCategory}
            placeholder="Select your sub category"
            options={candidateSubCategories[form.candidateCategory] || []}
            onChange={(value) => {
              setForm((f) => ({ ...f, candidateSubCategory: value }));
            }}
          />
        </div>
      )}

      {form.candidateCategory === "student" && (
        <>
          <p className="mb-2 text-[12.5px] font-semibold text-[#54263F]">
            Work status
          </p>
          <div className="mb-3 flex gap-2">
            {["fresher", "experienced"].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setForm((f) => ({ ...f, workStatus: status }))}
                className={`flex-1 rounded-[12px] border px-3.5 py-2.5 text-[13px] font-semibold capitalize transition-colors duration-150 ${
                  form.workStatus === status
                    ? "border-[#C75560] bg-[#FFF0E8] text-[#1D181A]"
                    : "border-[#EBC2AE] bg-[#FFF9F5] text-[#80576A] hover:bg-[#FFF0E8]"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </>
      )}

      {form.candidateCategory !== "student" && form.candidateSubCategory && (
        <div className="mb-4 rounded-[14px] border border-[#F2D9CC] bg-[#FFF9F5] p-3">
          <h3 className="mb-2 text-[12.5px] font-semibold text-[#54263F]">
            {candidateMainCategories.find((category) => category.value === form.candidateCategory)?.label || "Category details"}
            {' / '}
            {(candidateSubCategories[form.candidateCategory] || []).find(
              (category) => category.value === form.candidateSubCategory,
            )?.label || "Sub category"}
          </h3>
          <div className="space-y-3">
            {categorySpecificFields.map((field) => (
              <div key={field.key}>
                <label className="mb-1.5 block text-[12.5px] text-[#80576A]">
                  {field.label}
                </label>
                {field.type === "select" ? (
                  <>
                    <select
                      name={field.key}
                      value={form[field.key] || ""}
                      onChange={handleChange}
                      className={dynamicFieldClass}
                    >
                      <option value="">Select</option>
                      {field.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {field.key === "medicalCertificate" && form.medicalCertificate === "Yes" && (
                      <div className="mt-2">
                        <label className="mb-1.5 block text-[12px] text-[#80576A]">
                          Upload medical certificate
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => setMedicalCertificateFile(e.target.files?.[0] || null)}
                          className="block w-full cursor-pointer rounded-[10px] border border-[#EBC2AE] bg-[#FFF9F5] text-[12px] text-[#80576A] file:mr-2 file:cursor-pointer file:rounded-[7px] file:border-0 file:bg-[#1D181A] file:px-2.5 file:py-1.5 file:text-[11px] file:font-semibold file:text-white hover:file:bg-[#3A3034]"
                        />
                        {medicalCertificateFile && (
                          <p className="mt-1 text-[11px] text-[#8D6072]">
                            Selected: {medicalCertificateFile.name}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                ) : field.type === "textarea" ? (
                  <textarea
                    name={field.key}
                    value={form[field.key] || ""}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    className={`${dynamicFieldClass} min-h-[90px] resize-y`}
                  />
                ) : (
                  <>
                    <input
                      type={field.type}
                      name={field.key}
                      value={form[field.key] || ""}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                      className={dynamicFieldClass}
                    />
                    {field.key === "currentLocation" && (
                      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={useCurrentLocation}
                          disabled={locating}
                          className="p-0 text-[11px] font-semibold text-[#8B1E2F] underline-offset-2 transition-colors hover:text-[#C75560] hover:underline disabled:cursor-wait disabled:opacity-60"
                        >
                          {locating ? "Detecting location..." : "Use current location"}
                        </button>
                        {locationError && (
                          <span className="text-[10.5px] font-medium text-[#B3261E]">
                            {locationError}
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {form.candidateCategory === "student" && form.workStatus === "experienced" && (
        <div className="mb-4">
          <label className="mb-1.5 block text-[12.5px] text-[#80576A]">
            Upload your experience certificate
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setCertificate(e.target.files?.[0] || null)}
            className="block w-full cursor-pointer rounded-[12px] border border-[#EBC2AE] bg-[#FFF9F5] text-[12.5px] text-[#80576A] file:mr-3 file:cursor-pointer file:rounded-[8px] file:border-0 file:bg-[#1D181A] file:px-3 file:py-2 file:text-[12px] file:font-semibold file:text-white hover:file:bg-[#3A3034]"
          />
          {certificate && (
            <p className="mt-1.5 text-[11.5px] text-[#8D6072]">
              Selected: {certificate.name}
            </p>
          )}
        </div>
      )}

      {/* Agreements */}
      <label className="mb-2 flex cursor-pointer items-start gap-2 text-[12.5px] text-[#80576A]">
        <input
          type="checkbox"
          checked={agreeTerms}
          onChange={(e) => setAgreeTerms(e.target.checked)}
          className="mt-0.5 h-3.5 w-3.5 accent-[#C75560]"
        />
        I agree to the{" "}
        <a href="/terms" className="text-[#C75560] hover:underline">
          Terms &amp; Conditions
        </a>
      </label>
      <label className="mb-4 flex cursor-pointer items-start gap-2 text-[12.5px] text-[#80576A]">
        <input
          type="checkbox"
          checked={agreePrivacy}
          onChange={(e) => setAgreePrivacy(e.target.checked)}
          className="mt-0.5 h-3.5 w-3.5 accent-[#C75560]"
        />
        I agree to the{" "}
        <a href="/privacy" className="text-[#C75560] hover:underline">
          Privacy Policy
        </a>
      </label>

      {error && (
        <p className="mb-3 text-[12.5px] font-medium text-[#B3261E]">{error}</p>
      )}
      {message && (
        <p className="mb-3 text-[12.5px] font-medium text-[#9A671A]">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-[12px] bg-[#C75560] px-4 py-2.5 text-[13.5px] font-semibold text-white shadow-[0_10px_24px_-10px_rgba(199,85,96,0.65)] transition-transform duration-150 hover:-translate-y-0.5 hover:bg-[#AB4054] disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {paymentStatus === "verifying"
          ? "Verifying payment…"
          : paymentStatus === "awaiting-payment"
            ? "Waiting for payment…"
            : submitting
              ? "Starting payment…"
              : "Continue to Payment"}
      </button>

      <p className="mt-3 text-center text-[12.5px] text-[#80576A]">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-semibold text-[#C75560] underline underline-offset-2 hover:text-[#1D181A]"
        >
          Log in
        </button>
      </p>

    </form>
  );
}