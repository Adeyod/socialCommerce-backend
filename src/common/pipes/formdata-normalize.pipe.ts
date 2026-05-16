import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class FormDataNormalizePipe implements PipeTransform {
  transform(value: any) {
    if (!value || typeof value !== 'object') return value;

    const normalized = { ...value };

    for (const key of Object.keys(normalized)) {
      const val = normalized[key];

      normalized[key] = this.normalizeValue(val);
    }

    return normalized;
  }

  private normalizeValue(value: any) {
    // null/undefined/empty
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    // ARRAY CASE
    if (Array.isArray(value)) {
      return value
        .flatMap((v) => this.normalizeValue(v))
        .filter((v) => v !== undefined);
    }

    // STRING CASE (handles comma-separated values)
    if (typeof value === 'string') {
      const trimmed = value.trim();

      if (trimmed === '') return undefined;

      if (trimmed.includes(',')) {
        return trimmed
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean);
      }

      return trimmed;
    }

    return value;
  }
}
