import { NotAcceptableException } from '@nestjs/common';
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
