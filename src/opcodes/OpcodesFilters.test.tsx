import { describe, expect, test } from 'bun:test';

import { BCH_2026_OPCODES, type Category } from '@/lib/bch2026';
import {
  type ActivationYear,
  filterRows,
  parseOpcodeIdentifier,
} from './OpcodesPage';

describe('filterRows', () => {
  const baseState = { q: '', filters: [] as Category[] };

  test('returns matches for textual query', () => {
    const result = filterRows(
      BCH_2026_OPCODES,
      { ...baseState, q: 'checkdatasig' },
      new Set()
    );
    expect(result.some((row) => row.name === 'OP_CHECKDATASIG')).toBe(true);
    expect(
      result.every((row) =>
        `${row.name} ${row.description}`.toLowerCase().includes('checkdatasig')
      )
    ).toBe(true);
  });

  test('filters by opcode category', () => {
    const targetCategory: Category = 'Introspection';
    const result = filterRows(
      BCH_2026_OPCODES,
      { q: '', filters: [targetCategory] },
      new Set()
    );
    expect(result.length).toBeGreaterThan(0);
    result.forEach((row) => {
      expect(row.category).toBe(targetCategory);
    });
  });

  test('filters by activation year grouping', () => {
    const activationYears = new Set<ActivationYear>([2026]);
    const result = filterRows(BCH_2026_OPCODES, baseState, activationYears);
    const expectedNames = new Set([
      'OP_BEGIN',
      'OP_UNTIL',
      'OP_DEFINE',
      'OP_INVOKE',
      'OP_LSHIFTNUM',
      'OP_RSHIFTNUM',
      'OP_LSHIFTBIN',
      'OP_RSHIFTBIN',
      'OP_INVERT',
    ]);
    expect(result.length).toBe(expectedNames.size);
    expect(result.every((row) => expectedNames.has(row.name))).toBe(true);
  });
});

describe('parseOpcodeIdentifier', () => {
  test('parses hash fragments with parameter syntax', () => {
    expect(parseOpcodeIdentifier('#opcode=OP_CAT')).toBe('OP_CAT');
  });

  test('parses plain hash fragments', () => {
    expect(parseOpcodeIdentifier('#OP_CHECKSIG')).toBe('OP_CHECKSIG');
  });

  test('returns null for empty input', () => {
    expect(parseOpcodeIdentifier('#')).toBeNull();
    expect(parseOpcodeIdentifier('')).toBeNull();
  });
});
