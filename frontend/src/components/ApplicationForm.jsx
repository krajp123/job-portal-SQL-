import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

export const APPLICATION_FIELD_LIBRARY = [
    ['current_job_title', 'Current Job Title', 'text'],
    ['current_company', 'Current Company', 'text'],
    ['total_experience', 'Total Experience (years)', 'number'],
    ['relevant_experience', 'Relevant Experience (years)', 'number'],
    ['current_ctc', 'Current CTC (in Lakh)', 'number'],
    ['expected_ctc', 'Expected CTC (in Lakh)', 'number'],
    ['notice_period', 'Notice Period (in days)', 'number'],
    ['highest_qualification', 'Highest Qualification', 'text'],
    ['university', 'University / College Name', 'text'],
    ['graduation_year', 'Graduation Year', 'number'],
    ['current_location', 'Current Location', 'text'],
    ['preferred_location', 'Preferred Location', 'text'],
    ['willing_to_relocate', 'Willing to Relocate', 'radio'],
    ['linkedin_url', 'LinkedIn URL', 'url'],
    ['github_url', 'GitHub URL', 'url'],
    ['portfolio_url', 'Portfolio URL', 'url'],
    ['personal_website', 'Personal Website', 'url'],
    ['cover_letter', 'Cover Letter', 'textarea'],
];

const FIELD_TYPES = [
    ['text', 'Short text'], ['textarea', 'Long text'], ['number', 'Number'],
    ['radio', 'Yes / No'], ['checkbox', 'Multiple choice'], ['select', 'Dropdown'],
    ['skills', 'Multiple skills'], ['date', 'Date'], ['url', 'URL'], ['file', 'File upload'],
];

const FIELD_SUGGESTIONS = {
    highest_qualification: ['10th / SSC', '12th / HSC', 'ITI', 'Diploma', 'Bachelors Degree', 'Masters Degree', 'MCA', 'MBA', 'M.Tech', 'M.Com', 'PhD'],
    university: ['IIT Delhi', 'IIT Bombay', 'IIT Madras', 'IIT Kharagpur', 'NIT Rourkela', 'NIT Trichy', 'Delhi University', 'Mumbai University', 'Utkal University', 'BPUT', 'Bangalore University', 'Anna University', 'Pune University', 'Amity University', 'KIIT University'],
    preferred_location: ['Bengaluru', 'Hyderabad', 'Pune', 'Mumbai', 'Delhi NCR', 'Noida', 'Gurugram', 'Chennai', 'Kolkata', 'Bhubaneswar', 'Ahmedabad', 'Jaipur', 'Remote'],
};

const FIELD_LABELS = {
    current_ctc: 'Current CTC (in Lakh)',
    expected_ctc: 'Expected CTC (in Lakh)',
    notice_period: 'Notice Period (in days)',
    university: 'University / College Name',
};

function makeId() {
    return globalThis.crypto?.randomUUID?.() || `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function FieldInput({ field, value, onChange, error }) {
    const common = 'mt-1 block w-full rounded-[6px] border border-[#EBC2AE] bg-[#FFF9F5] px-3 py-1.5 text-[13px] outline-none transition-colors focus:border-[#C75560] focus:bg-white focus:ring-2 focus:ring-[#C75560]/10';
    const [skillDraft, setSkillDraft] = useState('');
    const [suggestionOpen, setSuggestionOpen] = useState(false);
    const [locating, setLocating] = useState(false);
    const [locationError, setLocationError] = useState('');
    if (field.fieldType === 'skills') return <div className="mt-1"><div className="rounded-[6px] border border-[#EBC2AE] bg-[#FFF9F5] px-3 py-1.5 focus-within:border-[#C75560] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#C75560]/10"><input value={skillDraft} onChange={(event) => setSkillDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); const skill = skillDraft.trim(); if (skill && !(value || []).includes(skill)) onChange([...(value || []), skill]); setSkillDraft(''); } }} onBlur={() => { const skill = skillDraft.trim(); if (skill && !(value || []).includes(skill)) onChange([...(value || []), skill]); setSkillDraft(''); }} placeholder="Type a skill and press Enter" className="!m-0 w-full !border-0 !bg-transparent px-0 py-0.5 text-[13px] !shadow-none !outline-none focus:!border-0 focus:!shadow-none" /></div>{Array.isArray(value) && value.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{value.map((skill) => <span key={skill} className="inline-flex items-center gap-1 rounded-[5px] border border-[#EBC2AE] bg-[#FFF9F5] px-2 py-0.5 text-[11px] font-medium text-[#54263F]">{skill}<button type="button" aria-label={`Remove ${skill}`} onClick={() => onChange(value.filter((item) => item !== skill))} className="text-[#80576A] hover:text-[#B3261E]">×</button></span>)}</div>}</div>;
    if (field.fieldType === 'textarea') return <textarea rows={3} className={common} value={value || ''} onChange={(e) => onChange(e.target.value)} />;
    if (field.fieldType === 'select' && field.options?.length) return <select className={common} value={value || ''} onChange={(e) => onChange(e.target.value)}><option value="">Select an option</option>{field.options.map((option) => <option key={option}>{option}</option>)}</select>;
    if (field.fieldType === 'radio') return <div className="mt-1 space-y-1.5">{(field.options?.length ? field.options : ['Yes', 'No']).map((option) => <label key={option} className="flex min-h-7 items-center gap-2 text-[13px] text-stone-700"><input type="radio" name={field.fieldId} checked={value === option} onChange={() => onChange(option)} />{option}</label>)}</div>;
    if (field.fieldType === 'checkbox' && field.options?.length) return <div className="mt-1 space-y-1.5">{field.options.map((option) => { const selected = Array.isArray(value) && value.includes(option); return <label key={option} className="flex min-h-7 items-center gap-2 text-[13px] text-stone-700"><input type="checkbox" checked={selected} onChange={() => onChange(selected ? value.filter((item) => item !== option) : [...(value || []), option])} />{option}</label>; })}</div>;
    const suggestions = FIELD_SUGGESTIONS[field.fieldId] || [];
    const matchingSuggestions = suggestions.filter((suggestion) => suggestion.toLowerCase().includes(String(value || '').toLowerCase())).slice(0, 8);
    async function useCurrentLocation() {
        if (!navigator.geolocation || locating) {
            setLocationError('Current location is not supported by this browser.');
            return;
        }
        setLocating(true);
        setLocationError('');
        navigator.geolocation.getCurrentPosition(async ({ coords }) => {
            try {
                const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`);
                if (!response.ok) throw new Error('Location lookup failed');
                const data = await response.json();
                const location = [data.city || data.locality, data.principalSubdivision, data.countryName].filter(Boolean).join(', ');
                onChange(location || `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`);
            } catch {
                onChange(`${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`);
                setLocationError('City lookup unavailable. Coordinates added instead.');
            } finally {
                setLocating(false);
            }
        }, () => {
            setLocationError('Location permission was denied. You can enter it manually.');
            setLocating(false);
        }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
    }
    return <>
        <div className="relative">
            <input type={field.fieldType === 'number' ? 'number' : field.fieldType === 'date' ? 'date' : field.fieldType === 'url' ? 'url' : 'text'} min={field.fieldType === 'number' ? '0' : undefined} step={field.fieldType === 'number' ? 'any' : undefined} onWheel={field.fieldType === 'number' ? (event) => event.currentTarget.blur() : undefined} className={common} value={value || ''} onFocus={() => setSuggestionOpen(String(value || '').length >= 2 && suggestions.length > 0)} onChange={(e) => { onChange(e.target.value); setSuggestionOpen(e.target.value.trim().length >= 2 && suggestions.length > 0); }} onBlur={() => setTimeout(() => setSuggestionOpen(false), 120)} />
            {suggestionOpen && matchingSuggestions.length > 0 && <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-[6px] border border-[#EBC2AE] bg-white shadow-lg">{matchingSuggestions.map((suggestion) => <button type="button" key={suggestion} onMouseDown={(event) => event.preventDefault()} onClick={() => { onChange(suggestion); setSuggestionOpen(false); }} className="block w-full border-b border-[#F4E5DE] px-3 py-2 text-left text-[12px] text-[#54263F] last:border-0 hover:bg-[#FFF4EF]">{suggestion}</button>)}</div>}
        </div>
        {field.fieldId === 'current_location' && <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2"><button type="button" onClick={useCurrentLocation} disabled={locating} className="p-0 text-[11px] font-semibold text-[#8B1E2F] underline-offset-2 transition-colors hover:text-[#C75560] hover:underline disabled:cursor-wait disabled:opacity-60">{locating ? 'Detecting location...' : 'Use current location'}</button>{locationError && <span className="text-[10.5px] font-medium text-[#B3261E]">{locationError}</span>}</div>}
    </>;
}

export function DynamicApplicationForm({ fields = [], initialValues = {}, onSubmit, submitting = false }) {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    function submit(event) {
        event.preventDefault();
        const nextErrors = {};
        fields.forEach((field) => {
            const value = values[field.fieldId];
            if (field.required && (value === undefined || value === '' || (Array.isArray(value) && value.length === 0))) nextErrors[field.fieldId] = 'This field is required.';
            if (value && field.fieldType === 'url') { try { new URL(value); } catch { nextErrors[field.fieldId] = 'Enter a valid URL.'; } }
        });
        setErrors(nextErrors);
        if (!Object.keys(nextErrors).length) onSubmit(fields.filter((field) => values[field.fieldId] !== undefined && values[field.fieldId] !== '' && (!Array.isArray(values[field.fieldId]) || values[field.fieldId].length > 0)).map((field) => ({ fieldId: field.fieldId, value: values[field.fieldId] })));
    }
    return <form onSubmit={submit} className="space-y-4">
        <div className="space-y-3">
            {fields.map((field) => <div key={field.fieldId}><label className="text-[12.5px] font-semibold text-stone-800">{FIELD_LABELS[field.fieldId] || field.label} {field.required && <span className="text-red-600">*</span>}</label><FieldInput field={field} value={values[field.fieldId]} onChange={(value) => setValues((current) => ({ ...current, [field.fieldId]: value }))} />{errors[field.fieldId] && <p className="mt-1 text-[11px] font-medium text-red-600">{errors[field.fieldId]}</p>}</div>)}
        </div>
        <div className="flex items-center justify-end pt-0"><button type="submit" disabled={submitting} className="rounded-[8px] bg-[#8B1E2F] px-5 py-2 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-[#701525] disabled:opacity-60">{submitting ? 'Applying...' : 'Submit Application'}</button></div>
    </form>;
}

export function ApplicationRequirementsBuilder({ value = [], onChange, externalApplyLink = '', onExternalApplyLinkChange }) {
    const [customOpen, setCustomOpen] = useState(false);
    const [custom, setCustom] = useState({ label: '', fieldType: 'text', options: '', required: false });
    const choiceTypes = ['radio', 'checkbox', 'select'];
    const selectedIds = new Set(value.map((field) => field.fieldId));
    const hasExternalLink = Boolean(externalApplyLink.trim());

    useEffect(() => {
        if (hasExternalLink) setCustomOpen(false);
    }, [hasExternalLink]);

    const add = ([fieldId, label, fieldType]) => {
        if (selectedIds.has(fieldId)) return;
        onChange([...value, {
            fieldId,
            label,
            fieldType,
            required: false,
            options: fieldType === 'radio' ? ['Yes', 'No'] : [],
        }]);
    };

    const addCustom = () => {
        const options = custom.options.split(',').map((item) => item.trim()).filter(Boolean);
        if (!custom.label.trim() || (choiceTypes.includes(custom.fieldType) && !options.length)) return;
        onChange([...value, {
            fieldId: makeId(),
            label: custom.label.trim(),
            fieldType: custom.fieldType,
            required: custom.required,
            options,
        }]);
        setCustom({ label: '', fieldType: 'text', options: '', required: false });
        setCustomOpen(false);
    };

    const update = (fieldId, patch) => onChange(value.map((field) => (
        field.fieldId === fieldId ? { ...field, ...patch } : field
    )));

    return (
        <section className="overflow-hidden rounded-[16px] border border-[#EBC2AE] bg-[#FFFDFC] shadow-[0_12px_30px_-24px_rgba(86,38,63,0.5)]">
            <div className="border-b border-[#F2D9CC] bg-[#FFF7F2] px-4 py-4 sm:px-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#C75560]">Additional Information</p>
                        <h3 className="mt-1 text-[16px] font-bold text-[#1D181A]">Application Requirements</h3>
                        <p className="mt-1 max-w-2xl text-[12px] leading-5 text-[#80576A]">
                            Choose the information you want to collect. Name, email, phone and resume are always taken from the candidate profile.
                        </p>
                    </div>
                    <span className="hidden shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[#9A671A] shadow-sm sm:inline-flex">
                        {value.length} {value.length === 1 ? 'field' : 'fields'} added
                    </span>
                </div>
            </div>

            <div className="p-4 sm:p-5">
                <div>
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h4 className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#54263F]">Suggested fields</h4>
                            <p className="mt-1 text-[11px] text-[#A77D8D]">{hasExternalLink ? 'Disabled while an external application link is provided.' : 'Add fields relevant to this role.'}</p>
                        </div>
                        <span className="text-[11px] font-medium text-[#A77D8D]">Click to add</span>
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {APPLICATION_FIELD_LIBRARY.map((field) => {
                            const added = selectedIds.has(field[0]);
                            return (
                                <button
                                    type="button"
                                    key={field[0]}
                                    onClick={() => add(field)}
                                    disabled={added || hasExternalLink}
                                    className={`flex min-h-10 items-center justify-between gap-2 rounded-[10px] border px-3 py-2 text-left text-[12px] font-semibold transition-colors ${added ? 'border-[#D8E7D9] bg-[#F3FAF3] text-[#5B8A62]' : 'border-[#F0D1BF] bg-white text-[#54263F] hover:border-[#C75560] hover:bg-[#FFF7F2]'}`}
                                >
                                    <span>{field[1]}</span>
                                    <span className="text-[15px] leading-none">{added ? '✓' : '+'}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="my-5 border-t border-[#F2D9CC]" />

                <div className="rounded-[12px] border border-[#EBC2AE] bg-[#FFF9F5] p-4">
                    <label className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#54263F]">External application link</label>
                    <p className="mt-1 text-[11px] text-[#A77D8D]">Candidates will be sent to this company link instead of completing questions here.</p>
                    <input
                        type="url"
                        value={externalApplyLink}
                        onChange={(event) => onExternalApplyLinkChange?.(event.target.value)}
                        placeholder="https://company.com/careers/apply"
                        className="mt-3 block w-full rounded-[9px] border border-[#EBC2AE] bg-white px-3 py-2.5 text-[12px] text-[#1D181A] outline-none focus:border-[#C75560]"
                    />
                    {hasExternalLink && <p className="mt-2 text-[11px] font-semibold text-[#9A671A]">Custom questions are disabled while this link is present.</p>}
                </div>

                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h4 className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#54263F]">Selected fields</h4>
                        <p className="mt-1 text-[11px] text-[#A77D8D]">Set each field as required or optional.</p>
                    </div>
                    {value.length > 0 && <span className="text-[11px] font-medium text-[#A77D8D]">{value.length} configured</span>}
                </div>

                {value.length === 0 ? (
                    <div className="mt-3 rounded-[12px] border border-dashed border-[#EBC2AE] bg-[#FFF9F5] px-4 py-6 text-center">
                        <p className="text-[12px] font-semibold text-[#54263F]">No additional fields yet</p>
                        <p className="mt-1 text-[11px] text-[#A77D8D]">Choose a suggested field or add your own question below.</p>
                    </div>
                ) : (
                    <div className="mt-3 space-y-2.5">
                        {value.map((field, index) => (
                            <div key={field.fieldId} className="rounded-[12px] border border-[#F0D1BF] bg-white p-3.5">
                                <div className="flex items-start gap-3">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFF0E8] text-[11px] font-bold text-[#C75560]">{index + 1}</span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-col gap-2 md:flex-row md:items-center">
                                            <input disabled={hasExternalLink} value={field.label} onChange={(event) => update(field.fieldId, { label: event.target.value })} aria-label="Field label" className="min-w-0 flex-1 rounded-[8px] border border-[#EBC2AE] bg-[#FFF9F5] px-3 py-2 text-[12px] font-semibold text-[#1D181A] outline-none focus:border-[#C75560] disabled:cursor-not-allowed disabled:opacity-50" />
                                            <select disabled={hasExternalLink} value={field.fieldType} onChange={(event) => update(field.fieldId, { fieldType: event.target.value, options: event.target.value === 'radio' && !field.options?.length ? ['Yes', 'No'] : field.options || [] })} aria-label="Field type" className="rounded-[8px] border border-[#EBC2AE] bg-[#FFF9F5] px-3 py-2 text-[12px] text-[#54263F] outline-none focus:border-[#C75560] disabled:cursor-not-allowed disabled:opacity-50">{FIELD_TYPES.map(([type, label]) => <option key={type} value={type}>{label}</option>)}</select>
                                        </div>
                                        {choiceTypes.includes(field.fieldType) && <input disabled={hasExternalLink} value={(field.options || []).join(', ')} onChange={(event) => update(field.fieldId, { options: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} placeholder="Add options separated by commas" aria-label="Field options" className="mt-2 w-full rounded-[8px] border border-[#EBC2AE] bg-[#FFF9F5] px-3 py-2 text-[11.5px] text-[#54263F] outline-none focus:border-[#C75560] disabled:cursor-not-allowed disabled:opacity-50" />}
                                        <div className="mt-2 flex items-center justify-between gap-3">
                                            <label className="flex cursor-pointer items-center gap-2 text-[11.5px] font-semibold text-[#80576A]"><input disabled={hasExternalLink} type="checkbox" checked={field.required} onChange={(event) => update(field.fieldId, { required: event.target.checked })} className="h-3.5 w-3.5 accent-[#C75560]" /> Required field</label>
                                            <button disabled={hasExternalLink} type="button" aria-label={`Remove ${field.label}`} onClick={() => onChange(value.filter((item) => item.fieldId !== field.fieldId))} className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#B3261E] hover:underline disabled:cursor-not-allowed disabled:opacity-50"><Trash2 size={13} /> Remove</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <button disabled={hasExternalLink} type="button" onClick={() => setCustomOpen((open) => !open)} className="mt-4 inline-flex items-center gap-2 rounded-[10px] border border-[#1D181A] bg-[#1D181A] px-3.5 py-2.5 text-[12px] font-bold text-white transition-colors hover:bg-[#3A3034] disabled:cursor-not-allowed disabled:opacity-50"><Plus size={14} /> {customOpen ? 'Close custom question' : 'Add Custom Question'}</button>

                {customOpen && !hasExternalLink && (
                    <div className="mt-3 rounded-[12px] border border-[#EBC2AE] bg-[#FFF7F2] p-4">
                        <div className="mb-3"><h4 className="text-[13px] font-bold text-[#1D181A]">Create a custom question</h4><p className="mt-1 text-[11px] text-[#80576A]">Write the question exactly as the candidate should see it.</p></div>
                        <div className="grid gap-3 md:grid-cols-[1fr_190px]">
                            <input autoFocus value={custom.label} onChange={(event) => setCustom({ ...custom, label: event.target.value })} placeholder="Example: Are you willing to relocate?" className="rounded-[9px] border border-[#EBC2AE] bg-white px-3 py-2.5 text-[12px] outline-none focus:border-[#C75560] md:col-span-2" />
                            <select value={custom.fieldType} onChange={(event) => setCustom({ ...custom, fieldType: event.target.value })} className="rounded-[9px] border border-[#EBC2AE] bg-white px-3 py-2.5 text-[12px] text-[#54263F] outline-none focus:border-[#C75560]">{FIELD_TYPES.map(([type, label]) => <option key={type} value={type}>{label}</option>)}</select>
                            <label className="flex items-center gap-2 rounded-[9px] border border-[#EBC2AE] bg-white px-3 py-2.5 text-[12px] font-semibold text-[#54263F]"><input type="checkbox" checked={custom.required} onChange={(event) => setCustom({ ...custom, required: event.target.checked })} className="h-3.5 w-3.5 accent-[#C75560]" /> Required</label>
                            {choiceTypes.includes(custom.fieldType) && <input value={custom.options} onChange={(event) => setCustom({ ...custom, options: event.target.value })} placeholder="Options: Remote, Hybrid, On-site" className="rounded-[9px] border border-[#EBC2AE] bg-white px-3 py-2.5 text-[12px] outline-none focus:border-[#C75560] md:col-span-2" />}
                        </div>
                        <div className="mt-3 flex justify-end"><button type="button" onClick={addCustom} disabled={!custom.label.trim() || (choiceTypes.includes(custom.fieldType) && !custom.options.trim())} className="rounded-[9px] bg-[#A51D35] px-4 py-2.5 text-[12px] font-bold text-white transition-colors hover:bg-[#8B1E2F] disabled:cursor-not-allowed disabled:opacity-45">Add question</button></div>
                    </div>
                )}
            </div>
        </section>
    );
}
