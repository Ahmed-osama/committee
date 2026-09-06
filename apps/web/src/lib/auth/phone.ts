// Egyptian mobile numbers in E.164: +20 followed by a 10-digit local number
// starting with one of the four active Egyptian mobile prefixes (010 Vodafone,
// 011 Etisalat Misr, 012 Orange, 015 WE) with the leading 0 dropped.
const EGYPT_MOBILE_E164 = /^\+20(10|11|12|15)\d{8}$/;

export function isEgyptianE164Phone(phone: string): boolean {
  return EGYPT_MOBILE_E164.test(phone);
}
