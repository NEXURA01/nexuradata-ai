import axios from "axios";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase credentials are not configured");
  }

  return createClient(
    supabaseUrl,
    supabaseKey
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

type LeadRecord = {
  phone: string;
  name: string;
  business_name: string;
  business_type: string;
  vertical?: string;
  property_age_years: number;
  address: string;
  city: string;
  postal_code?: string;
  email: string | null;
  score: number;
  intent_signal: string;
  source: string;
  source_detail?: string;
  acquisition_channel?: string;
  consent_status?: string;
  do_not_contact?: boolean;
  metadata?: Record<string, unknown>;
  website?: string;
};

const CAMPAIGN_INDUSTRY_QUERIES: Record<string, string[]> = {
  landscaping: ["landscaping", "lawn care", "garden maintenance"],
  window_washing: ["window cleaning", "window washing", "glass cleaning"],
  moving: ["moving company", "movers", "moving service"],
  junk_removal: ["junk removal", "junk hauling", "debris removal"],
  pressure_washing: ["pressure washing", "power washing", "exterior cleaning"],
  cleaning: ["cleaning service", "commercial cleaning", "office cleaning"],
  property_maintenance: ["property maintenance", "building maintenance", "facility maintenance"],
  handyman: ["handyman", "home repair", "general contractor"],
  painting: ["painting contractor", "painter", "interior painting"],
  roofing: ["roofing contractor", "roofer", "roof repair"],
};

const CONTACT_PAGE_PATHS = [
  "/contact",
  "/contact-us",
  "/contactez-nous",
  "/nous-joindre",
  "/about",
  "/team",
];

const GOOGLE_API_TIMEOUT_MS = Number(process.env.LEADS_GOOGLE_API_TIMEOUT_MS || 8000);
const MAX_PLACES_PER_QUERY = Math.max(3, Number(process.env.LEADS_MAX_PLACES_PER_QUERY || 8));
const WEBSITE_SCRAPE_TIMEOUT_MS = Number(process.env.LEADS_WEBSITE_TIMEOUT_MS || 8000);
const SOURCE_CONCURRENCY = Math.max(1, Number(process.env.LEADS_SOURCE_CONCURRENCY || 4));
const INSERT_CONCURRENCY = Math.max(1, Number(process.env.LEADS_INSERT_CONCURRENCY || 8));

const placeDetailsCache = new Map<string, Promise<GoogleMapsPlace | null>>();
const websiteEmailCache = new Map<string, Promise<string[]>>();

const normalizeUrl = (value: string) => {
  try {
    return new URL(value).toString().replace(/\/$/, "");
  } catch {
    return "";
  }
};

const extractEmailsFromText = (value: string) => {
  const matches = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
  return [...new Set(matches.map((email) => email.trim().toLowerCase()))];
};

const isLikelyPersonalEmail = (value: string) => {
  const localPart = value.split("@")[0] || "";
  return ["gmail", "yahoo", "outlook", "hotmail", "icloud", "live"].some(
    (domain) => value.includes(domain)
  ) || localPart.length < 2;
};

const createLeadKey = ({ email, phone, business_name, city }: Partial<LeadRecord>) => {
  const normalizedEmail = `${email || ""}`.trim().toLowerCase();
  const normalizedPhone = `${phone || ""}`.replace(/\D/g, "");
  const normalizedBusiness = `${business_name || ""}`.trim().toLowerCase();
  const normalizedCity = `${city || ""}`.trim().toLowerCase();

  if (normalizedEmail) {
    return `email:${normalizedEmail}`;
  }

  if (normalizedPhone) {
    return `phone:${normalizedPhone}`;
  }

  return `name:${normalizedBusiness}:${normalizedCity}`;
};

const runWithConcurrency = async <T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
) => {
  const results: R[] = [];
  let index = 0;

  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      results[currentIndex] = await worker(items[currentIndex]);
    }
  });

  await Promise.all(runners);
  return results;
};

async function fetchPlaceDetails(placeId: string, googleMapsApiKey: string) {
  if (!placeDetailsCache.has(placeId)) {
    placeDetailsCache.set(
      placeId,
      axios
        .get("https://maps.googleapis.com/maps/api/place/details/json", {
          timeout: GOOGLE_API_TIMEOUT_MS,
          params: {
            place_id: placeId,
            key: googleMapsApiKey,
            fields:
              "name,formatted_address,international_phone_number,website,url,types,rating",
          },
        })
        .then((response) => response.data?.result || null)
        .catch((error) => {
          console.error(`Place details failed for ${placeId}:`, error);
          return null;
        })
    );
  }

  return placeDetailsCache.get(placeId)!;
}

async function discoverEmailsFromWebsite(websiteUrl?: string) {
  if (!websiteUrl) {
    return [];
  }

  const normalizedWebsite = normalizeUrl(websiteUrl);
  if (!normalizedWebsite) {
    return [];
  }

  if (websiteEmailCache.has(normalizedWebsite)) {
    return websiteEmailCache.get(normalizedWebsite)!;
  }

  const lookupPromise = (async () => {
    const urlsToCheck = [
      normalizedWebsite,
      ...CONTACT_PAGE_PATHS.map((path) => `${normalizedWebsite}${path}`),
    ];
    const emails = new Set<string>();

    for (const url of urlsToCheck) {
      try {
        const response = await axios.get(url, {
          timeout: WEBSITE_SCRAPE_TIMEOUT_MS,
          responseType: "text",
        });
        const body = `${response.data || ""}`;
        for (const email of extractEmailsFromText(body)) {
          if (!isLikelyPersonalEmail(email)) {
            emails.add(email);
          }
        }
        const mailtoMatches = body.match(/mailto:([^"'\s>]+)/gi) || [];
        for (const match of mailtoMatches) {
          const email = match
            .replace(/^mailto:/i, "")
            .split("?")[0]
            .trim()
            .toLowerCase();
          if (email && !isLikelyPersonalEmail(email)) {
            emails.add(email);
          }
        }
      } catch (error) {
        console.error(`Email scrape failed for ${url}:`, error);
      }
    }

    return Array.from(emails);
  })();

  websiteEmailCache.set(normalizedWebsite, lookupPromise);
  return lookupPromise;
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
  const leads: LeadRecord[] = [];
  const seenLeadKeys = new Set<string>();
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
            timeout: GOOGLE_API_TIMEOUT_MS,
            params: {
              query: `${query} in ${city}`,
              key: googleMapsApiKey,
              type: "establishment",
            },
          }
        );

        const places = (response.data.results || []).slice(0, MAX_PLACES_PER_QUERY) as GoogleMapsPlace[];
        const sourced = await runWithConcurrency(places, SOURCE_CONCURRENCY, async (place) => {
          const details = await fetchPlaceDetails(place.place_id, googleMapsApiKey);
          if (!details) {
            return null;
          }

          const phone = details.international_phone_number || place.international_phone_number || null;
          if (!phone) {
            return null;
          }

          const propertyAge = Math.floor(Math.random() * 10) + 1;
          const { score, signal } = scoreProspect(
            {
              place_id: details.place_id || place.place_id,
              name: details.name || place.name,
              formatted_address: details.formatted_address || place.formatted_address,
              international_phone_number: phone || undefined,
              website: details.website || place.website,
              types: details.types || place.types || [],
              rating: details.rating || place.rating,
            },
            propertyAge
          );

          if (score < 6) {
            return null;
          }

          const [addressParts] = `${details.formatted_address || place.formatted_address || ""}`.split(",");

          const lead: LeadRecord = {
            phone: `${phone}`.replace(/\D/g, ""),
            name: details.name || place.name,
            business_name: details.name || place.name,
            business_type: "commercial",
            property_age_years: propertyAge,
            address: addressParts,
            city,
            email: null,
            score,
            intent_signal: signal,
            source: "google_maps",
            website: normalizeUrl(details.website || place.website || ""),
          };

          return lead;
        });

        for (const lead of sourced) {
          if (leads.length >= limit) break;

          if (!lead) {
            continue;
          }

          const leadKey = createLeadKey(lead);
          if (seenLeadKeys.has(leadKey)) {
            continue;
          }

          seenLeadKeys.add(leadKey);
          leads.push(lead);
        }
      } catch (error) {
        console.error(`Error sourcing ${city}:`, error);
      }
    }
  }

  return leads.slice(0, limit);
}

export async function sourceCampaignLeads(
  regions: string[],
  industries: string[],
  limit = 40
): Promise<any[]> {
  const leads: LeadRecord[] = [];
  const seenLeadKeys = new Set<string>();
  const googleMapsApiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!googleMapsApiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY not configured");
  }

  for (const region of regions) {
    for (const industry of industries) {
      if (leads.length >= limit) {
        break;
      }

      const queries = CAMPAIGN_INDUSTRY_QUERIES[industry] || [industry];

      for (const query of queries) {
        if (leads.length >= limit) {
          break;
        }

        try {
          const response = await axios.get(
            "https://maps.googleapis.com/maps/api/place/textsearch/json",
            {
              timeout: GOOGLE_API_TIMEOUT_MS,
              params: {
                query: `${query} in ${region}`,
                key: googleMapsApiKey,
              },
            }
          );

          const places = (response.data.results || []).slice(0, MAX_PLACES_PER_QUERY) as GoogleMapsPlace[];
          const sourced = await runWithConcurrency(places, SOURCE_CONCURRENCY, async (place) => {
            const details = await fetchPlaceDetails(place.place_id, googleMapsApiKey);
            if (!details) {
              return null;
            }

            const phone =
              details.international_phone_number ||
              place.international_phone_number ||
              null;
            if (!phone) {
              return null;
            }

            const website = normalizeUrl(details.website || place.website || "");
            const discoveredEmails = await discoverEmailsFromWebsite(website);
            const primaryEmail = discoveredEmails[0] || null;

            if (!primaryEmail) {
              return null;
            }

            const propertyAge = Math.floor(Math.random() * 10) + 1;
            const { score, signal } = scoreProspect(
              {
                place_id: details.place_id || place.place_id,
                name: details.name || place.name,
                formatted_address:
                  details.formatted_address || place.formatted_address,
                international_phone_number: phone || undefined,
                website: website || undefined,
                types: details.types || place.types || [],
                rating: details.rating || place.rating,
              },
              propertyAge
            );

            if (score < 6) {
              return null;
            }

            const [addressParts] = `${
              details.formatted_address || place.formatted_address || ""
            }`.split(",");

            const lead: LeadRecord = {
              phone: `${phone}`.replace(/\D/g, ""),
              name: details.name || place.name,
              business_name: details.name || place.name,
              business_type: industry,
              vertical: industry,
              property_age_years: propertyAge,
              address: addressParts,
              city: region,
              postal_code: "",
              email: primaryEmail,
              score,
              intent_signal: signal || `${region}_${industry}`,
              source: "google_maps_mailgun",
              source_detail: query,
              acquisition_channel: "google_maps",
              consent_status: "unknown",
              do_not_contact: false,
              metadata: {
                query,
                region,
                industry,
              },
              website,
            };

            return lead;
          });

          for (const lead of sourced) {
            if (leads.length >= limit) {
              break;
            }

            if (!lead) {
              continue;
            }

            const leadKey = createLeadKey(lead);
            if (seenLeadKeys.has(leadKey)) {
              continue;
            }

            seenLeadKeys.add(leadKey);
            leads.push(lead);
          }
        } catch (error) {
          console.error(`Error sourcing ${industry} in ${region}:`, error);
        }
      }
    }
  }

  return leads.slice(0, limit);
}

export async function insertLeadsToSupabase(leads: any[]): Promise<string[]> {
  const supabase = getSupabaseClient();
  const insertedIds: string[] = [];

  await runWithConcurrency(leads, INSERT_CONCURRENCY, async (lead) => {
    try {
      const { data, error } = await supabase
        .from("leads_landscaping")
        .insert([lead])
        .select("id")
        .single();

      if (error && error.code !== "23505") {
        // 23505 = unique violation (already exists)
        console.error("Insert error:", error);
      } else if (data?.id) {
        insertedIds.push(data.id);
      }
    } catch (err) {
      console.error("Insert failed:", err);
    }
  });

  return insertedIds;
}

export async function getLeadsForOutreach(
  limit = 40,
  options: { region?: string; industries?: string[]; createdSince?: string } = {}
): Promise<any[]> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from("leads_landscaping")
    .select("*")
    .in("status", ["new", "contacted"])
    .gte("score", 6)
    .not("email", "is", null)
    .not("phone", "is", null)
    .eq("do_not_contact", false)
    .or("consent_status.is.null,consent_status.neq.opted_out")
    .order("score", { ascending: false })
    .limit(limit);

  if (options.region) {
    query = query.eq("city", options.region);
  }

  if (options.industries && options.industries.length > 0) {
    query = query.in("business_type", options.industries);
  }

  if (options.createdSince) {
    query = query.gte("created_at", options.createdSince);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Fetch error:", error);
    return [];
  }

  return data || [];
}
