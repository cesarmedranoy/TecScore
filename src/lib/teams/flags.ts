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

/** Quita acentos y diacríticos: "Sudáfrica" → "sudafrica". */
function stripAccents(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Resuelve la bandera para un nombre de equipo.
 * Tolera variantes de capitalización, espacios extras y acentos.
 *
 * Ejemplos que matchean correctamente:
 *  - "Argentina", "argentina", "ARGENTINA"
 *  - "Perú", "Peru", "perú"
 *  - "Sudáfrica", "Sudafrica", "sudafrica"
 */
export function getFlag(teamName: string): string {
  const trimmed = teamName.trim();

  // 1. Match exacto (rápido)
  if (FLAGS[trimmed]) return FLAGS[trimmed];

  // 2. Match case-insensitive
  const lower = trimmed.toLowerCase();
  for (const key of Object.keys(FLAGS)) {
    if (key.toLowerCase() === lower) return FLAGS[key]!;
  }

  // 3. Match sin acentos (tolera typos como "Sudafrica" sin tilde)
  const normalized = stripAccents(trimmed);
  for (const key of Object.keys(FLAGS)) {
    if (stripAccents(key) === normalized) return FLAGS[key]!;
  }

  return DEFAULT_FLAG;
}
