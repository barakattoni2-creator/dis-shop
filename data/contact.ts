export const COMPANY_LEGAL_NAME = "Destiny Investment & Supplies (DIS)";
export const COMPANY_NAME = "DIS Shop";

export const ADDRESS_LINES = ["New Site Road", "Juba", "South Sudan"];

export const EMAIL = "info@dislc.com";

export interface PhoneNumber {
  display: string;
  tel: string;
}

export const PHONE_NUMBERS: PhoneNumber[] = [
  { display: "+211 923 600 599", tel: "+211923600599" },
  { display: "+211 923 692 442", tel: "+211923692442" },
];

// Primary number — used for WhatsApp and any single-phone context.
export const PHONE_DISPLAY = PHONE_NUMBERS[0].display;
export const PHONE_TEL = PHONE_NUMBERS[0].tel;

export const WHATSAPP_NUMBER = "211923600599";
export const WHATSAPP_DISPLAY = "+211 923 600 599";
