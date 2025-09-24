import * as React from 'react';
import { ExternalLink, Github, Search, X } from 'lucide-react';
import { BCH_2026_OPCODES, CATEGORIES } from '@/lib/bch2026';
import type { Category, OpcodeRow } from '@/lib/bch2026';

import './OpcodesPage.css';

export type State = {
  q: string;
  filters: Category[];
};

const createInitialState = (): State => ({ q: '', filters: [] });

const OPCODES_BY_VALUE = (() => {
  const map = new Map<number, OpcodeRow>();
  for (const row of BCH_2026_OPCODES) {
    map.set(row.value, row);
  }
  return map;
})();

const CATEGORY_LABELS: Partial<Record<Category, string>> = {
  'Push/Const (Bytes)': 'Push (Bytes)',
  'Push/Const (Numeric)': 'Push (Number)',
  'Binary/Bitwise': 'Bitwise',
  'Crypto/Sign': 'Crypto',
  'Reserved/Unknown': 'Unknown',
};

const KEEP_OP_PREFIX = new Set([
  'OP_0',
  'OP_1',
  'OP_2',
  'OP_3',
  'OP_4',
  'OP_5',
  'OP_6',
  'OP_7',
  'OP_8',
  'OP_9',
  'OP_10',
  'OP_11',
  'OP_12',
  'OP_13',
  'OP_14',
  'OP_15',
  'OP_16',
]);

const COLUMN_HEADERS = '0 1 2 3 4 5 6 7 8 9 A B C D E F'.split(' ');
const GRID_RANGE = Array.from({ length: 16 }, (_, index) => index);

const ACTIVATION_YEAR_OPTIONS = [
  2009, 2015, 2016, 2018, 2020, 2022, 2023, 2026,
] as const;
export type ActivationYear = (typeof ACTIVATION_YEAR_OPTIONS)[number];

const ACTIVATION_YEAR_LABELS: Record<ActivationYear, string> = {
  2009: '2009',
  2015: '2015',
  2016: '2016',
  2018: '2018',
  2020: '2020',
  2022: '2022',
  2023: '2023',
  2026: '2026',
};

const NAME_TO_VALUE = (() => {
  const map = new Map<string, number>();
  BCH_2026_OPCODES.forEach((row) => {
    const register = (key: string) => {
      map.set(key, row.value);
      map.set(key.toUpperCase(), row.value);
    };
    register(row.name);
    row.aliases.forEach(register);
  });
  return map;
})();

const ACTIVATION_NAME_GROUPS: Record<
  Exclude<ActivationYear, 2009>,
  string[]
> = {
  2015: ['OP_CHECKLOCKTIMEVERIFY'],
  2016: ['OP_CHECKSEQUENCEVERIFY'],
  2018: [
    'OP_CAT',
    'OP_SPLIT',
    'OP_AND',
    'OP_OR',
    'OP_XOR',
    'OP_DIV',
    'OP_MOD',
    'OP_NUM2BIN',
    'OP_BIN2NUM',
    'OP_CHECKDATASIG',
    'OP_CHECKDATASIGVERIFY',
  ],
  2020: ['OP_REVERSEBYTES'],
  2022: [
    'OP_MUL',
    'OP_INPUTINDEX',
    'OP_ACTIVEBYTECODE',
    'OP_TXVERSION',
    'OP_TXINPUTCOUNT',
    'OP_TXOUTPUTCOUNT',
    'OP_TXLOCKTIME',
    'OP_UTXOVALUE',
    'OP_UTXOBYTECODE',
    'OP_OUTPOINTTXHASH',
    'OP_OUTPOINTINDEX',
    'OP_INPUTBYTECODE',
    'OP_INPUTSEQUENCENUMBER',
    'OP_OUTPUTVALUE',
    'OP_OUTPUTBYTECODE',
  ],
  2023: [
    'OP_UTXOTOKENCATEGORY',
    'OP_UTXOTOKENCOMMITMENT',
    'OP_UTXOTOKENAMOUNT',
    'OP_OUTPUTTOKENCATEGORY',
    'OP_OUTPUTTOKENCOMMITMENT',
    'OP_OUTPUTTOKENAMOUNT',
  ],
  2026: [
    'OP_BEGIN',
    'OP_UNTIL',
    'OP_DEFINE',
    'OP_INVOKE',
    'OP_LSHIFTNUM',
    'OP_RSHIFTNUM',
    'OP_LSHIFTBIN',
    'OP_RSHIFTBIN',
    'OP_INVERT',
  ],
};

const ACTIVATION_VALUE_SETS: ReadonlyMap<ActivationYear, Set<number>> = (() => {
  const map = new Map<ActivationYear, Set<number>>();
  const usedValues = new Set<number>();

  const laterYears = ACTIVATION_YEAR_OPTIONS.filter(
    (year): year is Exclude<ActivationYear, 2009> => year !== 2009
  );

  laterYears.forEach((year) => {
    const set = new Set<number>();
    ACTIVATION_NAME_GROUPS[year].forEach((name) => {
      const value = NAME_TO_VALUE.get(name);
      if (value !== undefined) {
        set.add(value);
        usedValues.add(value);
      }
    });
    map.set(year, set);
  });

  const legacySet = new Set<number>();
  BCH_2026_OPCODES.forEach((row) => {
    if (!usedValues.has(row.value)) {
      legacySet.add(row.value);
    }
  });
  map.set(2009, legacySet);

  return map;
})();

type CollapsedRange = { start: number; end: number };

const COLLAPSED_ROW_RANGES: readonly CollapsedRange[] = [
  { start: 0x1, end: 0x3 },
  { start: 0xe, end: 0xf },
];

const RANGE_LABEL = (range: CollapsedRange) =>
  `${range.start.toString(16).toUpperCase()}-${range.end
    .toString(16)
    .toUpperCase()}`;

type GridSegment =
  | { type: 'row'; index: number }
  | { type: 'placeholder'; start: number; end: number; label: string }
  | {
      type: 'expanded-range';
      start: number;
      end: number;
      label: string;
      rows: number[];
    };

function buildSegments(expanded: ReadonlySet<number>): GridSegment[] {
  const segments: GridSegment[] = [];
  let index = 0;
  while (index < 16) {
    const collapse = COLLAPSED_ROW_RANGES.find(
      (range) => range.start === index
    );
    if (collapse) {
      if (!expanded.has(collapse.start)) {
        segments.push({
          type: 'placeholder',
          start: collapse.start,
          end: collapse.end,
          label: RANGE_LABEL(collapse),
        });
        index = collapse.end + 1;
        continue;
      }
      const rows: number[] = [];
      for (let row = collapse.start; row <= collapse.end; row += 1) {
        rows.push(row);
      }
      segments.push({
        type: 'expanded-range',
        start: collapse.start,
        end: collapse.end,
        label: RANGE_LABEL(collapse),
        rows,
      });
      index = collapse.end + 1;
      continue;
    }
    segments.push({ type: 'row', index });
    index += 1;
  }
  return segments;
}

const OPCODE_HASH_PARAM = 'opcode';

function parseOpcodeIdentifier(hash: string): string | null {
  if (!hash) return null;
  const trimmed = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!trimmed) return null;
  try {
    const decoded = decodeURIComponent(trimmed);
    const paramMatch = decoded.match(
      new RegExp(`^${OPCODE_HASH_PARAM}=([^=&]+)$`, 'i')
    );
    const identifier = paramMatch ? paramMatch[1] : decoded;
    const normalized = identifier!.trim();
    return normalized.length > 0 ? normalized : null;
  } catch {
    return null;
  }
}

function getRowByIdentifier(identifier: string): OpcodeRow | null {
  const target =
    NAME_TO_VALUE.get(identifier) ??
    NAME_TO_VALUE.get(identifier.toUpperCase());
  if (target === undefined) return null;
  return OPCODES_BY_VALUE.get(target) ?? null;
}

function collapsedRangeStart(value: number): number | null {
  const rowIndex = value >> 4;
  const match = COLLAPSED_ROW_RANGES.find(
    (range) => rowIndex >= range.start && rowIndex <= range.end
  );
  return match ? match.start : null;
}

const formatDataValue = (value: number) => value.toString(16).padStart(2, '0');

const displayCategoryName = (category: Category): string =>
  CATEGORY_LABELS[category] ?? category;

const formatOpcodeLabel = (name: string): string => {
  const base = KEEP_OP_PREFIX.has(name)
    ? name
    : name.startsWith('OP_')
    ? name.slice(3)
    : name;

  const withSpaces = base.replaceAll(
    /(check|sig|tx|utxo|input|output|outpoint|token|reverse|locktime|sequence)(?=[A-Z_])/gi,
    (_, word: string) => `${word} `
  );

  const normalized = withSpaces.replace(/^UNKNOWN(?=_[0-9A-F]+)/i, (match) =>
    match.toUpperCase()
  );
  return normalized.toUpperCase();
};

type FilterStage = 'initial' | 'operation' | 'activation';

export function OpcodesPage() {
  const [state, setState] = React.useState<State>(createInitialState);
  const [selected, setSelected] = React.useState<OpcodeRow | null>(null);
  const [expandedRanges, setExpandedRanges] = React.useState<Set<number>>(
    () => new Set()
  );
  const [filterStage, setFilterStage] = React.useState<FilterStage>(
    state.filters.length > 0 ? 'operation' : 'initial'
  );
  const [activationYears, setActivationYears] = React.useState<
    Set<ActivationYear>
  >(() => new Set());
  const scrollToSelectedRef = React.useRef(false);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  const query = state.q.trim().toLowerCase();
  const filters = state.filters;
  const filtersSelected = filters.length > 0;
  const activationSelected = activationYears.size > 0;
  const filteredRows = filterRows(BCH_2026_OPCODES, state, activationYears);
  const isFiltering = query.length > 0 || filtersSelected || activationSelected;
  const highlightedValues = isFiltering
    ? new Set(filteredRows.map((row) => row.value))
    : undefined;
  const segments = React.useMemo(
    () => buildSegments(expandedRanges),
    [expandedRanges]
  );
  const unknownActive = filters.includes('Reserved/Unknown');
  const filtersActiveForSearch = filtersSelected || activationSelected;
  const showClearFilter =
    filterStage !== 'initial' || filtersSelected || activationSelected;
  const searchPlaceholder = 'Search by name or description...';

  const toggleRange = React.useCallback((start: number) => {
    setExpandedRanges((prev) => {
      const next = new Set(prev);
      if (next.has(start)) {
        next.delete(start);
      } else {
        next.add(start);
      }
      return next;
    });
  }, []);

  const updateLocationHash = React.useCallback((row: OpcodeRow | null) => {
    if (typeof window === 'undefined') return;
    const { pathname, search } = window.location;
    const base = `${pathname}${search}`;
    const nextHash = row ? `#${encodeURIComponent(row.name)}` : '';
    const target = `${base}${nextHash}`;
    window.history.replaceState(null, '', target);
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }
  }, []);

  const ensureRangeVisible = React.useCallback((value: number) => {
    const start = collapsedRangeStart(value);
    if (start === null) return;
    setExpandedRanges((prev) => {
      if (prev.has(start)) return prev;
      const next = new Set(prev);
      next.add(start);
      return next;
    });
  }, []);

  const applySelection = React.useCallback(
    (
      row: OpcodeRow | null,
      options?: { updateHash?: boolean; scrollIntoView?: boolean }
    ) => {
      if (row) {
        ensureRangeVisible(row.value);
        scrollToSelectedRef.current = options?.scrollIntoView === true;
      } else {
        scrollToSelectedRef.current = false;
      }

      setSelected((previous) => {
        if (previous?.value === row?.value) return previous;
        return row;
      });

      if (options?.updateHash === false) return;
      updateLocationHash(row);
    },
    [ensureRangeVisible, updateLocationHash]
  );

  const clearFilters = React.useCallback(() => {
    setState((prev) => (prev.filters.length ? { ...prev, filters: [] } : prev));
    setActivationYears(() => new Set());
    setFilterStage('initial');
  }, []);

  const handleShowOperation = React.useCallback(() => {
    setFilterStage('operation');
  }, []);

  const handleShowActivation = React.useCallback(() => {
    setState((prev) => (prev.filters.length ? { ...prev, filters: [] } : prev));
    setFilterStage('activation');
  }, []);

  const handleActivationSelect = React.useCallback((year: ActivationYear) => {
    setActivationYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) {
        next.delete(year);
      } else {
        next.add(year);
      }
      return next;
    });
    setFilterStage('activation');
  }, []);

  const filterStackClass = `filter-stack stage-${filterStage}`;
  const filterStackAriaLabel =
    filterStage === 'operation'
      ? 'Filter by operation type'
      : filterStage === 'activation'
      ? 'Filter by activation year'
      : undefined;

  const clearSearch = React.useCallback(() => {
    setState((prev) => (prev.q.length ? { ...prev, q: '' } : prev));
    const input = searchInputRef.current;
    if (input) input.focus();
  }, []);

  const filtersContent = (() => {
    if (filterStage === 'initial') {
      return (
        <>
          <button
            type="button"
            className="chip stage-chip"
            onClick={handleShowOperation}
          >
            Operation Type
          </button>
          <button
            type="button"
            className="chip stage-chip"
            onClick={handleShowActivation}
          >
            Activation Year
          </button>
        </>
      );
    }

    if (filterStage === 'activation') {
      return ACTIVATION_YEAR_OPTIONS.map((year) => {
        const active = activationYears.has(year);
        return (
          <button
            key={year}
            type="button"
            className={`chip${active ? ' active' : ''}`}
            onClick={() => handleActivationSelect(year)}
          >
            {ACTIVATION_YEAR_LABELS[year]}
          </button>
        );
      });
    }

    return CATEGORIES.map((cat) => {
      const active = filters.includes(cat);
      const tone = catToClass(cat);
      return (
        <button
          key={cat}
          className={`chip${active ? ` active${tone ? ` ${tone}` : ''}` : ''}`}
          onClick={() =>
            setState((prev) => ({
              ...prev,
              filters: active
                ? prev.filters.filter((c) => c !== cat)
                : [...prev.filters, cat],
            }))
          }
        >
          {displayCategoryName(cat)}
        </button>
      );
    });
  })();

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncFromHash = () => {
      const identifier = parseOpcodeIdentifier(window.location.hash);
      if (!identifier) {
        applySelection(null, { updateHash: false });
        return;
      }
      const row = getRowByIdentifier(identifier);
      if (row) {
        const shouldScroll = selected?.value !== row.value;
        applySelection(row, {
          updateHash: false,
          scrollIntoView: shouldScroll,
        });
      } else {
        applySelection(null, { updateHash: false });
      }
    };

    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, [applySelection, selected]);

  React.useEffect(() => {
    if (!selected || !scrollToSelectedRef.current) return;
    if (typeof document === 'undefined') return;

    scrollToSelectedRef.current = false;
    const selector = `.matrix .cell[data-val="${formatDataValue(
      selected.value
    )}"]`;
    const cell = document.querySelector<HTMLElement>(selector);
    if (cell) {
      cell.scrollIntoView({ block: 'center', inline: 'center' });
    }
  }, [selected]);

  React.useEffect(() => {
    if (!isFiltering || filteredRows.length > 0) return;

    const hasQuery = state.q.trim().length > 0;

    if (hasQuery && (filtersSelected || activationSelected)) {
      setState((prev) =>
        prev.filters.length > 0 ? { ...prev, filters: [] } : prev
      );
      if (activationSelected) {
        setActivationYears(() => new Set());
      }
      setFilterStage('initial');
      return;
    }

    if (!hasQuery) {
      setState(createInitialState());
      setActivationYears(() => new Set());
      setFilterStage('initial');
    }
  }, [
    activationSelected,
    filteredRows.length,
    filtersSelected,
    isFiltering,
    state.q,
  ]);

  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    const baseTitle = 'CashVM Opcodes | Bitcoin Cash';
    document.title = selected ? `${selected.name} | ${baseTitle}` : baseTitle;
  }, [selected]);

  return (
    <div className={`opcodes-root${unknownActive ? ' unknown-active' : ''}`}>
      <header className="top">
        <div>
          <h1 className="mono">CashVM Opcodes</h1>
          <p className="sub">
            Opcode reference for the Bitcoin Cash virtual machine.
          </p>
        </div>
        <a
          className="cta-link"
          href="https://ide.bitauth.com/"
          target="_blank"
          rel="noreferrer noopener"
        >
          Online IDE
          <ExternalLink className="cta-icon" aria-hidden="true" />
          <span className="sr-only">Opens in a new tab</span>
        </a>
      </header>

      <div className="controls">
        <div className="filters-row">
          <div
            className={filterStackClass}
            aria-label={filterStackAriaLabel ?? undefined}
          >
            {showClearFilter ? (
              <button
                type="button"
                className="filter-label clear"
                onClick={clearFilters}
              >
                Clear Filter
              </button>
            ) : (
              <span className="filter-label">Filter By</span>
            )}
            {filtersContent}
          </div>
          <div
            className={`search-wrap${filtersActiveForSearch ? ' compact' : ''}`}
          >
            <Search className="search-icon" aria-hidden="true" size={14} />
            <input
              className="search-input"
              type="search"
              placeholder={searchPlaceholder}
              value={state.q}
              onChange={(event) =>
                setState((prev) => ({ ...prev, q: event.target.value }))
              }
              aria-label="Search opcodes"
              ref={searchInputRef}
            />
            {state.q.length > 0 ? (
              <button
                type="button"
                className="clear-search"
                onClick={clearSearch}
                aria-label="Clear search"
              >
                <X aria-hidden="true" size={14} />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <main className="layout">
        <div className="grid-wrap">
          <div className="matrix-scroll">
            <HexMatrix
              segments={segments}
              highlighted={highlightedValues}
              selectedValue={selected?.value ?? null}
              onSelect={(row, element, options) => {
                if (selected?.value === row.value) {
                  applySelection(null);
                  if (element) {
                    element.blur();
                  }
                  return;
                }
                const shouldScroll = options?.scrollIntoView === true;
                if (shouldScroll && element) {
                  element.scrollIntoView({ block: 'center', inline: 'center' });
                }
                applySelection(row);
              }}
              onToggleRange={toggleRange}
              ariaLabel="Opcode hex matrix"
            />
          </div>
          <div className="legend">{legend()}</div>
        </div>
      </main>

      <footer className="opcodes-footer">
        <div className="opcodes-footer-links">
          <a
            className="opcodes-footer-link"
            href="https://github.com/CashVm/vm.cash"
            target="_blank"
            rel="noreferrer noopener"
          >
            <Github className="footer-icon" aria-hidden="true" />
          </a>
        </div>
        <div className="opcodes-footer-credit">
          Made by{' '}
          <a
            href="https://x.com/bitjson"
            target="_blank"
            rel="noreferrer noopener"
          >
            @bitjson
          </a>
        </div>
      </footer>

      <DetailSheet row={selected} onClose={() => applySelection(null)} />
    </div>
  );
}

function filterRows(
  rows: readonly OpcodeRow[],
  state: State,
  activationYears: ReadonlySet<ActivationYear>
) {
  const query = state.q.trim().toLowerCase();
  const hasQuery = query.length > 0;
  const hasFilters = state.filters.length > 0;
  const hasActivation = activationYears.size > 0;
  const activationSet = hasActivation
    ? (() => {
        const combined = new Set<number>();
        activationYears.forEach((year) => {
          const values = ACTIVATION_VALUE_SETS.get(year);
          if (values) values.forEach((value) => combined.add(value));
        });
        return combined;
      })()
    : undefined;

  return rows.filter((row) => {
    if (hasFilters && !state.filters.includes(row.category)) return false;
    if (activationSet && !activationSet.has(row.value)) return false;
    if (!hasQuery) return true;
    const haystack = `${row.name} ${row.description}`.toLowerCase();
    return haystack.includes(query);
  });
}

type HexMatrixProps = {
  segments: readonly GridSegment[];
  highlighted: Set<number> | undefined;
  selectedValue: number | null;
  onSelect: (
    row: OpcodeRow,
    element?: HTMLDivElement | null,
    options?: { scrollIntoView?: boolean }
  ) => void;
  onToggleRange: (rangeStart: number) => void;
  ariaLabel?: string;
};

function HexMatrix({
  segments,
  highlighted,
  selectedValue,
  onSelect,
  onToggleRange,
  ariaLabel,
}: HexMatrixProps) {
  const [hoveredRange, setHoveredRange] = React.useState<number | null>(null);

  const handleRangeHover = React.useCallback((rangeStart: number | null) => {
    setHoveredRange(rangeStart);
  }, []);

  const renderRow = React.useCallback(
    (rowIndex: number) => {
      return (
        <div className="row" key={rowIndex}>
          <div className="r">{rowIndex.toString(16).toUpperCase()}</div>
          {GRID_RANGE.map((columnIndex) => {
            const value = (rowIndex << 4) | columnIndex;
            const item = OPCODES_BY_VALUE.get(value);
            const fallbackName = `OP_UNKNOWN_${value}`;
            const categoryClass = catToClass(
              item?.category ?? 'Reserved/Unknown'
            );
            const dimmed = highlighted && !highlighted.has(value);

            return (
              <div
                key={columnIndex}
                className={`cell ${categoryClass}${dimmed ? ' dim' : ''}`}
                tabIndex={item ? 0 : -1}
                data-val={value.toString(16).padStart(2, '0')}
                onClick={(event) => {
                  if (!item) return;
                  const wasSelected = selectedValue === item.value;
                  onSelect(item, event.currentTarget, {
                    scrollIntoView: false,
                  });
                  if (wasSelected) {
                    event.currentTarget.blur();
                  }
                }}
                onKeyDown={(event) => {
                  if (!item) return;
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect(item, event.currentTarget, {
                      scrollIntoView: true,
                    });
                  }
                }}
                role="button"
                aria-label={
                  item
                    ? `${item.name} at 0x${value
                        .toString(16)
                        .toUpperCase()
                        .padStart(2, '0')}`
                    : `Undefined at 0x${value
                        .toString(16)
                        .toUpperCase()
                        .padStart(2, '0')}`
                }
              >
                <div className="byte mono">
                  {`0x${value.toString(16).toUpperCase().padStart(2, '0')}`}
                </div>
                <div className="inner">
                  <div className="mn mono">
                    {formatOpcodeLabel(item?.name ?? fallbackName)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    },
    [highlighted, onSelect, selectedValue]
  );

  return (
    <div className="matrix" role="grid" aria-label={ariaLabel}>
      <div className="head">
        <div />
        {COLUMN_HEADERS.map((label) => (
          <div className="lbl" key={label}>
            {label}
          </div>
        ))}
      </div>

      {segments.map((segment) => {
        if (segment.type === 'placeholder') {
          const handleToggle = () => onToggleRange(segment.start);
          const handleKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              handleToggle();
            }
          };
          const isHovered = hoveredRange === segment.start;
          return (
            <div
              className={`row placeholder${isHovered ? ' range-hover' : ''}`}
              key={`placeholder-${segment.label}`}
              role="button"
              tabIndex={0}
              aria-expanded={false}
              aria-label={`Expand rows ${segment.label}`}
              onClick={handleToggle}
              onKeyDown={handleKey}
              onMouseEnter={() => handleRangeHover(segment.start)}
              onMouseLeave={() => handleRangeHover(null)}
              onFocus={() => handleRangeHover(segment.start)}
              onBlur={() => handleRangeHover(null)}
            >
              <div className="r" aria-hidden="true">
                {segment.label}
              </div>
              <div
                className="placeholder-cell mono"
                data-range={segment.label}
                aria-hidden="true"
              >
                ⋯
              </div>
              <span className="sr-only">
                Rows {segment.label} are collapsed. Activate to expand.
              </span>
            </div>
          );
        }

        if (segment.type === 'expanded-range') {
          const handleEnter = () => handleRangeHover(segment.start);
          const handleLeave = () => handleRangeHover(null);
          const isHovered = hoveredRange === segment.start;
          const handleToggle = () => onToggleRange(segment.start);

          return (
            <div
              className={`range-group${isHovered ? ' range-hover' : ''}`}
              key={`expanded-${segment.label}`}
            >
              <button
                type="button"
                className="range-handle"
                aria-label={`Collapse rows ${segment.label}`}
                onClick={handleToggle}
                onMouseEnter={handleEnter}
                onMouseLeave={handleLeave}
                onFocus={handleEnter}
                onBlur={handleLeave}
              >
                <span aria-hidden="true">{segment.label}</span>
                <span className="sr-only">Collapse rows {segment.label}</span>
              </button>
              <div className="range-highlight" aria-hidden="true" />
              {segment.rows.map((rowIndex) => renderRow(rowIndex))}
            </div>
          );
        }

        return renderRow(segment.index);
      })}
    </div>
  );
}

type DetailSheetProps = {
  row: OpcodeRow | null;
  onClose: () => void;
};

function DetailSheet({ row, onClose }: DetailSheetProps) {
  React.useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const categoryClass = row ? catToClass(row.category) : undefined;

  return (
    <aside
      className="panel"
      style={{ display: row ? 'flex' : 'none' }}
      aria-live="polite"
    >
      <header>
        <h2 className="mono">Details</h2>
      </header>
      <div className="body">
        {row && (
          <>
            <h3 className="mono">
              {row.name} <span className="badge">{row.byte}</span>
              <span
                className={`badge cat${
                  categoryClass ? ` ${categoryClass}` : ''
                }`}
              >
                {displayCategoryName(row.category)}
              </span>
            </h3>
            <p>{row.description}</p>
            {row.aliases.length > 0 && (
              <>
                <div className="k">Aliases / Former names</div>
                <div className="v mono">{row.aliases.join(', ')}</div>
              </>
            )}
            {row.specifications.length > 0 && (
              <>
                <div className="k">Specifications</div>
                <div className="actions">
                  {row.specifications.map((spec) => (
                    <a
                      key={spec.url}
                      className="chip"
                      href={spec.url}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      <span>{spec.label}</span>
                      <ExternalLink className="chip-icon" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
      <button className="close" onClick={onClose} aria-label="Close details">
        ×
      </button>
    </aside>
  );
}

function catToClass(category: Category): string {
  return (
    {
      'Push/Const (Numeric)': 'push-num',
      'Push/Const (Bytes)': 'push-byte',
      Stack: 'stack',
      'Binary/Bitwise': 'binary',
      Arithmetic: 'arith',
      Control: 'control',
      'Crypto/Sign': 'crypto',
      Introspection: 'intro',
      Tokens: 'token',
      'Reserved/Unknown': 'res',
      Misc: 'res',
    } as const
  )[category];
}

function legend() {
  const items: Array<[string, string]> = [
    ['push-num', 'Push (Number)'],
    ['push-byte', 'Push (Bytes)'],
    ['stack', 'Stack'],
    ['binary', 'Bitwise'],
    ['arith', 'Arithmetic'],
    ['control', 'Control'],
    ['crypto', 'Crypto'],
    ['intro', 'Introspection'],
    ['token', 'Tokens'],
    ['res', 'Unknown'],
  ];

  return items.map(([cls, label]) => (
    <span key={cls}>
      <i className={`sw ${cls}`} aria-hidden="true" />
      {label}
    </span>
  ));
}

export { filterRows, parseOpcodeIdentifier };
