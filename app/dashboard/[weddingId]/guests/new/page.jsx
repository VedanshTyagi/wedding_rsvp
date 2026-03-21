"use client";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * FILE:    app/dashboard/[weddingId]/guests/new/page.jsx
 * ROUTE:   /dashboard/[weddingId]/guests/new
 * PURPOSE: Add a new guest to a wedding.
 *
 * ON SUBMIT this page does 3 things in one API call:
 *   1. INSERT into `guests`                  — core guest record
 *   2. INSERT into `guest_function_invites`  — one row per checked function
 *   3. INSERT into `rsvp_responses`          — seeded as "pending" per function
 *
 * FORM FIELDS:
 *   • name          — full name (required)
 *   • phone         — mobile number
 *   • email         — email address
 *   • group_tag     — e.g. "Bride's Side", "Groom's Side", "Friend", "Colleague"
 *   • dietary       — veg / non-veg / vegan / jain / other
 *   • outstation    — boolean toggle (guest travelling from out of town?)
 *   • functions[]   — checkboxes, one per wedding event/function
 *
 * COMPONENTS IN THIS FILE:
 *   FormField        — labelled input wrapper with error display
 *   SelectField      — labelled <select> wrapper
 *   Toggle           — animated boolean toggle switch
 *   FunctionCheckbox — single function checkbox card
 *   NewGuestPage     — main page (default export)
 *
 * KEY FUNCTIONS:
 *   fetchFunctions() — loads all functions for this wedding from API
 *   handleSubmit()   — validates, POSTs, redirects on success
 *   validate()       — client-side validation, returns error map
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";

// ─── HELPER COMPONENTS ────────────────────────────────────────────────────────

/**
 * FormField
 * Wraps a label + input + optional error message.
 */
function FormField({ label, error, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-rose-500 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}

/**
 * SelectField
 * Labelled <select> with consistent styling.
 */
function SelectField({ label, value, onChange, options, placeholder, error }) {
  return (
    <FormField label={label} error={error}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`px-3 py-2.5 border rounded-lg text-sm bg-white text-gray-800
          focus:ring-2 focus:ring-indigo-400 focus:outline-none transition
          ${error ? "border-rose-400" : "border-gray-300"}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </FormField>
  );
}

/**
 * Toggle
 * Animated boolean toggle switch.
 * @param {boolean}  value    - current on/off state
 * @param {Function} onChange - called with new boolean
 * @param {string}   label    - label shown next to toggle
 * @param {string}   hint     - small description below
 */
function Toggle({ value, onChange, label, hint }) {
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative mt-0.5 flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1
          ${value ? "bg-indigo-600" : "bg-gray-300"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow
            transition-transform duration-200 ${value ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
      <div>
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        {hint && <p className="text-xs text-steel mt-0.5">{hint}</p>}
      </div>
    </div>
  );
}

/**
 * FunctionCheckbox
 * A card-style checkbox for a single wedding function/event.
 * @param {object}   fn       - { id, name, date, venue }
 * @param {boolean}  checked  - is this function selected?
 * @param {Function} onToggle - called with fn.id when clicked
 */
function FunctionCheckbox({ fn, checked, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(fn.id)}
      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-150
        ${checked
          ? "border-indigo-500 bg-indigo-50 shadow-sm"
          : "border-sand bg-white hover:border-gray-300 hover:bg-cream"}`}
    >
      <div className="flex items-center gap-3">
        <span className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
          ${checked ? "bg-indigo-600 border-indigo-600" : "border-gray-300 bg-white"}`}>
          {checked && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
            </svg>
          )}
        </span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${checked ? "text-indigo-700" : "text-gray-800"}`}>
            {fn.name}
          </p>
          {(fn.date || fn.venue) && (
            <p className="text-xs text-steel mt-0.5 truncate">
              {[fn.date, fn.venue].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const GROUP_OPTIONS = [
  { value: "bride_side", label: "Bride's Side" },
  { value: "groom_side", label: "Groom's Side" },
  { value: "friend",     label: "Friend" },
  { value: "colleague",  label: "Colleague" },
  { value: "family",     label: "Family" },
  { value: "other",      label: "Other" },
];

const DIETARY_OPTIONS = [
  { value: "veg",    label: "🥦 Vegetarian" },
  { value: "nonveg", label: "🍗 Non-Vegetarian" },
  { value: "vegan",  label: "🌱 Vegan" },
  { value: "jain",   label: "🙏 Jain" },
  { value: "other",  label: "✳️ Other / Not sure" },
];

// ─── MAIN PAGE COMPONENT ──────────────────────────────────────────────────────

export default function NewGuestPage({ params }) {
  const { weddingId } = use(params);
  const router = useRouter();

  // ── Form field state ───────────────────────────────────────────────────────
  const [form, setForm] = useState({
    name:       "",    // string  (required)
    phone:      "",    // string
    email:      "",    // string
    group_tag:  "",    // "bride_side" | "groom_side" | "friend" | "colleague" | "family" | "other"
    dietary:    "",    // "veg" | "nonveg" | "vegan" | "jain" | "other"
    outstation: false, // boolean — true if guest is from another city
  });

  /**
   * selectedFunctions — Set of function IDs user checked.
   * Each checked function will produce:
   *   1 row in guest_function_invites
   *   1 row in rsvp_responses (status = "pending")
   */
  const [selectedFunctions, setSelectedFunctions] = useState(new Set());

  // ── Wedding functions from API ─────────────────────────────────────────────
  const [weddingFunctions, setWeddingFunctions]   = useState([]);
  const [functionsLoading, setFunctionsLoading]   = useState(true);

  // ── Submission state ───────────────────────────────────────────────────────
  const [submitting, setSubmitting]   = useState(false);
  const [errors, setErrors]           = useState({});  // { fieldName: "message" }
  const [globalError, setGlobalError] = useState("");

  // ─────────────────────────────────────────────────────────────────────────
  // fetchFunctions
  // GET /api/weddings/[weddingId]/functions
  //
  // Returns: [{ id, name, date, venue }, ...]
  // All functions auto-selected by default so the user can uncheck if needed.
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchFunctions() {
      try {
        const res  = await fetch(`/api/weddings/${weddingId}/functions`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setWeddingFunctions(data);
        setSelectedFunctions(new Set(data.map((f) => f.id))); // default: all selected
      } catch {
        // functions section will show "none found" gracefully
      } finally {
        setFunctionsLoading(false);
      }
    }
    fetchFunctions();
  }, [weddingId]);

  // ─────────────────────────────────────────────────────────────────────────
  // setField — generic updater for form fields
  // Clears the validation error for that field on change.
  // ─────────────────────────────────────────────────────────────────────────
  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // toggleFunction — add/remove a function ID from the selected Set
  // ─────────────────────────────────────────────────────────────────────────
  function toggleFunction(fnId) {
    setSelectedFunctions((prev) => {
      const next = new Set(prev);
      next.has(fnId) ? next.delete(fnId) : next.add(fnId);
      return next;
    });
    if (errors.functions) setErrors((prev) => ({ ...prev, functions: "" }));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // validate — pure client-side checks
  // Returns { fieldName: errorString } map. Empty = valid.
  // ─────────────────────────────────────────────────────────────────────────
  function validate() {
    const errs = {};

    if (!form.name.trim())
      errs.name = "Guest name is required";

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Enter a valid email address";

    if (form.phone && !/^[+\d\s\-()]{7,15}$/.test(form.phone))
      errs.phone = "Enter a valid phone number";

    if (selectedFunctions.size === 0)
      errs.functions = "Select at least one function to invite this guest to";

    return errs;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // handleSubmit
  //
  // Step 1: client-side validate()
  // Step 2: POST /api/weddings/[weddingId]/guests
  //
  // Payload sent:
  // {
  //   name, phone, email, group_tag, dietary, outstation,
  //   function_ids: ["fn_001", "fn_002"]
  // }
  //
  // API is expected to:
  //   INSERT INTO guests          → returns guest.id
  //   INSERT INTO guest_function_invites (guest_id, function_id) for each id
  //   INSERT INTO rsvp_responses  (guest_id, function_id, status="pending") for each id
  //
  // Step 3: on 200/201 → redirect to guest list
  // ─────────────────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setGlobalError("");

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      document.querySelector("[data-first-error]")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/weddings/${weddingId}/guests`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:         form.name.trim(),
          phone:        form.phone.trim(),
          email:        form.email.trim(),
          group_tag:    form.group_tag,
          dietary:      form.dietary,
          outstation:   form.outstation,
          function_ids: [...selectedFunctions],
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Server error (${res.status})`);
      }

      router.push(`/dashboard/${weddingId}/guests`);

    } catch (err) {
      setGlobalError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // ─── RENDER ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-steel hover:text-gray-700 mb-4 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
            Back to Guest List
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Add New Guest</h1>
          <p className="text-sm text-steel mt-1">
            Fill in the details and pick which functions to invite this guest to.
          </p>
        </div>

        {/* Global API error */}
        {globalError && (
          <div className="mb-6 flex items-start gap-2 bg-rose-50 border border-rose-200
            text-rose-700 text-sm rounded-lg px-4 py-3">
            <span className="mt-0.5">⚠️</span>
            <span>{globalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-8">

          {/* ── Section 1: Basic Info ── */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs
                flex items-center justify-center font-bold">1</span>
              Basic Information
            </h2>

            {/* Name */}
            <FormField label="Full Name" required error={errors.name}>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="e.g. Priya Sharma"
                data-first-error={errors.name ? true : undefined}
                className={`px-3 py-2.5 border rounded-lg text-sm
                  focus:ring-2 focus:ring-indigo-400 focus:outline-none transition
                  ${errors.name ? "border-rose-400 bg-rose-50" : "border-gray-300 bg-white"}`}
              />
            </FormField>

            {/* Phone + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Phone Number" error={errors.phone}>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  placeholder="e.g. 9876543210"
                  className={`px-3 py-2.5 border rounded-lg text-sm
                    focus:ring-2 focus:ring-indigo-400 focus:outline-none transition
                    ${errors.phone ? "border-rose-400 bg-rose-50" : "border-gray-300 bg-white"}`}
                />
              </FormField>

              <FormField label="Email Address" error={errors.email}>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  placeholder="e.g. priya@example.com"
                  className={`px-3 py-2.5 border rounded-lg text-sm
                    focus:ring-2 focus:ring-indigo-400 focus:outline-none transition
                    ${errors.email ? "border-rose-400 bg-rose-50" : "border-gray-300 bg-white"}`}
                />
              </FormField>
            </div>
          </section>

          {/* ── Section 2: Guest Details ── */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs
                flex items-center justify-center font-bold">2</span>
              Guest Details
            </h2>

            <SelectField
              label="Group / Side"
              value={form.group_tag}
              onChange={(v) => setField("group_tag", v)}
              placeholder="Select a group…"
              options={GROUP_OPTIONS}
              error={errors.group_tag}
            />

            <SelectField
              label="Dietary Preference"
              value={form.dietary}
              onChange={(v) => setField("dietary", v)}
              placeholder="Select preference…"
              options={DIETARY_OPTIONS}
              error={errors.dietary}
            />

            <div className="pt-1">
              <Toggle
                value={form.outstation}
                onChange={(v) => setField("outstation", v)}
                label="Outstation Guest"
                hint="Travelling from outside the city — may need accommodation info."
              />
            </div>
          </section>

          {/* ── Section 3: Function Invites ── */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs
                  flex items-center justify-center font-bold">3</span>
                Invite to Functions
              </h2>
              {weddingFunctions.length > 1 && (
                <div className="flex gap-3 text-xs">
                  <button type="button"
                    onClick={() => setSelectedFunctions(new Set(weddingFunctions.map((f) => f.id)))}
                    className="text-indigo-600 hover:underline font-medium">
                    Select all
                  </button>
                  <button type="button"
                    onClick={() => setSelectedFunctions(new Set())}
                    className="text-steel hover:underline">
                    Clear
                  </button>
                </div>
              )}
            </div>

            <p className="text-xs text-steel -mt-1">
              A <strong>pending</strong> RSVP response will be seeded for each selected function.
            </p>

            {functionsLoading ? (
              <p className="text-sm text-steel py-4 text-center">Loading functions…</p>
            ) : weddingFunctions.length === 0 ? (
              <p className="text-sm text-steel py-4 text-center">
                No functions found.{" "}
                <a href={`/dashboard/${weddingId}/functions/new`}
                  className="text-indigo-600 underline">Add one first.</a>
              </p>
            ) : (
              <div className="grid gap-2.5">
                {weddingFunctions.map((fn) => (
                  <FunctionCheckbox
                    key={fn.id}
                    fn={fn}
                    checked={selectedFunctions.has(fn.id)}
                    onToggle={toggleFunction}
                  />
                ))}
              </div>
            )}

            {errors.functions && (
              <p className="text-xs text-rose-500 flex items-center gap-1" data-first-error>
                <span>⚠</span> {errors.functions}
              </p>
            )}

            {selectedFunctions.size > 0 && (
              <p className="text-xs text-indigo-600 font-medium">
                ✓ Invited to {selectedFunctions.size} function{selectedFunctions.size > 1 ? "s" : ""}
              </p>
            )}
          </section>

          {/* ── Submit / Cancel ── */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3
                bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400
                text-white font-semibold text-sm rounded-xl transition shadow-sm"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Adding Guest…
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                  </svg>
                  Add Guest
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-white border border-gray-300 text-gray-700
                hover:bg-cream font-semibold text-sm rounded-xl transition"
            >
              Cancel
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
