/**
 * Mapeo de nombres de selecciones a emoji de bandera unicode.
 *
 * Cubre las selecciones clásicas del Mundial (FIFA 2026: 48 equipos).
 * Si una selección no está en el map, devuelve la bandera blanca neutra.
 *
 * Por qué emoji y no SVG/imágenes:
 *  - Cero requests extra (vienen con el font del navegador).
 *  - Funcionan en todas las plataformas modernas.
 *  - Escalan perfectamente sin pixelarse.
 *
 * Acepta nombres en español, inglés y variantes (ej. "Brasil", "Brazil").
 */

const FLAGS: Record<string, string> = {
  // ============ Sudamérica (CONMEBOL) ============
  Argentina: "🇦🇷",
  Bolivia: "🇧🇴",
  Brasil: "🇧🇷",
  Brazil: "🇧🇷",
  Chile: "🇨🇱",
  Colombia: "🇨🇴",
  Ecuador: "🇪🇨",
  Paraguay: "🇵🇾",
  Perú: "🇵🇪",
  Peru: "🇵🇪",
  Uruguay: "🇺🇾",
  Venezuela: "🇻🇪",

  // ============ Norte / Centroamérica (CONCACAF) ============
  Canadá: "🇨🇦",
  Canada: "🇨🇦",
  "Costa Rica": "🇨🇷",
  Cuba: "🇨🇺",
  "El Salvador": "🇸🇻",
  "Estados Unidos": "🇺🇸",
  "USA": "🇺🇸",
  Guatemala: "🇬🇹",
  Haití: "🇭🇹",
  Honduras: "🇭🇳",
  Jamaica: "🇯🇲",
  México: "🇲🇽",
  Mexico: "🇲🇽",
  Panamá: "🇵🇦",
  Panama: "🇵🇦",

  // ============ Europa (UEFA) ============
  Alemania: "🇩🇪",
  Germany: "🇩🇪",
  Austria: "🇦🇹",
  Bélgica: "🇧🇪",
  Belgium: "🇧🇪",
  Croacia: "🇭🇷",
  Croatia: "🇭🇷",
  Dinamarca: "🇩🇰",
  Denmark: "🇩🇰",
  Escocia: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  Eslovaquia: "🇸🇰",
  Eslovenia: "🇸🇮",
  España: "🇪🇸",
  Spain: "🇪🇸",
  Finlandia: "🇫🇮",
  Francia: "🇫🇷",
  France: "🇫🇷",
  Gales: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  Grecia: "🇬🇷",
  Hungría: "🇭🇺",
  Inglaterra: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "Reino Unido": "🇬🇧",
  Irlanda: "🇮🇪",
  Italia: "🇮🇹",
  Italy: "🇮🇹",
  Noruega: "🇳🇴",
  Países_Bajos: "🇳🇱",
  "Países Bajos": "🇳🇱",
  Holanda: "🇳🇱",
  Netherlands: "🇳🇱",
  Polonia: "🇵🇱",
  Poland: "🇵🇱",
  Portugal: "🇵🇹",
  "República Checa": "🇨🇿",
  Rumania: "🇷🇴",
  Rusia: "🇷🇺",
  Serbia: "🇷🇸",
  Suecia: "🇸🇪",
  Sweden: "🇸🇪",
  Suiza: "🇨🇭",
  Switzerland: "🇨🇭",
  Turquía: "🇹🇷",
  Ucrania: "🇺🇦",

  // ============ África (CAF) ============
  Argelia: "🇩🇿",
  Camerún: "🇨🇲",
  "Costa de Marfil": "🇨🇮",
  Egipto: "🇪🇬",
  Ghana: "🇬🇭",
  Marruecos: "🇲🇦",
  Morocco: "🇲🇦",
  Nigeria: "🇳🇬",
  Senegal: "🇸🇳",
  Sudáfrica: "🇿🇦",
  Túnez: "🇹🇳",

  // ============ Asia (AFC) ============
  "Arabia Saudita": "🇸🇦",
  "Saudi Arabia": "🇸🇦",
  Australia: "🇦🇺",
  China: "🇨🇳",
  "Corea del Sur": "🇰🇷",
  "South Korea": "🇰🇷",
  Emiratos: "🇦🇪",
  Irán: "🇮🇷",
  Iran: "🇮🇷",
  Iraq: "🇮🇶",
  Japón: "🇯🇵",
  Japan: "🇯🇵",
  Qatar: "🇶🇦",

  // ============ Oceanía (OFC) ============
  "Nueva Zelanda": "🇳🇿",
};

/** Bandera por defecto cuando no hay match. */
const DEFAULT_FLAG = "🏳️";

/**
 * Resuelve la bandera para un nombre de equipo.
 * Tolera variantes de capitalización y espacios extras.
 */
export function getFlag(teamName: string): string {
  const trimmed = teamName.trim();
  if (FLAGS[trimmed]) return FLAGS[trimmed];

  // Intento case-insensitive
  const lower = trimmed.toLowerCase();
  for (const key of Object.keys(FLAGS)) {
    if (key.toLowerCase() === lower) return FLAGS[key]!;
  }
  return DEFAULT_FLAG;
}
