import axios from "axios";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface GoogleMapsPlace {
  place_id: string;
  name: string;
  formatted_address: string;
  international_phone_number?: string;
  website?: string;
  types: string[];
  rating?: number;
}

// Score leads based on intent signals
function scoreProspect(
  place: GoogleMapsPlace,
  propertyAge: number
): { score: number; signal: string } {
  let score = 5;
  let signal = "";

  // Business type signals
  if (
    place.types.includes("commercial_area") ||
    place.types.includes("establishment")
  ) {
    score += 2;
    signal = "commercial_property";
  }

  if (place.types.includes("real_estate_agency")) {
    score += 1;
    signal = "real_estate_business";
  }

  // Property age signal
  if (propertyAge > 5) {
    score += 1;
    signal = "maintenance_due";
  } else if (propertyAge < 2) {
    score += 2;
    signal = "new_property_maintenance";
  }

  // Rating signal (well-maintained business)
  if (place.rating && place.rating >= 4.5) {
    score += 1; // High-value prospect
  }

  return { score: Math.min(score, 10), signal };
}

export async function sourceCitiesLeads(
  cities: string[],
  limit = 40
): Promise<any[]> {
  const leads: any[] = [];
  const googleMapsApiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!googleMapsApiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY not configured");
  }

  const searchQueries = [
    "property management",
    "facility management",
    "business owner",
    "commercial real estate",
    "office building",
  ];

  for (const city of cities) {
    for (const query of searchQueries) {
      if (leads.length >= limit) break;

      try {
        const response = await axios.get(
          "https://maps.googleapis.com/maps/api/place/textsearch/json",
          {
            params: {
              query: `${query} in ${city}`,
              key: googleMapsApiKey,
              type: "establishment",
            },
          }
        );

        for (const place of response.data.results || []) {
          if (leads.length >= limit) break;

          const phone = place.international_phone_number || null;
          if (!phone) continue; // Skip if no phone

          // Estimate property age from establishment type
          const propertyAge = Math.floor(Math.random() * 10) + 1; // Mock: 1-10 years
          const { score, signal } = scoreProspect(place, propertyAge);

          // Only add high-scoring prospects
          if (score >= 6) {
            const [addressParts] = place.formatted_address.split(",");

            leads.push({
              phone: phone.replace(/\D/g, ""), // Clean phone
              name: place.name,
              business_name: place.name,
              business_type: "commercial",
              property_age_years: propertyAge,
              address: addressParts,
              city: city,
              email: null, // Would need additional lookup
              score,
              intent_signal: signal,
              source: "google_maps",
            });
          }
        }
      } catch (error) {
        console.error(`Error sourcing ${city}:`, error);
      }
    }
  }

  return leads.slice(0, limit);
}

export async function insertLeadsToSupabase(leads: any[]): Promise<string[]> {
  const supabase = getSupabaseClient();
  const insertedIds: string[] = [];

  for (const lead of leads) {
    try {
      const { data, error } = await supabase
        .from("leads_landscaping")
        .insert([lead])
        .select("id")
        .single();

      if (error && error.code !== "23505") {
        // 23505 = unique violation (already exists)
        console.error("Insert error:", error);
      } else if (data) {
        insertedIds.push(data.id);
      }
    } catch (err) {
      console.error("Insert failed:", err);
    }
  }

  return insertedIds;
}

export async function getLeadsForOutreach(
  limit = 40
): Promise<any[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("leads_landscaping")
    .select("*")
    .eq("status", "new")
    .gte("score", 6)
    .order("score", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Fetch error:", error);
    return [];
  }

  return data || [];
}
