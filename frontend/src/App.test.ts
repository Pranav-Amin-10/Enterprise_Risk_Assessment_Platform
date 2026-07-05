import { describe, it, expect } from 'vitest';

describe('Frontend Utility Tests', () => {
  it('should parse comma-separated tags into list blocks correctly', () => {
    const parseTags = (tagStr: string | null | undefined) => {
      if (!tagStr) return [];
      return tagStr.split(',').map((t) => t.trim()).filter((t) => t.length > 0);
    };

    expect(parseTags('pci-dss, critical-data, cloud-server')).toEqual(['pci-dss', 'critical-data', 'cloud-server']);
    expect(parseTags('  website , ,  api ')).toEqual(['website', 'api']);
    expect(parseTags(null)).toEqual([]);
  });

  it('should map CIA score numbers to qualitative strings', () => {
    const getCIALabel = (rating: number) => {
      if (rating === 3) return 'high';
      if (rating === 2) return 'medium';
      return 'low';
    };

    expect(getCIALabel(3)).toBe('high');
    expect(getCIALabel(2)).toBe('medium');
    expect(getCIALabel(1)).toBe('low');
  });
});
