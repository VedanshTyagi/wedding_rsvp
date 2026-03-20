"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Papa from "papaparse";

function StatusBadge({ status }) {
  const styles = {
    confirmed: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    declined:  "bg-rose-100 text-rose-800 border border-rose-200",
    pending:   "bg-amber-100 text-amber-800 border border-amber-200",
    awaiting:  "bg-slate-100 text-slate-500 border border-slate-200",
  };
  const label = {
    confirmed: "✓ Confirmed",
    declined:  "✗ Declined",
    pending:   "⏳ Pending",
    awaiting:  "— Awaiting",
  };
  const cls = styles[status] ?? styles.awaiting;
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label[status] ?? status}
    </span>
  );
}

/**
 * HeadcountCards
 * One card per function showing confirmed / pending / declined / total counts.
 * Also shows total people coming (guests + plus_ones + children).
 */
function HeadcountCards({ guests, functions }) {
  if (!functions.length || !guests.length) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {functions.map((fn) => {
        const counts = { confirmed: 0, pending: 0, declined: 0, awaiting: 0 };

        // Total people coming = confirmed guests + their plus_ones + children
        let totalPeople = 0;

        for (const guest of guests) {
          const status = guest.rsvp?.[fn] ?? "awaiting";
          counts[status] = (counts[status] ?? 0) + 1;

          if (status === "confirmed") {
            totalPeople += 1; // the guest themselves
            if (guest.plus_one) totalPeople += 1;
            totalPeople += guest.children_count ?? 0;
          }
        }

        const total = guests.length;

        return (
          <div key={fn} className="bg-white rounded-xl border border-sand shadow-sm p-4">
            <p className="text-sm font-bold text-gray-800 mb-3">{fn}</p>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-emerald-600">{counts.confirmed}</p>
                <p className="text-xs text-steel mt-0.5">Confirmed</p>
              </div>
              <div>
                <p className="text-lg font-bold text-amber-500">{counts.pending}</p>
                <p className="text-xs text-steel mt-0.5">Pending</p>
              </div>
              <div>
                <p className="text-lg font-bold text-rose-500">{counts.declined}</p>
                <p className="text-xs text-steel mt-0.5">Declined</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-700">{total}</p>
                <p className="text-xs text-steel mt-0.5">Total</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: total > 0 ? `${(counts.confirmed / total) * 100}%` : "0%" }}
              />
            </div>

            {/* People actually coming including plus ones and children */}
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-steel">
                {total > 0 ? Math.round((counts.confirmed / total) * 100) : 0}% confirmed
              </p>
              <p className="text-xs font-semibold text-indigo-600">
                👥 {totalPeople} people coming
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function GuestsPage({ params }) {
  const { weddingId } = params;

  const [guests, setGuests]                 = useState([]);
  const [functions, setFunctions]           = useState([]);
  const [filterGroup, setFilterGroup]       = useState("");
  const [filterFunction, setFilterFunction] = useState("");
  const [filterStatus, setFilterStatus]     = useState("");
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [importing, setImporting]           = useState(false);
  const [importResult, setImportResult]     = useState(null);
  const fileInputRef                        = useRef(null);

  async function fetchGuests() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/weddings/${weddingId}/guests`);
      if (!res.ok) throw new Error(`Failed to load guests (${res.status})`);
      const data = await res.json();
      setGuests(data.guests ?? []);
      setFunctions(data.functions ?? []);
      if (!filterFunction && data.functions?.length > 0) {
        setFilterFunction(data.functions[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchGuests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weddingId]);

  async function handleCSVImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
      complete: async ({ data: rows, errors: parseErrors }) => {
        if (parseErrors.length > 0) {
          setImportResult({ error: "CSV parse error: " + parseErrors[0].message });
          setImporting(false);
          return;
        }

        const COLUMN_MAP = {
          name:  ["name", "full name", "guest name"],
          email: ["email", "email address"],
          phone: ["phone", "mobile", "contact", "phone number"],
          group: ["group", "side", "family side", "category"],
        };

        function resolveField(row, fieldAliases) {
          for (const alias of fieldAliases) {
            if (row[alias] !== undefined) return row[alias].trim();
          }
          return "";
        }

        const mapped = rows.map((row) => ({
          name:  resolveField(row, COLUMN_MAP.name),
          email: resolveField(row, COLUMN_MAP.email),
          phone: resolveField(row, COLUMN_MAP.phone),
          group: resolveField(row, COLUMN_MAP.group),
        })).filter((g) => g.name);

        try {
          const res = await fetch(`/api/weddings/${weddingId}/guests/import`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ guests: mapped }),
          });
          const result = await res.json();
          setImportResult(result);
          await fetchGuests();
        } catch (err) {
          setImportResult({ error: err.message });
        } finally {
          setImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      },
    });
  }

  const filteredGuests = useMemo(() => {
    return guests.filter((guest) => {
      if (filterGroup && guest.group_tag?.toLowerCase() !== filterGroup.toLowerCase()) {
        return false;
      }
      if (filterStatus && filterFunction) {
        const rsvpForFn = guest.rsvp?.[filterFunction] ?? "awaiting";
        if (rsvpForFn !== filterStatus) return false;
      }
      return true;
    });
  }, [guests, filterGroup, filterFunction, filterStatus]);

  const uniqueGroups = useMemo(() => {
    return [...new Set(guests.map((g) => g.group_tag).filter(Boolean))].sort();
  }, [guests]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Guest List</h1>
          <p className="text-sm text-steel mt-0.5">
            {filteredGuests.length} of {guests.length} guests
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleCSVImport}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-cream disabled:opacity-50 transition"
          >
            {importing ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Importing…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                </svg>
                Import CSV
              </>
            )}
          </button>
        </div>
      </div>

      {/* Headcount Summary Cards */}
      {!loading && !error && (
        <HeadcountCards guests={guests} functions={functions} />
      )}

      {/* Import Toast */}
      {importResult && (
        <div className={`rounded-lg px-4 py-3 text-sm flex items-start gap-2 ${
          importResult.error
            ? "bg-rose-50 text-rose-700 border border-rose-200"
            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
        }`}>
          {importResult.error ? (
            <span>⚠️ {importResult.error}</span>
          ) : (
            <span>
              ✓ Import complete — <strong>{importResult.added}</strong> added,{" "}
              <strong>{importResult.skipped}</strong> skipped
              {importResult.errors > 0 && `, ${importResult.errors} errors`}
            </span>
          )}
          <button className="ml-auto text-current opacity-60 hover:opacity-100"
            onClick={() => setImportResult(null)}>✕</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        >
          <option value="">All Groups</option>
          {uniqueGroups.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        <select
          value={filterFunction}
          onChange={(e) => setFilterFunction(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        >
          <option value="">All Functions</option>
          {functions.map((fn) => (
            <option key={fn} value={fn}>{fn}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          disabled={!filterFunction}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-40"
        >
          <option value="">All Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="declined">Declined</option>
          <option value="awaiting">Awaiting</option>
        </select>

        {(filterGroup || filterStatus) && (
          <button
            onClick={() => { setFilterGroup(""); setFilterStatus(""); }}
            className="px-3 py-2 text-sm text-steel hover:text-gray-700 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-20 text-steel text-sm">Loading guests…</div>
      ) : error ? (
        <div className="text-center py-20 text-rose-500 text-sm">⚠️ {error}</div>
      ) : filteredGuests.length === 0 ? (
        <div className="text-center py-20 text-steel text-sm">No guests match the current filters.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-sand shadow-sm">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-cream">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-navy w-8">#</th>
                <th className="px-4 py-3 text-left font-semibold text-navy">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-navy">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-navy">Phone</th>
                <th className="px-4 py-3 text-left font-semibold text-navy">Group</th>
                {/* NEW COLUMN */}
                <th className="px-4 py-3 text-left font-semibold text-navy">Coming With</th>
                {functions.map((fn) => (
                  <th key={fn}
                    className={`px-4 py-3 text-center font-semibold text-navy ${
                      filterFunction === fn ? "bg-indigo-50 text-indigo-700" : ""
                    }`}>
                    {fn}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {filteredGuests.map((guest, idx) => {
                // Build "Coming With" text
                const comingWith = [];
                if (guest.plus_one) {
                  comingWith.push(guest.plus_one_name || "+1 guest");
                }
                if (guest.children_count > 0) {
                  comingWith.push(
                    `${guest.children_count} child${guest.children_count > 1 ? "ren" : ""}`
                  );
                }

                return (
                  <tr key={guest.id} className="hover:bg-cream transition-colors">
                    <td className="px-4 py-3 text-steel">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{guest.name}</td>
                    <td className="px-4 py-3 text-steel">{guest.email || "—"}</td>
                    <td className="px-4 py-3 text-steel">{guest.phone || "—"}</td>
                    <td className="px-4 py-3">
                      {guest.group_tag ? (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-medium border border-slate-200">
                          {guest.group_tag}
                        </span>
                      ) : "—"}
                    </td>

                    {/* Coming With cell */}
                    <td className="px-4 py-3">
                      {comingWith.length > 0 ? (
                        <div className="flex flex-col gap-0.5">
                          {comingWith.map((item, i) => (
                            <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium border border-indigo-100 w-fit">
                              {item}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-steel">—</span>
                      )}
                    </td>

                    {functions.map((fn) => (
                      <td key={fn} className={`px-4 py-3 text-center ${
                        filterFunction === fn ? "bg-indigo-50/40" : ""
                      }`}>
                        <StatusBadge status={guest.rsvp?.[fn] ?? "awaiting"} />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-steel">
        CSV format: <code className="bg-gray-100 px-1 rounded">Name, Email, Phone, Group</code> — extra columns are ignored.
      </p>
    </div>
  );
}
