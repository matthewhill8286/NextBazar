export type Category = {
  id: number;
  name: string;
  slug: string;
  icon: string;
  count: number;
};

export type Listing = {
  id: string;
  title: string;
  slug: string;
  price: number | null;
  currency: string;
  priceType: "fixed" | "negotiable" | "free" | "contact";
  category: string;
  categorySlug: string;
  location: string;
  condition: string | null;
  image: string;
  images: string[];
  seller: {
    name: string;
    verified: boolean;
    rating: number;
    reviews: number;
    memberSince: string;
    activeListings: number;
    avatar: string;
  };
  promoted: boolean;
  urgent: boolean;
  views: number;
  favorites: number;
  postedAt: string;
  description: string;
};

export const CATEGORIES: Category[] = [
  { id: 1, name: "Vehicles", slug: "vehicles", icon: "🚗", count: 12840 },
  { id: 2, name: "Property", slug: "property", icon: "🏠", count: 8920 },
  { id: 3, name: "Electronics", slug: "electronics", icon: "💻", count: 15600 },
  { id: 4, name: "Furniture", slug: "furniture", icon: "🪑", count: 6300 },
  { id: 5, name: "Fashion", slug: "fashion", icon: "👗", count: 9100 },
  { id: 6, name: "Jobs", slug: "jobs", icon: "💼", count: 4200 },
  { id: 7, name: "Services", slug: "services", icon: "🔧", count: 3800 },
  { id: 8, name: "Sports", slug: "sports", icon: "⚽", count: 2900 },
];

export const LOCATIONS = [
  "All Locations",
  "Nicosia",
  "Limassol",
  "Larnaca",
  "Paphos",
  "Famagusta",
  "Kyrenia",
];

export const LISTINGS: Listing[] = [
  {
    id: "1",
    title: "BMW 320i M Sport 2023",
    slug: "bmw-320i-m-sport-2023",
    price: 38500,
    currency: "€",
    priceType: "negotiable",
    category: "Vehicles",
    categorySlug: "vehicles",
    location: "Limassol",
    condition: "Like New",
    image:
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800&h=600&fit=crop",
    ],
    seller: {
      name: "AutoPro Dealers",
      verified: true,
      rating: 4.9,
      reviews: 87,
      memberSince: "2022",
      activeListings: 34,
      avatar: "A",
    },
    promoted: true,
    urgent: false,
    views: 1240,
    favorites: 89,
    postedAt: "2h ago",
    description:
      "Full service history, one owner, M Sport package with all extras. Adaptive LED headlights, Harman Kardon sound system, panoramic sunroof. Still under BMW warranty until 2026.",
  },
  {
    id: "2",
    title: "Luxury 3-Bed Apartment Sea View",
    slug: "luxury-3-bed-apartment-sea-view",
    price: 285000,
    currency: "€",
    priceType: "fixed",
    category: "Property",
    categorySlug: "property",
    location: "Paphos",
    condition: null,
    image:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
    ],
    seller: {
      name: "Coastal Realty",
      verified: true,
      rating: 4.8,
      reviews: 52,
      memberSince: "2021",
      activeListings: 18,
      avatar: "C",
    },
    promoted: true,
    urgent: false,
    views: 3200,
    favorites: 210,
    postedAt: "5h ago",
    description:
      "Stunning sea-view apartment in the heart of Paphos. Walking distance to the harbour, fully furnished with premium finishes. 3 bedrooms, 2 bathrooms, underground parking.",
  },
  {
    id: "3",
    title: 'MacBook Pro 16" M3 Max',
    slug: "macbook-pro-16-m3-max",
    price: 2800,
    currency: "€",
    priceType: "fixed",
    category: "Electronics",
    categorySlug: "electronics",
    location: "Nicosia",
    condition: "Like New",
    image:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=600&fit=crop",
    ],
    seller: {
      name: "TechMatt",
      verified: true,
      rating: 5.0,
      reviews: 12,
      memberSince: "2023",
      activeListings: 3,
      avatar: "T",
    },
    promoted: false,
    urgent: true,
    views: 890,
    favorites: 67,
    postedAt: "1h ago",
    description:
      "M3 Max chip, 36GB RAM, 1TB SSD. Barely used, still under AppleCare+ until 2027. Comes with original box, charger and USB-C hub.",
  },
  {
    id: "4",
    title: "Italian Leather Sofa Set",
    slug: "italian-leather-sofa-set",
    price: 1200,
    currency: "€",
    priceType: "negotiable",
    category: "Furniture",
    categorySlug: "furniture",
    location: "Limassol",
    condition: "Good",
    image:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop",
    ],
    seller: {
      name: "Maria K.",
      verified: false,
      rating: 4.5,
      reviews: 6,
      memberSince: "2024",
      activeListings: 2,
      avatar: "M",
    },
    promoted: false,
    urgent: false,
    views: 340,
    favorites: 28,
    postedAt: "1d ago",
    description:
      "Beautiful Italian leather 3-piece sofa set in cognac brown. Minor wear on armrests but overall excellent condition. Collection from Limassol.",
  },
  {
    id: "5",
    title: "iPhone 15 Pro Max 256GB",
    slug: "iphone-15-pro-max-256gb",
    price: 950,
    currency: "€",
    priceType: "fixed",
    category: "Electronics",
    categorySlug: "electronics",
    location: "Larnaca",
    condition: "New",
    image:
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&h=600&fit=crop",
    ],
    seller: {
      name: "PhoneHub",
      verified: true,
      rating: 4.7,
      reviews: 98,
      memberSince: "2020",
      activeListings: 45,
      avatar: "P",
    },
    promoted: false,
    urgent: false,
    views: 1560,
    favorites: 120,
    postedAt: "3h ago",
    description:
      "Brand new, sealed in box. Natural Titanium color. Full 1-year Apple warranty. Can deliver anywhere in Cyprus.",
  },
  {
    id: "6",
    title: "Mountain Bike Trek Marlin 7",
    slug: "mountain-bike-trek-marlin-7",
    price: 650,
    currency: "€",
    priceType: "negotiable",
    category: "Sports",
    categorySlug: "sports",
    location: "Nicosia",
    condition: "Good",
    image:
      "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=800&h=600&fit=crop",
    ],
    seller: {
      name: "Chris P.",
      verified: false,
      rating: 4.3,
      reviews: 4,
      memberSince: "2024",
      activeListings: 1,
      avatar: "C",
    },
    promoted: false,
    urgent: false,
    views: 210,
    favorites: 15,
    postedAt: "2d ago",
    description:
      "2022 model, well maintained. New tires and brakes fitted recently. Perfect for mountain trails around Troodos.",
  },
  {
    id: "7",
    title: "Senior React Developer",
    slug: "senior-react-developer",
    price: null,
    currency: "€",
    priceType: "contact",
    category: "Jobs",
    categorySlug: "jobs",
    location: "Nicosia",
    condition: null,
    image:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop",
    ],
    seller: {
      name: "TechCorp Cyprus",
      verified: true,
      rating: 4.6,
      reviews: 15,
      memberSince: "2021",
      activeListings: 8,
      avatar: "T",
    },
    promoted: true,
    urgent: false,
    views: 2800,
    favorites: 45,
    postedAt: "6h ago",
    description:
      "Join our growing team! Remote-friendly, competitive salary, equity options. Looking for 3+ years React experience, TypeScript proficiency, and familiarity with Next.js.",
  },
  {
    id: "8",
    title: "Mercedes C200 AMG Line 2022",
    slug: "mercedes-c200-amg-line-2022",
    price: 42000,
    currency: "€",
    priceType: "negotiable",
    category: "Vehicles",
    categorySlug: "vehicles",
    location: "Nicosia",
    condition: "Like New",
    image:
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&h=600&fit=crop",
    ],
    seller: {
      name: "Premium Motors",
      verified: true,
      rating: 4.8,
      reviews: 63,
      memberSince: "2019",
      activeListings: 22,
      avatar: "P",
    },
    promoted: false,
    urgent: false,
    views: 980,
    favorites: 72,
    postedAt: "8h ago",
    description:
      "AMG Line, Night Package, MBUX infotainment. Full dealer service history, single owner. 25,000km only.",
  },
  {
    id: "9",
    title: "Designer Dress Collection",
    slug: "designer-dress-collection",
    price: 180,
    currency: "€",
    priceType: "fixed",
    category: "Fashion",
    categorySlug: "fashion",
    location: "Limassol",
    condition: "New",
    image:
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=600&fit=crop",
    ],
    seller: {
      name: "Elena's Boutique",
      verified: true,
      rating: 4.9,
      reviews: 34,
      memberSince: "2022",
      activeListings: 12,
      avatar: "E",
    },
    promoted: false,
    urgent: false,
    views: 430,
    favorites: 56,
    postedAt: "12h ago",
    description:
      "Curated collection of 5 designer dresses, sizes S-M. Perfect for summer events. All brand new with tags attached.",
  },
  {
    id: "10",
    title: "Professional Home Cleaning",
    slug: "professional-home-cleaning",
    price: 25,
    currency: "€/hr",
    priceType: "fixed",
    category: "Services",
    categorySlug: "services",
    location: "Paphos",
    condition: null,
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=600&fit=crop",
    ],
    seller: {
      name: "CleanPro Services",
      verified: true,
      rating: 4.7,
      reviews: 41,
      memberSince: "2023",
      activeListings: 4,
      avatar: "C",
    },
    promoted: false,
    urgent: false,
    views: 620,
    favorites: 38,
    postedAt: "1d ago",
    description:
      "Professional deep cleaning service. Eco-friendly products. Reliable and thorough. Serving the entire Paphos district.",
  },
  {
    id: "11",
    title: "Gaming PC RTX 4080 Setup",
    slug: "gaming-pc-rtx-4080-setup",
    price: 2200,
    currency: "€",
    priceType: "negotiable",
    category: "Electronics",
    categorySlug: "electronics",
    location: "Nicosia",
    condition: "Like New",
    image:
      "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&h=600&fit=crop",
    ],
    seller: {
      name: "GameZone",
      verified: false,
      rating: 4.4,
      reviews: 8,
      memberSince: "2024",
      activeListings: 5,
      avatar: "G",
    },
    promoted: false,
    urgent: true,
    views: 760,
    favorites: 91,
    postedAt: "4h ago",
    description:
      'RTX 4080, Ryzen 7 7800X3D, 32GB DDR5, 2TB NVMe. Includes 27" 165Hz monitor, mechanical keyboard and mouse. Everything you need to game.',
  },
  {
    id: "12",
    title: "Penthouse Duplex with Pool",
    slug: "penthouse-duplex-with-pool",
    price: 520000,
    currency: "€",
    priceType: "fixed",
    category: "Property",
    categorySlug: "property",
    location: "Limassol",
    condition: null,
    image:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
    ],
    seller: {
      name: "Luxury Living RE",
      verified: true,
      rating: 5.0,
      reviews: 28,
      memberSince: "2020",
      activeListings: 15,
      avatar: "L",
    },
    promoted: true,
    urgent: false,
    views: 4500,
    favorites: 320,
    postedAt: "1d ago",
    description:
      "Spectacular penthouse duplex with private rooftop pool and 360-degree views. Smart home system, private elevator, two underground parking spaces.",
  },
];

// Helper functions
export function getListingBySlug(slug: string): Listing | undefined {
  return LISTINGS.find((l) => l.slug === slug);
}

export function getListingsByCategory(categorySlug: string): Listing[] {
  const cat = CATEGORIES.find((c) => c.slug === categorySlug);
  if (!cat) return [];
  return LISTINGS.filter((l) => l.categorySlug === categorySlug);
}

export function searchListings(query: string): Listing[] {
  const q = query.toLowerCase();
  return LISTINGS.filter(
    (l) =>
      l.title.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q) ||
      l.category.toLowerCase().includes(q),
  );
}

export function formatPrice(listing: Listing): string {
  if (listing.price === null) return "Contact";
  return `${listing.currency}${listing.price.toLocaleString()}`;
}
