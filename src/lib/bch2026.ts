import { OpcodesBch2026 as RawOpcodes2026 } from '@bitauth/libauth/build/lib/vm/instruction-sets/bch/2026/bch-2026-opcodes.js';
import { OpcodesBch2023 as RawOpcodes2023 } from '@bitauth/libauth/build/lib/vm/instruction-sets/bch/2023/bch-2023-opcodes.js';
import { OpcodeDescriptionsBch2026 as RawDescriptions2026 } from '@bitauth/libauth/build/lib/vm/instruction-sets/bch/2026/bch-2026-descriptions.js';
import { OpcodeDescriptionsBch2023 as RawDescriptions2023 } from '@bitauth/libauth/build/lib/vm/instruction-sets/bch/2023/bch-2023-descriptions.js';

export type Specification = {
  label: string;
  url: string;
};

export type OpcodeRow = {
  value: number; // 0..255
  byte: string; // "0xAC"
  name: string; // canonical 2026 opcode name (e.g., OP_BEGIN)
  aliases: string[]; // former names (e.g., OP_VERIF)
  description: string; // 2026 text if available; else fallback from 2023; else placeholder
  category: Category;
  specifications: readonly Specification[];
};

export type Category =
  | 'Push/Const (Numeric)'
  | 'Push/Const (Bytes)'
  | 'Stack'
  | 'Binary/Bitwise'
  | 'Arithmetic'
  | 'Control'
  | 'Crypto/Sign'
  | 'Introspection'
  | 'Tokens'
  | 'Reserved/Unknown'
  | 'Misc';

const OPCODES_2026 = RawOpcodes2026 as Record<string, string | number>;
const OPCODES_2023 = RawOpcodes2023 as Record<string, string | number>;
const DESCRIPTIONS_2026 = RawDescriptions2026 as Record<string, string>;
const DESCRIPTIONS_2023 = RawDescriptions2023 as Record<string, string>;

const STACK = new Set([
  'OP_TOALTSTACK',
  'OP_FROMALTSTACK',
  'OP_2DROP',
  'OP_2DUP',
  'OP_3DUP',
  'OP_2OVER',
  'OP_2ROT',
  'OP_2SWAP',
  'OP_IFDUP',
  'OP_DEPTH',
  'OP_DROP',
  'OP_DUP',
  'OP_NIP',
  'OP_OVER',
  'OP_PICK',
  'OP_ROLL',
  'OP_ROT',
  'OP_SWAP',
  'OP_TUCK',
]);
const CONTROL = new Set([
  'OP_NOP',
  'OP_IF',
  'OP_NOTIF',
  'OP_ELSE',
  'OP_ENDIF',
  'OP_VERIFY',
  'OP_RETURN',
  'OP_BEGIN',
  'OP_UNTIL',
  'OP_DEFINE',
  'OP_INVOKE',
]);
const BINARY = new Set([
  'OP_CAT',
  'OP_SPLIT',
  'OP_NUM2BIN',
  'OP_BIN2NUM',
  'OP_SIZE',
  'OP_INVERT',
  'OP_AND',
  'OP_OR',
  'OP_XOR',
  'OP_REVERSEBYTES',
  'OP_EQUAL',
  'OP_EQUALVERIFY',
  'OP_LSHIFTBIN',
  'OP_RSHIFTBIN',
]);
const ARITHMETIC = new Set([
  'OP_1ADD',
  'OP_1SUB',
  'OP_NEGATE',
  'OP_ABS',
  'OP_NOT',
  'OP_0NOTEQUAL',
  'OP_ADD',
  'OP_SUB',
  'OP_MUL',
  'OP_DIV',
  'OP_MOD',
  'OP_LSHIFTNUM',
  'OP_RSHIFTNUM',
  'OP_BOOLAND',
  'OP_BOOLOR',
  'OP_NUMEQUAL',
  'OP_NUMEQUALVERIFY',
  'OP_NUMNOTEQUAL',
  'OP_LESSTHAN',
  'OP_GREATERTHAN',
  'OP_LESSTHANOREQUAL',
  'OP_GREATERTHANOREQUAL',
  'OP_MIN',
  'OP_MAX',
  'OP_WITHIN',
]);
const CRYPTO = new Set([
  'OP_RIPEMD160',
  'OP_SHA1',
  'OP_SHA256',
  'OP_HASH160',
  'OP_HASH256',
  'OP_CODESEPARATOR',
  'OP_CHECKSIG',
  'OP_CHECKSIGVERIFY',
  'OP_CHECKMULTISIG',
  'OP_CHECKMULTISIGVERIFY',
  'OP_CHECKDATASIG',
  'OP_CHECKDATASIGVERIFY',
]);
const INTRO = new Set([
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
]);
const TOKENS = new Set([
  'OP_UTXOTOKENCATEGORY',
  'OP_UTXOTOKENCOMMITMENT',
  'OP_UTXOTOKENAMOUNT',
  'OP_OUTPUTTOKENCATEGORY',
  'OP_OUTPUTTOKENCOMMITMENT',
  'OP_OUTPUTTOKENAMOUNT',
]);

const SPEC_LIMITS: Specification = {
  label: 'Limits CHIP',
  url: 'https://github.com/bitjson/bch-vm-limits',
};
const SPEC_BIP65: Specification = {
  label: 'BIP 65',
  url: 'https://github.com/bitjson/bips/blob/master/bip-0065.mediawiki',
};
const SPEC_BIP112: Specification = {
  label: 'BIP 112',
  url: 'https://github.com/bitjson/bips/blob/master/bip-0112.mediawiki',
};
const SPEC_INTROSPECTION: Specification = {
  label: 'Introspection CHIP',
  url: 'https://github.com/bitjson/bch-2022/blob/master/CHIP-2021-02-Add-Native-Introspection-Opcodes.md',
};
const SPEC_OP_MUL: Specification = {
  label: 'OP_MUL CHIP',
  url: 'https://github.com/bitjson/bch-2022/blob/master/CHIP-2021-02-Bigger-Script-Integers.md',
};
const SPEC_CASHTOKENS: Specification = {
  label: 'CashTokens CHIP',
  url: 'https://cashtokens.org/docs/spec/chip',
};
const SPEC_BIGINT: Specification = {
  label: 'BigInt CHIP',
  url: 'https://github.com/bitjson/bch-bigint',
};
const SPEC_LOOPS: Specification = {
  label: 'Loops CHIP',
  url: 'https://github.com/bitjson/bch-loops/',
};
const SPEC_FUNCTIONS: Specification = {
  label: 'Functions CHIP',
  url: 'https://github.com/bitjson/bch-functions/',
};
const SPEC_BITWISE: Specification = {
  label: 'Bitwise CHIP',
  url: 'https://github.com/bitjson/bch-bitwise/',
};
const SPEC_CHECKDATASIG: Specification = {
  label: 'OP_CHECKDATASIG Specification',
  url: 'https://upgradespecs.bitcoincashnode.org/op_checkdatasig/',
};
const SPEC_OPCODE_RESTORATION: Specification = {
  label: '2018 Opcode Restoration',
  url: 'https://upgradespecs.bitcoincashnode.org/may-2018-reenabled-opcodes/',
};
const SPEC_REVERSEBYTES: Specification = {
  label: 'OP_REVERSEBYTES Specification',
  url: 'https://upgradespecs.bitcoincashnode.org/2020-05-15-op_reversebytes/',
};

const LOOPS_CHIP_OPS = new Set(['OP_BEGIN', 'OP_UNTIL']);
const FUNCTIONS_CHIP_OPS = new Set(['OP_DEFINE', 'OP_INVOKE']);
const BITWISE_CHIP_OPS = new Set([
  'OP_LSHIFTNUM',
  'OP_RSHIFTNUM',
  'OP_LSHIFTBIN',
  'OP_RSHIFTBIN',
  'OP_INVERT',
]);
const OPCODES_2018_NAMES = new Set([
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
]);

const SPEC_PRIORITY = new Map<Specification, number>([
  [SPEC_BIP65, 2015],
  [SPEC_BIP112, 2016],
  [SPEC_OPCODE_RESTORATION, 2018],
  [SPEC_CHECKDATASIG, 2018.1],
  [SPEC_REVERSEBYTES, 2020],
  [SPEC_INTROSPECTION, 2022],
  [SPEC_OP_MUL, 2022.1],
  [SPEC_CASHTOKENS, 2023],
  [SPEC_LIMITS, 2025],
  [SPEC_LOOPS, 2026],
  [SPEC_FUNCTIONS, 2026.1],
  [SPEC_BITWISE, 2026.2],
  [SPEC_BIGINT, 2026.9],
]);

const CATEGORY_OVERRIDES: Partial<Record<string, Category>> = {
  OP_NOP: 'Control',
  OP_CODESEPARATOR: 'Control',
  OP_UTXOTOKENCATEGORY: 'Introspection',
  OP_UTXOTOKENCOMMITMENT: 'Introspection',
  OP_UTXOTOKENAMOUNT: 'Introspection',
  OP_OUTPUTTOKENCATEGORY: 'Introspection',
  OP_OUTPUTTOKENCOMMITMENT: 'Introspection',
  OP_OUTPUTTOKENAMOUNT: 'Introspection',
  OP_CHECKLOCKTIMEVERIFY: 'Introspection',
  OP_CHECKSEQUENCEVERIFY: 'Introspection',
};

const NUMERIC_PUSH_NAMES = new Set([
  'OP_0',
  'OP_1NEGATE',
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

const BYTE_PUSH_NAMES = new Set([
  'OP_PUSHDATA_1',
  'OP_PUSHDATA_2',
  'OP_PUSHDATA_4',
]);

const RESERVED_NAMES = new Set([
  'OP_RESERVED',
  'OP_VER',
  'OP_NOP1',
  'OP_NOP4',
  'OP_NOP5',
  'OP_NOP6',
  'OP_NOP7',
  'OP_NOP8',
  'OP_NOP9',
  'OP_NOP10',
]);

const ALIAS_SOURCES = [OPCODES_2026, OPCODES_2023];

const normalizeOpcodeName = (name: string): string =>
  name
    .replace(/^OP_UNKNOWN(?=\d)/, 'OP_UNKNOWN_')
    .replace(/^UNKNOWN(?=\d)/, 'UNKNOWN_');

const buildTable = (): OpcodeRow[] => {
  const rows: OpcodeRow[] = [];
  for (let value = 0; value <= 0xff; value += 1) {
    const canonical = getCanonicalName(value);
    const name = normalizeOpcodeName(canonical ?? `OP_UNKNOWN_${value}`);
    const aliases = getAliases(value, name).map(normalizeOpcodeName);
    const description = getDescription(name, aliases);
    const category = categorize(name);
    rows.push({
      value,
      byte: formatHex(value),
      name,
      aliases,
      description,
      category,
      specifications: getSpecifications(name, category),
    });
  }
  return rows;
};

const getCanonicalName = (value: number): string | undefined => {
  const entry = OPCODES_2026[value];
  return typeof entry === 'string' ? entry : undefined;
};

const getAliases = (value: number, canonical: string): string[] => {
  const aliases = new Set<string>();
  for (const source of ALIAS_SOURCES) {
    for (const [key, sourceValue] of Object.entries(source)) {
      if (
        typeof sourceValue === 'number' &&
        sourceValue === value &&
        key !== canonical
      ) {
        aliases.add(key);
      }
    }
  }
  return Array.from(aliases).sort();
};

const getDescription = (name: string, aliases: string[]): string => {
  const aliasDescription = aliases
    .map((alias) => DESCRIPTIONS_2026[alias] ?? DESCRIPTIONS_2023[alias])
    .find(
      (entry): entry is string => typeof entry === 'string' && entry.length > 0
    );
  const description =
    DESCRIPTIONS_2026[name] ?? DESCRIPTIONS_2023[name] ?? aliasDescription;
  if (description) return description;
  return name.startsWith('OP_UNKNOWN_') ? 'Undefined/reserved codepoint.' : '—';
};

const categorize = (name: string): Category => {
  const overridden = CATEGORY_OVERRIDES[name];
  if (overridden) return overridden;
  if (name.startsWith('OP_PUSHBYTES')) return 'Push/Const (Bytes)';
  if (BYTE_PUSH_NAMES.has(name)) return 'Push/Const (Bytes)';
  if (NUMERIC_PUSH_NAMES.has(name)) return 'Push/Const (Numeric)';
  if (STACK.has(name)) return 'Stack';
  if (CONTROL.has(name)) return 'Control';
  if (BINARY.has(name)) return 'Binary/Bitwise';
  if (ARITHMETIC.has(name)) return 'Arithmetic';
  if (CRYPTO.has(name)) return 'Crypto/Sign';
  if (TOKENS.has(name) || name.includes('TOKEN')) return 'Tokens';
  if (INTRO.has(name) || /(TX|UTXO|OUTPUT|INPUT|OUTPOINT)/.test(name))
    return 'Introspection';
  if (RESERVED_NAMES.has(name) || name.startsWith('OP_UNKNOWN_'))
    return 'Reserved/Unknown';
  return 'Misc';
};

const getSpecifications = (
  name: string,
  category: Category
): Specification[] => {
  const specs: Specification[] = [SPEC_LIMITS];
  const append = (spec: Specification) => {
    if (!specs.some((entry) => entry.url === spec.url)) {
      specs.push(spec);
    }
  };

  if (name === 'OP_CHECKLOCKTIMEVERIFY') append(SPEC_BIP65);
  if (name === 'OP_CHECKSEQUENCEVERIFY') append(SPEC_BIP112);
  if (INTRO.has(name)) append(SPEC_INTROSPECTION);
  if (TOKENS.has(name)) append(SPEC_CASHTOKENS);
  if (category === 'Arithmetic') append(SPEC_BIGINT);
  if (name === 'OP_MUL') append(SPEC_OP_MUL);
  if (LOOPS_CHIP_OPS.has(name)) append(SPEC_LOOPS);
  if (FUNCTIONS_CHIP_OPS.has(name)) append(SPEC_FUNCTIONS);
  if (BITWISE_CHIP_OPS.has(name)) append(SPEC_BITWISE);
  if (name === 'OP_REVERSEBYTES') append(SPEC_REVERSEBYTES);
  if (name === 'OP_CHECKDATASIG' || name === 'OP_CHECKDATASIGVERIFY')
    append(SPEC_CHECKDATASIG);
  if (OPCODES_2018_NAMES.has(name) && name !== 'OP_CHECKDATASIG')
    append(SPEC_OPCODE_RESTORATION);

  const getPriority = (spec: Specification) =>
    SPEC_PRIORITY.get(spec) ?? Number.MAX_SAFE_INTEGER;

  return specs.sort((a, b) => {
    const diff = getPriority(a) - getPriority(b);
    if (diff !== 0) return diff;
    return a.label.localeCompare(b.label);
  });
};

const formatHex = (value: number) =>
  `0x${value.toString(16).toUpperCase().padStart(2, '0')}`;

const OPCODE_ROWS = buildTable();

export const BCH_2026_OPCODES: readonly OpcodeRow[] = OPCODE_ROWS;

export const CATEGORIES: readonly Category[] = Array.from(
  new Set(OPCODE_ROWS.map((row) => row.category))
).sort();

export const loadBch2026 = async (): Promise<OpcodeRow[]> => OPCODE_ROWS;
