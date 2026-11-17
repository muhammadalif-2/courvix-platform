/** Stable identifiers keep reports consistent across languages and locations. */
export const SPORTS = [
  ["Basket", "Basketball", "team"],
  ["Badminton", "Badminton", "racket"],
  ["Sepak bola", "Football / soccer", "team"],
  ["Futsal", "Futsal", "team"],
  ["Voli", "Volleyball", "team"],
  ["Tenis", "Tennis", "racket"],
  ["Padel", "Padel", "racket"],
  ["Tenis meja", "Table tennis", "racket"],
  ["Squash", "Squash", "racket"],
  ["Pickleball", "Pickleball", "racket"],
  ["Renang", "Swimming", "individual"],
  ["Atletik", "Athletics", "individual"],
  ["Lari", "Running", "individual"],
  ["Bersepeda", "Cycling", "individual"],
  ["Triathlon", "Triathlon", "individual"],
  ["Golf", "Golf", "individual"],
  ["Panahan", "Archery", "individual"],
  ["Senam", "Gymnastics", "individual"],
  ["Taekwondo", "Taekwondo", "combat"],
  ["Karate", "Karate", "combat"],
  ["Judo", "Judo", "combat"],
  ["Pencak silat", "Pencak silat", "combat"],
  ["Tinju", "Boxing", "combat"],
  ["Muay Thai", "Muay Thai", "combat"],
  ["BJJ", "Brazilian jiu-jitsu", "combat"],
  ["Gulat", "Wrestling", "combat"],
  ["MMA", "Mixed martial arts", "combat"],
  ["Hoki", "Hockey", "team"],
  ["Rugby", "Rugby", "team"],
  ["Cricket", "Cricket", "team"],
  ["Baseball", "Baseball", "team"],
  ["Softball", "Softball", "team"],
  ["Handball", "Handball", "team"],
  ["Netball", "Netball", "team"],
  ["Sepak takraw", "Sepak takraw", "team"],
  ["Polo air", "Water polo", "team"],
  ["Anggar", "Fencing", "combat"],
  ["Angkat besi", "Weightlifting", "fitness"],
  ["Fitness", "Fitness / personal training", "fitness"],
  ["CrossFit", "CrossFit", "fitness"],
  ["Yoga", "Yoga", "fitness"],
  ["Pilates", "Pilates", "fitness"],
  ["Dance", "Dance", "fitness"],
  ["Panjat tebing", "Climbing", "individual"],
  ["Selancar", "Surfing", "individual"],
  ["Dayung", "Rowing", "individual"],
  ["Berkuda", "Equestrian", "individual"],
  ["Skateboarding", "Skateboarding", "individual"],
  ["Ice skating", "Ice skating", "individual"],
  ["Ski", "Skiing", "individual"],
  ["Esports", "Esports", "team"],
  ["Multisport", "Multisport", "individual"],
] as const;
export const sportEntry = (v: string) =>
  SPORTS.find(
    (s) =>
      s[0] === v || s[1] === v || (v === "Basketball" && s[0] === "Basket"),
  );
export const canonicalSport = (v: string) => sportEntry(v)?.[0] || "";
export function sportOptions(sport: string, field: string) {
  const category = sportEntry(sport)?.[2];
  if (field === "category")
    return [
      "U-8",
      "U-10",
      "U-12",
      "U-14",
      "U-16",
      "U-18",
      "U-21",
      "Senior",
      "Masters",
      "Open",
    ];
  if (field === "experience")
    return ["0–1 years", "1–3 years", "3–5 years", "5–10 years", "10+ years"];
  if (field === "licenseName")
    return [
      "Not yet licensed",
      "Foundation",
      "Level 1",
      "Level 2",
      "Level 3",
      "Professional",
      "International",
    ];
  if (
    field === "objective" ||
    field === "specialty" ||
    field === "description"
  ) {
    if (category === "fitness")
      return [
        "Strength",
        "Conditioning",
        "Mobility",
        "Weight management",
        "Rehabilitation",
        "General fitness",
      ];
    if (category === "combat")
      return [
        "Fundamentals",
        "Technique",
        "Sparring",
        "Competition",
        "Conditioning",
        "Self-defense",
      ];
    return [
      "Fundamentals",
      "Technique",
      "Tactics",
      "Conditioning",
      "Competition",
      "Recovery",
    ];
  }
  if (field === "position") {
    if (sport === "Basket" || sport === "Basketball")
      return [
        "Point guard",
        "Shooting guard",
        "Small forward",
        "Power forward",
        "Center",
        "All-round",
      ];
    if (["Sepak bola", "Futsal"].includes(sport))
      return ["Goalkeeper", "Defender", "Midfielder", "Forward", "All-round"];
    if (sport === "Voli")
      return [
        "Setter",
        "Outside hitter",
        "Opposite",
        "Middle blocker",
        "Libero",
        "All-round",
      ];
    if (sport === "Renang")
      return ["Freestyle", "Backstroke", "Breaststroke", "Butterfly", "Medley"];
    if (category === "racket")
      return ["Singles", "Doubles", "Mixed doubles", "All-round"];
    if (category === "combat")
      return ["Beginner", "Intermediate", "Advanced", "Competitive"];
    return [
      "Beginner",
      "Intermediate",
      "Advanced",
      "Competitive",
      "Recreational",
    ];
  }
  return [];
}
export const COUNTRIES =
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(
    " ",
  );
export const CURRENCIES = [
  "IDR",
  "USD",
  "EUR",
  "GBP",
  "SGD",
  "MYR",
  "AUD",
  "CAD",
  "NZD",
  "JPY",
  "KRW",
  "CNY",
  "HKD",
  "TWD",
  "INR",
  "THB",
  "VND",
  "PHP",
  "AED",
  "SAR",
  "QAR",
  "BHD",
  "KWD",
  "CHF",
  "SEK",
  "NOK",
  "DKK",
  "PLN",
  "CZK",
  "TRY",
  "BRL",
  "MXN",
  "ZAR",
  "NGN",
  "EGP",
  "KES",
  "PKR",
  "BDT",
  "LKR",
  "NPR",
  "RUB",
  "UAH",
  "ILS",
  "CLP",
  "COP",
  "PEN",
  "ARS",
];
export const TIMEZONES = Intl.supportedValuesOf("timeZone");
export function validTimezone(v: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: v });
    return true;
  } catch {
    return false;
  }
}
export const GROUPS = ["Tim", "Kelas", "Kelompok", "Private"];

export function currencyDigits(currency: string) {
  return (
    new Intl.NumberFormat("en", {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits || 0
  );
}
export function validAmount(amount: unknown, currency = "IDR") {
  if (
    typeof amount !== "number" ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > 1e12
  )
    return false;
  const factor = 10 ** currencyDigits(currency);
  return (
    Math.abs(amount * factor - Math.round(amount * factor)) < 0.00001 &&
    Number.isSafeInteger(Math.round(amount * factor))
  );
}
