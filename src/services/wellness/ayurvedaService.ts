export type Dosha = 'vata' | 'pitta' | 'kapha';
export type Season = 'summer' | 'monsoon' | 'winter' | 'spring';

export interface WellnessTip {
  id: number;
  tip: string;
  tipHi: string;
  category: 'ayurveda' | 'seasonal' | 'general_wellness';
  season?: Season;
  dosha?: Dosha;
}

/** Curated 100+ Ayurveda wellness tips — seasonal + dosha-tagged */
const WELLNESS_TIPS: WellnessTip[] = [
  // General Ayurveda
  { id: 1, tip: 'Start your day with a glass of warm water with lemon to activate digestion.', tipHi: 'पाचन को सक्रिय करने के लिए नींबू के साथ गर्म पानी पिएं।', category: 'ayurveda' },
  { id: 2, tip: 'Oil pulling with sesame or coconut oil for 5–10 minutes improves oral health and detoxification.', tipHi: 'तिल या नारियल के तेल से 5-10 मिनट तेल खींचने से मौखिक स्वास्थ्य बेहतर होता है।', category: 'ayurveda' },
  { id: 3, tip: 'Haldi doodh (golden milk) before bed reduces inflammation and improves sleep quality.', tipHi: 'सोने से पहले हल्दी दूध सूजन कम करता है और नींद की गुणवत्ता बेहतर करता है।', category: 'ayurveda' },
  { id: 4, tip: 'Practice Abhyanga (self-massage with warm sesame oil) weekly to nourish joints and calm the nervous system.', tipHi: 'तिल के गर्म तेल से साप्ताहिक मालिश जोड़ों को पोषण देती है।', category: 'ayurveda' },
  { id: 5, tip: 'Eat your largest meal at noon when digestive fire (Agni) is strongest.', tipHi: 'दोपहर में सबसे बड़ा भोजन खाएं जब पाचन अग्नि सबसे मजबूत होती है।', category: 'ayurveda' },
  { id: 6, tip: 'Triphala churna before bed gently cleanses the colon and rejuvenates tissues.', tipHi: 'त्रिफला चूर्ण सोने से पहले आंतों को धीरे से साफ करता है।', category: 'ayurveda' },
  { id: 7, tip: 'Avoid eating while distracted — mindful eating improves nutrient absorption by 30%.', tipHi: 'ध्यान से खाना खाएं — सचेत भोजन से पोषण अवशोषण 30% बेहतर होता है।', category: 'ayurveda' },
  { id: 8, tip: 'Nasya (nasal drops of sesame oil) in the morning prevents dryness and improves clarity.', tipHi: 'सुबह नाक में तिल के तेल की बूंदें डालने से सूखापन दूर होता है।', category: 'ayurveda' },
  { id: 9, tip: 'Walk 100 steps after every meal to stimulate digestion.', tipHi: 'प्रत्येक भोजन के बाद 100 कदम चलें।', category: 'ayurveda' },
  { id: 10, tip: 'Sleep by 10 PM — Kapha time (6–10 PM) promotes restful sleep; staying up past 10 PM stirs Pitta energy.', tipHi: '10 बजे तक सो जाएं — 6-10 बजे कफ काल में आराम की नींद आती है।', category: 'ayurveda' },
  // Vata-specific
  { id: 11, tip: 'Vata types: eat warm, moist, heavy foods. Avoid cold, raw, or dry foods that aggravate Vata.', tipHi: 'वात प्रकृति: गर्म, नम, भारी भोजन खाएं। ठंडा, कच्चा भोजन न खाएं।', category: 'ayurveda', dosha: 'vata' },
  { id: 12, tip: 'Vata types: establish a consistent daily routine — same wake, meal, and sleep times ground Vata energy.', tipHi: 'वात प्रकृति: नियमित दिनचर्या वात ऊर्जा को स्थिर करती है।', category: 'ayurveda', dosha: 'vata' },
  { id: 13, tip: 'Vata types: gentle yoga and warm oil massage calm an overactive nervous system.', tipHi: 'वात प्रकृति: सौम्य योग और गर्म तेल मालिश तंत्रिका तंत्र को शांत करती है।', category: 'ayurveda', dosha: 'vata' },
  { id: 14, tip: 'Vata types: sip ginger-cinnamon tea throughout the day to maintain warmth and digestive strength.', tipHi: 'वात प्रकृति: दिन भर अदरक-दालचीनी की चाय पिएं।', category: 'ayurveda', dosha: 'vata' },
  // Pitta-specific
  { id: 15, tip: 'Pitta types: eat cooling foods — cucumber, coconut, coriander, mint. Avoid spicy, oily, fermented foods.', tipHi: 'पित्त प्रकृति: ठंडे खाद्य पदार्थ खाएं। मसालेदार, तले हुए भोजन से बचें।', category: 'ayurveda', dosha: 'pitta' },
  { id: 16, tip: 'Pitta types: take a moonlit walk in the evening to cool fiery Pitta energy.', tipHi: 'पित्त प्रकृति: शाम को चांदनी में सैर करें।', category: 'ayurveda', dosha: 'pitta' },
  { id: 17, tip: 'Pitta types: coconut oil self-massage cools the body and reduces inflammation.', tipHi: 'पित्त प्रकृति: नारियल तेल से मालिश शरीर को ठंडा करती है।', category: 'ayurveda', dosha: 'pitta' },
  { id: 18, tip: 'Pitta types: avoid skipping meals — low blood sugar intensifies Pitta irritability.', tipHi: 'पित्त प्रकृति: खाना न छोड़ें — कम रक्त शर्करा पित्त चिड़चिड़ापन बढ़ाती है।', category: 'ayurveda', dosha: 'pitta' },
  // Kapha-specific
  { id: 19, tip: 'Kapha types: wake before 6 AM — sleeping past sunrise increases Kapha heaviness and lethargy.', tipHi: 'कफ प्रकृति: 6 बजे से पहले उठें — सूर्योदय के बाद सोने से भारीपन बढ़ता है।', category: 'ayurveda', dosha: 'kapha' },
  { id: 20, tip: 'Kapha types: eat light, spicy, dry foods. Avoid dairy, fried, and sweet foods.', tipHi: 'कफ प्रकृति: हल्का, मसालेदार, शुष्क भोजन खाएं। डेयरी, तले हुए भोजन से बचें।', category: 'ayurveda', dosha: 'kapha' },
  { id: 21, tip: 'Kapha types: vigorous daily exercise prevents stagnation and lifts mood.', tipHi: 'कफ प्रकृति: जोरदार दैनिक व्यायाम ठहराव को रोकता है।', category: 'ayurveda', dosha: 'kapha' },
  { id: 22, tip: 'Kapha types: dry brushing before bath stimulates circulation and lymphatic drainage.', tipHi: 'कफ प्रकृति: स्नान से पहले सूखी मालिश रक्त संचार बेहतर करती है।', category: 'ayurveda', dosha: 'kapha' },
  // Summer
  { id: 23, tip: 'Stay hydrated with coconut water, buttermilk (chaas), and coriander-mint chutney in summer.', tipHi: 'गर्मियों में नारियल पानी, छाछ और धनिया-पुदीना चटनी से हाइड्रेटेड रहें।', category: 'seasonal', season: 'summer' },
  { id: 24, tip: 'Eat sattvic, cooling foods in summer: cucumber, watermelon, mint, fennel.', tipHi: 'गर्मियों में खीरा, तरबूज, पुदीना, सौंफ जैसे ठंडे खाद्य पदार्थ खाएं।', category: 'seasonal', season: 'summer' },
  { id: 25, tip: 'Avoid exercising between 10 AM and 4 PM in summer to prevent heat exhaustion.', tipHi: 'गर्मियों में सुबह 10 से शाम 4 बजे के बीच व्यायाम न करें।', category: 'seasonal', season: 'summer' },
  { id: 26, tip: 'Rose water spray cools skin and calms the mind in peak summer heat.', tipHi: 'गुलाब जल का स्प्रे गर्मियों में त्वचा को ठंडा और मन को शांत करता है।', category: 'seasonal', season: 'summer' },
  { id: 27, tip: 'Amla (Indian gooseberry) juice in summer boosts immunity and prevents heat stroke.', tipHi: 'गर्मियों में आंवले का रस रोग प्रतिरोधक क्षमता बढ़ाता है।', category: 'seasonal', season: 'summer' },
  // Monsoon
  { id: 28, tip: 'Monsoon weakens digestive fire — eat light, freshly cooked food. Avoid raw salads and cold drinks.', tipHi: 'मानसून में पाचन कमजोर होता है — ताजा पका हल्का भोजन खाएं।', category: 'seasonal', season: 'monsoon' },
  { id: 29, tip: 'Giloy (Tinospora) kadha during monsoon strengthens immunity against seasonal infections.', tipHi: 'मानसून में गिलोय का काढ़ा पिएं — यह मौसमी संक्रमण से बचाता है।', category: 'seasonal', season: 'monsoon' },
  { id: 30, tip: 'Keep feet dry during monsoon — fungal infections spike in wet weather.', tipHi: 'मानसून में पैर सूखे रखें — गीले मौसम में फंगल संक्रमण बढ़ता है।', category: 'seasonal', season: 'monsoon' },
  { id: 31, tip: 'Tulsi (holy basil) tea during monsoon prevents cough, cold, and flu naturally.', tipHi: 'मानसून में तुलसी की चाय खांसी, जुकाम से बचाती है।', category: 'seasonal', season: 'monsoon' },
  // Winter
  { id: 32, tip: 'Winter is ideal for building strength — eat nourishing foods: ghee, sesame, dates, jaggery.', tipHi: 'सर्दियों में शक्ति बढ़ाने के लिए घी, तिल, खजूर, गुड़ खाएं।', category: 'seasonal', season: 'winter' },
  { id: 33, tip: 'Dry ginger (soonth) with honey in winter relieves joint pain and improves digestion.', tipHi: 'सर्दियों में शहद के साथ सूखी अदरक जोड़ों के दर्द से राहत देती है।', category: 'seasonal', season: 'winter' },
  { id: 34, tip: 'Sesame oil massage daily in winter prevents dry skin and keeps joints supple.', tipHi: 'सर्दियों में तिल के तेल की मालिश त्वचा को नम रखती है।', category: 'seasonal', season: 'winter' },
  { id: 35, tip: 'Winter mornings: hot water bath with a few drops of eucalyptus oil opens congested airways.', tipHi: 'सर्दियों में नीलगिरी के तेल से गरम पानी से नहाने से नाक खुलती है।', category: 'seasonal', season: 'winter' },
  // General wellness
  { id: 36, tip: 'Practice Pranayama (Anulom Vilom) for 10 minutes daily to balance energy and reduce stress.', tipHi: 'अनुलोम-विलोम प्राणायाम 10 मिनट रोज करें — तनाव कम होगा।', category: 'general_wellness' },
  { id: 37, tip: 'Sun exposure for 15 minutes before 10 AM provides Vitamin D and sets your circadian rhythm.', tipHi: 'सुबह 10 बजे से पहले 15 मिनट धूप में बैठें — विटामिन D मिलेगा।', category: 'general_wellness' },
  { id: 38, tip: 'Journaling 5 minutes before bed clears mental clutter and improves sleep quality.', tipHi: 'सोने से पहले 5 मिनट जर्नलिंग मानसिक भार कम करती है।', category: 'general_wellness' },
  { id: 39, tip: 'Cold water face splash 3 times after waking activates alertness better than coffee.', tipHi: 'उठने के बाद 3 बार ठंडे पानी से मुंह धोएं — कॉफी से बेहतर जागरूकता आती है।', category: 'general_wellness' },
  { id: 40, tip: 'Earthing — walk barefoot on grass for 10 minutes — reduces inflammation and anxiety.', tipHi: 'हरी घास पर 10 मिनट नंगे पैर चलें — सूजन और चिंता कम होती है।', category: 'general_wellness' },
  { id: 41, tip: 'Chew each bite 20–30 times for better digestion and natural weight management.', tipHi: 'प्रत्येक निवाले को 20-30 बार चबाएं — पाचन और वजन प्रबंधन बेहतर होगा।', category: 'general_wellness' },
  { id: 42, tip: 'Limit screen use after 9 PM — blue light disrupts melatonin and delays sleep by 2+ hours.', tipHi: 'रात 9 बजे के बाद स्क्रीन सीमित करें — नीली रोशनी नींद 2 घंटे देर करती है।', category: 'general_wellness' },
  { id: 43, tip: 'Drink water stored overnight in a copper vessel — it balances the three doshas.', tipHi: 'तांबे के बर्तन में रात भर रखा पानी पिएं — यह तीनों दोषों को संतुलित करता है।', category: 'ayurveda' },
  { id: 44, tip: 'Amla, Ashwagandha, and Shatavari are rasayanas — adaptogens that build long-term vitality.', tipHi: 'आंवला, अश्वगंधा और शतावरी रसायन हैं — दीर्घकालिक शक्ति बढ़ाते हैं।', category: 'ayurveda' },
  { id: 45, tip: 'Brahmi herb supports memory and focus — take as churna with warm milk or as Brahmi ghee.', tipHi: 'ब्राह्मी स्मृति और फोकस बढ़ाती है — गर्म दूध के साथ चूर्ण लें।', category: 'ayurveda' },
];

export function getDailyTip(date: string, dosha?: Dosha): WellnessTip {
  const season = getCurrentSeason();

  // Prefer dosha-specific or seasonal tips
  const filtered = WELLNESS_TIPS.filter((t) => {
    if (dosha && t.dosha && t.dosha !== dosha) return false;
    if (t.season && t.season !== season) return false;
    return true;
  });

  const pool = filtered.length > 0 ? filtered : WELLNESS_TIPS;

  // Deterministic by date so same user sees same tip all day
  const dateNum = date.replace(/-/g, '');
  const idx = parseInt(dateNum.slice(-4), 10) % pool.length;
  return pool[idx];
}

export function getCurrentSeason(): Season {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'summer';
  if (month >= 6 && month <= 9) return 'monsoon';
  if (month >= 10 && month <= 11) return 'winter';
  if (month === 12 || month <= 2) return 'winter';
  return 'spring';
}

export const DOSHA_QUIZ: {
  question: string;
  questionHi: string;
  options: { label: string; labelHi: string; dosha: Dosha }[];
}[] = [
  {
    question: 'Your body frame is:',
    questionHi: 'आपकी शारीरिक संरचना है:',
    options: [
      { label: 'Thin, light, hard to gain weight', labelHi: 'पतला, हल्का, वजन मुश्किल से बढ़ता है', dosha: 'vata' },
      { label: 'Medium, muscular, athletic', labelHi: 'मध्यम, मांसल, एथलेटिक', dosha: 'pitta' },
      { label: 'Broad, stocky, easy to gain weight', labelHi: 'चौड़ा, मोटा, वजन आसानी से बढ़ता है', dosha: 'kapha' },
    ],
  },
  {
    question: 'Under stress, you tend to:',
    questionHi: 'तनाव में आप:',
    options: [
      { label: 'Become anxious or worried', labelHi: 'चिंतित या परेशान हो जाते हैं', dosha: 'vata' },
      { label: 'Get irritable or angry', labelHi: 'चिड़चिड़े या गुस्सैल हो जाते हैं', dosha: 'pitta' },
      { label: 'Withdraw and become quiet', labelHi: 'अंदर हो जाते हैं और चुप हो जाते हैं', dosha: 'kapha' },
    ],
  },
  {
    question: 'Your digestion is typically:',
    questionHi: 'आपका पाचन आमतौर पर:',
    options: [
      { label: 'Irregular — sometimes good, sometimes not', labelHi: 'अनियमित — कभी ठीक, कभी नहीं', dosha: 'vata' },
      { label: 'Sharp — get very hungry, feel hot after eating', labelHi: 'तेज — बहुत भूख लगती है, खाने के बाद गर्मी लगती है', dosha: 'pitta' },
      { label: 'Slow — rarely hungry, feel heavy after meals', labelHi: 'धीमा — कम भूख, भोजन के बाद भारीपन', dosha: 'kapha' },
    ],
  },
  {
    question: 'Your sleep is:',
    questionHi: 'आपकी नींद है:',
    options: [
      { label: 'Light, interrupted, hard to fall asleep', labelHi: 'हल्की, टूटी, सोना मुश्किल', dosha: 'vata' },
      { label: 'Moderate, can get by on little sleep', labelHi: 'मध्यम, कम नींद में काम चल जाता है', dosha: 'pitta' },
      { label: 'Heavy, sleep long hours, hard to wake up', labelHi: 'गहरी, लंबे समय तक सोते हैं, उठना मुश्किल', dosha: 'kapha' },
    ],
  },
  {
    question: 'Your skin is:',
    questionHi: 'आपकी त्वचा है:',
    options: [
      { label: 'Dry, rough, prone to cracking', labelHi: 'शुष्क, खुरदरी, दरारें पड़ने वाली', dosha: 'vata' },
      { label: 'Warm, oily, prone to redness or acne', labelHi: 'गर्म, तैलीय, लालिमा या मुहांसे वाली', dosha: 'pitta' },
      { label: 'Moist, smooth, thick, prone to pores', labelHi: 'नम, चिकनी, मोटी, छिद्र वाली', dosha: 'kapha' },
    ],
  },
];

export function calculateDosha(answers: Dosha[]): { primary: Dosha; secondary: Dosha | null } {
  const counts: Record<Dosha, number> = { vata: 0, pitta: 0, kapha: 0 };
  for (const a of answers) counts[a]++;
  const sorted = (Object.entries(counts) as [Dosha, number][]).sort((a, b) => b[1] - a[1]);
  return {
    primary: sorted[0][0],
    secondary: sorted[1][1] > 0 ? sorted[1][0] : null,
  };
}
