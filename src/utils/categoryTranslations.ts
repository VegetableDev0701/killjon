import { Category } from "../services/listingsApi";

// Spanish translations for category names and descriptions (backend still sends these as strings)
const categoryTranslations = {
  // Category display names
  vehicles: "Vehículos y Autos",
  real_estate: "Bienes Raíces",
  electronics: "Electrónicos y Gadgets",
  fashion: "Moda y Ropa",
  foods: "Comidas y Bebidas",
  services: "Servicios",
  vehicle_parts: "Partes y Accesorios de Vehículos",
  jobs: "Empleos y Trabajo",
  furniture: "Muebles y Hogar",
  books: "Libros y Medios",
  sports: "Deportes y Fitness",
  pets: "Mascotas y Animales",
  collectibles: "Coleccionables y Antigüedades",
  health: "Salud y Belleza",
  education: "Educación y Entrenamiento",
  events: "Eventos y Entradas",
  tools: "Herramientas y Equipos",

  // Category descriptions
  vehicles_description: "Autos, motocicletas, camiones y otros vehículos",
  real_estate_description:
    "Casas, apartamentos, terrenos y propiedades comerciales",
  electronics_description:
    "Teléfonos, laptops, tablets y dispositivos electrónicos",
  fashion_description: "Ropa, zapatos, bolsos y accesorios",
  foods_description: "Comidas, víveres, snacks, bebidas y artículos gourmet",
  services_description: "Servicios profesionales, reparaciones y consultas",
  vehicle_parts_description:
    "Vende partes de autos y accesorios — baterías, llantas, parlantes, luces, GPS y más",
  jobs_description:
    "Oportunidades de trabajo, trabajo freelance y posiciones de carrera",
  furniture_description: "Muebles, electrodomésticos y decoración del hogar",
  books_description: "Libros, revistas, películas y materiales educativos",
  sports_description:
    "Equipos deportivos, artículos de fitness y actividades al aire libre",
  pets_description:
    "Perros, gatos, pájaros y otras mascotas para venta o adopción",
  collectibles_description:
    "Sellos, monedas, arte, artículos vintage y coleccionables raros",
  health_description:
    "Equipos médicos, productos de belleza y artículos de bienestar",
  education_description: "Cursos, tutorías, talleres y materiales educativos",
  events_description:
    "Entradas de conciertos, eventos deportivos, talleres y entretenimiento",
  tools_description:
    "Herramientas manuales, herramientas eléctricas, equipos de construcción y maquinaria",
};

// Helper function to get localized text from multilingual object or string
const getLocalizedText = (textObj: any, language: string): string => {
  if (typeof textObj === "string") return textObj; // Backward compatibility
  if (typeof textObj === "object" && textObj !== null) {
    return textObj[language] || textObj.en || "";
  }
  return "";
};

// Function to translate category data
export const translateCategory = (
  category: Category,
  language: string
): Category => {
  const translatedCategory = { ...category };

  // For Spanish, translate display_name and description using translation table
  if (language === "es") {
    // Translate display_name using translation table (backend sends simple strings)
    const displayNameKey = category.category_key;
    if (
      categoryTranslations[displayNameKey as keyof typeof categoryTranslations]
    ) {
      translatedCategory.display_name =
        categoryTranslations[
          displayNameKey as keyof typeof categoryTranslations
        ];
    }

    // Translate description using translation table (backend sends simple strings)
    const descriptionKey = `${category.category_key}_description`;
    if (
      categoryTranslations[descriptionKey as keyof typeof categoryTranslations]
    ) {
      translatedCategory.description =
        categoryTranslations[
          descriptionKey as keyof typeof categoryTranslations
        ];
    }
  }

  // Translate attributes for ALL languages (backend sends multilingual format for label, placeholder, options)
  if (category.attributes) {
    const translatedAttributes: any = {};

    Object.keys(category.attributes).forEach((attrKey) => {
      const attr = category.attributes[attrKey];
      const translatedAttr = { ...attr };

      // Translate label (multilingual from backend)
      if (attr.label) {
        translatedAttr.label = getLocalizedText(attr.label, language);
      }

      // Translate placeholder (multilingual from backend)
      if (attr.placeholder) {
        translatedAttr.placeholder = getLocalizedText(
          attr.placeholder,
          language
        );
      }

      // Translate enum options (multilingual from backend)
      if (attr.type === "enum" && attr.options) {
        translatedAttr.options = attr.options.map((option: any) => {
          return getLocalizedText(option, language);
        });
      }

      // Translate array options (multilingual from backend)
      if (attr.type === "array" && attr.options) {
        translatedAttr.options = attr.options.map((option: any) => {
          return getLocalizedText(option, language);
        });
      }

      translatedAttributes[attrKey] = translatedAttr;
    });

    translatedCategory.attributes = translatedAttributes;
  }

  // Translate basic_attributes for ALL languages (backend sends multilingual format for label, placeholder, options)
  if (
    category.basic_attributes &&
    typeof category.basic_attributes === "object" &&
    Object.keys(category.basic_attributes).length > 0
  ) {
    const translatedBasicAttributes: any = {};

    Object.keys(category.basic_attributes).forEach((attrKey) => {
      const attr = (category.basic_attributes as Record<string, any>)[attrKey];
      const translatedAttr = { ...attr };

      // Translate label (multilingual from backend)
      if (attr.label) {
        translatedAttr.label = getLocalizedText(attr.label, language);
      }

      // Translate placeholder (multilingual from backend)
      if (attr.placeholder) {
        translatedAttr.placeholder = getLocalizedText(
          attr.placeholder,
          language
        );
      }

      // Translate enum options (multilingual from backend)
      if (attr.type === "enum" && attr.options) {
        translatedAttr.options = attr.options.map((option: any) => {
          return getLocalizedText(option, language);
        });
      }

      // Translate array options (multilingual from backend)
      if (attr.type === "array" && attr.options) {
        translatedAttr.options = attr.options.map((option: any) => {
          return getLocalizedText(option, language);
        });
      }

      translatedBasicAttributes[attrKey] = translatedAttr;
    });

    translatedCategory.basic_attributes = translatedBasicAttributes;
  }

  return translatedCategory;
};
