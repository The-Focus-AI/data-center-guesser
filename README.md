# CLOUD / CUBICLE

**Live:** [artifacts.thefocus.ai/a/hVefaAKoB0E/](https://artifacts.thefocus.ai/a/hVefaAKoB0E/)

Satellite guessing game from [TheFocus.AI](https://thefocus.ai). Two buildings, one question: **which one is a data center?**

Each round is a real facility against a lookalike — a warehouse, office campus, semiconductor fab, cold-storage site, or factory. Imagery is [Esri World Imagery](https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer) (Maxar) in Leaflet. Place-name labels stay off until you turn them on or the round is revealed. The data center is randomly assigned to the left or right side.

## A round

Click either satellite image, or the button under it. You can zoom with the scroll wheel and the on-map zoom, zoom-out, and reset controls. The map does not pan.

| Action | Control |
| --- | --- |
| Choose the left building | Click it, or press `A` / `1` |
| Choose the right building | Click it, or press `B` / `2` |
| Next pair | `Enter` or `Space` |
| Hint | The data center’s clue, before you guess |
| Labels | Place names over the imagery |
| Shuffle | A random data center against a random decoy, using the current filters |
| Close the field guide | `Escape` |

After the guess, both buildings are named. Each pane shows the operator, city, power, footprint, a short summary, the satellite tells, and a Google Maps satellite link. The banner states whether the pick was right, the data-center subtype, a tier benchmark, your rate on that pair, and a comparison lesson.

## Modes

The arena opens on **CT Only (No Hyperscalers)**.

| Mode | What it includes |
| --- | --- |
| CT Only (No Hyperscalers) | Both sites are in Connecticut. Hyperscale and AI supercluster data centers are left out. |
| All US (No Hyperscalers) | Drops the Connecticut limit. Hyperscale and AI supercluster data centers stay out. |
| All US (+ Hyperscalers) | The full pair list, including hyperscale and AI campuses. |

Those two wider modes are named “All US” in the nav. They do not filter to the United States: the rest of the atlas includes a few sites in Europe, Asia, and Australia. A Connecticut pair counts as Connecticut only when both the data center and the decoy are in CT.

If the active filters match no curated pair, the arena falls back to the full pair list. **Shuffle** and **Inspect in Arena** build a one-off matchup from the atlas instead of the curated list, still respecting the Connecticut and hyperscaler filters when they can.

## Field guide

Five comparisons, each with a compute signature and a decoy signature:

1. Rooftop chillers and cooling arrays, versus bare roofs, skylights, or solar.
2. Generator rows, versus truck docks and trailer yards.
3. On-site high-voltage substations, versus a pad-mounted commercial transformer. Semiconductor fabs are the exception: they have substations too.
4. A small parking lot next to a huge building, versus lots and garages sized for a workforce.
5. Crash bollards, double fencing, and no ground-floor windows, versus glass lobbies and open yards.

Accessory server rooms under about 3 MW often sit inside an ordinary office. The tell is a rear generator enclosure or a local cluster of dry coolers, not a campus substation.

## Size and energy taxonomy

Five tiers, from an accessory server room to a campus that can draw a gigawatt. AI superclusters are grouped with hyperscale. Each tier lists power, annual energy, homes-equivalent, grid voltage, footprint, backup generation, cooling, zoning, and the satellite signature. Choosing a tier filters the atlas to those data centers, and each example can be sent to the arena.

| Tier | Power |
| --- | ---: |
| Suspected small-scale server room | 0.5–3 MW |
| Edge / small data hub | 3–15 MW |
| Enterprise data center | 10–65 MW |
| Colocation (COLO) | 15–300+ MW |
| Hyperscale and AI supercluster | 100–1,000+ MW |

The page also shows how those figures are derived: annual energy from MW at an 0.85 load factor (DOE / Lawrence Berkeley National Lab 2024), homes from EIA residential use (~10,500 kWh/yr), generator count times roughly 2.5 MW, and the jump from 13.8 kV distribution to a 69–115 kV+ substation once a site is past about 15 MW.

Provenance is split three ways. Colocation and hyperscale figures come from operator materials, filings, and interconnection records. Enterprise figures, including several Connecticut sites, come from footprints, substations, and generator air permits. Suspected small server rooms are engineering estimates from rooftop cooling and one or two generator pads.

## Atlas

The directory lists every site: name, operator, city, subtype, difficulty, power, footprint, coordinates, summary, and the first two satellite tells. Search matches name, operator, city, state, and subtype.

Filters: Connecticut only, no hyperscalers, suspected small-scale server rooms, compute versus decoy, subtype, and difficulty (easy, medium, hard). **Inspect in Arena** pairs that site with a random opponent of the opposite type. **Sat view** opens Google Maps satellite.

## Accuracy

Your score stays in this browser (`localStorage` key `thefocus_dc_recon_analytics_v1`). The accuracy view shows overall percent, a 62% non-hyperscaler benchmark, your rate by subtype against the tier baselines below, and your rate on each pair you have played. Reset clears only the local store.

| Subtype | Baseline right-answer rate |
| --- | ---: |
| Hyperscale | 84% |
| Colocation (COLO) | 74% |
| Enterprise data center | 69% |
| AI supercluster | 66% |
| Edge / small data hub | 58% |
| Suspected small-scale server room | 46% |

Each guess also sends a Plausible `Guess` event on `artifacts.thefocus.ai`, with `result`, `pair_id`, `dc_name`, `dc_subtype`, `decoy_name`, `decoy_subtype`, `picked_facility`, `difficulty`, and `region` (`Connecticut` or `US / Global`).

## Catalog

Sites and curated pairs are in `src/data/facilities.ts`, which appends `src/data/expandedFacilities.ts`. Each site has coordinates, a default zoom, subtype, difficulty, visual tells, a clue, and a summary. Each curated pair adds a title and a comparison lesson.

| | Count |
| --- | ---: |
| Sites | 257 |
| Data centers | 141 |
| Lookalike sites | 116 |
| Curated pairs | 44 |
| Connecticut sites | 63 (36 data centers, 27 decoys) |

Data centers: 47 colocation, 30 hyperscale, 30 enterprise, 15 edge, 13 suspected small-scale server rooms, 6 AI superclusters.

Lookalikes: 35 distribution / fulfillment, 32 corporate office / campus, 19 cold storage, 17 EV / aerospace manufacturing, 13 semiconductor fabs.

`scripts/fetch-osm-datacenters.mjs` queries the OpenStreetMap Overpass API for `telecom=data_center`, `building=data_center`, and named warehouses. It writes `osm-<region>-facilities.json` and is not loaded by the app.

```bash
node scripts/fetch-osm-datacenters.mjs ashburn
```

Regions: `ashburn`, `silicon`, `hillsboro`, `chicago`, `dallas`, `connecticut`. The default is `ashburn`.

## Develop

React, TypeScript, Vite, and Tailwind. Vite `base` is `./`, so the production build can be hosted under a path such as the live artifact URL.

```bash
pnpm install
pnpm dev       # local dev server
pnpm build     # typecheck and production build
pnpm preview   # serve the production build
pnpm lint      # oxlint
```
