// Seed content used on first run. After that, everything is edited from /admin.
const img = id => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`;

const content = {
  site: {
    name: 'Abhyudaya Events',
    tagline: 'Your Vision. Our Creation.',
    logo: '/assets/logo.png',
    logoMark: '/assets/logo-mark.png',
    announcement: 'Now booking college fests & corporate galas for the 2026–27 season',
    seoDescription: 'Abhyudaya Events — luxury event management, artist management, brand activations, digital marketing and college fest sponsorships across India.'
  },
  hero: {
    eyebrow: 'Luxury Event Management · India',
    title: 'We craft moments that become legends.',
    subtitle: 'From grand celebrations to high-impact brand experiences, we turn your vision into an unforgettable event, planned with precision and executed flawlessly.',
    ctaPrimary: 'Plan Your Event',
    ctaSecondary: 'Explore Services',
    video: '',
    images: [
      img('photo-1492684223066-81342ee5ff30'),
      img('photo-1540575467063-178a50c2df87'),
      img('photo-1519167758481-83f550bb49b3')
    ]
  },
  slides: [
    {
      "image": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80",
      "caption": "Concert Night",
      "category": "Concerts"
    },
    {
      "image": "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1000&q=80",
      "caption": "Royal Wedding Décor",
      "category": "Weddings"
    },
    {
      "image": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1000&q=80",
      "caption": "Corporate Summit",
      "category": "Corporate"
    },
    {
      "image": "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1000&q=80",
      "caption": "College Fest Main Stage",
      "category": "Fests"
    },
    {
      "image": "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1000&q=80",
      "caption": "Gala Dinner",
      "category": "Corporate"
    },
    {
      "image": "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1000&q=80",
      "caption": "Live Performance",
      "category": "Concerts"
    }
  ],
  events: [
    {
      "title": "Chogada Tara",
      "subtitle": "Tricity's Biggest Open Air Dandiya & Garba Night",
      "date": "2026-10-17T18:00",
      "showTime": false,
      "venue": "Circus Ground, Sector 17, Chandigarh",
      "organisers": "RoS Events × Abhyudaya Events",
      "lineup": [
        "AAHRMB Live Band",
        "DJ Chhavi",
        "DJ Samix",
        "DJ Stellar"
      ],
      "description": "Dress up, grab your dandiya and dance under the open sky with live music, top DJs and festive vibes all night long.",
      "posters": [
        "/assets/events/chogada-tara-poster.webp",
        "/assets/events/chogada-tara-lineup.webp"
      ],
      "ctaText": "DM for Passes",
      "ctaLink": "https://wa.me/917889231615?text=Hi!%20I%20would%20like%20passes%20for%20Chogada%20Tara%20on%2017%20October.",
      "phones": [
        "+91 78892 31615",
        "+91 70092 51977"
      ],
      "popup": true,
      "tag": "",
      "delay": 4
    }
  ],
  stats: [
    { value: 250, suffix: '+', label: 'Events Delivered' },
    { value: 120, suffix: '+', label: 'Artists Managed' },
    { value: 60, suffix: '+', label: 'Brand Partners' },
    { value: 50, suffix: 'K+', label: 'Audience Reached' }
  ],
  about: {
    title: 'Where vision meets flawless execution',
    text: 'Abhyudaya Events builds meaningful connections between brands, artists and audiences. Our team handles each event from first idea to the final bow, adding creative direction, careful logistics and our own on-ground crew so every guest leaves with a lasting impression.',
    image: '/assets/founder.webp',
    founder: 'Chakshush K Sharma',
    founderTitle: 'Founder'
  },
  objectives: [
    'To build meaningful connections between brands, artists and audiences.',
    'To create impactful experiences through creative solutions and seamless execution.',
    'To deliver value, inspire engagement and leave lasting impressions.'
  ],
  services: [
    { icon: 'calendar', title: 'Event Management', text: 'End-to-end planning and execution of memorable events with precision, creativity and flawless coordination.', points: ['Event Planning & Execution', 'Venue & Vendor Management', 'On-Ground Coordination'], image: img('photo-1505236858219-8359eb29e329') },
    { icon: 'mic', title: 'Artist Management', text: 'Comprehensive artist management and bookings for a wide range of events and appearances.', points: ['Artist Booking & Management', 'Negotiation & Contracts', 'Celebrity Appearances'], image: img('photo-1501386761578-eac5c94b800a') },
    { icon: 'megaphone', title: 'Digital Marketing', text: 'Powerful digital strategies and campaigns that build brand presence, engage audiences and deliver results.', points: ['Social Media Marketing', 'Digital Campaigns', 'Audience Engagement'], image: img('photo-1460925895917-afdab827c52f') },
    { icon: 'star', title: 'Brand Promotions & Activations', text: 'Innovative brand promotions and activations that connect your brand with the right audience in the most impactful way.', points: ['Brand Promotions', 'On-Ground Activations', 'Sponsorships & Partnerships'], image: img('photo-1475721027785-f74eccf877e2') },
    { icon: 'users', title: 'Manpower & Volunteer Support', text: 'Trained manpower and volunteers to ensure smooth operations for both corporate and cultural events.', points: ['Event Staff & Coordinators', 'Registration & Help Desk', 'Backstage Crew & Technical Support'], image: img('photo-1528605248644-14dd04022da1') },
    { icon: 'building', title: 'College Fest Support & Sponsorships', text: 'We help colleges and universities create extraordinary fests through partnerships, sponsorships and end-to-end support.', points: ['Sponsorship Opportunities', 'Brand Partnerships', 'Financial Support for Bigger Events'], image: img('photo-1533174072545-7a4b6ad7a6c3') }
  ],
  process: [
    { title: 'Discover', text: 'We listen to your vision, audience and goals.' },
    { title: 'Design', text: 'Concepts, themes, budgets and a detailed run-of-show.' },
    { title: 'Deliver', text: 'Vendors, artists, crew and tech, all coordinated on the ground.' },
    { title: 'Delight', text: 'Your guests leave with stories, and your brand with results.' }
  ],
  gallery: [
    { image: img('photo-1514525253161-7a46d19cd819'), caption: 'Concert Night', category: 'Concerts' },
    { image: img('photo-1519225421980-715cb0215aed'), caption: 'Royal Wedding Décor', category: 'Weddings' },
    { image: img('photo-1540575467063-178a50c2df87'), caption: 'Corporate Summit', category: 'Corporate' },
    { image: img('photo-1470229722913-7c0e2dbbafd3'), caption: 'College Fest Main Stage', category: 'Fests' },
    { image: img('photo-1464366400600-7168b8af9bc3'), caption: 'Gala Dinner', category: 'Corporate' },
    { image: img('photo-1459749411175-04bf5292ceea'), caption: 'Live Performance', category: 'Concerts' }
  ],
  testimonials: [
    { quote: 'Abhyudaya Events turned our annual fest into the biggest one our campus has seen. The sponsorships and artist line-up were outstanding.', name: 'Student Council President', role: 'University Fest' },
    { quote: 'Every detail was handled with care. Our product launch ran on time, looked premium, and the on-ground team was exceptional.', name: 'Marketing Head', role: 'Lifestyle Brand' },
    { quote: 'Professional, creative and reliable. They managed our artist bookings and contracts without a single hiccup.', name: 'Event Director', role: 'Corporate Client' }
  ],
  clients: ['Universities', 'Lifestyle Brands', 'Corporates', 'Music Labels', 'Startups', 'Cultural Bodies'],
  faqs: [
    { q: 'What kinds of events do you manage?', a: 'Corporate events, college fests, concerts, brand activations, weddings, private celebrations and more.' },
    { q: 'How early should we book?', a: 'For large events we recommend 6–8 weeks. We can also handle shorter timelines.' },
    { q: 'Do you help colleges find sponsors?', a: 'Yes. Sponsorship and brand partnerships for fests are one of our core services.' },
    { q: 'Can you book celebrities and artists?', a: 'Yes. We handle artist booking, negotiation, contracts and hospitality.' }
  ],
  contact: {
    phone: '+91 78892 31615',
    whatsapp: '917889231615',
    email: 'teamabhyudayaevent@gmail.com',
    instagram: 'https://www.instagram.com/',
    instagramHandle: 'abhyudaya events',
    address: 'India',
    founder: 'Chakshush K Sharma'
  },
  theme: { navy: '#11213C', rose: '#D8C3A5', platinum: '#D6D6D6', pearl: '#F8F9FA', charcoal: '#2C3338' }
};

content.hero.slides = content.slides; delete content.slides;
module.exports = content;
