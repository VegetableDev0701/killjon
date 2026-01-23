// Dominican Republic Geocoding Utility
// Maps location strings to precise coordinates for the Dominican Republic

export interface Coordinates {
  latitude: number;
  longitude: number;
  city: string;
  province: string;
}

// Major cities and their coordinates in Dominican Republic
const DOMINICAN_CITIES: Record<string, Coordinates> = {
  // Santo Domingo (Capital)
  "santo domingo": {
    latitude: 18.4861,
    longitude: -69.9312,
    city: "Santo Domingo",
    province: "Distrito Nacional",
  },
  "santo domingo este": {
    latitude: 18.4861,
    longitude: -69.9312,
    city: "Santo Domingo Este",
    province: "Santo Domingo",
  },
  "santo domingo oeste": {
    latitude: 18.4861,
    longitude: -69.9312,
    city: "Santo Domingo Oeste",
    province: "Santo Domingo",
  },
  "santo domingo norte": {
    latitude: 18.4861,
    longitude: -69.9312,
    city: "Santo Domingo Norte",
    province: "Santo Domingo",
  },
  "distrito nacional": {
    latitude: 18.4861,
    longitude: -69.9312,
    city: "Distrito Nacional",
    province: "Distrito Nacional",
  },
  dn: {
    latitude: 18.4861,
    longitude: -69.9312,
    city: "Distrito Nacional",
    province: "Distrito Nacional",
  },

  // Santiago
  santiago: {
    latitude: 19.4517,
    longitude: -70.6986,
    city: "Santiago",
    province: "Santiago",
  },
  "santiago de los caballeros": {
    latitude: 19.4517,
    longitude: -70.6986,
    city: "Santiago de los Caballeros",
    province: "Santiago",
  },

  // Punta Cana
  "punta cana": {
    latitude: 18.5601,
    longitude: -68.3725,
    city: "Punta Cana",
    province: "La Altagracia",
  },
  bavaro: {
    latitude: 18.5601,
    longitude: -68.3725,
    city: "Bávaro",
    province: "La Altagracia",
  },
  bávaro: {
    latitude: 18.5601,
    longitude: -68.3725,
    city: "Bávaro",
    province: "La Altagracia",
  },

  // Puerto Plata
  "puerto plata": {
    latitude: 19.7934,
    longitude: -70.6884,
    city: "Puerto Plata",
    province: "Puerto Plata",
  },
  sosua: {
    latitude: 19.7539,
    longitude: -70.519,
    city: "Sosúa",
    province: "Puerto Plata",
  },
  sosúa: {
    latitude: 19.7539,
    longitude: -70.519,
    city: "Sosúa",
    province: "Puerto Plata",
  },
  cabarete: {
    latitude: 19.7498,
    longitude: -70.4083,
    city: "Cabarete",
    province: "Puerto Plata",
  },

  // La Romana
  "la romana": {
    latitude: 18.4273,
    longitude: -68.9728,
    city: "La Romana",
    province: "La Romana",
  },
  bayahibe: {
    latitude: 18.3728,
    longitude: -68.825,
    city: "Bayahibe",
    province: "La Romana",
  },

  // San Pedro de Macorís
  "san pedro de macoris": {
    latitude: 18.4539,
    longitude: -69.3086,
    city: "San Pedro de Macorís",
    province: "San Pedro de Macorís",
  },
  "san pedro de macorís": {
    latitude: 18.4539,
    longitude: -69.3086,
    city: "San Pedro de Macorís",
    province: "San Pedro de Macorís",
  },
  guayacanes: {
    latitude: 18.4167,
    longitude: -69.2333,
    city: "Guayacanes",
    province: "San Pedro de Macorís",
  },
  "juan dolio": {
    latitude: 18.4167,
    longitude: -69.2333,
    city: "Juan Dolio",
    province: "San Pedro de Macorís",
  },

  // San Francisco de Macorís
  "san francisco de macoris": {
    latitude: 19.3008,
    longitude: -70.2525,
    city: "San Francisco de Macorís",
    province: "Duarte",
  },
  "san francisco de macorís": {
    latitude: 19.3008,
    longitude: -70.2525,
    city: "San Francisco de Macorís",
    province: "Duarte",
  },

  // La Vega
  "la vega": {
    latitude: 19.2222,
    longitude: -70.5297,
    city: "La Vega",
    province: "La Vega",
  },
  "concepcion de la vega": {
    latitude: 19.2222,
    longitude: -70.5297,
    city: "Concepción de La Vega",
    province: "La Vega",
  },
  "concepción de la vega": {
    latitude: 19.2222,
    longitude: -70.5297,
    city: "Concepción de La Vega",
    province: "La Vega",
  },

  // Moca
  moca: {
    latitude: 19.3833,
    longitude: -70.5167,
    city: "Moca",
    province: "Espaillat",
  },

  // San Cristóbal
  "san cristobal": {
    latitude: 18.4167,
    longitude: -70.1,
    city: "San Cristóbal",
    province: "San Cristóbal",
  },
  "san cristóbal": {
    latitude: 18.4167,
    longitude: -70.1,
    city: "San Cristóbal",
    province: "San Cristóbal",
  },

  // Higüey
  higuey: {
    latitude: 18.6167,
    longitude: -68.7,
    city: "Higüey",
    province: "La Altagracia",
  },
  higüey: {
    latitude: 18.6167,
    longitude: -68.7,
    city: "Higüey",
    province: "La Altagracia",
  },

  // Barahona
  barahona: {
    latitude: 18.2083,
    longitude: -71.1,
    city: "Barahona",
    province: "Barahona",
  },

  // Azua
  azua: {
    latitude: 18.45,
    longitude: -70.7333,
    city: "Azua",
    province: "Azua",
  },

  // Bonao
  bonao: {
    latitude: 18.9333,
    longitude: -70.4,
    city: "Bonao",
    province: "Monseñor Nouel",
  },

  // San Juan de la Maguana
  "san juan de la maguana": {
    latitude: 18.8,
    longitude: -71.2333,
    city: "San Juan de la Maguana",
    province: "San Juan",
  },

  // Monte Cristi
  "monte cristi": {
    latitude: 19.85,
    longitude: -71.65,
    city: "Monte Cristi",
    province: "Monte Cristi",
  },

  // Dajabón
  dajabon: {
    latitude: 19.55,
    longitude: -71.7,
    city: "Dajabón",
    province: "Dajabón",
  },
  dajabón: {
    latitude: 19.55,
    longitude: -71.7,
    city: "Dajabón",
    province: "Dajabón",
  },

  // Samaná
  samana: {
    latitude: 19.2,
    longitude: -69.3333,
    city: "Samaná",
    province: "Samaná",
  },
  samaná: {
    latitude: 19.2,
    longitude: -69.3333,
    city: "Samaná",
    province: "Samaná",
  },
  "las terrenas": {
    latitude: 19.3167,
    longitude: -69.5333,
    city: "Las Terrenas",
    province: "Samaná",
  },

  // Jarabacoa
  jarabacoa: {
    latitude: 19.1167,
    longitude: -70.6333,
    city: "Jarabacoa",
    province: "La Vega",
  },

  // Constanza
  constanza: {
    latitude: 18.9167,
    longitude: -70.75,
    city: "Constanza",
    province: "La Vega",
  },

  // Boca Chica
  "boca chica": {
    latitude: 18.45,
    longitude: -69.6,
    city: "Boca Chica",
    province: "Santo Domingo",
  },

  // San José de Ocoa
  "san jose de ocoa": {
    latitude: 18.55,
    longitude: -70.5,
    city: "San José de Ocoa",
    province: "San José de Ocoa",
  },

  // Pedernales
  pedernales: {
    latitude: 18.0333,
    longitude: -71.75,
    city: "Pedernales",
    province: "Pedernales",
  },

  // Elías Piña
  "elias pina": {
    latitude: 19.1,
    longitude: -71.7,
    city: "Elías Piña",
    province: "Elías Piña",
  },
  "elías piña": {
    latitude: 19.1,
    longitude: -71.7,
    city: "Elías Piña",
    province: "Elías Piña",
  },

  // Independencia
  independencia: {
    latitude: 18.5,
    longitude: -71.85,
    city: "Independencia",
    province: "Independencia",
  },
  jimaní: {
    latitude: 18.5,
    longitude: -71.85,
    city: "Jimaní",
    province: "Independencia",
  },

  // Baoruco
  baoruco: {
    latitude: 18.5,
    longitude: -71.4,
    city: "Baoruco",
    province: "Baoruco",
  },
  neiba: {
    latitude: 18.5,
    longitude: -71.4,
    city: "Neiba",
    province: "Baoruco",
  },

  // Valverde
  valverde: {
    latitude: 19.55,
    longitude: -70.9833,
    city: "Valverde",
    province: "Valverde",
  },
  mao: {
    latitude: 19.55,
    longitude: -70.9833,
    city: "Mao",
    province: "Valverde",
  },

  // María Trinidad Sánchez
  "maria trinidad sanchez": {
    latitude: 19.3833,
    longitude: -69.85,
    city: "María Trinidad Sánchez",
    province: "María Trinidad Sánchez",
  },
  "maría trinidad sánchez": {
    latitude: 19.3833,
    longitude: -69.85,
    city: "María Trinidad Sánchez",
    province: "María Trinidad Sánchez",
  },
  nagua: {
    latitude: 19.3833,
    longitude: -69.85,
    city: "Nagua",
    province: "María Trinidad Sánchez",
  },

  // Hermanas Mirabal
  "hermanas mirabal": {
    latitude: 19.4167,
    longitude: -70.3333,
    city: "Hermanas Mirabal",
    province: "Hermanas Mirabal",
  },
  salcedo: {
    latitude: 19.4167,
    longitude: -70.3333,
    city: "Salcedo",
    province: "Hermanas Mirabal",
  },

  // Monte Plata
  "monte plata": {
    latitude: 18.8167,
    longitude: -69.7833,
    city: "Monte Plata",
    province: "Monte Plata",
  },

  // Hato Mayor
  "hato mayor": {
    latitude: 18.7667,
    longitude: -69.25,
    city: "Hato Mayor",
    province: "Hato Mayor",
  },

  // Peravia
  peravia: {
    latitude: 18.2833,
    longitude: -70.3333,
    city: "Peravia",
    province: "Peravia",
  },
  bani: {
    latitude: 18.2833,
    longitude: -70.3333,
    city: "Baní",
    province: "Peravia",
  },
  baní: {
    latitude: 18.2833,
    longitude: -70.3333,
    city: "Baní",
    province: "Peravia",
  },

  // Sánchez Ramírez
  "sanchez ramirez": {
    latitude: 19.05,
    longitude: -70.15,
    city: "Sánchez Ramírez",
    province: "Sánchez Ramírez",
  },
  "sánchez ramírez": {
    latitude: 19.05,
    longitude: -70.15,
    city: "Sánchez Ramírez",
    province: "Sánchez Ramírez",
  },
  cotui: {
    latitude: 19.05,
    longitude: -70.15,
    city: "Cotui",
    province: "Sánchez Ramírez",
  },
  cotuí: {
    latitude: 19.05,
    longitude: -70.15,
    city: "Cotuí",
    province: "Sánchez Ramírez",
  },

  // Monseñor Nouel
  "monsenor nouel": {
    latitude: 18.9333,
    longitude: -70.4,
    city: "Monseñor Nouel",
    province: "Monseñor Nouel",
  },
  "monseñor nouel": {
    latitude: 18.9333,
    longitude: -70.4,
    city: "Monseñor Nouel",
    province: "Monseñor Nouel",
  },

  // Espaillat
  espaillat: {
    latitude: 19.3833,
    longitude: -70.5167,
    city: "Espaillat",
    province: "Espaillat",
  },

  // Duarte
  duarte: {
    latitude: 19.3008,
    longitude: -70.2525,
    city: "Duarte",
    province: "Duarte",
  },

  // Santiago Rodríguez
  "santiago rodriguez": {
    latitude: 19.4167,
    longitude: -71.3333,
    city: "Santiago Rodríguez",
    province: "Santiago Rodríguez",
  },
  "santiago rodríguez": {
    latitude: 19.4167,
    longitude: -71.3333,
    city: "Santiago Rodríguez",
    province: "Santiago Rodríguez",
  },
  sabaneta: {
    latitude: 19.4167,
    longitude: -71.3333,
    city: "Sabaneta",
    province: "Santiago Rodríguez",
  },
};

// Popular neighborhoods and areas within major cities
const NEIGHBORHOODS: Record<string, Coordinates> = {
  // Santo Domingo neighborhoods
  gazcue: {
    latitude: 18.47,
    longitude: -69.92,
    city: "Gazcue",
    province: "Distrito Nacional",
  },
  piantini: {
    latitude: 18.48,
    longitude: -69.94,
    city: "Piantini",
    province: "Distrito Nacional",
  },
  naco: {
    latitude: 18.49,
    longitude: -69.93,
    city: "Naco",
    province: "Distrito Nacional",
  },
  "bella vista": {
    latitude: 18.485,
    longitude: -69.935,
    city: "Bella Vista",
    province: "Distrito Nacional",
  },
  "ensanche naco": {
    latitude: 18.49,
    longitude: -69.93,
    city: "Ensanche Naco",
    province: "Distrito Nacional",
  },
  "ensanche luperon": {
    latitude: 18.475,
    longitude: -69.925,
    city: "Ensanche Luperón",
    province: "Distrito Nacional",
  },
  "ensanche luperón": {
    latitude: 18.475,
    longitude: -69.925,
    city: "Ensanche Luperón",
    province: "Distrito Nacional",
  },
  "ensanche julia": {
    latitude: 18.48,
    longitude: -69.92,
    city: "Ensanche Julia",
    province: "Distrito Nacional",
  },
  "ensanche isabella": {
    latitude: 18.485,
    longitude: -69.915,
    city: "Ensanche Isabella",
    province: "Distrito Nacional",
  },
  "villa juana": {
    latitude: 18.47,
    longitude: -69.91,
    city: "Villa Juana",
    province: "Distrito Nacional",
  },
  "villa consuelo": {
    latitude: 18.465,
    longitude: -69.905,
    city: "Villa Consuelo",
    province: "Distrito Nacional",
  },
  "villa maria": {
    latitude: 18.46,
    longitude: -69.9,
    city: "Villa María",
    province: "Distrito Nacional",
  },
  "villa maría": {
    latitude: 18.46,
    longitude: -69.9,
    city: "Villa María",
    province: "Distrito Nacional",
  },
  "los cacicazgos": {
    latitude: 18.475,
    longitude: -69.94,
    city: "Los Cacicazgos",
    province: "Distrito Nacional",
  },
  "los prados": {
    latitude: 18.48,
    longitude: -69.945,
    city: "Los Prados",
    province: "Distrito Nacional",
  },

  // Punta Cana areas
  "punta cana village": {
    latitude: 18.5601,
    longitude: -68.3725,
    city: "Punta Cana Village",
    province: "La Altagracia",
  },
  "cap cana": {
    latitude: 18.55,
    longitude: -68.38,
    city: "Cap Cana",
    province: "La Altagracia",
  },
  "cabeza de toro": {
    latitude: 18.57,
    longitude: -68.36,
    city: "Cabeza de Toro",
    province: "La Altagracia",
  },
  cortecito: {
    latitude: 18.565,
    longitude: -68.375,
    city: "Cortecito",
    province: "La Altagracia",
  },
  "el cortecito": {
    latitude: 18.565,
    longitude: -68.375,
    city: "El Cortecito",
    province: "La Altagracia",
  },

  // Santiago areas
  "santiago centro": {
    latitude: 19.4517,
    longitude: -70.6986,
    city: "Santiago Centro",
    province: "Santiago",
  },
  "santiago norte": {
    latitude: 19.46,
    longitude: -70.69,
    city: "Santiago Norte",
    province: "Santiago",
  },
  "santiago sur": {
    latitude: 19.44,
    longitude: -70.71,
    city: "Santiago Sur",
    province: "Santiago",
  },

  // Puerto Plata areas
  "puerto plata centro": {
    latitude: 19.7934,
    longitude: -70.6884,
    city: "Puerto Plata Centro",
    province: "Puerto Plata",
  },
  costambar: {
    latitude: 19.78,
    longitude: -70.7,
    city: "Costambar",
    province: "Puerto Plata",
  },
  "playa dorada": {
    latitude: 19.77,
    longitude: -70.72,
    city: "Playa Dorada",
    province: "Puerto Plata",
  },
};

// Popular landmarks and tourist areas
const LANDMARKS: Record<string, Coordinates> = {
  "zona colonial": {
    latitude: 18.4861,
    longitude: -69.9312,
    city: "Zona Colonial",
    province: "Distrito Nacional",
  },
  malecon: {
    latitude: 18.46,
    longitude: -69.9,
    city: "Malecón",
    province: "Distrito Nacional",
  },
  malecón: {
    latitude: 18.46,
    longitude: -69.9,
    city: "Malecón",
    province: "Distrito Nacional",
  },
  "aeropuerto las americas": {
    latitude: 18.45,
    longitude: -69.6,
    city: "Aeropuerto Las Américas",
    province: "Santo Domingo",
  },
  "aeropuerto las américas": {
    latitude: 18.45,
    longitude: -69.6,
    city: "Aeropuerto Las Américas",
    province: "Santo Domingo",
  },
  "aeropuerto punta cana": {
    latitude: 18.5601,
    longitude: -68.3725,
    city: "Aeropuerto Punta Cana",
    province: "La Altagracia",
  },
  "aeropuerto santiago": {
    latitude: 19.4517,
    longitude: -70.6986,
    city: "Aeropuerto Santiago",
    province: "Santiago",
  },
  "aeropuerto puerto plata": {
    latitude: 19.7934,
    longitude: -70.6884,
    city: "Aeropuerto Puerto Plata",
    province: "Puerto Plata",
  },
  "puerto plata airport": {
    latitude: 19.7934,
    longitude: -70.6884,
    city: "Aeropuerto Puerto Plata",
    province: "Puerto Plata",
  },
  "santiago airport": {
    latitude: 19.4517,
    longitude: -70.6986,
    city: "Aeropuerto Santiago",
    province: "Santiago",
  },
  "punta cana airport": {
    latitude: 18.5601,
    longitude: -68.3725,
    city: "Aeropuerto Punta Cana",
    province: "La Altagracia",
  },
  "santo domingo airport": {
    latitude: 18.45,
    longitude: -69.6,
    city: "Aeropuerto Las Américas",
    province: "Santo Domingo",
  },
};

/**
 * Geocodes a location string to coordinates for the Dominican Republic
 * @param locationString - The location string to geocode
 * @returns Coordinates object or null if not found
 */
export function geocodeLocation(locationString: string): Coordinates | null {
  if (!locationString) return null;

  const normalizedLocation = locationString?.toLowerCase()?.trim();

  console.log("locationString 3", normalizedLocation);

  // Remove common prefixes and suffixes
  const cleanLocation = normalizedLocation
    .replace(
      /^(en|en la|en el|cerca de|cerca|cerca a|a|al|del|de la|de el|en las|en los)\s+/i,
      ""
    )
    .replace(
      /\s+(republica dominicana|rd|dominicana|dominican republic|dr)$/i,
      ""
    )
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Check exact matches first
  if (DOMINICAN_CITIES[cleanLocation]) {
    return DOMINICAN_CITIES[cleanLocation];
  }

  if (NEIGHBORHOODS[cleanLocation]) {
    return NEIGHBORHOODS[cleanLocation];
  }

  if (LANDMARKS[cleanLocation]) {
    return LANDMARKS[cleanLocation];
  }

  // Check partial matches
  for (const [key, coords] of Object.entries(DOMINICAN_CITIES)) {
    if (cleanLocation.includes(key) || key.includes(cleanLocation)) {
      return coords;
    }
  }

  for (const [key, coords] of Object.entries(NEIGHBORHOODS)) {
    if (cleanLocation.includes(key) || key.includes(cleanLocation)) {
      return coords;
    }
  }

  for (const [key, coords] of Object.entries(LANDMARKS)) {
    if (cleanLocation.includes(key) || key.includes(cleanLocation)) {
      return coords;
    }
  }

  // Check for common variations and misspellings
  const variations: Record<string, string> = {
    "santo domingo": "santo domingo",
    "st domingo": "santo domingo",
    "st. domingo": "santo domingo",
    santiago: "santiago",
    "punta cana": "punta cana",
    puntacana: "punta cana",
    "puerto plata": "puerto plata",
    "la romana": "la romana",
    laromana: "la romana",
    "san pedro": "san pedro de macoris",
    "san pedro de macoris": "san pedro de macoris",
    "san francisco": "san francisco de macoris",
    "san francisco de macoris": "san francisco de macoris",
    "la vega": "la vega",
    moca: "moca",
    "san cristobal": "san cristobal",
    "san cristóbal": "san cristobal",
    higuey: "higuey",
    higüey: "higuey",
    barahona: "barahona",
    azua: "azua",
    bonao: "bonao",
    "san juan": "san juan de la maguana",
    "monte cristi": "monte cristi",
    dajabon: "dajabon",
    dajabón: "dajabon",
    samana: "samana",
    samaná: "samana",
    jarabacoa: "jarabacoa",
    constanza: "constanza",
    "boca chica": "boca chica",
    "las terrenas": "las terrenas",
    sosua: "sosua",
    sosúa: "sosua",
    cabarete: "cabarete",
    bayahibe: "bayahibe",
    guayacanes: "guayacanes",
    "juan dolio": "juan dolio",
    costambar: "costambar",
    "playa dorada": "playa dorada",
    "cap cana": "cap cana",
    "cabeza de toro": "cabeza de toro",
    cortecito: "cortecito",
    "el cortecito": "cortecito",
    gazcue: "gazcue",
    piantini: "piantini",
    naco: "naco",
    "bella vista": "bella vista",
    "villa juana": "villa juana",
    "villa consuelo": "villa consuelo",
    "villa maria": "villa maria",
    "villa maría": "villa maria",
    "los cacicazgos": "los cacicazgos",
    "los prados": "los prados",
    "zona colonial": "zona colonial",
    malecon: "malecon",
    malecón: "malecon",
  };

  for (const [variation, standard] of Object.entries(variations)) {
    if (cleanLocation.includes(variation)) {
      const coords =
        DOMINICAN_CITIES[standard] ||
        NEIGHBORHOODS[standard] ||
        LANDMARKS[standard];
      if (coords) return coords;
    }
  }

  // If no match found, return null
  return null;
}

/**
 * Geocodes multiple location strings and returns valid coordinates
 * @param locationStrings - Array of location strings
 * @returns Array of coordinates objects
 */
export function geocodeMultipleLocations(
  locationStrings: string[]
): Coordinates[] {
  const coordinates: Coordinates[] = [];

  for (const location of locationStrings) {
    const coords = geocodeLocation(location);
    if (coords) {
      coordinates.push(coords);
    }
  }

  return coordinates;
}

/**
 * Gets all available cities in the Dominican Republic
 * @returns Array of city names
 */
export function getAvailableCities(): string[] {
  return Object.keys(DOMINICAN_CITIES);
}

/**
 * Gets all available neighborhoods
 * @returns Array of neighborhood names
 */
export function getAvailableNeighborhoods(): string[] {
  return Object.keys(NEIGHBORHOODS);
}

/**
 * Gets all available landmarks
 * @returns Array of landmark names
 */
export function getAvailableLandmarks(): string[] {
  return Object.keys(LANDMARKS);
}

export const customMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#181818" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#c1fe00" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#181818" }] },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#888" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#232323" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#232323" }],
  },
];
