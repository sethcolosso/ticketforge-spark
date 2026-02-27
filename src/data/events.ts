import event1 from "@/assets/event-1.png";
import event2 from "@/assets/event-2.png";
import event3 from "@/assets/event-3.png";

export interface TicketType {
  id: string;
  name: string;
  price: number;
  description: string;
  available: number;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  date: string;
  time: string;
  location: string;
  venue: string;
  image: string;
  description: string;
  longDescription: string;
  category: string;
  tickets: TicketType[];
  featured: boolean;
  soldOut: boolean;
}

export const events: Event[] = [
  {
    id: "1",
    title: "Neon Nights: Underground Electronic",
    slug: "neon-nights-underground-electronic",
    date: "2026-04-15",
    time: "9:00 PM",
    location: "Brooklyn, NY",
    venue: "The Warehouse District",
    image: event1,
    description: "An immersive electronic music experience in a converted industrial warehouse.",
    longDescription: "Step into a world of pulsating beats and mesmerizing visuals at Neon Nights. This underground electronic event transforms a raw industrial warehouse into a multi-sensory playground featuring world-class DJs, immersive light installations, and interactive art spaces. Expect deep house, techno, and experimental electronic sounds across three uniquely designed stages.",
    category: "Music",
    featured: true,
    soldOut: false,
    tickets: [
      { id: "t1", name: "General Admission", price: 45, description: "Access to all stages and areas", available: 200 },
      { id: "t2", name: "VIP Experience", price: 120, description: "Priority entry, VIP lounge, complimentary drinks", available: 50 },
      { id: "t3", name: "Artist Meet & Greet", price: 250, description: "VIP + backstage access and artist meet & greet", available: 15 },
    ],
  },
  {
    id: "2",
    title: "Urban Block Party Festival",
    slug: "urban-block-party-festival",
    date: "2026-05-22",
    time: "2:00 PM",
    location: "Austin, TX",
    venue: "6th Street Block",
    image: event2,
    description: "A massive outdoor block party with live bands, food trucks, and street art.",
    longDescription: "The Urban Block Party Festival takes over six city blocks for an all-day celebration of music, food, and culture. Featuring over 20 live bands across four outdoor stages, 40+ curated food vendors, live street art murals, and interactive community installations. From indie rock to hip-hop, this festival celebrates the diversity of urban culture.",
    category: "Festival",
    featured: true,
    soldOut: false,
    tickets: [
      { id: "t4", name: "Day Pass", price: 65, description: "Full day access to all stages and areas", available: 500 },
      { id: "t5", name: "Weekend Pass", price: 110, description: "Access for both Saturday and Sunday", available: 300 },
      { id: "t6", name: "VIP Weekend", price: 225, description: "Weekend access with VIP areas and premium viewing", available: 75 },
    ],
  },
  {
    id: "3",
    title: "After Dark: Art & Sound Exhibition",
    slug: "after-dark-art-sound-exhibition",
    date: "2026-03-28",
    time: "7:00 PM",
    location: "Los Angeles, CA",
    venue: "The Gallery DTLA",
    image: event3,
    description: "Where contemporary art meets experimental sound in an intimate gallery setting.",
    longDescription: "After Dark merges the worlds of visual art and experimental music in an intimate gallery space. Experience curated installations from emerging artists, live sound performances, and interactive digital art pieces. The evening includes a guided gallery walk, artist talks, and a closing DJ set in the courtyard.",
    category: "Art",
    featured: false,
    soldOut: false,
    tickets: [
      { id: "t7", name: "General Entry", price: 30, description: "Gallery access and performances", available: 150 },
      { id: "t8", name: "Collector's Pass", price: 85, description: "Early access, catalog, and artist reception", available: 40 },
    ],
  },
  {
    id: "4",
    title: "Concrete Jungle: Hip-Hop Showcase",
    slug: "concrete-jungle-hiphop-showcase",
    date: "2026-06-10",
    time: "8:00 PM",
    location: "Chicago, IL",
    venue: "Metro Chicago",
    image: event1,
    description: "Featuring the hottest emerging hip-hop artists and producers.",
    longDescription: "Concrete Jungle brings together the next generation of hip-hop talent for an explosive night of raw lyricism and hard-hitting beats. Featuring 8 emerging artists, live producer battles, and freestyle sessions. This is where tomorrow's headliners are discovered today.",
    category: "Music",
    featured: false,
    soldOut: false,
    tickets: [
      { id: "t9", name: "General Admission", price: 35, description: "Standing room access", available: 300 },
      { id: "t10", name: "Front Row VIP", price: 95, description: "Reserved front section + merch pack", available: 30 },
    ],
  },
  {
    id: "5",
    title: "Rooftop Sessions: Sunset Edition",
    slug: "rooftop-sessions-sunset",
    date: "2026-07-04",
    time: "5:00 PM",
    location: "Miami, FL",
    venue: "Skyline Terrace",
    image: event2,
    description: "Chill vibes and deep house as the sun sets over the city skyline.",
    longDescription: "Join us on the rooftop for an unforgettable sunset session overlooking the Miami skyline. Deep house, tropical beats, and chill vibes from 5 PM until midnight. Full bar, gourmet bites, and an infinity pool backdrop.",
    category: "Music",
    featured: true,
    soldOut: true,
    tickets: [
      { id: "t11", name: "Sunset Pass", price: 55, description: "Rooftop access from 5 PM", available: 0 },
      { id: "t12", name: "Premium Sunset", price: 150, description: "Reserved daybed, bottle service", available: 0 },
    ],
  },
  {
    id: "6",
    title: "Punk Revival: Back to Basics",
    slug: "punk-revival-back-to-basics",
    date: "2026-04-30",
    time: "7:30 PM",
    location: "Portland, OR",
    venue: "The Roseland",
    image: event3,
    description: "Raw energy, loud guitars, and the spirit of punk in its purest form.",
    longDescription: "Three chords and the truth. Punk Revival brings together six bands that embody the raw, unfiltered spirit of punk rock. No pretension, no production — just pure energy in a legendary venue. Mosh pits encouraged.",
    category: "Music",
    featured: false,
    soldOut: false,
    tickets: [
      { id: "t13", name: "Pit Access", price: 25, description: "General admission standing", available: 400 },
      { id: "t14", name: "Balcony Reserved", price: 45, description: "Seated balcony with drink ticket", available: 80 },
    ],
  },
];

export const getEventBySlug = (slug: string) => events.find((e) => e.slug === slug);
export const getFeaturedEvents = () => events.filter((e) => e.featured);
export const getEventsByCategory = (category: string) =>
  category === "All" ? events : events.filter((e) => e.category === category);
export const getCategories = () => ["All", ...new Set(events.map((e) => e.category))];
