#!/usr/bin/env node
/**
 * OpenStreetMap Overpass API Data Center & Warehouse Fetcher
 * ----------------------------------------------------------
 * Queries OpenStreetMap for real-world coordinates of:
 *   1. Data Centers (`telecom=data_center` or `building=data_center`)
 *   2. Look-alike Warehouses / Distribution Centers (`building=warehouse`)
 *
 * Usage:
 *   node scripts/fetch-osm-datacenters.mjs [region]
 *
 * Regions supported out-of-the-box:
 *   - ashburn   (Loudoun County, VA - "Data Center Alley")
 *   - silicon   (Santa Clara / San Jose, CA)
 *   - hillsboro (Hillsboro, OR)
 *   - chicago   (Elk Grove Village, IL)
 *   - dallas    (Dallas / Plano / Richardson, TX)
 */

import fs from 'node:fs';
import path from 'node:path';

const REGIONS = {
  ashburn: {
    name: 'Loudoun County / Ashburn, VA',
    bbox: [38.95, -77.55, 39.08, -77.38], // [south, west, north, east]
  },
  silicon: {
    name: 'Santa Clara / Silicon Valley, CA',
    bbox: [37.35, -122.02, 37.42, -121.92],
  },
  hillsboro: {
    name: 'Hillsboro, OR',
    bbox: [45.51, -122.98, 45.59, -122.85],
  },
  chicago: {
    name: 'Elk Grove Village, IL',
    bbox: [41.97, -88.02, 42.03, -87.93],
  },
  dallas: {
    name: 'Plano / Richardson, TX',
    bbox: [32.96, -96.76, 33.05, -96.64],
  },
  connecticut: {
    name: 'State of Connecticut (Fairfield, New Haven & Hartford Counties)',
    bbox: [40.98, -73.73, 42.05, -71.78],
  },
};

const regionKey = process.argv[2] || 'ashburn';
const region = REGIONS[regionKey] || REGIONS.ashburn;
const [s, w, n, e] = region.bbox;

const overpassQuery = `
[out:json][timeout:30];
(
  node["telecom"="data_center"](${s},${w},${n},${e});
  way["telecom"="data_center"](${s},${w},${n},${e});
  relation["telecom"="data_center"](${s},${w},${n},${e});
  way["building"="data_center"](${s},${w},${n},${e});
  way["building"="warehouse"]["name"](${s},${w},${n},${e});
);
out center tags 100;
`;

async function main() {
  console.log(`📡 Querying OpenStreetMap Overpass API for ${region.name}...`);
  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(overpassQuery)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass API returned HTTP ${response.status}`);
  }

  const data = await response.json();
  const results = (data.elements || []).map((el) => {
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    const tags = el.tags || {};
    const isDataCenter =
      tags.telecom === 'data_center' || tags.building === 'data_center';

    return {
      osmId: `${el.type}/${el.id}`,
      name: tags.name || tags.operator || (isDataCenter ? 'Unnamed Data Center' : 'Industrial Warehouse'),
      operator: tags.operator || tags.brand || 'Unknown Operator',
      isDataCenter,
      subtype: isDataCenter ? 'Colocation / Hyperscale' : 'Distribution / Warehouse',
      lat,
      lng,
      googleMapsSatelliteUrl: `https://www.google.com/maps/@${lat},${lng},18z/data=!3m1!1e3`,
      tags,
    };
  });

  const outFile = path.resolve(process.cwd(), `osm-${regionKey}-facilities.json`);
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2));

  const dcCount = results.filter((r) => r.isDataCenter).length;
  const whCount = results.length - dcCount;
  console.log(`✅ Found ${dcCount} Data Centers and ${whCount} Warehouses in ${region.name}.`);
  console.log(`📄 Saved to ${outFile}`);
}

main().catch((err) => {
  console.error('❌ Error fetching from Overpass API:', err.message);
  process.exit(1);
});
