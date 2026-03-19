// app/api/crm-sync/route.js
// POST — reads confirmed RSVP counts per function and POSTs to CRM

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CRM_URL = process.env.CRM_WEBHOOK_URL;       // e.g. https://hooks.zapier.com/...
const CRM_API_KEY = process.env.CRM_API_KEY;        // optional auth header for the CRM

// ─── route handler ─────────────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.API_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { weddingId } = body;

    if (!weddingId) {
      return NextResponse.json({ error: "weddingId is required" }, { status: 400 });
    }

    if (!CRM_URL) {
      return NextResponse.json({ error: "CRM_WEBHOOK_URL not configured" }, { status: 500 });
    }

        // 1. fetch confirmed RSVPs grouped by function/event
        // fetch confirmed rsvps
    const { data: rsvps, error: rsvpError } = await supabase
      .from("rsvp_responses")
      .select("id, status, guest_count, dietary_requirements, guest_id, function_id")
      .eq("status", "confirmed");

      if (rsvpError) {
        return NextResponse.json({ error: rsvpError.message }, { status: 500 });
      }

      const guestIds = (rsvps || []).map(r => r.guest_id).filter(Boolean);
      const functionIds = (rsvps || []).map(r => r.function_id).filter(Boolean);

      const { data: guestsData } = await supabase
        .from("guests")
        .select("id, full_name, email, phone")
        .in("id", guestIds);

      const { data: eventsData } = await supabase
        .from("wedding_functions")
        .select("id, name")
        .in("id", functionIds);

      const guestMap = Object.fromEntries((guestsData || []).map(g => [g.id, g]));
      const eventMap2 = Object.fromEntries((eventsData || []).map(e => [e.id, e]));

      const filteredRsvps = (rsvps || []).filter(r => guestMap[r.guest_id]);

      const enrichedRsvps = filteredRsvps.map(r => ({
        ...r,
        guests: guestMap[r.guest_id] || null,
        events: eventMap2[r.function_id] || null,
      }));

    if (rsvpError) {
      return NextResponse.json({ error: rsvpError.message }, { status: 500 });
    }

    // 2. aggregate counts per event/function
    const eventMap = {};
    for (const rsvp of enrichedRsvps) {
      const event = rsvp.events;
      if (!event) continue;

      if (!eventMap[event.id]) {
        eventMap[event.id] = {
          eventId: event.id,
          eventName: event.name,
          eventDate: event.date,
          venue: event.venue,
          confirmedGuests: 0,
          totalHeadcount: 0,
          dietaryRequirements: [],
          guests: [],
        };
      }

      eventMap[event.id].confirmedGuests += 1;
      eventMap[event.id].totalHeadcount += rsvp.guest_count || 1;

      if (rsvp.dietary_requirements) {
        eventMap[event.id].dietaryRequirements.push(rsvp.dietary_requirements);
      }

      if (rsvp.guests) {
        eventMap[event.id].guests.push({
          name: rsvp.guests.full_name,
          email: rsvp.guests.email,
          phone: rsvp.guests.phone,
          headcount: rsvp.guest_count || 1,
          dietary: rsvp.dietary_requirements || null,
        });
      }
    }

    const payload = {
      weddingId,
      syncedAt: new Date().toISOString(),
      coupleNames: process.env.COUPLE_NAMES,
      events: Object.values(eventMap),
      summary: {
        totalEvents: Object.keys(eventMap).length,
        totalConfirmedGuests: Object.values(eventMap).reduce(
          (sum, e) => sum + e.confirmedGuests, 0
        ),
        totalHeadcount: Object.values(eventMap).reduce(
          (sum, e) => sum + e.totalHeadcount, 0
        ),
      },
    };

    // 3. POST to CRM
    const crmHeaders = {
      "Content-Type": "application/json",
      ...(CRM_API_KEY ? { Authorization: `Bearer ${CRM_API_KEY}` } : {}),
    };

    const crmResponse = await fetch(CRM_URL, {
      method: "POST",
      headers: crmHeaders,
      body: JSON.stringify(payload),
    });

    if (!crmResponse.ok) {
      const crmError = await crmResponse.text();
      console.error("[crm-sync] CRM responded with error:", crmError);
      return NextResponse.json(
        { error: "CRM rejected the payload", detail: crmError },
        { status: 502 }
      );
    }

    // 4. log the sync to Supabase so you can see it in the dashboard
    await supabase.from("crm_sync_log").insert({
      wedding_id: weddingId,
      synced_at: new Date().toISOString(),
      payload,
      status: "success",
    });

    return NextResponse.json(
      { success: true, summary: payload.summary, syncedAt: payload.syncedAt },
      { status: 200 }
    );
  } catch (err) {
    console.error("[crm-sync] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
