import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class FormDataNormalizePipe implements PipeTransform {
  transform(value: any) {
    if (!value || typeof value !== 'object') return value;

    const normalized: any = Array.isArray(value) ? [] : {};

    if (Array.isArray(value)) {
      return this.normalizeValue(value);
    }

    for (const key of Object.keys(value)) {
      if (key === 'files') {
        normalized[key] = value[key];
        continue;
      }

      normalized[key] = this.normalizeValue(value[key]);
    }

    return normalized;
  }

  private normalizeValue(value: any) {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    if (Array.isArray(value)) {
      return value
        .map((v) => this.normalizeValue(v))
        .flat()
        .filter((v) => v !== undefined);
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();

      if (!trimmed) return undefined;

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
