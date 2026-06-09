/** Hindu vrat/festival calendar for 2026–2027. Dates are approximate — based on standard Hindu calendar. */

export interface VratDate {
  date: string; // YYYY-MM-DD
  name: string;
  nameHi: string;
  type: 'ekadashi' | 'festival' | 'fasting';
  description: string;
}

// Ekadashi dates 2026 (approximate — depends on lunar calendar)
const VRAT_CALENDAR_2026: VratDate[] = [
  { date: '2026-01-09', name: 'Putrada Ekadashi', nameHi: 'पुत्रदा एकादशी', type: 'ekadashi', description: 'Paush Shukla Ekadashi' },
  { date: '2026-01-25', name: 'Shattila Ekadashi', nameHi: 'षट्तिला एकादशी', type: 'ekadashi', description: 'Magh Krishna Ekadashi' },
  { date: '2026-02-08', name: 'Jaya Ekadashi', nameHi: 'जया एकादशी', type: 'ekadashi', description: 'Magh Shukla Ekadashi' },
  { date: '2026-02-24', name: 'Vijaya Ekadashi', nameHi: 'विजया एकादशी', type: 'ekadashi', description: 'Phalguna Krishna Ekadashi' },
  { date: '2026-03-10', name: 'Amalaki Ekadashi', nameHi: 'आमलकी एकादशी', type: 'ekadashi', description: 'Phalguna Shukla Ekadashi' },
  { date: '2026-03-25', name: 'Papmochani Ekadashi', nameHi: 'पापमोचनी एकादशी', type: 'ekadashi', description: 'Chaitra Krishna Ekadashi' },
  { date: '2026-04-09', name: 'Kamada Ekadashi', nameHi: 'कामदा एकादशी', type: 'ekadashi', description: 'Chaitra Shukla Ekadashi' },
  { date: '2026-04-24', name: 'Varuthini Ekadashi', nameHi: 'वरूथिनी एकादशी', type: 'ekadashi', description: 'Vaishakha Krishna Ekadashi' },
  { date: '2026-05-09', name: 'Mohini Ekadashi', nameHi: 'मोहिनी एकादशी', type: 'ekadashi', description: 'Vaishakha Shukla Ekadashi' },
  { date: '2026-05-23', name: 'Apara Ekadashi', nameHi: 'अपरा एकादशी', type: 'ekadashi', description: 'Jyeshtha Krishna Ekadashi' },
  { date: '2026-06-07', name: 'Nirjala Ekadashi', nameHi: 'निर्जला एकादशी', type: 'ekadashi', description: 'Jyeshtha Shukla Ekadashi — strictest fast, no water' },
  { date: '2026-06-22', name: 'Yogini Ekadashi', nameHi: 'योगिनी एकादशी', type: 'ekadashi', description: 'Ashadha Krishna Ekadashi' },
  { date: '2026-07-07', name: 'Devshayani Ekadashi', nameHi: 'देवशयनी एकादशी', type: 'ekadashi', description: 'Ashadha Shukla Ekadashi — Chaturmaas begins' },
  { date: '2026-07-21', name: 'Kamika Ekadashi', nameHi: 'कामिका एकादशी', type: 'ekadashi', description: 'Shravana Krishna Ekadashi' },
  { date: '2026-08-05', name: 'Shravana Putrada Ekadashi', nameHi: 'श्रावण पुत्रदा एकादशी', type: 'ekadashi', description: 'Shravana Shukla Ekadashi' },
  { date: '2026-08-19', name: 'Aja Ekadashi', nameHi: 'अजा एकादशी', type: 'ekadashi', description: 'Bhadrapada Krishna Ekadashi' },
  { date: '2026-09-04', name: 'Parivartini Ekadashi', nameHi: 'परिवर्तिनी एकादशी', type: 'ekadashi', description: 'Bhadrapada Shukla Ekadashi' },
  { date: '2026-09-18', name: 'Indira Ekadashi', nameHi: 'इंदिरा एकादशी', type: 'ekadashi', description: 'Ashwin Krishna Ekadashi' },
  { date: '2026-10-03', name: 'Papankusha Ekadashi', nameHi: 'पापांकुशा एकादशी', type: 'ekadashi', description: 'Ashwin Shukla Ekadashi' },
  { date: '2026-10-18', name: 'Rama Ekadashi', nameHi: 'रमा एकादशी', type: 'ekadashi', description: 'Kartik Krishna Ekadashi' },
  { date: '2026-11-01', name: 'Devutthana Ekadashi', nameHi: 'देवउठनी एकादशी', type: 'ekadashi', description: 'Kartik Shukla Ekadashi — Chaturmaas ends' },
  { date: '2026-11-16', name: 'Utpanna Ekadashi', nameHi: 'उत्पन्ना एकादशी', type: 'ekadashi', description: 'Margashirsha Krishna Ekadashi' },
  { date: '2026-12-01', name: 'Mokshada Ekadashi', nameHi: 'मोक्षदा एकादशी', type: 'ekadashi', description: 'Margashirsha Shukla Ekadashi — Gita Jayanti' },
  { date: '2026-12-16', name: 'Saphala Ekadashi', nameHi: 'सफला एकादशी', type: 'ekadashi', description: 'Paush Krishna Ekadashi' },
  // Major festivals
  { date: '2026-01-14', name: 'Makar Sankranti', nameHi: 'मकर संक्रांति', type: 'festival', description: 'Harvest festival — fasting and prayers' },
  { date: '2026-02-26', name: 'Mahashivratri', nameHi: 'महाशिवरात्री', type: 'fasting', description: 'Night-long fast and vigil for Lord Shiva' },
  { date: '2026-03-21', name: 'Holi', nameHi: 'होली', type: 'festival', description: 'Festival of colours' },
  { date: '2026-04-06', name: 'Ram Navami', nameHi: 'राम नवमी', type: 'fasting', description: 'Birthday of Lord Rama — Navratri fast ends' },
  { date: '2026-04-01', name: 'Chaitra Navratri begins', nameHi: 'चैत्र नवरात्रि', type: 'fasting', description: '9-day Goddess Durga festival fast' },
  { date: '2026-08-02', name: 'Hariyali Teej', nameHi: 'हरियाली तीज', type: 'fasting', description: 'Women\'s fasting festival for marital happiness' },
  { date: '2026-08-21', name: 'Raksha Bandhan', nameHi: 'रक्षा बंधन', type: 'festival', description: 'Festival of brother-sister bond' },
  { date: '2026-08-28', name: 'Janmashtami', nameHi: 'जन्माष्टमी', type: 'fasting', description: 'Birthday of Lord Krishna — midnight fast' },
  { date: '2026-09-23', name: 'Shardiya Navratri begins', nameHi: 'शारदीय नवरात्रि', type: 'fasting', description: '9-day Goddess Durga festival fast' },
  { date: '2026-10-01', name: 'Dussehra', nameHi: 'दशहरा', type: 'festival', description: 'Victory of good over evil' },
  { date: '2026-10-13', name: 'Karwa Chauth', nameHi: 'करवा चौथ', type: 'fasting', description: 'Married women fast for husband\'s long life' },
  { date: '2026-10-20', name: 'Ahoi Ashtami', nameHi: 'अहोई अष्टमी', type: 'fasting', description: 'Mothers fast for children\'s wellbeing' },
  { date: '2026-10-30', name: 'Diwali', nameHi: 'दीपावली', type: 'festival', description: 'Festival of lights' },
  { date: '2026-11-06', name: 'Chhath Puja', nameHi: 'छठ पूजा', type: 'fasting', description: 'Sun worship — 36-hour nirjala fast' },
];

const VRAT_CALENDAR_2027: VratDate[] = [
  { date: '2027-01-01', name: 'Saphala Ekadashi', nameHi: 'सफला एकादशी', type: 'ekadashi', description: 'Paush Shukla Ekadashi' },
  { date: '2027-01-26', name: 'Jaya Ekadashi', nameHi: 'जया एकादशी', type: 'ekadashi', description: 'Magh Shukla Ekadashi' },
  { date: '2027-02-17', name: 'Mahashivratri', nameHi: 'महाशिवरात्री', type: 'fasting', description: 'Night-long fast for Lord Shiva' },
  { date: '2027-03-21', name: 'Holi', nameHi: 'होली', type: 'festival', description: 'Festival of colours' },
  { date: '2027-09-25', name: 'Karwa Chauth', nameHi: 'करवा चौथ', type: 'fasting', description: 'Married women fast for husband\'s long life' },
  { date: '2027-10-19', name: 'Diwali', nameHi: 'दीपावली', type: 'festival', description: 'Festival of lights' },
  // Ramadan (approx)
  { date: '2026-02-18', name: 'Ramadan begins', nameHi: 'रमजान', type: 'fasting', description: 'Month-long Islamic fasting from dawn to dusk' },
  { date: '2026-03-20', name: 'Eid al-Fitr', nameHi: 'ईद', type: 'festival', description: 'End of Ramadan' },
];

const ALL_VRATS = [...VRAT_CALENDAR_2026, ...VRAT_CALENDAR_2027].sort((a, b) =>
  a.date.localeCompare(b.date)
);

export function getVratCalendar(): VratDate[] {
  return ALL_VRATS;
}

export function getUpcomingVrats(days = 30): VratDate[] {
  const today = new Date().toISOString().split('T')[0];
  const future = new Date();
  future.setDate(future.getDate() + days);
  const futureStr = future.toISOString().split('T')[0];
  return ALL_VRATS.filter((v) => v.date >= today && v.date <= futureStr);
}

export function getVratForDate(date: string): VratDate | undefined {
  return ALL_VRATS.find((v) => v.date === date);
}

/** Returns Brahma Muhurta start time for a given date (approximately 1h 36min before sunrise).
 *  Sunrise estimated at 6:00 AM for simplicity — a native astronomy library would be needed for precision. */
export function getBrahmaMuhurta(date: string): string {
  // Standard: Brahma Muhurta is 1h 36min (4 ghatikas) before sunrise
  // Approximate sunrise: 6:00 AM IST across India
  // Brahma Muhurta: 4:24 AM
  return `${date}T04:24:00+05:30`;
}

export const MANTRA_PRESETS = [
  { name: 'Om', nameHi: 'ॐ', defaultCount: 108, icon: '🕉️' },
  { name: 'Gayatri Mantra', nameHi: 'गायत्री मंत्र', defaultCount: 108, icon: '☀️' },
  { name: 'Hanuman Chalisa', nameHi: 'हनुमान चालीसा', defaultCount: 11, icon: '🙏' },
  { name: 'Surya Namaskar', nameHi: 'सूर्य नमस्कार', defaultCount: 12, icon: '🌅' },
  { name: 'Mahamrityunjaya Mantra', nameHi: 'महामृत्युंजय मंत्र', defaultCount: 108, icon: '🔱' },
  { name: 'Lakshmi Ashtottara', nameHi: 'लक्ष्मी अष्टोत्तर', defaultCount: 108, icon: '🪷' },
  { name: 'Ram Nam', nameHi: 'राम नाम', defaultCount: 1000, icon: '🏹' },
] as const;
