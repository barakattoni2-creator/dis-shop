// Pre-database fallback only (see services/db/categories.js's merge logic) —
// slugs match the real Category rows so a product's `category` field keeps
// working once a database is connected. Names mirror the current main
// category names where a direct 1:1 mapping exists.
//
// "home-kitchen" and "household-supplies" are deliberately absent: those
// slugs were repurposed in the database (renamed to "kitchen-items" and
// "household" — see CategoryRedirect) rather than deleted, so leaving them
// here would make the DB<->static merge in fetchCategories() resurrect the
// old, now-redirected slugs as if they were still-live categories.
export interface StaticCategory {
  slug: string;
  name: string;
  icon: string;
}

export const categories: StaticCategory[] = [
  { slug: "air-conditioners", name: "Gree Air Conditioners", icon: "❄️" },
  { slug: "solar", name: "Solar Energy", icon: "☀️" },
  { slug: "electrical", name: "Electrical", icon: "🔌" },
  { slug: "tools", name: "EMTOP Tools", icon: "🔧" },
  { slug: "cleaning-laundry", name: "Cleaning Materials", icon: "🧼" },
  { slug: "lighting", name: "Lighting", icon: "💡" },
  { slug: "water-pumps", name: "Water Pumps", icon: "🚰" },
  { slug: "generators", name: "Generators", icon: "🔋" },
];

export const brands: string[] = ["Gree", "Sonifer", "EMTOP", "Total", "Spartan", "Felicity", "Deye"];

const colorFor = (seed: number): string => {
  const colors = [
    "#DCEAFB",
    "#FCE4D0",
    "#E5ECF3",
    "#FBEEDD",
    "#D6E8FA",
    "#FAD9B8",
    "#E8F0F8",
    "#F7E0C4",
  ];
  return colors[seed % colors.length];
};

export interface StaticProduct {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  badge: string | null;
  isNew: boolean;
  color: string;
  description: string;
  specs: Record<string, string>;
}

// A few products below reference "home-kitchen"/"household-supplies" —
// slugs deliberately no longer present in `categories` above (see that
// export's comment). Harmless today: this whole file is a pre-database
// fallback and DATABASE_URL is configured in every real environment, so
// it's dormant, not loaded. Left as-is rather than rewritten here, since
// fixing demo content is a separate concern from this TypeScript pass.
export const products: StaticProduct[] = [
  {
    id: "p1",
    name: "1.5HP Split Air Conditioner",
    category: "air-conditioners",
    brand: "Gree",
    price: 450.0,
    originalPrice: 520.0,
    rating: 4.6,
    reviews: 128,
    badge: "Best Seller",
    isNew: false,
    color: colorFor(0),
    description:
      "A reliable 1.5HP split unit built to cool bedrooms and small offices even during Juba's hottest months, with a low-noise indoor fan and energy-saving compressor.",
    specs: {
      "Cooling Capacity": "12,000 BTU",
      "Power Consumption": "1,350W",
      Warranty: "1 Year",
    },
  },
  {
    id: "p2",
    name: "2HP Split Air Conditioner — Inverter",
    category: "air-conditioners",
    brand: "Gree",
    price: 620.0,
    originalPrice: 699.0,
    rating: 4.7,
    reviews: 94,
    badge: "Deal",
    isNew: true,
    color: colorFor(1),
    description:
      "Inverter technology adjusts compressor speed to hold a steady temperature and cut electricity use, making this 2HP unit a strong fit for living rooms and shops.",
    specs: {
      "Cooling Capacity": "18,000 BTU",
      "Power Consumption": "1,900W",
      Warranty: "2 Years",
    },
  },
  {
    id: "p3",
    name: "Portable Air Conditioner Unit (12000 BTU)",
    category: "air-conditioners",
    brand: "Gree",
    price: 380.0,
    originalPrice: 430.0,
    rating: 4.3,
    reviews: 61,
    badge: null,
    isNew: false,
    color: colorFor(2),
    description:
      "No fixed installation needed — roll this unit into any room, vent it through a window, and get instant cooling for rentals or rooms without wall-mount space.",
    specs: {
      "Cooling Capacity": "12,000 BTU",
      "Power Consumption": "1,300W",
      Warranty: "1 Year",
    },
  },
  {
    id: "p4",
    name: "300W Monocrystalline Solar Panel",
    category: "solar",
    brand: "Felicity",
    price: 165.0,
    originalPrice: 195.0,
    rating: 4.8,
    reviews: 203,
    badge: "Best Seller",
    isNew: false,
    color: colorFor(3),
    description:
      "High-efficiency monocrystalline cells deliver strong output even on overcast days — a solid building block for home or small business solar arrays.",
    specs: {
      Output: "300W",
      Type: "Monocrystalline",
      Warranty: "2 Years",
    },
  },
  {
    id: "p5",
    name: "3kVA Solar Power Inverter",
    category: "solar",
    brand: "Deye",
    price: 540.0,
    originalPrice: 610.0,
    rating: 4.5,
    reviews: 87,
    badge: "Deal",
    isNew: true,
    color: colorFor(4),
    description:
      "Converts stored solar power into clean AC electricity for your home, with a built-in charge controller and automatic switchover when the grid goes down.",
    specs: {
      Capacity: "3kVA",
      "Input Voltage": "24V DC",
      Warranty: "2 Years",
    },
  },
  {
    id: "p6",
    name: "200Ah Deep Cycle Solar Battery",
    category: "solar",
    brand: "Felicity",
    price: 310.0,
    originalPrice: 350.0,
    rating: 4.6,
    reviews: 76,
    badge: null,
    isNew: false,
    color: colorFor(5),
    description:
      "Deep-cycle design tolerates daily charge and discharge cycles without losing capacity, giving your solar system dependable power through the night.",
    specs: {
      Capacity: "200Ah",
      Voltage: "12V",
      Warranty: "1 Year",
    },
  },
  {
    id: "p7",
    name: "18V Cordless Drill Driver Set",
    category: "tools",
    brand: "EMTOP",
    price: 89.99,
    originalPrice: 119.99,
    rating: 4.5,
    reviews: 342,
    badge: "Best Seller",
    isNew: false,
    color: colorFor(6),
    description:
      "A go-anywhere cordless drill with two batteries and a full bit set, built for everything from furniture assembly to on-site electrical and plumbing work.",
    specs: {
      Voltage: "18V",
      "Battery Included": "2 x 1.5Ah",
      Warranty: "6 Months",
    },
  },
  {
    id: "p8",
    name: "Heavy-Duty Angle Grinder (4.5-inch)",
    category: "tools",
    brand: "Total",
    price: 54.99,
    originalPrice: 69.99,
    rating: 4.4,
    reviews: 156,
    badge: "Deal",
    isNew: false,
    color: colorFor(7),
    description:
      "A high-torque motor and reinforced guard make this grinder equally at home cutting rebar, sharpening blades, or smoothing welds on site.",
    specs: {
      "Disc Size": "4.5 inch",
      Power: "850W",
      Warranty: "6 Months",
    },
  },
  {
    id: "p9",
    name: "128-Piece Tool Box Set",
    category: "tools",
    brand: "Spartan",
    price: 74.99,
    originalPrice: 94.99,
    rating: 4.6,
    reviews: 210,
    badge: null,
    isNew: true,
    color: colorFor(0),
    description:
      "Sockets, wrenches, screwdrivers and pliers organized in a rugged carry case — a complete starter kit for home repairs or a first workshop toolbox.",
    specs: {
      Pieces: "128",
      Case: "Molded carry case",
      Warranty: "1 Year",
    },
  },
  {
    id: "p10",
    name: "Electric Kettle 1.7L Stainless Steel",
    category: "home-kitchen",
    brand: "Sonifer",
    price: 24.99,
    originalPrice: 32.99,
    rating: 4.5,
    reviews: 289,
    badge: "Best Seller",
    isNew: false,
    color: colorFor(1),
    description:
      "Boils a full 1.7 litres in minutes with auto shut-off and boil-dry protection — a dependable daily kettle for home or office.",
    specs: {
      Capacity: "1.7L",
      Power: "1,850W",
      Warranty: "1 Year",
    },
  },
  {
    id: "p11",
    name: "Standing Fan 18-inch, 3-Speed",
    category: "home-kitchen",
    brand: "Sonifer",
    price: 39.99,
    originalPrice: 49.99,
    rating: 4.3,
    reviews: 174,
    badge: null,
    isNew: false,
    color: colorFor(2),
    description:
      "An 18-inch oscillating fan with three speed settings and an adjustable height stand, built to move serious air through any room.",
    specs: {
      "Blade Size": "18 inch",
      Speeds: "3",
      Warranty: "1 Year",
    },
  },
  {
    id: "p12",
    name: "Blender & Juicer 1.5L",
    category: "home-kitchen",
    brand: "Sonifer",
    price: 34.99,
    originalPrice: 44.99,
    rating: 4.4,
    reviews: 132,
    badge: "Deal",
    isNew: false,
    color: colorFor(3),
    description:
      "A 1.5L glass jar and stainless steel blades handle smoothies, juices and crushed ice, backed by a powerful motor built for daily use.",
    specs: {
      Capacity: "1.5L",
      Power: "600W",
      Warranty: "1 Year",
    },
  },
  {
    id: "p13",
    name: "50m Heavy-Duty Extension Cable",
    category: "electrical",
    brand: "Total",
    price: 28.99,
    originalPrice: 36.99,
    rating: 4.6,
    reviews: 198,
    badge: "Best Seller",
    isNew: false,
    color: colorFor(4),
    description:
      "A 50-metre reel of heavy-duty cable with reinforced insulation, ideal for running power to workshops, generators or outdoor sites.",
    specs: {
      Length: "50m",
      Rating: "13A",
      Warranty: "1 Year",
    },
  },
  {
    id: "p14",
    name: "Circuit Breaker Distribution Box — 12 Way",
    category: "electrical",
    brand: "Total",
    price: 45.99,
    originalPrice: 54.99,
    rating: 4.5,
    reviews: 88,
    badge: null,
    isNew: true,
    color: colorFor(5),
    description:
      "A 12-way distribution board for organizing household or small commercial circuits, with clearly labeled breakers for safe, easy maintenance.",
    specs: {
      Ways: "12",
      Rating: "63A main",
      Warranty: "1 Year",
    },
  },
  {
    id: "p15",
    name: "Electrical Wire Roll 100m (2.5mm)",
    category: "electrical",
    brand: "EMTOP",
    price: 62.99,
    originalPrice: 74.99,
    rating: 4.7,
    reviews: 121,
    badge: "Deal",
    isNew: false,
    color: colorFor(6),
    description:
      "Copper-core 2.5mm wire on a full 100-metre roll, suited for household socket circuits and general wiring installations.",
    specs: {
      Length: "100m",
      "Core Size": "2.5mm",
      Warranty: "1 Year",
    },
  },
  {
    id: "p16",
    name: "LED Bulb 6-Pack (9W, Cool White)",
    category: "lighting",
    brand: "Sonifer",
    price: 12.99,
    originalPrice: 17.99,
    rating: 4.7,
    reviews: 412,
    badge: "Best Seller",
    isNew: false,
    color: colorFor(7),
    description:
      "Six long-life LED bulbs with bright cool-white output, using a fraction of the power of old incandescent bulbs.",
    specs: {
      Wattage: "9W",
      Lumens: "800lm",
      Warranty: "1 Year",
    },
  },
  {
    id: "p17",
    name: "Solar Street Light 100W with Motion Sensor",
    category: "lighting",
    brand: "Felicity",
    price: 58.99,
    originalPrice: 72.99,
    rating: 4.5,
    reviews: 96,
    badge: "Deal",
    isNew: true,
    color: colorFor(0),
    description:
      "A self-contained solar street light with built-in motion sensor and battery, perfect for compounds, gates and roads without grid access.",
    specs: {
      Wattage: "100W",
      Sensor: "Motion-activated",
      Warranty: "2 Years",
    },
  },
  {
    id: "p18",
    name: "Rechargeable LED Lantern",
    category: "lighting",
    brand: "Sonifer",
    price: 19.99,
    originalPrice: 26.99,
    rating: 4.4,
    reviews: 145,
    badge: null,
    isNew: false,
    color: colorFor(1),
    description:
      "A rechargeable lantern with hours of backup light, built for load-shedding evenings, camping trips or emergency use.",
    specs: {
      Runtime: "Up to 10 hrs",
      Battery: "Rechargeable Li-ion",
      Warranty: "6 Months",
    },
  },
  {
    id: "p19",
    name: "3.5L Digital Air Fryer",
    category: "home-kitchen",
    brand: "Sonifer",
    price: 49.99,
    originalPrice: 64.99,
    rating: 4.7,
    reviews: 231,
    badge: "Best Seller",
    isNew: true,
    color: colorFor(2),
    description:
      "Digital touch controls and a 3.5L basket make it easy to fry, roast and reheat with little to no oil — a healthier, faster way to cook daily meals.",
    specs: {
      Capacity: "3.5L",
      Power: "1,400W",
      Warranty: "1 Year",
    },
  },
  {
    id: "p20",
    name: "20L Water Dispenser with Stand",
    category: "household-supplies",
    brand: "Sonifer",
    price: 45.99,
    originalPrice: 56.99,
    rating: 4.4,
    reviews: 68,
    badge: "Deal",
    isNew: false,
    color: colorFor(3),
    description:
      "Hot and cold water at the press of a button — a sturdy floor-standing dispenser built for home, office or shop use.",
    specs: {
      Capacity: "20L bottle",
      Function: "Hot & Cold",
      Warranty: "1 Year",
    },
  },
  {
    id: "p21",
    name: "Heavy-Duty Plastic Storage Box Set (3pc)",
    category: "household-supplies",
    brand: "Total",
    price: 19.99,
    originalPrice: 26.99,
    rating: 4.3,
    reviews: 54,
    badge: null,
    isNew: false,
    color: colorFor(4),
    description:
      "Stackable, lockable storage boxes in three sizes to keep clothes, tools and household items organized and pest-free.",
    specs: {
      Pieces: "3",
      Material: "Reinforced plastic",
      Warranty: "6 Months",
    },
  },
  {
    id: "p22",
    name: "Laundry Basket with Wheels (60L)",
    category: "cleaning-laundry",
    brand: "Sonifer",
    price: 14.99,
    originalPrice: 19.99,
    rating: 4.2,
    reviews: 47,
    badge: null,
    isNew: false,
    color: colorFor(5),
    description:
      "A 60L wheeled laundry basket that rolls easily between rooms, with a breathable mesh body that keeps clothes fresh.",
    specs: {
      Capacity: "60L",
      Wheels: "4",
      Warranty: "6 Months",
    },
  },
  {
    id: "p23",
    name: "Multi-Surface Mop & Bucket Set",
    category: "cleaning-laundry",
    brand: "Spartan",
    price: 22.99,
    originalPrice: 29.99,
    rating: 4.5,
    reviews: 83,
    badge: "Deal",
    isNew: false,
    color: colorFor(6),
    description:
      "A spin mop and bucket set that wrings itself out, making daily floor cleaning faster with less mess.",
    specs: {
      Type: "Spin mop",
      "Bucket Capacity": "8L",
      Warranty: "6 Months",
    },
  },
  {
    id: "p24",
    name: "0.5HP Submersible Water Pump",
    category: "water-pumps",
    brand: "EMTOP",
    price: 68.99,
    originalPrice: 84.99,
    rating: 4.5,
    reviews: 39,
    badge: "Best Seller",
    isNew: false,
    color: colorFor(7),
    description:
      "Submerges directly into wells or tanks to move clean water efficiently — a reliable choice for home water supply.",
    specs: {
      Power: "0.5HP",
      "Max Flow": "3,000L/hr",
      Warranty: "1 Year",
    },
  },
  {
    id: "p25",
    name: "1HP Surface Water Pump",
    category: "water-pumps",
    brand: "Total",
    price: 94.99,
    originalPrice: 112.99,
    rating: 4.4,
    reviews: 28,
    badge: null,
    isNew: true,
    color: colorFor(0),
    description:
      "A self-priming surface pump built for boosting water pressure or transferring water from tanks and boreholes.",
    specs: {
      Power: "1HP",
      "Max Flow": "4,500L/hr",
      Warranty: "1 Year",
    },
  },
  {
    id: "p26",
    name: "2KVA Petrol Generator",
    category: "generators",
    brand: "Total",
    price: 320.0,
    originalPrice: 360.0,
    rating: 4.6,
    reviews: 61,
    badge: "Best Seller",
    isNew: false,
    color: colorFor(1),
    description:
      "A portable petrol generator that keeps essential lights and appliances running during power cuts, with a quiet-running engine.",
    specs: {
      Capacity: "2KVA",
      Fuel: "Petrol",
      Warranty: "1 Year",
    },
  },
  {
    id: "p27",
    name: "5KVA Diesel Generator",
    category: "generators",
    brand: "Deye",
    price: 780.0,
    originalPrice: 850.0,
    rating: 4.7,
    reviews: 33,
    badge: "Deal",
    isNew: true,
    color: colorFor(2),
    description:
      "A heavier-duty diesel generator for homes, shops and small offices that need dependable backup power for longer hours.",
    specs: {
      Capacity: "5KVA",
      Fuel: "Diesel",
      Warranty: "2 Years",
    },
  },
];
