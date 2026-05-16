import { ForbiddenException, NotAcceptableException } from '@nestjs/common';
import parsePhoneNumberFromString from 'libphonenumber-js';
import { customAlphabet } from 'nanoid';

export const normalizePhoneNumber = (phoneNumber: string) => {
  const parsed = parsePhoneNumberFromString(phoneNumber, 'NG');

  if (!parsed || !parsed.isValid()) {
    throw new NotAcceptableException({
      message: 'Invalid phone number format.',
      success: false,
      status: 406,
    });
  }

  return parsed.number;
};

export const generateRefCode = (): string => {
  const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTVWXYZ0123456789', 8);

  const code = `AT-${nanoid()}`;
  return code;
};

export function buildSmartPatch<T extends Record<string, any>>(
  dto: T,
): Partial<T> {
  const patch: Partial<T> = {};

  for (const [key, value] of Object.entries(dto)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }

    if (Array.isArray(value)) {
      const cleaned = value
        .map((v) => (typeof v === 'string' ? v.trim() : v))
        .filter((v) => v !== '' && v !== null && v !== undefined);

      if (cleaned.length === 0) continue;

      patch[key as keyof T] = cleaned as T[keyof T];
      continue;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') continue;

      patch[key as keyof T] = trimmed as T[keyof T];
      continue;
    }

    patch[key as keyof T] = value;
  }

  return patch;
}

// export const generatePaymentReference = (payload: {
//   bookingId: string;
//   listingType: ListingType;
// }) => {
//   const { bookingId, listingType } = payload;

//   console.log('payload:', payload);

//   if (!bookingId || !listingType) {
//     throw new BadRequestException({
//       message: 'User ID and plan are required.',
//       success: false,
//       status: 400,
//     });
//   }

//   const ref = `PAYMENT_${listingType}_${bookingId}_${Date.now()}`;

//   return ref;
// };

// export const normalizeDto = (dto: Record<string, any>) => {
//   const response = Object.fromEntries(
//     Object.entries(dto).map(([key, value]) => [
//       key,
//       typeof value === 'string' ? value.toLowerCase().trim() : value,
//     ]),
//   );

//   return response;
// };

export const validateBusinessOwnership = (
  resourceBusinessId: string,
  businessId: string,
) => {
  if (resourceBusinessId !== businessId) {
    throw new ForbiddenException('Access denied');
  }
};
