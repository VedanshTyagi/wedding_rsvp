// app/api/weddings/[weddingId]/crm/route.js
// GET   — load crm_webhook_url, crm_api_key + last sync log
// PATCH — save crm_webhook_url, crm_api_key

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function GET(request, { params }) {
  const { weddingId } = await params;
  const supabase = getClient();

  try {
    const [{ data: wedding, error: wError }, { data: log }] = await Promise.all([
      supabase
        .from("weddings")
        .select("crm_webhook_url, crm_api_key")
        .eq("id", weddingId)
        .single(),
      supabase
        .from("crm_sync_log")
        .select("synced_at, payload, status")
        .eq("wedding_id", weddingId)
        .order("synced_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (wError) throw wError;

    return NextResponse.json({
      crm_webhook_url: wedding?.crm_webhook_url || "",
      crm_api_key:     wedding?.crm_api_key     || "",
      last_sync:       log?.synced_at            || null,
      last_sync_data:  log?.payload?.summary     || null,
    });

  } catch (error) {
    console.error("[GET /crm]", error);
    return NextResponse.json(
      { message: error.message ?? "Failed to load CRM settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  const { weddingId } = await params;
  const supabase = getClient();

  try {
    const { crm_webhook_url, crm_api_key } = await request.json();

    const { error } = await supabase
      .from("weddings")
      .update({ crm_webhook_url, crm_api_key })
      .eq("id", weddingId);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[PATCH /crm]", error);
    return NextResponse.json(
      { message: error.message ?? "Failed to save CRM settings" },
      { status: 500 }
    );
  }
}
