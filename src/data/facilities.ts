import { EXPANDED_FACILITY_LOCATIONS, EXPANDED_CURATED_PAIRS } from './expandedFacilities';

export type DataCenterSubtype =
  | 'Hyperscale'
  | 'Colocation (COLO)'
  | 'Enterprise Data Center'
  | 'Edge / Small Data Hub'
  | 'Suspected Small-Scale Server Room'
  | 'AI Supercluster';

export type DecoySubtype =
  | 'Corporate Office / Campus'
  | 'Distribution / Fulfillment Center'
  | 'Semiconductor Fab / Cleanroom'
  | 'Cold Storage Logistics'
  | 'EV / Aerospace Manufacturing';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface FacilityLocation {
  id: string;
  name: string;
  operator: string;
  city: string;
  stateOrCountry: string;
  lat: number;
  lng: number;
  defaultZoom: number;
  isDataCenter: boolean;
  subtype: DataCenterSubtype | DecoySubtype;
  difficulty: DifficultyLevel;
  powerCapacityMW?: string;
  sqft?: string;
  visualTells: string[];
  summary: string;
  clue: string;
}

export interface FacilityPair {
  id: string;
  title: string;
  difficulty: DifficultyLevel;
  categoryTag: string;
  comparisonLesson: string;
  dataCenter: FacilityLocation;
  decoy: FacilityLocation;
}

export const FACILITY_LOCATIONS: FacilityLocation[] = [
  // ==========================================
  // DATA CENTERS (24 Real Verified Locations)
  // ==========================================
  {
    id: 'dc-equinix-ashburn',
    name: 'Equinix Ashburn Campus (DC1–DC15)',
    operator: 'Equinix',
    city: 'Ashburn',
    stateOrCountry: 'VA, USA',
    lat: 39.0163,
    lng: -77.4590,
    defaultZoom: 17,
    isDataCenter: true,
    subtype: 'Colocation (COLO)',
    difficulty: 'easy',
    powerCapacityMW: '180+ MW Campus',
    sqft: '1,200,000+ sq ft',
    visualTells: [
      'Dense rows of rooftop closed-loop HVAC chillers covering every building roof',
      'Dedicated rows of diesel backup generator enclosures along the building perimeters',
      'Very small employee parking lots despite massive square footage',
      'Minimal windows and zero tractor-trailer shipping bays'
    ],
    summary: 'Located in the heart of "Data Center Alley" in Loudoun County, Virginia, where up to 70% of the world’s internet traffic flows through dense fiber interconnects.',
    clue: 'Look closely at the roof load and the perimeter yards—notice what is lined up instead of semi-truck trailers.'
  },
  {
    id: 'dc-google-council-bluffs',
    name: 'Google Council Bluffs Data Center',
    operator: 'Google',
    city: 'Council Bluffs',
    stateOrCountry: 'IA, USA',
    lat: 41.1965,
    lng: -95.8296,
    defaultZoom: 16,
    isDataCenter: true,
    subtype: 'Hyperscale',
    difficulty: 'easy',
    powerCapacityMW: '400+ MW',
    sqft: '2,500,000+ sq ft',
    visualTells: [
      'Massive high-voltage electrical substation wired directly into the campus',
      'Long, modular server hall wings with external evaporative cooling towers',
      'Retention ponds used for thermal water management',
      'Double-fenced security perimeter with guardhouse entry'
    ],
    summary: 'One of Google’s largest hyperscale cloud campuses globally, powered heavily by Iowa wind energy and housing hundreds of thousands of custom TPU/CPU racks.',
    clue: 'Check the adjacent high-voltage electrical infrastructure and repeating modular cooling arrays along the spines of the halls.'
  },
  {
    id: 'dc-meta-prineville',
    name: 'Meta Prineville Data Center Campus',
    operator: 'Meta (Facebook)',
    city: 'Prineville',
    stateOrCountry: 'OR, USA',
    lat: 44.2946,
    lng: -120.8920,
    defaultZoom: 16,
    isDataCenter: true,
    subtype: 'Hyperscale',
    difficulty: 'easy',
    powerCapacityMW: '350+ MW',
    sqft: '4,600,000 sq ft',
    visualTells: [
      'Long narrow H-shaped and rectangular buildings with continuous rooftop air-handling units (penthouse louvers)',
      'Dedicated on-site high-voltage power substations at the campus edge',
      'Virtually no passenger car parking relative to building footprint',
      'No loading dock aprons for 18-wheelers'
    ],
    summary: 'Meta’s flagship Open Compute Project (OCP) hyperscale campus in the high desert of Oregon, using outside air economization for cooling.',
    clue: 'Notice the elongated building proportions and the huge rooftop penthouse air handlers running the full spine.'
  },
  {
    id: 'dc-switch-citadel',
    name: 'Switch The Citadel Campus (TAHOE RENO 1)',
    operator: 'Switch',
    city: 'McCarran (Reno)',
    stateOrCountry: 'NV, USA',
    lat: 39.5469,
    lng: -119.4730,
    defaultZoom: 16,
    isDataCenter: true,
    subtype: 'Colocation (COLO)',
    difficulty: 'medium',
    powerCapacityMW: '130–650 MW Planned',
    sqft: '1,300,000 sq ft (Single Building)',
    visualTells: [
      'Custom-patented T-SCIF external HVAC cooling units lining the entire exterior walls like gills',
      '200-mph wind-rated concrete walls and military-grade perimeter security berms',
      'Dedicated 180 MW substation directly beside the facility'
    ],
    summary: 'One of the largest Tier IV colocation data center buildings in the world, located in the Tahoe Reno Industrial Center right next to Tesla Gigafactory.',
    clue: 'Look at the exterior side walls—hundreds of identical external mechanical units project outward around the entire perimeter.'
  },
  {
    id: 'dc-qts-atlanta',
    name: 'QTS Atlanta-Metro Mega Data Center',
    operator: 'QTS Realty Trust',
    city: 'Atlanta',
    stateOrCountry: 'GA, USA',
    lat: 33.7192,
    lng: -84.4262,
    defaultZoom: 17,
    isDataCenter: true,
    subtype: 'Colocation (COLO)',
    difficulty: 'medium',
    powerCapacityMW: '100+ MW',
    sqft: '990,000 sq ft',
    visualTells: [
      'On-site Georgia Power substation embedded directly into the property',
      'Massive chiller yards and generator banks tucked into side courtyards',
      'Windowless hardened concrete structure with multi-layer vehicle crash barriers'
    ],
    summary: 'Originally built as a massive printing plant and converted into one of the largest enterprise and hyperscale colocation facilities in the US Southeast.',
    clue: 'Spot the high-voltage electrical yard feeding directly into the building footprint and the dense mechanical yards.'
  },
  {
    id: 'dc-google-thedalles',
    name: 'Google The Dalles Data Center',
    operator: 'Google',
    city: 'The Dalles',
    stateOrCountry: 'OR, USA',
    lat: 45.6321,
    lng: -121.2015,
    defaultZoom: 17,
    isDataCenter: true,
    subtype: 'Hyperscale',
    difficulty: 'easy',
    powerCapacityMW: '200+ MW',
    sqft: '750,000+ sq ft',
    visualTells: [
      'Large plume-emitting cooling tower banks with giant circular fans visible from orbit',
      'Direct proximity to Columbia River hydroelectric transmission lines',
      'Heavy security fencing and pipe bridges connecting cooling plants to server halls'
    ],
    summary: 'Google’s very first custom-built hyperscale data center (2006), sited along the Columbia River to tap cheap hydroelectric power.',
    clue: 'Look for the row of large circular cooling tower fans and industrial piping bridges.'
  },
  {
    id: 'dc-aws-boardman',
    name: 'AWS US-West (Oregon) Data Center',
    operator: 'Amazon Web Services (AWS)',
    city: 'Boardman',
    stateOrCountry: 'OR, USA',
    lat: 45.8404,
    lng: -119.6562,
    defaultZoom: 17,
    isDataCenter: true,
    subtype: 'Hyperscale',
    difficulty: 'medium',
    powerCapacityMW: '150+ MW',
    sqft: '600,000 sq ft',
    visualTells: [
      'Identical side-by-side rectangular halls with synchronized generator pads on one flank',
      'Dedicated electrical substation on the corner of the parcel',
      'Zero truck docks—only small security checkpoints and equipment airlocks'
    ],
    summary: 'Part of AWS’s core us-west-2 availability zone region in Eastern Oregon.',
    clue: 'Notice the repeating parallel buildings with identical external generator and chiller yards on their sides.'
  },
  {
    id: 'dc-microsoft-quincy',
    name: 'Microsoft Columbia Data Center',
    operator: 'Microsoft Azure',
    city: 'Quincy',
    stateOrCountry: 'WA, USA',
    lat: 47.2468,
    lng: -119.8732,
    defaultZoom: 16,
    isDataCenter: true,
    subtype: 'Hyperscale',
    difficulty: 'easy',
    powerCapacityMW: '300+ MW',
    sqft: '1,500,000+ sq ft',
    visualTells: [
      'Dozens of modular "Generation 4/5" data halls arranged in neat military-style grids',
      'Massive array of backup diesel generators and electrical switchgear lining every module',
      'Two dedicated utility substations feeding the campus'
    ],
    summary: 'A major Microsoft Azure cloud hub in Central Washington powered by Grant County PUD hydroelectricity.',
    clue: 'Look at the regimented grid of narrow data halls and two on-site utility substations.'
  },
  {
    id: 'dc-nsa-utah',
    name: 'Utah Data Center (Intelligence Community Comprehensive National Cybersecurity Initiative)',
    operator: 'U.S. National Security Agency (NSA)',
    city: 'Bluffdale',
    stateOrCountry: 'UT, USA',
    lat: 40.4278,
    lng: -111.9333,
    defaultZoom: 16,
    isDataCenter: true,
    subtype: 'Enterprise Data Center',
    difficulty: 'easy',
    powerCapacityMW: '65 MW',
    sqft: '1,500,000 sq ft',
    visualTells: [
      'Four identical data halls flanked by massive chilled-water plants and rows of backup fuel tanks',
      'Extreme standoff perimeter security, vehicle traps, and patrol roads',
      'Massive dedicated substation and tiered hillside retaining walls'
    ],
    summary: 'A flagship U.S. federal enterprise/intelligence data center designed for exabyte-scale signal processing and cybersecurity.',
    clue: 'Notice the four symmetrical wings connected to central chiller plants and an unmistakable fortified security perimeter.'
  },
  {
    id: 'dc-coreweave-plano',
    name: 'CoreWeave / Digital Realty Plano AI Hub',
    operator: 'Digital Realty / CoreWeave',
    city: 'Plano',
    stateOrCountry: 'TX, USA',
    lat: 33.0145,
    lng: -96.6789,
    defaultZoom: 17,
    isDataCenter: true,
    subtype: 'AI Supercluster',
    difficulty: 'medium',
    powerCapacityMW: '64 MW',
    sqft: '400,000 sq ft',
    visualTells: [
      'Roof packed edge-to-edge with high-density liquid-to-air heat rejection units',
      'Screened generator yards running the entire length of the rear wall',
      'Suburban business park setting where neighbors have windowed offices, while this building is solid precast concrete'
    ],
    summary: 'High-density GPU colocation facility retrofitted to handle liquid-cooled NVIDIA H100/B200 AI training clusters.',
    clue: 'Compare the roof density here with neighboring suburban buildings—every square foot of the roof is covered in cooling gear.'
  },
  {
    id: 'dc-xai-colossus-memphis',
    name: 'xAI "Colossus" Supercluster Facility',
    operator: 'xAI',
    city: 'Memphis',
    stateOrCountry: 'TN, USA',
    lat: 35.0605,
    lng: -90.0888,
    defaultZoom: 17,
    isDataCenter: true,
    subtype: 'AI Supercluster',
    difficulty: 'hard',
    powerCapacityMW: '150+ MW',
    sqft: '785,000 sq ft',
    visualTells: [
      'Repurposed industrial manufacturing facility surrounded by dozens of mobile natural gas turbines and Tesla Megapack batteries',
      'Temporary and permanent modular chiller banks filling the former truck yards',
      'Direct adjacent substation expansion'
    ],
    summary: 'Formerly an Electrolux appliance factory, rapidly converted into the world’s largest 100,000+ H100 GPU AI training supercluster.',
    clue: 'Look in the yard around the building: instead of shipping trailers, the concrete pads are packed with portable power turbines, Megapacks, and modular chillers.'
  },
  {
    id: 'dc-digital-realty-santa-clara',
    name: 'Digital Realty SJC Campus (Space Park)',
    operator: 'Digital Realty',
    city: 'Santa Clara',
    stateOrCountry: 'CA, USA',
    lat: 37.3765,
    lng: -121.9602,
    defaultZoom: 18,
    isDataCenter: true,
    subtype: 'Colocation (COLO)',
    difficulty: 'medium',
    powerCapacityMW: '80+ MW',
    sqft: '650,000 sq ft',
    visualTells: [
      'Multi-story urban infill buildings with entire roofs dedicated to tightly packed cooling towers',
      'Minimal street-level windows and heavy steel equipment louvers',
      'Silicon Valley Municipal Power (SVP) substations right across the street'
    ],
    summary: 'Silicon Valley’s premier colocation hub in Santa Clara, taking advantage of municipal utility rates lower than PG&E.',
    clue: 'In a dense Silicon Valley office park, look for the roof that has zero skylights or solar panels—only wall-to-wall industrial chillers.'
  },
  {
    id: 'dc-vantage-santa-clara',
    name: 'Vantage Data Centers Santa Clara Campus',
    operator: 'Vantage Data Centers',
    city: 'Santa Clara',
    stateOrCountry: 'CA, USA',
    lat: 37.3725,
    lng: -121.9540,
    defaultZoom: 18,
    isDataCenter: true,
    subtype: 'Colocation (COLO)',
    difficulty: 'medium',
    powerCapacityMW: '77 MW',
    sqft: '520,000 sq ft',
    visualTells: [
      'Dedicated private electrical substation sitting directly on the corner of Walsh Ave',
      'Multi-story buildings with dense rooftop mechanical penthouses',
      'Tiny parking lot for a multi-building campus'
    ],
    summary: 'High-density wholesale colocation campus serving major cloud and AI tenants in the heart of Silicon Valley.',
    clue: 'Look for the private electrical substation tucked right onto the campus corner alongside multi-story rooftop cooling banks.'
  },
  {
    id: 'dc-coresite-la1-one-wilshire',
    name: 'One Wilshire & CoreSite LA2 Carrier Hotel',
    operator: 'CoreSite / GI Partners',
    city: 'Los Angeles',
    stateOrCountry: 'CA, USA',
    lat: 34.0537,
    lng: -118.2348,
    defaultZoom: 18,
    isDataCenter: true,
    subtype: 'Edge / Small Data Hub',
    difficulty: 'hard',
    powerCapacityMW: '35 MW',
    sqft: '424,000 sq ft',
    visualTells: [
      'Urban industrial building whose roof is completely covered in cooling towers, satellite dishes, and exhaust flues',
      'Large emergency generator fuel belly-tank vents and mechanical louvers along the facade',
      'Almost no cars in the gated lot despite being a massive downtown building'
    ],
    summary: 'CoreSite LA2 is one of the highest-density urban interconnection and edge hubs in Southern California, linking trans-Pacific undersea cables to cloud providers.',
    clue: 'Even in an urban neighborhood, look at the roof: dozens of heavy HVAC chillers and generator exhaust stacks instead of a plain flat roof.'
  },
  {
    id: 'dc-cyxtera-elk-grove',
    name: 'CyrusOne / T5 Chicago Data Center Campus',
    operator: 'T5 / CyrusOne',
    city: 'Elk Grove Village',
    stateOrCountry: 'IL, USA',
    lat: 42.0086,
    lng: -87.9718,
    defaultZoom: 17,
    isDataCenter: true,
    subtype: 'Colocation (COLO)',
    difficulty: 'medium',
    powerCapacityMW: '90 MW',
    sqft: '500,000 sq ft',
    visualTells: [
      'Surrounded by normal warehouses with 18-wheeler docks, yet this parcel has zero semi-trailers and a ComEd substation right next door',
      'Symmetrical rooftop chiller arrays arranged in neat rows',
      'Black security fencing with biometric vehicle gates'
    ],
    summary: 'Elk Grove Village is an industrial park outside O’Hare Airport that transformed from logistics warehouses into one of North America’s hottest COLO markets.',
    clue: 'Compare the perimeter with neighboring buildings: one has 18-wheeler loading bays, while the data center has generator enclosures and rooftop chillers.'
  },
  {
    id: 'dc-switch-las-vegas',
    name: 'Switch Core Campus (LAS VEGAS)',
    operator: 'Switch',
    city: 'Las Vegas',
    stateOrCountry: 'NV, USA',
    lat: 36.0628,
    lng: -115.2117,
    defaultZoom: 16,
    isDataCenter: true,
    subtype: 'Colocation (COLO)',
    difficulty: 'easy',
    powerCapacityMW: '315 MW',
    sqft: '2,400,000 sq ft',
    visualTells: [
      'Signature bright silver reflective roofs flanked by hundreds of external red/gray modular HVAC units',
      'Walled fortress perimeter with armed guard checkpoints',
      'High-density electrical yard with multiple redundant transformer banks'
    ],
    summary: 'Switch’s flagship Las Vegas SuperNAP colocation ecosystem serving over 900 enterprise and cloud clients.',
    clue: 'Look for the distinctive external HVAC modules lining the long sides of the buildings like radiator fins.'
  },
  {
    id: 'dc-apple-maiden',
    name: 'Apple Maiden iCloud Data Center',
    operator: 'Apple',
    city: 'Maiden',
    stateOrCountry: 'NC, USA',
    lat: 35.5880,
    lng: -81.2580,
    defaultZoom: 16,
    isDataCenter: true,
    subtype: 'Enterprise Data Center',
    difficulty: 'easy',
    powerCapacityMW: '100+ MW',
    sqft: '500,000+ sq ft',
    visualTells: [
      'Bright white cool-roof membrane with centralized chilled water loops',
      'Massive adjacent solar farm and biogas fuel cell installation right across the road',
      'Dedicated high-voltage Duke Energy substation at the entrance'
    ],
    summary: 'Apple’s primary East Coast iCloud enterprise data center, famous for its massive on-site solar arrays and Bloom Energy fuel cell farm.',
    clue: 'Notice the combination of a huge high-voltage substation, biogas fuel cells, and bright white cool-roof halls with almost no parking.'
  },
  {
    id: 'dc-meta-lulea',
    name: 'Meta Luleå Arctic Data Center',
    operator: 'Meta (Facebook)',
    city: 'Luleå',
    stateOrCountry: 'Sweden',
    lat: 65.6167,
    lng: 22.1264,
    defaultZoom: 16,
    isDataCenter: true,
    subtype: 'Hyperscale',
    difficulty: 'medium',
    powerCapacityMW: '120 MW',
    sqft: '900,000 sq ft',
    visualTells: [
      'Long rectangular halls nestled in sub-Arctic pine forest using direct Nordic air cooling',
      'Continuous rooftop air intake penthouses and side generator compounds',
      'Almost zero cars or trucks around a massive three-building complex'
    ],
    summary: 'Meta’s first European data center, located just 70 miles south of the Arctic Circle to use sub-freezing Nordic air for free cooling.',
    clue: 'Three massive elongated halls tucked into the forest with rooftop air-handling penthouses and no shipping yards.'
  },
  {
    id: 'dc-google-eemshaven',
    name: 'Google Eemshaven Data Center',
    operator: 'Google',
    city: 'Eemshaven',
    stateOrCountry: 'Netherlands',
    lat: 53.4281,
    lng: 6.8439,
    defaultZoom: 16,
    isDataCenter: true,
    subtype: 'Hyperscale',
    difficulty: 'medium',
    powerCapacityMW: '200+ MW',
    sqft: '1,100,000 sq ft',
    visualTells: [
      'Distinctive modular server buildings flanked by rows of cooling towers and electrical transformers',
      'Situated right next to subsea cable landing stations and North Sea wind farm substations',
      'Double security fencing with water moat perimeter'
    ],
    summary: 'A major European Google Cloud hub positioned at the landing point of transatlantic fiber cables and offshore North Sea wind power.',
    clue: 'Look for the water moat security perimeter and the rows of cooling towers lined up alongside the server halls.'
  },
  {
    id: 'dc-equinix-frankfurt',
    name: 'Equinix Frankfurt FR5 / Kleyerstraße Campus',
    operator: 'Equinix',
    city: 'Frankfurt',
    stateOrCountry: 'Germany',
    lat: 50.1008,
    lng: 8.6315,
    defaultZoom: 18,
    isDataCenter: true,
    subtype: 'Colocation (COLO)',
    difficulty: 'hard',
    powerCapacityMW: '45 MW',
    sqft: '320,000 sq ft',
    visualTells: [
      'Dense urban building with every square meter of roof space occupied by dry coolers and chillers',
      'External steel pipework and backup generator exhaust stacks climbing the building exterior',
      'Gated security sally-port entry'
    ],
    summary: 'Home to DE-CIX, one of the largest internet exchange points in the world by peak traffic throughput.',
    clue: 'In this dense German commercial district, look at the roof packed tightly with white heat-rejection fans.'
  },
  {
    id: 'dc-flexential-hillsboro',
    name: 'Flexential / Stack Hillsboro Data Center',
    operator: 'Flexential / STACK',
    city: 'Hillsboro',
    stateOrCountry: 'OR, USA',
    lat: 45.5562,
    lng: -122.9125,
    defaultZoom: 17,
    isDataCenter: true,
    subtype: 'Colocation (COLO)',
    difficulty: 'medium',
    powerCapacityMW: '72 MW',
    sqft: '450,000 sq ft',
    visualTells: [
      'Roof lined with symmetrical arrays of indirect evaporative cooling units',
      'Walled equipment yard on the side holding dozens of green/gray backup diesel generators',
      'Tiny visitor parking lot in front'
    ],
    summary: 'Hillsboro, Oregon is the West Coast’s premier low-latency gateway to Asia-Pacific subsea fiber cables.',
    clue: 'Notice the walled-off side yard full of identical backup generators and the sparse parking lot.'
  },
  {
    id: 'dc-tierpoint-spokane',
    name: 'TierPoint Regional Edge Data Hub',
    operator: 'TierPoint',
    city: 'Spokane',
    stateOrCountry: 'WA, USA',
    lat: 47.6845,
    lng: -117.1965,
    defaultZoom: 18,
    isDataCenter: true,
    subtype: 'Edge / Small Data Hub',
    difficulty: 'hard',
    powerCapacityMW: '6 MW',
    sqft: '45,000 sq ft',
    visualTells: [
      'Compact regional building with disproportionate rooftop HVAC density compared to neighboring offices',
      'Fenced pad containing 3 large Caterpillar diesel generators and liquid fuel tanks',
      'Windowless tilt-up concrete walls'
    ],
    summary: 'A classic regional enterprise/edge colocation hub serving healthcare, banking, and local cloud workloads in the Inland Northwest.',
    clue: 'Even on a small suburban footprint, spot the fenced generator pad and heavy rooftop chillers vs. normal office roofs.'
  },
  {
    id: 'dc-jpmorgan-delaware',
    name: 'JPMorgan Chase Enterprise Data Center',
    operator: 'JPMorgan Chase',
    city: 'Newark',
    stateOrCountry: 'DE, USA',
    lat: 39.6644,
    lng: -75.7161,
    defaultZoom: 17,
    isDataCenter: true,
    subtype: 'Enterprise Data Center',
    difficulty: 'hard',
    powerCapacityMW: '30 MW',
    sqft: '250,000 sq ft',
    visualTells: [
      'Large chilled-water plant and thermal energy storage tanks right behind the main hall',
      'Redundant 2N electrical yards on opposite sides of the building',
      'Heavy perimeter bollard protection and security gatehouse'
    ],
    summary: 'A Tier IV enterprise banking data center built with dual active-active power paths to process global financial transactions.',
    clue: 'Look for the twin electrical yards on opposite sides of the building (2N redundancy) and minimal parking.'
  },
  {
    id: 'dc-aws-ashburn-loudoun',
    name: 'AWS IAD East Data Center Cluster',
    operator: 'Amazon Web Services (AWS)',
    city: 'Sterling',
    stateOrCountry: 'VA, USA',
    lat: 39.0042,
    lng: -77.4291,
    defaultZoom: 17,
    isDataCenter: true,
    subtype: 'Hyperscale',
    difficulty: 'medium',
    powerCapacityMW: '120 MW',
    sqft: '680,000 sq ft',
    visualTells: [
      'Two-story precast concrete boxes with zero windows and screened mechanical equipment yards',
      'Row of 20+ backup generators tucked behind acoustic screen walls',
      'Almost empty parking lot between giant industrial buildings'
    ],
    summary: 'Part of AWS’s flagship us-east-1 region in Northern Virginia, designed to blend into suburban business parks with acoustic walls.',
    clue: 'Look behind the acoustic screen walls hugging the building—those are rows of 3 MW diesel generators, not truck docks.'
  },

  // ==========================================
  // DECOY BUILDINGS (24 Real Verified Locations)
  // ==========================================
  {
    id: 'decoy-amazon-ont8',
    name: 'Amazon ONT8 Fulfillment Center',
    operator: 'Amazon Logistics',
    city: 'Moreno Valley',
    stateOrCountry: 'CA, USA',
    lat: 33.8961,
    lng: -117.2464,
    defaultZoom: 16,
    isDataCenter: false,
    subtype: 'Distribution / Fulfillment Center',
    difficulty: 'easy',
    sqft: '1,200,000 sq ft',
    visualTells: [
      'Hundreds of 53-foot semi-trailers backed into loading docks along both long sides of the building',
      'Massive employee parking lot holding 1,500+ passenger cars for warehouse shifts',
      'Clean white roof with skylights and minimal small packaged RTU air conditioners (no heavy chiller banks)'
    ],
    summary: 'A massive e-commerce fulfillment center where thousands of workers and robots pick, pack, and ship consumer packages onto 18-wheelers.',
    clue: 'Count the 18-wheeler trailers lined up along the perimeter and the giant employee parking lot.'
  },
  {
    id: 'decoy-ups-worldport',
    name: 'UPS Centennial Ground Sorting Hub',
    operator: 'UPS',
    city: 'Hodgkins (Chicago)',
    stateOrCountry: 'IL, USA',
    lat: 41.7586,
    lng: -87.8689,
    defaultZoom: 16,
    isDataCenter: false,
    subtype: 'Distribution / Fulfillment Center',
    difficulty: 'easy',
    sqft: '1,500,000 sq ft',
    visualTells: [
      'Sawtooth loading dock bays with hundreds of brown package trailers docked side-by-side',
      'Expansive trailer marshaling yards surrounding the entire building',
      'Zero rooftop chillers or electrical substations'
    ],
    summary: 'One of the largest ground package sorting facilities in the world, processing millions of parcels per day via conveyor belts.',
    clue: 'The entire building perimeter is one continuous dock for semi-truck trailers.'
  },
  {
    id: 'decoy-target-dc-midlothian',
    name: 'Target Regional Distribution Center',
    operator: 'Target Corporation',
    city: 'Midlothian',
    stateOrCountry: 'TX, USA',
    lat: 32.4958,
    lng: -96.9589,
    defaultZoom: 16,
    isDataCenter: false,
    subtype: 'Distribution / Fulfillment Center',
    difficulty: 'medium',
    sqft: '1,400,000 sq ft',
    visualTells: [
      'Long narrow warehouse shape that mimics a hyperscale data center, but surrounded by tractor-trailer staging lanes',
      'Large white roof with zero cooling towers',
      'Wide truck turning aprons on both sides'
    ],
    summary: 'A regional retail distribution center supplying Target stores across Texas and the Southwest.',
    clue: 'Although the long rectangular shape resembles a hyperscale campus, look at the wide concrete aprons filled with semi-trailers.'
  },
  {
    id: 'decoy-tesla-giga-nevada',
    name: 'Tesla Gigafactory Nevada',
    operator: 'Tesla / Panasonic',
    city: 'Sparks',
    stateOrCountry: 'NV, USA',
    lat: 39.5380,
    lng: -119.4430,
    defaultZoom: 16,
    isDataCenter: false,
    subtype: 'EV / Aerospace Manufacturing',
    difficulty: 'medium',
    sqft: '5,300,000 sq ft',
    visualTells: [
      'Vast sea of thousands of employee cars parked all around the desert site',
      'Rooftop solar array covering the flat roof along with central industrial process exhausts',
      'Active freight shipping docks on the south and west ends'
    ],
    summary: 'Located less than two miles from Switch Citadel in the Tahoe Reno Industrial Center, this megafactory manufactures lithium-ion电池 and EV drive units.',
    clue: 'Look at the thousands of employee cars parked outside—data centers employ a tiny fraction of this workforce.'
  },
  {
    id: 'decoy-intel-ocotillo-fab',
    name: 'Intel Ocotillo Semiconductor Fab (Fab 42 / 52)',
    operator: 'Intel Corporation',
    city: 'Chandler',
    stateOrCountry: 'AZ, USA',
    lat: 33.2435,
    lng: -111.8832,
    defaultZoom: 16,
    isDataCenter: false,
    subtype: 'Semiconductor Fab / Cleanroom',
    difficulty: 'hard',
    sqft: '3,000,000+ sq ft',
    visualTells: [
      'Massive multi-story employee parking garages (5,000+ engineers and technicians on site)',
      'Bulk industrial gas separation plants (nitrogen/oxygen spherical and cylindrical cryogenic tanks) and ultra-pure water plants',
      'Central cleanroom fabs connected by elevated pedestrian skybridges to office buildings'
    ],
    summary: 'One of the ultimate satellite look-alikes: semiconductor fabs have huge cooling towers and substations just like data centers, but also require giant bulk gas plants and thousands of parking spaces.',
    clue: 'Tricky! Both have cooling towers and substations—but look for the huge multi-story employee parking structures and bulk cryogenic nitrogen tank farms.'
  },
  {
    id: 'decoy-tsmc-arizona',
    name: 'TSMC Fab 21 Semiconductor Megafab',
    operator: 'TSMC',
    city: 'Phoenix',
    stateOrCountry: 'AZ, USA',
    lat: 33.7755,
    lng: -112.1565,
    defaultZoom: 16,
    isDataCenter: false,
    subtype: 'Semiconductor Fab / Cleanroom',
    difficulty: 'hard',
    sqft: '3,500,000 sq ft',
    visualTells: [
      'Sprawling chemical reclamation, water purification, and industrial gas plants flanking the central fab',
      'Massive workforce parking lots and multi-wing glass administrative offices attached via skybridges',
      'High-bay cleanroom roofs with tall chemical scrubber exhaust stacks rather than uniform modular server chillers'
    ],
    summary: 'TSMC’s $65B advanced logic wafer fabrication complex in North Phoenix, producing 4nm and 3nm silicon chips.',
    clue: 'Look for the chemical scrubber stacks, bulk gas tank farms, and massive workforce parking zones.'
  },
  {
    id: 'decoy-apple-park-infinite-loop',
    name: 'Apple Infinite Loop Corporate Campus',
    operator: 'Apple',
    city: 'Cupertino',
    stateOrCountry: 'CA, USA',
    lat: 37.3318,
    lng: -122.0312,
    defaultZoom: 17,
    isDataCenter: false,
    subtype: 'Corporate Office / Campus',
    difficulty: 'easy',
    sqft: '850,000 sq ft',
    visualTells: [
      'Six curved glass office buildings arranged around lush landscaped green courtyards',
      'Surrounded by vast surface parking lots and underground parking ramps',
      'Standard commercial HVAC units and continuous ribbons of office windows'
    ],
    summary: 'Apple’s historic six-building corporate headquarters campus in Cupertino, designed for thousands of software and hardware engineers.',
    clue: 'Landscaped central courtyards, continuous glass facades, and huge commuter parking lots.'
  },
  {
    id: 'decoy-microsoft-redwest',
    name: 'Microsoft Redmond West Corporate Campus',
    operator: 'Microsoft',
    city: 'Redmond',
    stateOrCountry: 'WA, USA',
    lat: 47.6492,
    lng: -122.1398,
    defaultZoom: 17,
    isDataCenter: false,
    subtype: 'Corporate Office / Campus',
    difficulty: 'easy',
    sqft: '900,000 sq ft',
    visualTells: [
      'X-shaped and angled office buildings maximizing natural window light for employee desks',
      'Outdoor sports fields, wooded walking trails, and landscaped plazas',
      'No electrical substations or generator rows'
    ],
    summary: 'Part of Microsoft’s global corporate headquarters in Redmond where software teams design Windows, Office, and Xbox.',
    clue: 'Notice the angled building wings designed to give every office worker a window view, plus sports fields and trails.'
  },
  {
    id: 'decoy-lineage-cold-storage',
    name: 'Lineage Logistics Automated Cold Storage Facility',
    operator: 'Lineage Logistics',
    city: 'Colton',
    stateOrCountry: 'CA, USA',
    lat: 34.0452,
    lng: -117.3458,
    defaultZoom: 17,
    isDataCenter: false,
    subtype: 'Cold Storage Logistics',
    difficulty: 'hard',
    sqft: '450,000 sq ft',
    visualTells: [
      'Heavy rooftop ammonia refrigeration condensers and insulated piping (looks very similar to a data center roof!)',
      'HOWEVER: One entire side of the building is lined with refrigerated semi-truck loading docks and parked 18-wheelers',
      'Wide concrete truck apron for grocery logistics'
    ],
    summary: 'Cold storage warehouses are the #1 satellite doppelgänger of data centers because they also have windowless insulated concrete walls and massive rooftop cooling plants—until you spot the row of 40 semi-truck docks!',
    clue: 'Watch out! Both have windowless insulated walls and big rooftop cooling units—check which one has 40 semi-truck bays on the side.'
  },
  {
    id: 'decoy-americold-atlanta',
    name: 'Americold Temperature-Controlled Logistics Hub',
    operator: 'Americold Realty Trust',
    city: 'Atlanta',
    stateOrCountry: 'GA, USA',
    lat: 33.7012,
    lng: -84.5421,
    defaultZoom: 17,
    isDataCenter: false,
    subtype: 'Cold Storage Logistics',
    difficulty: 'hard',
    sqft: '380,000 sq ft',
    visualTells: [
      'Large rooftop refrigeration condensers and insulated white roof',
      'Long refrigerated loading dock apron with dozens of 53-foot reefer trailers backed into bay doors',
      'No high-voltage utility substation or diesel generator row'
    ],
    summary: 'An industrial freezer warehouse storing frozen foods at -20°F for grocery supply chains across the Southeast.',
    clue: 'It has heavy rooftop refrigeration gear like a data center, but look at the long row of 18-wheeler trailers docked along the building.'
  },
  {
    id: 'decoy-boeing-everett',
    name: 'Boeing Everett Widebody Assembly Plant',
    operator: 'Boeing',
    city: 'Everett',
    stateOrCountry: 'WA, USA',
    lat: 47.9255,
    lng: -122.2718,
    defaultZoom: 15,
    isDataCenter: false,
    subtype: 'EV / Aerospace Manufacturing',
    difficulty: 'easy',
    sqft: '4,300,000 sq ft',
    visualTells: [
      'Colossal high-bay doors opening directly onto aircraft taxiways and painted flight lines',
      'Thousands of employee cars in sprawling parking lots',
      'Smooth flat roof without data center chiller arrays'
    ],
    summary: 'The largest building in the world by volume (472 million cubic feet), built to assemble 747, 767, 777, and 787 widebody airliners.',
    clue: 'Look at the giant hangar doors opening onto aircraft aprons and massive employee parking lots.'
  },
  {
    id: 'decoy-walmart-dc-sanger',
    name: 'Walmart Regional Distribution Center #6068',
    operator: 'Walmart',
    city: 'Sanger',
    stateOrCountry: 'TX, USA',
    lat: 33.3792,
    lng: -97.1755,
    defaultZoom: 16,
    isDataCenter: false,
    subtype: 'Distribution / Fulfillment Center',
    difficulty: 'easy',
    sqft: '1,250,000 sq ft',
    visualTells: [
      'Octopus-like conveyor wings with hundreds of truck bays on every side',
      'Thousands of parked Walmart semi-trailers in surrounding staging lots',
      'Plain white roof with skylights'
    ],
    summary: 'A regional grocery and general merchandise distribution hub serving Walmart Supercenters across North Texas.',
    clue: 'Spot the distinctive multi-wing cross-dock layout surrounded by hundreds of white semi-trailers.'
  },
  {
    id: 'decoy-cisco-san-jose',
    name: 'Cisco Systems Tasman Corporate Campus',
    operator: 'Cisco Systems',
    city: 'San Jose',
    stateOrCountry: 'CA, USA',
    lat: 37.4082,
    lng: -121.9535,
    defaultZoom: 17,
    isDataCenter: false,
    subtype: 'Corporate Office / Campus',
    difficulty: 'medium',
    sqft: '1,100,000 sq ft',
    visualTells: [
      'Identical square suburban tilt-up buildings surrounded entirely by tree-lined employee parking lots',
      'Light commercial rooftop HVAC units with large open roof space',
      'Decorative glass entrance atriums and pedestrian walkways'
    ],
    summary: 'Classic Silicon Valley R&D and corporate office buildings in North San Jose, just minutes from Santa Clara’s data centers.',
    clue: 'Notice how 70% of the land parcel is tree-lined commuter car parking rather than electrical substations or generator yards.'
  },
  {
    id: 'decoy-oracle-redwood-shores',
    name: 'Oracle Redwood Shores Corporate Headquarters',
    operator: 'Oracle Corporation',
    city: 'Redwood City',
    stateOrCountry: 'CA, USA',
    lat: 37.5295,
    lng: -122.2655,
    defaultZoom: 17,
    isDataCenter: false,
    subtype: 'Corporate Office / Campus',
    difficulty: 'easy',
    sqft: '2,000,000 sq ft',
    visualTells: [
      'Cylindrical emerald-glass office towers arranged around an artificial lagoon',
      'Multi-story concrete parking structures for thousands of office employees',
      'Zero industrial substations or external generator yards'
    ],
    summary: 'Oracle’s iconic waterfront corporate campus shaped like database cylinders.',
    clue: 'Glass cylindrical office towers, decorative lagoons, and multi-story commuter parking garages.'
  },
  {
    id: 'decoy-rivian-normal',
    name: 'Rivian Automotive Manufacturing Plant',
    operator: 'Rivian',
    city: 'Normal',
    stateOrCountry: 'IL, USA',
    lat: 40.5095,
    lng: -89.0485,
    defaultZoom: 16,
    isDataCenter: false,
    subtype: 'EV / Aerospace Manufacturing',
    difficulty: 'medium',
    sqft: '4,000,000 sq ft',
    visualTells: [
      'Vast staging lots filled with thousands of newly built electric trucks/SUVs waiting for transport',
      'Railroad spurs entering the building and test track loops nearby',
      'Large workforce parking lots'
    ],
    summary: 'Rivian’s flagship electric vehicle assembly plant in Central Illinois.',
    clue: 'Look at the sprawling vehicle storage lots, test track, and freight rail spurs.'
  },
  {
    id: 'decoy-prologis-elk-grove',
    name: 'Prologis O’Hare Air Freight Logistics Center',
    operator: 'Prologis',
    city: 'Elk Grove Village',
    stateOrCountry: 'IL, USA',
    lat: 42.0021,
    lng: -87.9585,
    defaultZoom: 17,
    isDataCenter: false,
    subtype: 'Distribution / Fulfillment Center',
    difficulty: 'medium',
    sqft: '320,000 sq ft',
    visualTells: [
      'Located in the exact same Elk Grove industrial park as major COLO data centers, but features a continuous line of truck loading docks',
      'Flat featureless roof with zero chillers',
      'No backup generators or electrical substation'
    ],
    summary: 'An air-cargo logistics warehouse located blocks away from Elk Grove’s data center cluster.',
    clue: 'Same neighborhood, same concrete tilt-up box—but look at the clean flat roof and row of truck docks.'
  },
  {
    id: 'decoy-ikea-distribution-perryville',
    name: 'IKEA East Coast Distribution Center',
    operator: 'IKEA',
    city: 'Perryville',
    stateOrCountry: 'MD, USA',
    lat: 39.5782,
    lng: -76.0412,
    defaultZoom: 16,
    isDataCenter: false,
    subtype: 'Distribution / Fulfillment Center',
    difficulty: 'medium',
    sqft: '1,700,000 sq ft',
    visualTells: [
      'Roof covered edge-to-edge in dark blue photovoltaic solar panels (not chillers!)',
      'Hundreds of shipping containers and semi-trailers parked in neat rows outside',
      'Long loading dock bays on both sides'
    ],
    summary: 'A high-bay automated furniture distribution warehouse with one of Maryland’s largest rooftop solar installations.',
    clue: 'Don’t confuse flat rooftop solar panels with raised 3D mechanical cooling towers—and check the shipping container yard!'
  },
  {
    id: 'decoy-fedex-memphis-hub',
    name: 'FedEx Express World Hub Sorting Complex',
    operator: 'FedEx',
    city: 'Memphis',
    stateOrCountry: 'TN, USA',
    lat: 35.0565,
    lng: -89.9695,
    defaultZoom: 16,
    isDataCenter: false,
    subtype: 'Distribution / Fulfillment Center',
    difficulty: 'easy',
    sqft: '3,200,000 sq ft',
    visualTells: [
      'Surrounded by cargo aircraft parking gates, tugs, and unit load device (ULD) container dollies',
      'Long sorting buildings with vehicle ramps and zero cooling towers'
    ],
    summary: 'FedEx’s global air cargo superhub in Memphis, just a few miles east of xAI’s Colossus AI supercluster.',
    clue: 'Surrounded by widebody cargo jets and container tugs rather than power turbines and substations.'
  },
  {
    id: 'decoy-samsung-austin-fab',
    name: 'Samsung Austin Semiconductor Fab (S2)',
    operator: 'Samsung Electronics',
    city: 'Austin',
    stateOrCountry: 'TX, USA',
    lat: 30.3752,
    lng: -97.6328,
    defaultZoom: 16,
    isDataCenter: false,
    subtype: 'Semiconductor Fab / Cleanroom',
    difficulty: 'hard',
    sqft: '2,400,000 sq ft',
    visualTells: [
      'Huge multi-deck parking garages holding thousands of employee cars',
      'Industrial bulk gas separation towers and chemical tank farms on the perimeter',
      'Elevated cleanroom skybridges connecting fabrication buildings to multi-story office wings'
    ],
    summary: 'Samsung’s massive semiconductor wafer fabrication plant in Austin, Texas.',
    clue: 'Look for the multi-story commuter parking garages and chemical/gas tank farms that distinguish a chip fab from a data center.'
  },
  {
    id: 'decoy-verizon-basking-ridge',
    name: 'Verizon Global Operations & Corporate Center',
    operator: 'Verizon',
    city: 'Basking Ridge',
    stateOrCountry: 'NJ, USA',
    lat: 40.6712,
    lng: -74.5442,
    defaultZoom: 17,
    isDataCenter: false,
    subtype: 'Corporate Office / Campus',
    difficulty: 'easy',
    sqft: '1,400,000 sq ft',
    visualTells: [
      'Symmetrical terraced office wings overlooking decorative ponds and manicured lawns',
      'Huge surface parking lots flanking both sides of the complex',
      'Glass curtain walls and skylights'
    ],
    summary: 'Verizon’s operational headquarters campus in New Jersey.',
    clue: 'Notice the decorative ponds, windowed office terraces, and massive commuter parking lots.'
  },
  {
    id: 'decoy-uline-distribution-pleasant-prairie',
    name: 'Uline Corporate & Distribution Campus',
    operator: 'Uline',
    city: 'Pleasant Prairie',
    stateOrCountry: 'WI, USA',
    lat: 42.5365,
    lng: -87.9498,
    defaultZoom: 16,
    isDataCenter: false,
    subtype: 'Distribution / Fulfillment Center',
    difficulty: 'medium',
    sqft: '1,800,000 sq ft',
    visualTells: [
      'Immaculately uniform rectangular warehouses that look like hyperscale halls from afar',
      'Closer inspection reveals 100+ semi-truck dock doors along the back wall and a completely clean white roof',
      'No substation or chiller arrays'
    ],
    summary: 'Major shipping supply distribution campus along I-94 between Milwaukee and Chicago.',
    clue: 'The buildings are arranged in a neat campus grid like a hyperscale data center, but the roofs are completely bare and the rear walls are all truck docks.'
  },
  {
    id: 'decoy-Sysco-houston',
    name: 'Sysco Cold Foodservice Distribution Center',
    operator: 'Sysco Corporation',
    city: 'Houston',
    stateOrCountry: 'TX, USA',
    lat: 29.9785,
    lng: -95.4265,
    defaultZoom: 17,
    isDataCenter: false,
    subtype: 'Cold Storage Logistics',
    difficulty: 'hard',
    sqft: '550,000 sq ft',
    visualTells: [
      'Rooftop refrigeration piping and condensers over the freezer section',
      'Fleet of 150+ silver refrigerated semi-trailers parked in the yard and backed into loading docks',
      'Dedicated truck wash and fueling lanes'
    ],
    summary: 'A major cold-chain foodservice distribution hub supplying restaurants and hospitals.',
    clue: 'There is heavy refrigeration gear on the roof, but look at the fleet of 150+ semi-trailers docked around the building.'
  },
  {
    id: 'decoy-nike-memphis-dc',
    name: 'Nike North America Logistics Campus',
    operator: 'Nike',
    city: 'Memphis',
    stateOrCountry: 'TN, USA',
    lat: 35.2215,
    lng: -89.9045,
    defaultZoom: 16,
    isDataCenter: false,
    subtype: 'Distribution / Fulfillment Center',
    difficulty: 'medium',
    sqft: '2,800,000 sq ft',
    visualTells: [
      'Distinctive multi-wing building with an outdoor employee running track and basketball court',
      'Hundreds of shipping containers and semi-trailers docked across multiple bays',
      'Clean white roof with skylight strips'
    ],
    summary: 'Nike’s largest footwear and apparel distribution center in North America.',
    clue: 'Look for the hundreds of shipping trailers and the clean skylit roof.'
  },
  {
    id: 'decoy-general-motors-arlington',
    name: 'GM Arlington SUV Assembly Plant',
    operator: 'General Motors',
    city: 'Arlington',
    stateOrCountry: 'TX, USA',
    lat: 32.7425,
    lng: -97.0715,
    defaultZoom: 16,
    isDataCenter: false,
    subtype: 'EV / Aerospace Manufacturing',
    difficulty: 'easy',
    sqft: '5,750,000 sq ft',
    visualTells: [
      'Railroad auto-rack loading yards and thousands of finished SUVs parked in shipping lots',
      'Massive employee shift parking lots on all sides',
      'Paint shop exhaust stacks rather than uniform modular data center chillers'
    ],
    summary: 'General Motors’ flagship full-size SUV assembly plant producing every Escalade, Tahoe, and Suburban.',
    clue: 'Surrounded by rail yards, thousands of finished vehicles, and massive worker parking lots.'
  },

  // ==========================================
  // CONNECTICUT DATA CENTERS (COLO, Enterprise, Edge — Non-Hyperscaler)
  // ==========================================
  {
    id: 'dc-ct-cyrusone-norwalk',
    name: 'CyrusOne NYM5 Norwalk Data Center (6 Norden Place)',
    operator: 'CyrusOne (formerly Cervalis)',
    city: 'Norwalk',
    stateOrCountry: 'CT, USA',
    lat: 41.1131,
    lng: -73.3887,
    defaultZoom: 17,
    isDataCenter: true,
    subtype: 'Colocation (COLO)',
    difficulty: 'medium',
    powerCapacityMW: '18 MW',
    sqft: '168,000 sq ft',
    visualTells: [
      'Dense cluster of rooftop HVAC chillers and dry coolers packed onto the southern wing',
      'Fenced backup diesel generator yard and utility transformer bank along the rear perimeter',
      'Minimal cars in the parking lot despite a massive footprint right along I-95'
    ],
    summary: 'Located at 6 Norden Place in Norwalk, CT, this major Fairfield County colocation and financial disaster-recovery facility serves Wall Street banks and enterprise clients outside the NYC flood zone.',
    clue: 'Look at the dense cluster of white rooftop cooling units and the fenced generator yard on the back side of the building.'
  },
  {
    id: 'dc-ct-cyrusone-stamford',
    name: 'CyrusOne NYM10 Stamford Data Center (10 Riverbend Dr)',
    operator: 'CyrusOne',
    city: 'Stamford',
    stateOrCountry: 'CT, USA',
    lat: 41.0840,
    lng: -73.5179,
    defaultZoom: 18,
    isDataCenter: true,
    subtype: 'Colocation (COLO)',
    difficulty: 'medium',
    powerCapacityMW: '12 MW',
    sqft: '115,000 sq ft',
    visualTells: [
      'Concentrated rows of rooftop CRAC/chiller units and fenced ground-level diesel generators',
      'Hardened low-profile suburban campus building with few cars parked outside',
      'Zero 18-wheeler freight loading docks'
    ],
    summary: 'Located in Stamford’s Springdale business corridor, providing ultra-low-latency colocation for Connecticut hedge funds, trading desks, and enterprise workloads.',
    clue: 'In a suburban Stamford office park, look for the roof packed with mechanical chillers and the fenced generator bank.'
  },
  {
    id: 'dc-ct-digital-realty-trumbull',
    name: 'Digital Realty HVN10 Connecticut Data Center (80 Merritt Blvd)',
    operator: 'Digital Realty',
    city: 'Trumbull',
    stateOrCountry: 'CT, USA',
    lat: 41.2407,
    lng: -73.1474,
    defaultZoom: 18,
    isDataCenter: true,
    subtype: 'Colocation (COLO)',
    difficulty: 'medium',
    powerCapacityMW: '16 MW',
    sqft: '190,000 sq ft',
    visualTells: [
      'Dedicated electrical substation yard and rows of green/gray backup diesel generators flanking the building',
      'Symmetrical arrays of rooftop chillers and cooling towers',
      'Security fence and gated entry right off Route 8 / Merritt Parkway'
    ],
    summary: 'Located at 80 Merritt Blvd in Trumbull, CT, Digital Realty’s flagship Connecticut colocation campus hosts major financial services, insurance, and enterprise IT infrastructure.',
    clue: 'Spot the dedicated electrical substation and rows of backup diesel generators tucked along the side of the building.'
  },
  {
    id: 'dc-ct-tierpoint-waterbury',
    name: 'TierPoint Connecticut Data Center (108 Bank St)',
    operator: 'TierPoint',
    city: 'Waterbury',
    stateOrCountry: 'CT, USA',
    lat: 41.5544,
    lng: -73.0411,
    defaultZoom: 18,
    isDataCenter: true,
    subtype: 'Edge / Small Data Hub',
    difficulty: 'hard',
    powerCapacityMW: '5 MW',
    sqft: '48,000 sq ft',
    visualTells: [
      'Urban downtown carrier hotel roof packed with industrial HVAC chillers and telecom antennas',
      'Hardened brick/concrete walls with ground-level generator exhaust louvers',
      'Secured gated utility yard in the rear'
    ],
    summary: 'TierPoint’s Waterbury edge colocation hub at 108 Bank Street provides high-availability hybrid cloud and disaster recovery for New England enterprises.',
    clue: 'In downtown Waterbury, look for the roof covered in heavy mechanical cooling units rather than a bare commercial roof.'
  },
  {
    id: 'dc-ct-ensono-windsor',
    name: 'Ensono / Travelers Enterprise Data Center (300 Day Hill Rd)',
    operator: 'Ensono / Travelers Insurance',
    city: 'Windsor',
    stateOrCountry: 'CT, USA',
    lat: 41.8741,
    lng: -72.6777,
    defaultZoom: 18,
    isDataCenter: true,
    subtype: 'Enterprise Data Center',
    difficulty: 'medium',
    powerCapacityMW: '15 MW',
    sqft: '155,000 sq ft',
    visualTells: [
      'Windowless white-roof data hall module with adjacent chilled-water plant and backup generator array',
      'High-security perimeter fencing and minimal daily commuter cars',
      'Zero freight shipping bays despite being on Windsor’s Day Hill industrial corridor'
    ],
    summary: 'Purpose-built Tier III+ enterprise insurance and mainframe data center in Windsor, CT serving Hartford’s insurance and banking industry.',
    clue: 'Compare this parcel on Day Hill Road with its neighbors: windowless white data hall, fenced generator bank, and almost no cars.'
  },
  {
    id: 'dc-ct-chimenet-wallingford',
    name: 'ChimeNet / Barnes Industrial Data Hub (110 Barnes Rd)',
    operator: 'ChimeNet / Connecticut Hospital Association',
    city: 'Wallingford',
    stateOrCountry: 'CT, USA',
    lat: 41.4866,
    lng: -72.8011,
    defaultZoom: 18,
    isDataCenter: true,
    subtype: 'Edge / Small Data Hub',
    difficulty: 'hard',
    powerCapacityMW: '4 MW',
    sqft: '42,000 sq ft',
    visualTells: [
      'Redundant backup generator pads and dense rooftop cooling units on a compact suburban building',
      'Direct proximity to Wallingford Electric Division’s municipal power grid (lowest utility rates in CT)',
      'No semi-truck loading docks'
    ],
    summary: 'A specialized healthcare and regional enterprise data hub in Wallingford, CT taking advantage of Wallingford’s municipal electric utility.',
    clue: 'Look for the external generator pads and concentrated rooftop HVAC units without any warehouse loading docks.'
  },

  // ==========================================
  // CONNECTICUT LOOK-ALIKE DECOYS (Distribution, Corporate Offices)
  // ==========================================
  {
    id: 'decoy-ct-amazon-windsor',
    name: 'Amazon DCY1 / BDL2 Fulfillment Complex (Day Hill Corridor)',
    operator: 'Amazon Logistics',
    city: 'Windsor',
    stateOrCountry: 'CT, USA',
    lat: 41.8788,
    lng: -72.6944,
    defaultZoom: 17,
    isDataCenter: false,
    subtype: 'Distribution / Fulfillment Center',
    difficulty: 'easy',
    sqft: '450,000 sq ft',
    visualTells: [
      'Surrounded by fleets of blue Amazon delivery vans and 53-foot semi-trailers at loading docks',
      'Large shift-worker parking lot',
      'Clean white roof with standard light commercial RTUs (no chiller banks or generators)'
    ],
    summary: 'Located on Helmsford Way just off Day Hill Road in Windsor, CT—less than a mile from Windsor’s enterprise data centers.',
    clue: 'Located right down the road from Windsor’s data centers, but surrounded by delivery van staging lanes and semi-truck docks.'
  },
  {
    id: 'decoy-ct-sysco-rocky-hill',
    name: 'Sysco Connecticut Cold Storage Distribution Center',
    operator: 'Sysco Corporation',
    city: 'Rocky Hill',
    stateOrCountry: 'CT, USA',
    lat: 41.6460,
    lng: -72.6723,
    defaultZoom: 17,
    isDataCenter: false,
    subtype: 'Cold Storage Logistics',
    difficulty: 'hard',
    sqft: '360,000 sq ft',
    visualTells: [
      'Heavy rooftop refrigeration condensers for industrial freezers (looks like a data center roof!)',
      'Long dock apron lined with dozens of 53-foot refrigerated semi-trailers',
      'Dedicated truck maintenance and tractor parking yard'
    ],
    summary: 'Located at 500 Enterprise Drive in Rocky Hill, CT just off I-91, supplying temperature-controlled food across New England.',
    clue: 'Tricky Connecticut cold-storage decoy! It has rooftop refrigeration units like a data center, but check the long row of 18-wheeler trailers docked on the side.'
  },
  {
    id: 'decoy-ct-voya-windsor',
    name: 'Voya Financial Corporate Campus (One Orange Way)',
    operator: 'Voya Financial',
    city: 'Windsor',
    stateOrCountry: 'CT, USA',
    lat: 41.8766,
    lng: -72.6847,
    defaultZoom: 17,
    isDataCenter: false,
    subtype: 'Corporate Office / Campus',
    difficulty: 'easy',
    sqft: '420,000 sq ft',
    visualTells: [
      'Windowed multi-wing glass office buildings overlooking a landscaped pond on Day Hill Road',
      'Expansive surface parking lots for over 1,200 office workers',
      'No generator rows or chiller farms'
    ],
    summary: 'Located right next door to Ensono’s Enterprise Data Center on Day Hill Road in Windsor, CT, housing corporate financial offices.',
    clue: 'Notice the continuous glass windows, decorative pond, and huge surface parking lots for office commuters.'
  },
  {
    id: 'decoy-ct-charter-stamford',
    name: ' Frontier / Corporate Executive Campus (1155 Long Ridge Rd)',
    operator: 'Corporate Office Park',
    city: 'Stamford',
    stateOrCountry: 'CT, USA',
    lat: 41.1076,
    lng: -73.5692,
    defaultZoom: 18,
    isDataCenter: false,
    subtype: 'Corporate Office / Campus',
    difficulty: 'easy',
    sqft: '220,000 sq ft',
    visualTells: [
      'Architectural office roofs with skylights, windowed facades, and wooded courtyards',
      'Surrounded by commuter car parking decks and surface lots',
      'No electrical substation or diesel generator yards'
    ],
    summary: 'Classic Stamford corporate headquarters complex tucked into the wooded ridges of Fairfield County.',
    clue: 'Look at the skylights, wooded walkways, and commuter parking lots.'
  },
  {
    id: 'decoy-ct-traderjoes-bloomfield',
    name: 'Trader Joe’s New England Cold & Dry Distribution Hub',
    operator: 'Trader Joe’s / First Industrial',
    city: 'Windsor / Bloomfield',
    stateOrCountry: 'CT, USA',
    lat: 41.8982,
    lng: -72.6543,
    defaultZoom: 17,
    isDataCenter: false,
    subtype: 'Distribution / Fulfillment Center',
    difficulty: 'medium',
    sqft: '680,000 sq ft',
    visualTells: [
      'Massive rectangular cross-dock warehouse with 80+ semi-trailer doors',
      'Large tractor-trailer staging lots and employee parking',
      'Clean white roof membrane along half the building'
    ],
    summary: 'Major grocery distribution center near Bradley International Airport in the Windsor/Bloomfield industrial corridor.',
    clue: 'Look for the long rows of 18-wheeler dock doors and trailer staging yards.'
  },
  {
    id: 'decoy-ct-aetna-hartford',
    name: 'Aetna / CVS Health Corporate Headquarters (151 Farmington Ave)',
    operator: 'Aetna (CVS Health)',
    city: 'Hartford',
    stateOrCountry: 'CT, USA',
    lat: 41.7670,
    lng: -72.6909,
    defaultZoom: 17,
    isDataCenter: false,
    subtype: 'Corporate Office / Campus',
    difficulty: 'easy',
    sqft: '1,600,000 sq ft',
    visualTells: [
      'Historic Colonial Revival cupola and winged glass/brick office complex',
      'Massive multi-story employee parking garages and surface lots',
      'Landscaped lawns and pedestrian plazas'
    ],
    summary: 'Aetna’s historic corporate insurance headquarters campus in Hartford, Connecticut.',
    clue: 'Historic office architecture, landscaped plazas, and massive employee parking structures.'
  },

  // ==========================================
  // SUSPECTED SMALL-SCALE SERVER ROOMS (Accessory / Stealth / Edge < 5 MW)
  // Designed for Municipal Zoning Analysis (Accessory IT vs. Principal Data Center Use)
  // ==========================================
  {
    id: 'dc-ct-small-newhaven-300george',
    name: '300 George Street Telecom & Biotech Server Suite',
    operator: 'Multi-Tenant Carrier / Biotech Server Room',
    city: 'New Haven',
    stateOrCountry: 'CT, USA',
    lat: 41.3050,
    lng: -72.9313,
    defaultZoom: 18,
    isDataCenter: true,
    subtype: 'Suspected Small-Scale Server Room',
    difficulty: 'hard',
    powerCapacityMW: '1.5–3 MW (Accessory / Suite)',
    sqft: '18,000 sq ft (Server Suite inside 500k sq ft building)',
    visualTells: [
      'Mixed-use commercial building with a disproportionately dense cluster of rooftop dry-coolers and telecom microwave dishes on one section of the roof',
      'Street-level/alley emergency diesel generator flues retrofitted onto an existing former SNET telephone building',
      'Blends into downtown office zoning without a standalone utility substation'
    ],
    summary: 'Originally built as a Southern New England Telephone (SNET) switching hub and now housing biotech laboratories alongside high-density carrier/server rooms. A classic zoning edge case where a server room operates inside a commercial office/lab building.',
    clue: 'Look closely at the roof: unlike a normal office building, sections of this roof carry clustered industrial dry-coolers and telecom dishes.'
  },
  {
    id: 'dc-ct-small-hartford-woodland',
    name: '40 Woodland Street Medical & Insurance Server Annex',
    operator: 'Enterprise / Healthcare IT Annex',
    city: 'Hartford',
    stateOrCountry: 'CT, USA',
    lat: 41.7701,
    lng: -72.7012,
    defaultZoom: 18,
    isDataCenter: true,
    subtype: 'Suspected Small-Scale Server Room',
    difficulty: 'hard',
    powerCapacityMW: '1.2 MW (Small-Scale)',
    sqft: '15,000 sq ft (Server Wing)',
    visualTells: [
      'Suburban/urban office parcel with an external fenced pad containing dedicated backup diesel generators and chillers tucked behind the building',
      'Windowless masonry mechanical wing attached to a conventional office structure',
      'Acoustic screening around ground-mounted condensers to meet neighborhood noise ordinances'
    ],
    summary: 'Located in Hartford’s Asylum Hill insurance and medical district, illustrating how a small-scale server room (< 2 MW) appears from orbit as an accessory mechanical annex attached to an office building.',
    clue: 'Look behind the office building for the fenced pad with backup generators and dedicated chillers.'
  },
  {
    id: 'dc-ct-small-glastonbury-windingbrook',
    name: 'Glastonbury Corporate Park Accessory Server Hub (455 Winding Brook Dr)',
    operator: 'Financial / Disaster Recovery Suite',
    city: 'Glastonbury',
    stateOrCountry: 'CT, USA',
    lat: 41.7169,
    lng: -72.5950,
    defaultZoom: 18,
    isDataCenter: true,
    subtype: 'Suspected Small-Scale Server Room',
    difficulty: 'hard',
    powerCapacityMW: '0.8–2 MW (Small-Scale)',
    sqft: '12,000 sq ft (Server Room)',
    visualTells: [
      'Looks like a standard suburban corporate office building at first glance, but has a fenced backup generator enclosure and pad-mounted transformer upgrade in the rear parking lot',
      'Extra CRAC rooftop condenser units clustered over the interior server room zone',
      'Located in a standard suburban office park zone'
    ],
    summary: 'A prime example for zoning boards: a suburban office park building in Glastonbury, CT that houses a dedicated disaster-recovery server room with an external backup generator pad in the parking lot.',
    clue: 'Spot the dedicated backup generator enclosure and concentrated rooftop cooling units tucked into an otherwise normal suburban office parcel.'
  },
  {
    id: 'dc-ct-small-newhaven-longwharf',
    name: 'Long Wharf Regional Telecom & Server Node (555 Long Wharf Dr)',
    operator: 'Regional Fiber / Colocation Suite',
    city: 'New Haven',
    stateOrCountry: 'CT, USA',
    lat: 41.2978,
    lng: -72.9122,
    defaultZoom: 18,
    isDataCenter: true,
    subtype: 'Suspected Small-Scale Server Room',
    difficulty: 'hard',
    powerCapacityMW: '1.5 MW (Small-Scale)',
    sqft: '14,000 sq ft (Server Suite)',
    visualTells: [
      'Sits directly along the I-95 / Amtrak Northeast Corridor fiber-optic trunk line',
      'Clustered rooftop chillers and dedicated backup power equipment serving tenant server suites inside an office building',
      'Shares surface parking with regular commercial office tenants'
    ],
    summary: 'A multi-tenant commercial building along the I-95 fiber corridor in New Haven where small-scale colocation and server rooms operate alongside traditional maritime/office suites.',
    clue: 'Look at the roof mechanical cluster right along the I-95 fiber corridor.'
  },

  // ==========================================
  // DISNEY / ESPN INFRASTRUCTURE (Bristol, CT & Kings Mountain, NC)
  // ==========================================
  {
    id: 'dc-ct-espn-bristol-digital-center',
    name: 'Disney / ESPN Digital Center (DC-1 & DC-2) & Satellite Teleport (935 Middle St)',
    operator: 'The Walt Disney Company / ESPN',
    city: 'Bristol',
    stateOrCountry: 'CT, USA',
    lat: 41.6478,
    lng: -72.9022,
    defaultZoom: 17,
    isDataCenter: true,
    subtype: 'Enterprise Data Center',
    difficulty: 'medium',
    powerCapacityMW: '18 MW (Broadcast Data Center + Teleport)',
    sqft: '410,000 sq ft (DC-1 + DC-2)',
    visualTells: [
      'Unmistakable satellite dish "teleport" antenna farm (dozens of large white C-band/Ku-band parabolic dishes) immediately adjacent to Digital Center 1 & 2',
      'Massive rooftop chilled-water HVAC arrays and dedicated backup diesel generator compounds powering 24/7 live video servers',
      'Dedicated high-reliability Eversource electrical feed and media server vaults'
    ],
    summary: 'ESPN’s global broadcast data center and production complex in Bristol, CT (part of The Walt Disney Company). Digital Center 1 (220,000 sq ft) and Digital Center 2 (193,500 sq ft) house petabytes of live sports video storage, transcoding clusters, and one of the largest commercial satellite earth-station farms in New England.',
    clue: 'Look for the unmistakable array of dozens of white parabolic satellite dishes ("teleport") paired with heavy rooftop chillers and backup generator compounds.'
  },
  {
    id: 'decoy-ct-espn-north-campus-bristol',
    name: 'Disney / ESPN North Campus Corporate Offices & Logistics (Ronzo Rd)',
    operator: 'The Walt Disney Company / ESPN',
    city: 'Bristol',
    stateOrCountry: 'CT, USA',
    lat: 41.6515,
    lng: -72.9038,
    defaultZoom: 17,
    isDataCenter: false,
    subtype: 'Corporate Office / Campus',
    difficulty: 'medium',
    sqft: '350,000 sq ft',
    visualTells: [
      'Sprawling employee surface parking lots, pedestrian plazas, and windowed administrative office wings',
      'Standard commercial office roofs without satellite teleport dishes or heavy chiller banks',
      'Remote broadcast truck staging bays'
    ],
    summary: 'The northern administrative, Plaza office, and logistics portion of the ESPN Bristol campus—housing corporate staff, cafeteria/wellness centers, and commuter parking rather than the Digital Center server vaults.',
    clue: 'Notice the sprawling employee commuter parking lots and windowed office wings without the satellite dish farm or heavy chiller plant.'
  },
  {
    id: 'dc-disney-kings-mountain-nc',
    name: 'Walt Disney Kings Mountain Enterprise Data Center (T5@Charlotte)',
    operator: 'The Walt Disney Company',
    city: 'Kings Mountain',
    stateOrCountry: 'NC, USA',
    lat: 35.2513,
    lng: -81.3975,
    defaultZoom: 17,
    isDataCenter: true,
    subtype: 'Enterprise Data Center',
    difficulty: 'easy',
    powerCapacityMW: '36 MW',
    sqft: '220,000 sq ft',
    visualTells: [
      'Windowless hardened concrete data hall surrounded by double-fenced perimeter security',
      'Dedicated electrical substation yard and continuous row of backup diesel generators along the side wall',
      'Tiny parking lot (< 30 spaces) for a massive high-security facility'
    ],
    summary: 'Built by The Walt Disney Company in Kings Mountain, NC (near Apple’s Maiden NC campus) to power Disney+, theme park reservations, and enterprise cloud infrastructure.',
    clue: 'Classic purpose-built enterprise data center: windowless concrete box, row of backup generators, adjacent substation, and almost zero cars.'
  },
  ...EXPANDED_FACILITY_LOCATIONS
];

export const CURATED_PAIRS: FacilityPair[] = [
  // ==========================================
  // DISNEY / ESPN CURATED PAIRS (Bristol, CT & Kings Mountain, NC)
  // ==========================================
  {
    id: 'pair-ct-espn-digital-center-vs-north-campus',
    title: 'Bristol, CT Campus Recon: Disney/ESPN Digital Center & Teleport vs. Corporate Offices',
    difficulty: 'medium',
    categoryTag: 'Enterprise Data Center vs. Corporate Office',
    comparisonLesson: 'Right on Middle Street in Bristol, CT, ESPN’s Digital Center 1 & 2 (southern sector) is packed with a massive satellite teleport dish farm, heavy rooftop chillers, and backup generators to run 24/7 video server clusters—while the northern administrative sector is dominated by commuter parking and offices.',
    dataCenter: FACILITY_LOCATIONS.find(f => f.id === 'dc-ct-espn-bristol-digital-center')!,
    decoy: FACILITY_LOCATIONS.find(f => f.id === 'decoy-ct-espn-north-campus-bristol')!
  },
  {
    id: 'pair-ct-espn-vs-hartford-aetna',
    title: 'Connecticut Media Compute vs. Insurance HQ: Disney/ESPN Bristol vs. Aetna Hartford',
    difficulty: 'easy',
    categoryTag: 'Enterprise Data Center vs. Corporate Office',
    comparisonLesson: 'Disney/ESPN’s Bristol Digital Center stands out from orbit thanks to its giant cluster of white parabolic satellite earth-station dishes and chiller plants, compared to Aetna’s traditional Hartford office campus.',
    dataCenter: FACILITY_LOCATIONS.find(f => f.id === 'dc-ct-espn-bristol-digital-center')!,
    decoy: FACILITY_LOCATIONS.find(f => f.id === 'decoy-ct-aetna-hartford')!
  },
  {
    id: 'pair-disney-nc-vs-amazon',
    title: 'Disney+ Enterprise Data Center (Kings Mountain) vs. Fulfillment Warehouse',
    difficulty: 'easy',
    categoryTag: 'Enterprise Data Center vs. Distribution',
    comparisonLesson: 'The Walt Disney Company’s purpose-built enterprise data center in Kings Mountain, NC has a dedicated substation, generator row, and tiny parking lot—unlike a distribution center surrounded by 18-wheeler docks.',
    dataCenter: FACILITY_LOCATIONS.find(f => f.id === 'dc-disney-kings-mountain-nc')!,
    decoy: FACILITY_LOCATIONS.find(f => f.id === 'decoy-target-dc-midlothian')!
  },

  // ==========================================
  // CONNECTICUT ZONING & SMALL-SCALE SERVER ROOM PAIRS
  // ==========================================
  {
    id: 'pair-ct-zoning-small-glastonbury-vs-wethersfield',
    title: 'CT Zoning Case Study: Suspected Small-Scale Server Room vs. Standard Office',
    difficulty: 'hard',
    categoryTag: 'Suspected Small-Scale Server Room vs. Corporate Office',
    comparisonLesson: 'For municipal zoning regulations: both buildings sit in suburban Hartford-area office parks. However, the Glastonbury building with a suspected small-scale server room has a retrofitted backup diesel generator pad and clustered CRAC condensers over its server suite.',
    dataCenter: FACILITY_LOCATIONS.find(f => f.id === 'dc-ct-small-glastonbury-windingbrook')!,
    decoy: FACILITY_LOCATIONS.find(f => f.id === 'decoy-ct-charter-stamford')!
  },
  {
    id: 'pair-ct-zoning-newhaven-300george-vs-hartford-aetna',
    title: 'CT Urban Zoning: Mixed-Use Server Suite (300 George St) vs. Traditional Office HQ',
    difficulty: 'hard',
    categoryTag: 'Suspected Small-Scale Server Room vs. Corporate Office',
    comparisonLesson: '300 George Street in New Haven houses high-density telecom/biotech server rooms inside a commercial building—visible via its dense rooftop dry-coolers and generator flues—unlike a pure administrative headquarters.',
    dataCenter: FACILITY_LOCATIONS.find(f => f.id === 'dc-ct-small-newhaven-300george')!,
    decoy: FACILITY_LOCATIONS.find(f => f.id === 'decoy-ct-aetna-hartford')!
  },
  {
    id: 'pair-ct-zoning-hartford-woodland-vs-windsor-voya',
    title: 'CT Accessory IT Use: Hartford Server Annex vs. Windsor Office Campus',
    difficulty: 'hard',
    categoryTag: 'Suspected Small-Scale Server Room vs. Corporate Office',
    comparisonLesson: 'Small-scale server rooms (< 2 MW) rarely have utility substations; instead, zoning inspectors can spot them by the windowless mechanical wing, acoustic-screened chiller pads, and backup diesel generators added behind an office building.',
    dataCenter: FACILITY_LOCATIONS.find(f => f.id === 'dc-ct-small-hartford-woodland')!,
    decoy: FACILITY_LOCATIONS.find(f => f.id === 'decoy-ct-voya-windsor')!
  },

  // ==========================================
  // CONNECTICUT CURATED PAIRS (Non-Hyperscaler)
  // ==========================================
  {
    id: 'pair-ct-norwalk-vs-windsor-amazon',
    title: 'Connecticut Showdown: Norwalk COLO vs. Windsor Amazon Hub',
    difficulty: 'easy',
    categoryTag: 'Colocation (COLO) vs. Distribution',
    comparisonLesson: 'CyrusOne Norwalk (6 Norden Place) is a fortress Fairfield County COLO with dense rooftop chillers and rear generator banks. Amazon’s Windsor hub is surrounded by delivery van staging lanes and 18-wheeler loading docks.',
    dataCenter: FACILITY_LOCATIONS.find(f => f.id === 'dc-ct-cyrusone-norwalk')!,
    decoy: FACILITY_LOCATIONS.find(f => f.id === 'decoy-ct-amazon-windsor')!
  },
  {
    id: 'pair-ct-trumbull-vs-rocky-hill-sysco',
    title: 'CT I-91/Rt-8 Recon: Digital Realty Trumbull vs. Sysco Cold Storage',
    difficulty: 'hard',
    categoryTag: 'Colocation (COLO) vs. Cold Storage',
    comparisonLesson: 'Both Connecticut facilities have heavy rooftop cooling equipment! Digital Realty Trumbull (80 Merritt Blvd) has an on-site electrical substation and generator rows with zero truck docks, while Sysco Rocky Hill has 40+ refrigerated semi-trailers backed into loading bays.',
    dataCenter: FACILITY_LOCATIONS.find(f => f.id === 'dc-ct-digital-realty-trumbull')!,
    decoy: FACILITY_LOCATIONS.find(f => f.id === 'decoy-ct-sysco-rocky-hill')!
  },
  {
    id: 'pair-ct-windsor-neighbors',
    title: 'Same Street in Windsor, CT: Enterprise Data Center vs. Corporate Office',
    difficulty: 'easy',
    categoryTag: 'Enterprise Data Center vs. Corporate Office',
    comparisonLesson: 'Located right next to each other on Day Hill Road in Windsor, CT! The Ensono/Travelers Enterprise Data Center (300 Day Hill Rd) is a windowless white-roof module with a chilled-water plant and almost no cars, while Voya Financial next door has windowed offices and 1,200+ parking spaces.',
    dataCenter: FACILITY_LOCATIONS.find(f => f.id === 'dc-ct-ensono-windsor')!,
    decoy: FACILITY_LOCATIONS.find(f => f.id === 'decoy-ct-voya-windsor')!
  },
  {
    id: 'pair-ct-stamford-colo-vs-office',
    title: 'Stamford Financial Recon: CyrusOne COLO vs. Long Ridge Office Campus',
    difficulty: 'medium',
    categoryTag: 'Colocation (COLO) vs. Corporate Office',
    comparisonLesson: 'In Stamford, CT, CyrusOne’s NYM10 colocation facility at 10 Riverbend Drive packs its roof with CRAC heat rejection units and has a fenced generator yard, whereas Stamford corporate offices feature skylights and sprawling commuter parking.',
    dataCenter: FACILITY_LOCATIONS.find(f => f.id === 'dc-ct-cyrusone-stamford')!,
    decoy: FACILITY_LOCATIONS.find(f => f.id === 'decoy-ct-charter-stamford')!
  },
  {
    id: 'pair-ct-wallingford-vs-bloomfield',
    title: 'Central CT: Wallingford Edge Data Hub vs. Windsor Logistics Warehouse',
    difficulty: 'medium',
    categoryTag: 'Edge / Small Data Hub vs. Distribution',
    comparisonLesson: 'Wallingford’s Barnes Industrial data hub uses municipal utility power with external backup generators and rooftop chillers, whereas the Windsor/Bloomfield distribution warehouse is lined with 80+ semi-trailer loading bays.',
    dataCenter: FACILITY_LOCATIONS.find(f => f.id === 'dc-ct-chimenet-wallingford')!,
    decoy: FACILITY_LOCATIONS.find(f => f.id === 'decoy-ct-traderjoes-bloomfield')!
  },
  {
    id: 'pair-ct-waterbury-vs-hartford',
    title: 'CT Carrier Hotel vs. Hartford Insurance HQ',
    difficulty: 'medium',
    categoryTag: 'Edge / Small Data Hub vs. Corporate Office',
    comparisonLesson: 'TierPoint’s Waterbury data center at 108 Bank Street has a roof packed edge-to-edge with chillers and telecom gear, whereas Aetna’s Hartford campus is surrounded by huge employee parking garages and landscaped lawns.',
    dataCenter: FACILITY_LOCATIONS.find(f => f.id === 'dc-ct-tierpoint-waterbury')!,
    decoy: FACILITY_LOCATIONS.find(f => f.id === 'decoy-ct-aetna-hartford')!
  },

  {
    id: 'pair-ashburn-vs-amazon',
    title: 'Data Center Alley vs. Mega Fulfillment Center',
    difficulty: 'easy',
    categoryTag: 'Colocation (COLO) vs. Distribution',
    comparisonLesson: 'Both are 1M+ sq ft windowless concrete rectangles. However, the Equinix COLO campus is covered in rooftop chillers, ringed by diesel generators, and has almost no parking—while the Amazon fulfillment center is ringed by 18-wheeler loading docks and a 1,500-car employee lot.',
    dataCenter: FACILITY_LOCATIONS.find(f => f.id === 'dc-equinix-ashburn')!,
    decoy: FACILITY_LOCATIONS.find(f => f.id === 'decoy-amazon-ont8')!
  },
  {
    id: 'pair-google-vs-target',
    title: 'Hyperscale Cloud vs. Regional Retail Warehouse',
    difficulty: 'easy',
    categoryTag: 'Hyperscale vs. Distribution',
    comparisonLesson: 'Hyperscale server halls (like Google Council Bluffs) and regional retail warehouses (like Target) share long, narrow modular footprints. The giveaway is the high-voltage electrical substation and cooling towers at Google vs. the wide tractor-trailer turning aprons at Target.',
    dataCenter: FACILITY_LOCATIONS.find(f => f.id === 'dc-google-council-bluffs')!,
    decoy: FACILITY_LOCATIONS.find(f => f.id === 'decoy-target-dc-midlothian')!
  },
  {
    id: 'pair-meta-vs-uline',
    title: 'Campus Grid Showdown: Hyperscale vs. Shipping Supply',
    difficulty: 'medium',
    categoryTag: 'Hyperscale vs. Distribution',
    comparisonLesson: 'Both campuses arrange gigantic white rectangular buildings in a neat geometric grid. Look at the spine of Meta’s roofs (continuous mechanical air-handler penthouses + on-site substation) vs. Uline’s bare white roofs and rows of rear semi-truck bays.',
    dataCenter: FACILITY_LOCATIONS.find(f => f.id === 'dc-meta-prineville')!,
    decoy: FACILITY_LOCATIONS.find(f => f.id === 'decoy-uline-distribution-pleasant-prairie')!
  },
  {
    id: 'pair-switch-vs-tesla',
    title: 'Desert Neighbors: Switch Citadel vs. Tesla Gigafactory',
    difficulty: 'medium',
    categoryTag: 'Colocation (COLO) vs. Manufacturing',
    comparisonLesson: 'Located just 1.5 miles apart in the Tahoe Reno Industrial Center! Switch Citadel has almost zero cars outside and hundreds of external T-SCIF HVAC units lining its walls, whereas Tesla Gigafactory is surrounded by thousands of employee cars and shipping docks.',
    dataCenter: FACILITY_LOCATIONS.find(f => f.id === 'dc-switch-citadel')!,
    decoy: FACILITY_LOCATIONS.find(f => f.id === 'decoy-tesla-giga-nevada')!
  },
  {
    id: 'pair-elkgrove-neighbors',
    title: 'Same Industrial Park: Elk Grove COLO vs. Air Freight Warehouse',
    difficulty: 'medium',
    categoryTag: 'Colocation (COLO) vs. Distribution',
    comparisonLesson: 'Located blocks apart near Chicago O’Hare Airport. Both are precast concrete boxes, but the COLO data center has a ComEd substation next door and symmetrical rooftop chillers, while the Prologis warehouse has a bare roof and 18-wheeler docks.',
    dataCenter: FACILITY_LOCATIONS.find(f => f.id === 'dc-cyxtera-elk-grove')!,
    decoy: FACILITY_LOCATIONS.find(f => f.id === 'decoy-prologis-elk-grove')!
  },
  {
    id: 'pair-santaclara-vs-cisco',
    title: 'Silicon Valley: COLO Powerhouse vs. Corporate Tech Campus',
    difficulty: 'easy',
    categoryTag: 'Colocation (COLO) vs. Corporate Office',
    comparisonLesson: 'In Silicon Valley, corporate tech campuses (like Cisco) dedicate most of their land to tree-lined employee parking and windowed offices. Santa Clara COLO campuses (like Digital Realty) pack every square foot of roof with chillers and have tiny parking lots.',
    dataCenter: FACILITY_LOCATIONS.find(f => f.id === 'dc-digital-realty-santa-clara')!,
    decoy: FACILITY_LOCATIONS.find(f => f.id === 'decoy-cisco-san-jose')!
  },
  {
    id: 'pair-cold-storage-trap',
    title: 'The Ultimate Doppelgänger: Data Center vs. Cold Storage Freezer',
    difficulty: 'hard',
    categoryTag: 'Colocation (COLO) vs. Cold Storage',
    comparisonLesson: 'Cold storage warehouses are the #1 satellite look-alike for data centers because both are windowless insulated concrete boxes with heavy rooftop cooling machinery. The key distinction: Cold storage has 40+ refrigerated semi-truck loading docks; the data center has diesel generators and an electrical substation.',
    dataCenter: FACILITY_LOCATIONS.find(f => f.id === 'dc-qts-atlanta')!,
    decoy: FACILITY_LOCATIONS.find(f => f.id === 'decoy-lineage-cold-storage')!
  },
  {
    id: 'pair-quincy-vs-intel',
    title: 'Power Giants: Azure Hyperscale vs. Intel Semiconductor Fab',
    difficulty: 'hard',
    categoryTag: 'Hyperscale vs. Semiconductor Fab',
    comparisonLesson: 'Semiconductor fabs and hyperscale data centers both have huge substations and cooling towers. However, chip fabs require thousands of on-site engineers (notice the massive multi-story parking garages) and bulk cryogenic nitrogen/gas separation towers.',
    dataCenter: FACILITY_LOCATIONS.find(f => f.id === 'dc-microsoft-quincy')!,
    decoy: FACILITY_LOCATIONS.find(f => f.id === 'decoy-intel-ocotillo-fab')!
  },
  {
    id: 'pair-xai-vs-fedex-memphis',
    title: 'Memphis Giants: xAI "Colossus" Supercluster vs. FedEx Hub',
    difficulty: 'hard',
    categoryTag: 'AI Supercluster vs. Distribution',
    comparisonLesson: 'xAI converted a former Memphis appliance factory into a 100,000-GPU supercluster—its former truck yards are now packed with mobile gas turbines, Tesla Megapacks, and modular chillers, unlike logistics hubs filled with cargo containers and trailers.',
    dataCenter: FACILITY_LOCATIONS.find(f => f.id === 'dc-xai-colossus-memphis')!,
    decoy: FACILITY_LOCATIONS.find(f => f.id === 'decoy-fedex-memphis-hub')!
  },
  {
    id: 'pair-apple-icloud-vs-apple-campus',
    title: 'Apple Cloud vs. Apple Cubicles',
    difficulty: 'easy',
    categoryTag: 'Enterprise Data Center vs. Corporate Office',
    comparisonLesson: 'Apple’s Infinite Loop headquarters in Cupertino features curved glass offices, green courtyards, and thousands of employee parking spaces. Apple’s Maiden iCloud Data Center is a windowless white cool-roof fortress paired with a massive substation and solar/fuel-cell array.',
    dataCenter: FACILITY_LOCATIONS.find(f => f.id === 'dc-apple-maiden')!,
    decoy: FACILITY_LOCATIONS.find(f => f.id === 'decoy-apple-park-infinite-loop')!
  },
  {
    id: 'pair-nsa-vs-verizon',
    title: 'Fortress Compute vs. Corporate Operations HQ',
    difficulty: 'easy',
    categoryTag: 'Enterprise Data Center vs. Corporate Office',
    comparisonLesson: 'The NSA Utah Data Center has four symmetrical windowless halls, massive chiller plants, fuel tanks, and minimal parking. Verizon’s operations headquarters has glass terraces, artificial lakes, and sprawling commuter parking lots.',
    dataCenter: FACILITY_LOCATIONS.find(f => f.id === 'dc-nsa-utah')!,
    decoy: FACILITY_LOCATIONS.find(f => f.id === 'decoy-verizon-basking-ridge')!
  },
  {
    id: 'pair-coreweave-vs-americold',
    title: 'AI GPU Cluster vs. Frozen Food Logistics',
    difficulty: 'hard',
    categoryTag: 'AI Supercluster vs. Cold Storage',
    comparisonLesson: 'Both roofs have heavy thermal rejection machinery. Look at the perimeter walls: the AI data center has screened backup generator yards and zero truck bays, while Americold has a long concrete apron lined with 53-foot refrigerated trailers.',
    dataCenter: FACILITY_LOCATIONS.find(f => f.id === 'dc-coreweave-plano')!,
    decoy: FACILITY_LOCATIONS.find(f => f.id === 'decoy-americold-atlanta')!
  },
  {
    id: 'pair-vantage-vs-ikea',
    title: 'Rooftop Chiller Array vs. Rooftop Solar Warehouse',
    difficulty: 'medium',
    categoryTag: 'Colocation (COLO) vs. Distribution',
    comparisonLesson: 'At lower zoom, flat rooftop solar panels on a warehouse can look similar to rooftop equipment. Zooming in on Vantage Santa Clara reveals 3D cooling towers and an on-site utility substation, whereas IKEA has flat PV panels and hundreds of shipping containers.',
    dataCenter: FACILITY_LOCATIONS.find(f => f.id === 'dc-vantage-santa-clara')!,
    decoy: FACILITY_LOCATIONS.find(f => f.id === 'decoy-ikea-distribution-perryville')!
  },
  {
    id: 'pair-jpmorgan-vs-samsung',
    title: 'Tier IV Bank Data Center vs. Semiconductor Wafer Fab',
    difficulty: 'hard',
    categoryTag: 'Enterprise Data Center vs. Semiconductor Fab',
    comparisonLesson: 'JPMorgan’s Tier IV data center features twin 2N electrical yards and a thermal storage plant with very little parking. Samsung’s Austin chip fab is surrounded by huge multi-deck employee parking structures and bulk gas towers.',
    dataCenter: FACILITY_LOCATIONS.find(f => f.id === 'dc-jpmorgan-delaware')!,
    decoy: FACILITY_LOCATIONS.find(f => f.id === 'decoy-samsung-austin-fab')!
  },
  {
    id: 'pair-edge-spokane-vs-redwest',
    title: 'Regional Edge Data Hub vs. Suburban Office Park',
    difficulty: 'medium',
    categoryTag: 'Edge / Small Data Hub vs. Corporate Office',
    comparisonLesson: 'Small regional data hubs often sit inside normal suburban office parks. You can spot the Edge Data Hub by its windowless concrete walls, disproportionately dense rooftop HVAC units, and fenced diesel generator pad.',
    dataCenter: FACILITY_LOCATIONS.find(f => f.id === 'dc-tierpoint-spokane')!,
    decoy: FACILITY_LOCATIONS.find(f => f.id === 'decoy-microsoft-redwest')!
  },
  {
    id: 'pair-aws-ashburn-vs-sysco',
    title: 'Suburban Stealth AWS vs. Cold-Chain Distribution',
    difficulty: 'hard',
    categoryTag: 'Hyperscale vs. Cold Storage',
    comparisonLesson: 'AWS hides its rows of 3 MW backup generators behind acoustic screen walls in Northern Virginia. Sysco’s cold storage warehouse also has rooftop cooling units, but its yard is packed with 150+ silver refrigerated semi-trailers.',
    dataCenter: FACILITY_LOCATIONS.find(f => f.id === 'dc-aws-ashburn-loudoun')!,
    decoy: FACILITY_LOCATIONS.find(f => f.id === 'decoy-Sysco-houston')!
  },
  ...EXPANDED_CURATED_PAIRS
];

export const VISUAL_TELL_GUIDE = [
  {
    title: '1. Rooftop Chiller & Cooling Arrays',
    dataCenterSign: 'Dense, symmetrical rows of 3D mechanical chillers, adiabatic coolers, or evaporative cooling towers covering the roof or flanking the halls.',
    decoySign: 'Bare white membrane roofs, translucent skylight strips, or flat 2D solar panels.'
  },
  {
    title: '2. Generator Rows vs. 18-Wheeler Loading Docks',
    dataCenterSign: 'Long rows of identical rectangular diesel generator enclosures (with exhaust stacks) tucked behind security fences or screen walls.',
    decoySign: 'Wide concrete turning aprons (130+ ft) with painted yellow stripes and dozens of 53-foot semi-trailers backed into bay doors.'
  },
  {
    title: '3. High-Voltage Electrical Substations',
    dataCenterSign: 'Dedicated on-site utility substations (50 MW to 500+ MW) with high-voltage transmission lines terminating directly at the facility.',
    decoySign: 'Standard commercial 3-phase pad-mounted transformers (except semiconductor fabs, which also have substations).'
  },
  {
    title: '4. The Parking Lot Paradox',
    dataCenterSign: 'Tiny parking lots (often 20–50 spaces) next to a $1B+ million-square-foot building—servers don’t drive to work!',
    decoySign: 'Sprawling surface lots or multi-story parking garages holding 1,000 to 5,000 cars for office workers, fulfillment pickers, or fab technicians.'
  },
  {
    title: '5. Security Perimeter & Standoff Distance',
    dataCenterSign: 'Anti-ram K12 crash bollards, double-layer ornamental iron fencing, sally-port vehicle airlocks, and zero ground-floor windows.',
    decoySign: 'Landscaped glass lobbies, decorative ponds, or open truck marshaling yards.'
  }
];

export interface SizeEnergyTaxonomyTier {
  tierCode: string;
  subtype: DataCenterSubtype;
  label: string;
  powerRangeMW: string;
  annualEnergyGWh: string;
  equivHomesPowered: string;
  buildingSqFt: string;
  parcelAcres: string;
  rackCount: string;
  gridFeedVoltage: string;
  backupGenerators: string;
  coolingArchitecture: string;
  zoningClassification: string;
  satelliteFootprintSignature: string;
}

export const SIZE_ENERGY_TAXONOMY: SizeEnergyTaxonomyTier[] = [
  {
    tierCode: 'TIER 01 // MICRO / ACCESSORY',
    subtype: 'Suspected Small-Scale Server Room',
    label: 'Suspected Small-Scale Server Room / Accessory IT Suite',
    powerRangeMW: '0.5 – 3 MW',
    annualEnergyGWh: '4 – 22 GWh / yr',
    equivHomesPowered: '~400 – 2,000 homes',
    buildingSqFt: '5,000 – 20,000 sq ft (Suite inside larger building)',
    parcelAcres: '1 – 5 acres (Shared office/lab lot)',
    rackCount: '50 – 250 racks',
    gridFeedVoltage: '13.8 kV municipal distribution feed (Pad-mounted transformer)',
    backupGenerators: '1 – 2 diesel generators (750 kW – 2 MW) in rear parking enclosure',
    coolingArchitecture: 'Localized rooftop split DX / CRAC dry-coolers over server suite',
    zoningClassification: 'Accessory Commercial / Office Use (Often unpermitted as principal data center)',
    satelliteFootprintSignature: 'Looks like a normal office or telecom building, except one section of roof or rear parking lot has clustered dry-coolers and a fenced generator pad.'
  },
  {
    tierCode: 'TIER 02 // REGIONAL EDGE',
    subtype: 'Edge / Small Data Hub',
    label: 'Edge / Small Data Hub & Carrier Hotel',
    powerRangeMW: '3 – 15 MW',
    annualEnergyGWh: '22 – 110 GWh / yr',
    equivHomesPowered: '~2,000 – 10,500 homes',
    buildingSqFt: '25,000 – 75,000 sq ft',
    parcelAcres: '3 – 10 acres',
    rackCount: '250 – 1,200 racks',
    gridFeedVoltage: '13.8 kV – 34.5 kV dual utility underground feeders',
    backupGenerators: '2 – 6 diesel generators (2 – 3 MW each) in walled yard',
    coolingArchitecture: 'Rooftop air-cooled chiller banks + telecom fiber/microwave roof penthouses',
    zoningClassification: 'Light Industrial / Commercial Telecom Overlay (Special Permit)',
    satelliteFootprintSignature: 'Compact windowless or carrier-hotel structure with 50%+ of roof covered in chillers, fenced generator compound, and < 30 parking spaces.'
  },
  {
    tierCode: 'TIER 03 // ENTERPRISE',
    subtype: 'Enterprise Data Center',
    label: 'Enterprise Data Center (Bank, Insurance, Broadcast, Gov)',
    powerRangeMW: '10 – 65 MW',
    annualEnergyGWh: '75 – 480 GWh / yr',
    equivHomesPowered: '~7,000 – 45,000 homes',
    buildingSqFt: '100,000 – 450,000 sq ft',
    parcelAcres: '15 – 50 acres',
    rackCount: '1,000 – 5,000 racks',
    gridFeedVoltage: '69 kV – 115 kV redundant 2N transmission Tap / Substation',
    backupGenerators: '6 – 24 diesel generators (2.5 – 3 MW each) + bulk belly/yard fuel tanks',
    coolingArchitecture: 'Central chilled-water plant, cooling towers, or thermal storage tanks',
    zoningClassification: 'Campus Industrial / Planned Development District (High-Security Setbacks)',
    satelliteFootprintSignature: 'Hardened windowless data hall with twin (2N) electrical switchgear yards, perimeter crash bollards, guardhouse, and tiny employee lot.'
  },
  {
    tierCode: 'TIER 04 // COLOCATION (COLO)',
    subtype: 'Colocation (COLO)',
    label: 'Wholesale & Retail Colocation Campus',
    powerRangeMW: '15 – 300+ MW',
    annualEnergyGWh: '110 – 2,200+ GWh / yr',
    equivHomesPowered: '~10,500 – 210,000 homes',
    buildingSqFt: '150,000 – 1,300,000+ sq ft',
    parcelAcres: '15 – 120 acres',
    rackCount: '2,000 – 25,000+ racks',
    gridFeedVoltage: '115 kV – 230 kV dedicated on-site utility substation',
    backupGenerators: '10 – 80+ diesel generators (3 MW each) lined up in regimented rows',
    coolingArchitecture: 'Wall-to-wall rooftop closed-loop chillers or perimeter modular HVAC gills',
    zoningClassification: 'Heavy Industrial / Dedicated Data Center Overlay Zone (Acoustic & Grid Review)',
    satelliteFootprintSignature: 'Every square foot of roof is packed with symmetrical white/gray chillers; long rows of generator enclosures replace semi-truck docks.'
  },
  {
    tierCode: 'TIER 05 // HYPERSCALE & AI',
    subtype: 'Hyperscale',
    label: 'Hyperscale Cloud & AI Supercluster Campus',
    powerRangeMW: '100 – 1,000+ MW (0.1 – 1+ GW)',
    annualEnergyGWh: '800 – 8,000+ GWh / yr',
    equivHomesPowered: '~75,000 – 750,000+ homes (City-scale load)',
    buildingSqFt: '500,000 – 4,600,000+ sq ft',
    parcelAcres: '100 – 1,000+ acres',
    rackCount: '25,000 – 100,000+ high-density GPU/TPU racks (up to 100 kW/rack)',
    gridFeedVoltage: '230 kV – 500 kV bulk transmission lines + multi-bay utility substations',
    backupGenerators: '40 – 150+ generators, on-site gas turbines, or Megapack BESS arrays',
    coolingArchitecture: 'Direct-to-chip liquid cooling + evaporative cooling tower plumes + thermal ponds',
    zoningClassification: 'Regional Utility / Mega-Industrial Siting Council Jurisdiction',
    satelliteFootprintSignature: 'Regimented grid of elongated H-shaped or parallel halls wired directly into a massive 345/500 kV transmission substation.'
  }
];

