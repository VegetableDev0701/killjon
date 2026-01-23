import { Linking } from "react-native";
import { formatPrice, IS_ANDROID } from "./constants";
import i18n from "../i18n/i18n";

const COUNTRY_CODE = __DEV__ ? "+91" : "+1";

interface WhatsAppMessageParams {
  phoneNumber: string;
  productTitle: string;
  price: number;
  priceCurrency?: string;
}

interface ProductItem {
  title: string;
  price?: number;
  priceCurrency?: string;
  quantity: number;
}

const getWhatsAppMessage = (params: WhatsAppMessageParams): string => {
  const { productTitle, price, priceCurrency } = params;

  const formattedPrice = formatPrice(price, priceCurrency);

  return i18n
    .t("whatsapp.interestedMessage")
    .replace("{productTitle}", productTitle)
    .replace("{price}", formattedPrice);
};

export const openWhatsApp = async (
  params: WhatsAppMessageParams
): Promise<void> => {
  const { phoneNumber } = params;

  // Clean phone number - remove all non-digit characters
  const cleanPhoneNumber = phoneNumber.replace(/\D/g, "");

  // Create WhatsApp message
  const message = getWhatsAppMessage(params);
  const encodedMessage = encodeURIComponent(message);

  // Construct WhatsApp URL
  const whatsappUrl = `https://wa.me/${COUNTRY_CODE}${cleanPhoneNumber}?text=${encodedMessage}`;

  try {
    // Check if WhatsApp is available
    const supported = await Linking.canOpenURL(whatsappUrl);

    if (supported || IS_ANDROID) {
      await Linking.openURL(whatsappUrl);
    } else {
      // Fallback to phone call if WhatsApp is not available
      await Linking.openURL(`tel:${phoneNumber}`);
    }
  } catch (error) {
    console.error("Error opening WhatsApp:", error);
    // Fallback to phone call on error
    await Linking.openURL(`tel:${phoneNumber}`);
  }
};

export const getWhatsAppUrl = (params: WhatsAppMessageParams): string => {
  const { phoneNumber } = params;
  const cleanPhoneNumber = phoneNumber.replace(/\D/g, "");
  const message = getWhatsAppMessage(params);
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${COUNTRY_CODE}${cleanPhoneNumber}?text=${encodedMessage}`;
};

interface MultipleProductsParams {
  phoneNumber: string;
  products: ProductItem[];
}

const getMultipleProductsMessage = (params: MultipleProductsParams): string => {
  const { products } = params;

  const greeting = i18n.t("whatsapp.interestedInProducts");

  let total = 0;

  const productsList = products
    .map((product, index) => {
      const quantity = product.quantity > 1 ? ` (x${product.quantity})` : "";

      // Calculate per-product total
      const itemTotal =
        product.price && product.quantity
          ? product.price * product.quantity
          : 0;

      total += itemTotal;

      const priceText = product.price
        ? ` - ${formatPrice(product.price, product.priceCurrency)}`
        : "";

      return `${index + 1}. ${product.title}${quantity}${priceText}`;
    })
    .join("\n");

  const totalText =
    total > 0
      ? `\n\n${i18n.t("whatsapp.total")}: ${formatPrice(
          total,
          products[0]?.priceCurrency
        )}`
      : "";

  return `${greeting}\n\n${productsList}${totalText}`;
};

export const openWhatsAppMultipleProducts = async (
  params: MultipleProductsParams
): Promise<void> => {
  const { phoneNumber } = params;

  // Clean phone number - remove all non-digit characters
  const cleanPhoneNumber = phoneNumber.replace(/\D/g, "");

  // Create WhatsApp message
  const message = getMultipleProductsMessage(params);
  const encodedMessage = encodeURIComponent(message);

  // Construct WhatsApp URL
  const whatsappUrl = `https://wa.me/${COUNTRY_CODE}${cleanPhoneNumber}?text=${encodedMessage}`;

  try {
    // Check if WhatsApp is available
    const supported = await Linking.canOpenURL(whatsappUrl);

    if (supported || IS_ANDROID) {
      await Linking.openURL(whatsappUrl);
    } else {
      // Fallback to phone call if WhatsApp is not available
      await Linking.openURL(`tel:${phoneNumber}`);
    }
  } catch (error) {
    console.error("Error opening WhatsApp:", error);
    // Fallback to phone call on error
    await Linking.openURL(`tel:${phoneNumber}`);
  }
};
