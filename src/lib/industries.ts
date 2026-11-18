export const industries = [
  "Retail",
  "Fashion",
  "Government",
  "FMCG",
  "Banking & Insurance",
  "Real Estate",
] as const;

export const companiesByIndustry: Record<(typeof industries)[number], string[]> = {
  Retail: [
    "CP ALL Public Company Limited",
    "THE MALL GROUP COMPANY LIMITED",
    "Big C Supercenter Public Company Limited",
    "Central Pattana Public Company Limited (CPN)",
    "Central Watson Co., Ltd.",
    "King Power Corporation Co., Ltd.",
  ],
  Fashion: [
    "The Thai Silk Company Limited (JIM THOMPSON)",
    "Jaspal Public Company Limited",
    "Rubber Soul Co., Ltd.",
  ],
  Government: [
    "Tourism Authority of Thailand (TAT)",
    "Electronic Transactions Development Agency (ETDA)",
    "Geo-Informatics and Space Technology Development Agency (GISTDA)",
  ],
  FMCG: [
    "Oishi Group Public Company Limited",
    "Meiji (Thailand) Co., Ltd.",
    "Dutch Mill Co., Ltd.",
  ],
  "Banking & Insurance": [
    "Muang Thai Insurance Public Company Limited",
    "Counter Service Co., Ltd.",
    "Bangkok Insurance Public Company Limited",
  ],
  "Real Estate": [
    "SC Asset Corporation Public Company Limited",
    "Property Perfect Public Company Limited",
  ],
};
