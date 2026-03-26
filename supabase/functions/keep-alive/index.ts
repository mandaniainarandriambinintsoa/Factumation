import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data, error } = await supabase.from("invoices").select("id").limit(1);

  return new Response(
    JSON.stringify({
      status: "alive",
      timestamp: new Date().toISOString(),
      db: error ? "error" : "ok",
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
});
