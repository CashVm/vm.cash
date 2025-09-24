import * as React from 'react';
import '@testing-library/jest-dom/vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';

import { BCH_2026_OPCODES } from '@/lib/bch2026';

import { OpcodesPage } from './OpcodesPage';

const opcodeByName = (name: string) => {
  const match = BCH_2026_OPCODES.find((row) => row.name === name);
  if (!match) throw new Error(`Missing opcode ${name}`);
  return match;
};

const firstByCategory = (category: string) => {
  const match = BCH_2026_OPCODES.find((row) => row.category === category);
  if (!match) throw new Error(`Missing opcode in category ${category}`);
  return match;
};

const cellKey = (value: number) => value.toString(16).padStart(2, '0');

const COLLAPSED_RANGES = [
  { start: 0x1, end: 0x3 },
  { start: 0xe, end: 0xf },
] as const;

const isInCollapsedRow = (value: number) => {
  const rowIndex = value >> 4;
  return COLLAPSED_RANGES.some(
    (range) => rowIndex >= range.start && rowIndex <= range.end
  );
};

const getVisibleCells = (matrix: HTMLElement) =>
  Array.from(matrix.querySelectorAll('.cell[role="button"]')) as HTMLElement[];

describe('OpcodesPage', () => {
  beforeEach(() => {
    window.location.hash = '';
    window.history.replaceState(null, '', '/');
  });

  afterEach(() => {
    cleanup();
  });

  test('renders visible opcode slots and placeholder rows', () => {
    render(<OpcodesPage />);

    const matrix = screen.getByRole('grid', { name: /opcode hex matrix/i });
    const cells = getVisibleCells(matrix);
    const expectedVisibleCells = BCH_2026_OPCODES.filter(
      (row) => !isInCollapsedRow(row.value)
    ).length;

    expect(cells).toHaveLength(expectedVisibleCells);
    cells.forEach((cell) => expect(cell).not.toHaveClass('dim'));

    const placeholders = matrix.querySelectorAll('.placeholder-cell');
    expect(placeholders).toHaveLength(COLLAPSED_RANGES.length);
    COLLAPSED_RANGES.forEach((range) => {
      const label = `${range.start.toString(16).toUpperCase()}-${range.end
        .toString(16)
        .toUpperCase()}`;
      expect(matrix.querySelector(`[data-range="${label}"]`)).not.toBeNull();
    });
  });

  test('search narrows highlights to matching opcodes', () => {
    const target = opcodeByName('OP_ADD');

    render(<OpcodesPage />);

    const search = screen.getByRole('searchbox', { name: /search opcodes/i });
    fireEvent.change(search, { target: { value: target.name } });

    const matrix = screen.getByRole('grid', { name: /opcode hex matrix/i });
    const cells = getVisibleCells(matrix);
    const key = cellKey(target.value);
    const targetCell = matrix.querySelector(`[data-val="${key}"]`);

    if (!(targetCell instanceof HTMLElement)) {
      throw new Error('Target cell not found');
    }

    expect(targetCell).not.toHaveClass('dim');
    expect(cells.some((cell) => cell.classList.contains('dim'))).toBe(true);
  });

  test('search retains query when filters clear after no matches', async () => {
    const target = opcodeByName('OP_ADD');

    render(<OpcodesPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Operation Type' }));

    const introspectionChip = screen.getByRole('button', {
      name: 'Introspection',
    });
    fireEvent.click(introspectionChip);

    const search = screen.getByRole('searchbox', { name: /search opcodes/i });
    fireEvent.change(search, { target: { value: 'add' } });

    await waitFor(() => {
      if (introspectionChip.isConnected) {
        throw new Error('Introspection chip still present');
      }
    });

    const activeSearch = screen.getByRole('searchbox', {
      name: /search opcodes/i,
    });
    expect((activeSearch as HTMLInputElement).value).toBe('add');

    const matrix = screen.getByRole('grid', { name: /opcode hex matrix/i });
    const targetCell = matrix.querySelector(
      `[data-val="${cellKey(target.value)}"]`
    );

    if (!(targetCell instanceof HTMLElement)) {
      throw new Error('Target cell not found');
    }

    expect(targetCell).not.toHaveClass('dim');
  });

  test('category filter isolates matching opcodes', () => {
    const focus = firstByCategory('Crypto/Sign');
    const other = firstByCategory('Arithmetic');

    render(<OpcodesPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Operation Type' }));

    const cryptoChip = screen.getByRole('button', { name: 'Crypto' });
    fireEvent.click(cryptoChip);

    expect(cryptoChip).toHaveClass('active');

    const matrix = screen.getByRole('grid', { name: /opcode hex matrix/i });
    const focusKey = cellKey(focus.value);
    const otherKey = cellKey(other.value);
    const focusCell = matrix.querySelector(`[data-val="${focusKey}"]`);
    const otherCell = matrix.querySelector(`[data-val="${otherKey}"]`);

    if (
      !(focusCell instanceof HTMLElement) ||
      !(otherCell instanceof HTMLElement)
    ) {
      throw new Error('Selected cells not found');
    }

    expect(focusCell).not.toHaveClass('dim');
    expect(otherCell).toHaveClass('dim');
  });

  test('unknown filter highlights reserved opcodes with updated name formatting', () => {
    const focus =
      BCH_2026_OPCODES.find((row) => row.name.startsWith('OP_UNKNOWN_')) ??
      firstByCategory('Reserved/Unknown');
    const other = firstByCategory('Arithmetic');

    render(<OpcodesPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Operation Type' }));
    const unknownChip = screen.getByRole('button', { name: 'Unknown' });
    fireEvent.click(unknownChip);

    const matrix = screen.getByRole('grid', { name: /opcode hex matrix/i });
    const focusCell = matrix.querySelector(
      `[data-val="${cellKey(focus.value)}"]`
    );
    const otherCell = matrix.querySelector(
      `[data-val="${cellKey(other.value)}"]`
    );

    if (
      !(focusCell instanceof HTMLElement) ||
      !(otherCell instanceof HTMLElement)
    ) {
      throw new Error('Cells not found');
    }

    expect(focusCell).not.toHaveClass('dim');
    expect(otherCell).toHaveClass('dim');
  });

  test('activation year filter highlights matching opcodes', () => {
    const target = opcodeByName('OP_REVERSEBYTES');
    const other = firstByCategory('Arithmetic');

    render(<OpcodesPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Activation Year' }));
    fireEvent.click(screen.getByRole('button', { name: '2020' }));

    const matrix = screen.getByRole('grid', { name: /opcode hex matrix/i });
    const targetCell = matrix.querySelector(
      `[data-val="${cellKey(target.value)}"]`
    );
    const otherCell = matrix.querySelector(
      `[data-val="${cellKey(other.value)}"]`
    );

    if (
      !(targetCell instanceof HTMLElement) ||
      !(otherCell instanceof HTMLElement)
    ) {
      throw new Error('Cells not found');
    }

    expect(targetCell).not.toHaveClass('dim');
    expect(otherCell).toHaveClass('dim');
  });

  test('activation year filters combine when multiple years selected', () => {
    const year2022 = opcodeByName('OP_MUL');
    const year2023 = opcodeByName('OP_OUTPUTTOKENCATEGORY');
    const other = opcodeByName('OP_ADD');

    render(<OpcodesPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Activation Year' }));
    fireEvent.click(screen.getByRole('button', { name: '2022' }));
    fireEvent.click(screen.getByRole('button', { name: '2023' }));

    const matrix = screen.getByRole('grid', { name: /opcode hex matrix/i });
    const cell2022 = matrix.querySelector(
      `[data-val="${cellKey(year2022.value)}"]`
    );
    const cell2023 = matrix.querySelector(
      `[data-val="${cellKey(year2023.value)}"]`
    );
    const otherCell = matrix.querySelector(
      `[data-val="${cellKey(other.value)}"]`
    );

    if (
      !(cell2022 instanceof HTMLElement) ||
      !(cell2023 instanceof HTMLElement) ||
      !(otherCell instanceof HTMLElement)
    ) {
      throw new Error('Cells not found');
    }

    expect(cell2022).not.toHaveClass('dim');
    expect(cell2023).not.toHaveClass('dim');
    expect(otherCell).toHaveClass('dim');
  });

  test('selecting a cell toggles the detail panel', () => {
    const target = opcodeByName('OP_ADD');

    const { container } = render(<OpcodesPage />);
    const matrix = screen.getByRole('grid', { name: /opcode hex matrix/i });
    const key = cellKey(target.value);
    const targetCell = matrix.querySelector(`[data-val="${key}"]`);
    const panel = container.querySelector('.panel') as HTMLElement | null;

    if (!(targetCell instanceof HTMLElement)) {
      throw new Error('Target cell not found');
    }
    if (!panel) throw new Error('Detail panel not found');

    fireEvent.click(targetCell);
    expect(panel.style.display).toBe('flex');
    expect(within(panel).getByText(target.name)).toBeInTheDocument();

    fireEvent.click(targetCell);
    expect(panel.style.display).toBe('none');
  });

  test('updates the document title based on selection', async () => {
    const target = opcodeByName('OP_ADD');
    document.title = 'Initial Title';

    render(<OpcodesPage />);

    await waitFor(() =>
      expect(document.title).toBe('CashVM Opcodes | Bitcoin Cash')
    );

    const matrix = screen.getByRole('grid', { name: /opcode hex matrix/i });
    const key = cellKey(target.value);
    const targetCell = matrix.querySelector(`[data-val="${key}"]`);

    if (!(targetCell instanceof HTMLElement)) {
      throw new Error('Target cell not found');
    }

    fireEvent.click(targetCell);

    await waitFor(() =>
      expect(document.title).toBe('OP_ADD | CashVM Opcodes | Bitcoin Cash')
    );

    fireEvent.click(targetCell);

    await waitFor(() =>
      expect(document.title).toBe('CashVM Opcodes | Bitcoin Cash')
    );
  });

  test('opcode labels drop the OP_ prefix when appropriate', () => {
    const trimmed = opcodeByName('OP_ADD');
    const preserved = opcodeByName('OP_0');

    render(<OpcodesPage />);

    const matrix = screen.getByRole('grid', { name: /opcode hex matrix/i });
    const trimmedCell = matrix.querySelector(
      `[data-val="${cellKey(trimmed.value)}"]`
    );
    const preservedCell = matrix.querySelector(
      `[data-val="${cellKey(preserved.value)}"]`
    );

    if (
      !(trimmedCell instanceof HTMLElement) ||
      !(preservedCell instanceof HTMLElement)
    ) {
      throw new Error('Cells not found');
    }

    expect(within(trimmedCell).getByText('ADD')).toBeInTheDocument();
    expect(within(preservedCell).getByText('OP_0')).toBeInTheDocument();
  });

  test('search input retains value when no results match', async () => {
    render(<OpcodesPage />);

    const search = screen.getByRole('searchbox', { name: /search opcodes/i });
    fireEvent.change(search, { target: { value: 'unmatched-query' } });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(
      (
        screen.getByRole('searchbox', {
          name: /search opcodes/i,
        }) as HTMLInputElement
      ).value
    ).toBe('unmatched-query');
  });

  test('collapsible row headers toggle visibility', () => {
    render(<OpcodesPage />);

    const matrix = screen.getByRole('grid', { name: /opcode hex matrix/i });
    const initialCount = getVisibleCells(matrix).length;

    const expandButton = screen.getByRole('button', {
      name: /expand rows 1-3/i,
    });
    fireEvent.click(expandButton);

    const expandedCount = getVisibleCells(matrix).length;
    const rangeSize =
      (COLLAPSED_RANGES[0].end - COLLAPSED_RANGES[0].start + 1) * 16;
    expect(expandedCount).toBe(initialCount + rangeSize);

    const collapseButtons = screen.getAllByRole('button', {
      name: /collapse rows 1-3/i,
    });
    expect(collapseButtons.length).toBeGreaterThan(0);
    fireEvent.click(collapseButtons[0]!);

    expect(getVisibleCells(matrix).length).toBe(initialCount);
  });

  test('renders opcode from hash and expands collapsed rows', async () => {
    const collapsed =
      BCH_2026_OPCODES.find((row) => isInCollapsedRow(row.value)) ??
      opcodeByName('OP_ADD');
    window.location.hash = `#${collapsed.name}`;

    const { container } = render(<OpcodesPage />);

    await waitFor(() => {
      const panel = container.querySelector('.panel') as HTMLElement | null;
      if (!panel) throw new Error('Panel not found');
      expect(panel.style.display).toBe('flex');
      expect(within(panel).getByText(collapsed.name)).toBeInTheDocument();
    });

    const matrix = screen.getByRole('grid', { name: /opcode hex matrix/i });
    await waitFor(() => {
      const cell = matrix.querySelector(
        `[data-val="${cellKey(collapsed.value)}"]`
      );
      expect(cell).toBeInstanceOf(HTMLElement);
    });
  });

  test('updates the hash when selecting and clearing opcodes', () => {
    const target = opcodeByName('OP_ADD');

    render(<OpcodesPage />);

    const matrix = screen.getByRole('grid', { name: /opcode hex matrix/i });
    const key = cellKey(target.value);
    const targetCell = matrix.querySelector(`[data-val="${key}"]`);

    if (!(targetCell instanceof HTMLElement)) {
      throw new Error('Target cell not found');
    }

    fireEvent.click(targetCell);
    expect(window.location.hash).toBe(`#${target.name}`);

    fireEvent.click(targetCell);
    expect(window.location.hash).toBe('');
  });

  test('responds to manual hash changes', async () => {
    const first = opcodeByName('OP_ADD');
    const second = opcodeByName('OP_SUB');

    render(<OpcodesPage />);

    const matrix = screen.getByRole('grid', { name: /opcode hex matrix/i });
    const firstCell = matrix.querySelector(
      `[data-val="${cellKey(first.value)}"]`
    );

    if (!(firstCell instanceof HTMLElement)) {
      throw new Error('First cell not found');
    }

    fireEvent.click(firstCell);
    expect(window.location.hash).toBe(`#${first.name}`);

    window.location.hash = `#${second.name}`;
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    await waitFor(() => {
      const panel = document.querySelector('.panel') as HTMLElement | null;
      if (!panel) throw new Error('Panel not found');
      expect(panel.style.display).toBe('flex');
      expect(within(panel).getByText(second.name)).toBeInTheDocument();
    });

    expect(window.location.hash).toBe(`#${second.name}`);
  });
});
