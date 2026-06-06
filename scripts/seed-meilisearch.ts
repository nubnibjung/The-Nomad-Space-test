/**
 * Seed Meilisearch with listing data.
 * Run:  npx tsx scripts/seed-meilisearch.ts
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_MEILISEARCH_HOST=http://localhost:7700
 *   NEXT_PUBLIC_MEILISEARCH_KEY=masterKey
 */

import { Meilisearch } from "meilisearch";
import { config } from "dotenv";
import { MEILISEARCH_DOCUMENTS } from "../lib/data";

config({ path: ".env.local" });

const host  = process.env.NEXT_PUBLIC_MEILISEARCH_HOST ?? "http://localhost:7700";
const key   = process.env.NEXT_PUBLIC_MEILISEARCH_KEY  ?? "masterKey";
const index = process.env.NEXT_PUBLIC_MEILISEARCH_INDEX ?? "listings";

const fallbackDocuments = [
  {
    id: "lst_001",
    title: "Industrial Loft with 4K Monitor",
    category: "monitors",
    neighborhood: "Saphan Khwai, Bangkok",
    summary: "Standing desk, USB-C dock, 1Gbps fiber",
    amenities: ["4K display", "Type-C dock", "Fiber"],
    price_per_night: 2490,
    rating: 4.94,
    review_count: 148,
    images: [
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=80",
    ],
    _geo: { lat: 13.7932, lng: 100.5486 },
  },
  {
    id: "lst_002",
    title: "Herman Miller Studio near Ari Park",
    category: "ergonomic",
    neighborhood: "Ari, Bangkok",
    summary: "Ergonomic chair, calm daylight, park walk",
    amenities: ["Herman Miller", "Daylight", "Quiet"],
    price_per_night: 2890,
    rating: 4.97,
    review_count: 103,
    images: [
      "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    ],
    _geo: { lat: 13.7794, lng: 100.5448 },
  },
  {
    id: "lst_003",
    title: "Natural Light Designer Loft",
    category: "loft",
    neighborhood: "Pradiphat, Bangkok",
    summary: "High ceiling loft with large inspiration wall",
    amenities: ["Loft", "Moodboard", "Soft light"],
    price_per_night: 3190,
    rating: 4.92,
    review_count: 211,
    images: [
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80",
    ],
    _geo: { lat: 13.789, lng: 100.5388 },
  },
  {
    id: "lst_004",
    title: "Cafe-Connected Sprint Room",
    category: "coffee",
    neighborhood: "Ari Samphan, Bangkok",
    summary: "Private room above a specialty coffee bar",
    amenities: ["Coffee", "Team table", "Late access"],
    price_per_night: 3360,
    rating: 4.89,
    review_count: 86,
    images: [
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80",
    ],
    _geo: { lat: 13.7762, lng: 100.5386 },
  },
  {
    id: "lst_005",
    title: "Silent Coding Cabin with Fiber Net",
    category: "quiet",
    neighborhood: "Phahonyothin, Bangkok",
    summary: "Sound-softened room built for deep work",
    amenities: ["Silent", "Fiber", "Focus"],
    price_per_night: 2180,
    rating: 4.9,
    review_count: 73,
    images: [
      "https://images.unsplash.com/photo-1486946255434-2466348c2166?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80",
    ],
    _geo: { lat: 13.8041, lng: 100.5601 },
  },
  {
    id: "lst_006",
    title: "Podcast Suite with Acoustic Wall",
    category: "podcast",
    neighborhood: "Chatuchak, Bangkok",
    summary: "Mic-ready suite for recording and calls",
    amenities: ["Mic arm", "Acoustic", "Call room"],
    price_per_night: 3050,
    rating: 4.88,
    review_count: 67,
    images: [
      "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=900&q=80",
    ],
    _geo: { lat: 13.8114, lng: 100.5582 },
  },
  {
    id: "lst_007",
    title: "Team Sprint Loft with Whiteboards",
    category: "team",
    neighborhood: "Ari, Bangkok",
    summary: "War-room layout for planning and shipping",
    amenities: ["Whiteboards", "6 seats", "HDMI"],
    price_per_night: 3990,
    rating: 4.93,
    review_count: 122,
    images: [
      "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=900&q=80",
    ],
    _geo: { lat: 13.7821, lng: 100.5392 },
  },
  {
    id: "lst_008",
    title: "Type-C Dock Minimalist Work Loft",
    category: "monitors",
    neighborhood: "Kamphaeng Phet, Bangkok",
    summary: "Plug-and-work studio beside the weekend market",
    amenities: ["USB-C", "Monitor", "Desk lamp"],
    price_per_night: 2640,
    rating: 4.86,
    review_count: 58,
    images: [
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1486946255434-2466348c2166?auto=format&fit=crop&w=900&q=80",
    ],
    _geo: { lat: 13.7972, lng: 100.5461 },
  },
];

const documents = MEILISEARCH_DOCUMENTS.length > 0 ? MEILISEARCH_DOCUMENTS : fallbackDocuments;

async function seed() {
  console.log(`→ Connecting to ${host} …`);
  const client = new Meilisearch({ host, apiKey: key });

  // Verify connection
  try {
    const health = await client.health();
    console.log("✓ Meilisearch healthy:", health.status);
  } catch {
    console.error("✗ Cannot reach Meilisearch. Is Docker running?");
    console.error(`  Expected: ${host}`);
    process.exit(1);
  }

  // Create or update index
  console.log(`→ Upserting ${documents.length} documents into "${index}" …`);
  const task = await client.index(index).addDocuments(documents);
  console.log("  Task enqueued:", task.taskUid);

  // Configure index settings
  await client.index(index).updateSettings({
    filterableAttributes: ["_geo", "category", "price_per_night", "rating"],
    sortableAttributes: ["price_per_night", "rating", "_geo"],
    searchableAttributes: ["title", "category", "neighborhood", "summary", "amenities"],
  });
  console.log("✓ Index settings updated");

  // Wait for indexing task
  await client.tasks.waitForTask(task.taskUid);
  console.log("✓ Documents indexed successfully");

  const stats = await client.index(index).getStats();
  console.log(`✓ Index "${index}" now has ${stats.numberOfDocuments} documents`);
}

seed();
