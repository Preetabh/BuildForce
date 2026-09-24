import { evaluateCellMath, STANDARD_SLASH_FORMULAS, SlashFormulaDefinition } from './test_measurement_formulas';

interface RowDimensionConfig {
  hasLength: boolean;
  hasBreadth: boolean;
  hasHeight: boolean;
  lengthLabel: string;
  breadthLabel: string;
  heightLabel: string;
  formulaName: string;
}

const getRowDimensionConfig = (formulaStr: string | undefined): RowDimensionConfig => {
  const rawKey = (formulaStr || 'LxWxH').trim();
  const formulaKey = rawKey.toLowerCase();

  if (!formulaKey || formulaKey === 'lxwxh' || formulaKey === 'volume' || formulaKey === 'default') {
    return {
      hasLength: true,
      hasBreadth: true,
      hasHeight: true,
      lengthLabel: 'L',
      breadthLabel: 'B',
      heightLabel: 'H',
      formulaName: 'L×B×H',
    };
  }

  const match = STANDARD_SLASH_FORMULAS.find(
    (f) =>
      f.command.toLowerCase() === formulaKey ||
      f.code.toLowerCase() === formulaKey ||
      formulaKey.includes(f.command.toLowerCase()) ||
      f.name.toLowerCase() === formulaKey
  );

  if (match) {
    // Determine from formula definitions or highlightCols
    const cmd = (match.command || match.code || '').toLowerCase();
    
    // highlightCols mapping
    let cols: ('NOS' | 'L' | 'B' | 'H')[] = ['NOS', 'L', 'B', 'H'];
    if (cmd === '/area' || cmd === '/perim' || cmd === '/deduct') cols = ['NOS', 'L', 'B'];
    else if (cmd === '/circarea' || cmd === '/spherearea' || cmd === '/spherevol' || cmd === '/circperim' || cmd === '/length') cols = ['NOS', 'L'];
    else if (cmd === '/cylarea' || cmd === '/cyltotal' || cmd === '/triarea' || cmd === '/cylvol' || cmd === '/cone') cols = ['NOS', 'L', 'H'];
    else if (cmd === '/door' || cmd === '/window') cols = ['NOS', 'B', 'H'];
    else if (cmd === '/vol' || cmd === 'lxwxh') cols = ['NOS', 'L', 'B', 'H'];

    const hasL = cols.includes('L');
    const hasB = cols.includes('B');
    const hasH = cols.includes('H');

    let lengthLabel = 'L';
    let breadthLabel = 'B';
    let heightLabel = 'H';

    if (cmd.includes('circ') || cmd.includes('cyl')) {
      lengthLabel = 'Dia D';
    } else if (cmd.includes('sphere') || cmd.includes('cone')) {
      lengthLabel = 'Radius R';
    } else if (cmd === '/triarea' || cmd.includes('tri')) {
      lengthLabel = 'Base B';
    }

    if (cmd === '/door' || cmd === '/window') {
      breadthLabel = 'Width W';
    }

    if (cmd.includes('cyl') || cmd.includes('cone') || cmd.includes('tri')) {
      heightLabel = 'Height H';
    }

    return {
      hasLength: hasL,
      hasBreadth: hasB,
      hasHeight: hasH,
      lengthLabel,
      breadthLabel,
      heightLabel,
      formulaName: match.name || match.code,
    };
  }

  return {
    hasLength: true,
    hasBreadth: true,
    hasHeight: true,
    lengthLabel: 'L',
    breadthLabel: 'B',
    heightLabel: 'H',
    formulaName: rawKey,
  };
};

const calculateRowQuantity = (row: { nos: any; length: any; width: any; heightDepth: any; formula: string }): number => {
  const dimConfig = getRowDimensionConfig(row.formula);
  const nosVal = evaluateCellMath(row.nos);
  const nos = nosVal !== 0 ? nosVal : (row.nos === '' ? 1 : 0);
  const l = dimConfig.hasLength ? evaluateCellMath(row.length) : 0;
  const w = dimConfig.hasBreadth ? evaluateCellMath(row.width) : 0;
  const h = dimConfig.hasHeight ? evaluateCellMath(row.heightDepth) : 0;

  const formulaKey = (row.formula || '').toLowerCase().trim();

  const matchFormula = STANDARD_SLASH_FORMULAS.find(
    (f) =>
      f.command.toLowerCase() === formulaKey ||
      f.code.toLowerCase() === formulaKey ||
      formulaKey.includes(f.command.toLowerCase())
  );

  if (matchFormula && typeof matchFormula.calculate === 'function') {
    const val = matchFormula.calculate({ nos, l, w, h });
    return Number(val.toFixed(3));
  }

  if (l > 0 && w > 0 && h > 0) return Number((nos * l * w * h).toFixed(3));
  if (l > 0 && w > 0) return Number((nos * l * w).toFixed(3));
  if (l > 0 && h > 0) return Number((nos * l * h).toFixed(3));
  if (l > 0) return Number((nos * l).toFixed(3));
  if (nos !== 0 && (row.nos !== '' || l > 0)) return Number(nos.toFixed(3));
  return 0;
};

// RUN TESTS
console.log('================================================================');
console.log('🧪 RUNNING DYNAMIC DIMENSION LOCKING & FORMULA EVALUATION TESTS');
console.log('================================================================');

let passed = 0;
let total = 0;

function assert(condition: boolean, desc: string) {
  total++;
  if (condition) {
    console.log(`  ✓ PASS: ${desc}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${desc}`);
  }
}

// 1. /area: L & B enabled, H disabled
const areaDim = getRowDimensionConfig('/area');
assert(areaDim.hasLength === true && areaDim.hasBreadth === true && areaDim.hasHeight === false, '/area enables L, B and disables H');
// Even if height is present in input, it must NOT affect /area result
const areaQty = calculateRowQuantity({ nos: 2, length: '10', width: '5', heightDepth: '999', formula: '/area' });
assert(areaQty === 100, `/area calculates 2 * 10 * 5 = 100.000 ignoring disabled height (got ${areaQty})`);

// 2. /circarea: L (Dia D) enabled, B & H disabled
const circDim = getRowDimensionConfig('/circarea');
assert(circDim.hasLength === true && circDim.hasBreadth === false && circDim.hasHeight === false, '/circarea enables Dia D and disables B, H');
assert(circDim.lengthLabel === 'Dia D', '/circarea labels Length as "Dia D"');
const circQty = calculateRowQuantity({ nos: 1, length: '10', width: '500', heightDepth: '500', formula: '/circarea' });
const expectedCirc = Number(((Math.PI / 4) * 100).toFixed(3));
assert(circQty === expectedCirc, `/circarea calculates π/4 * 10^2 = ${expectedCirc} ignoring disabled B & H (got ${circQty})`);

// 3. /cylarea: L (Dia D) & H enabled, B disabled
const cylDim = getRowDimensionConfig('/cylarea');
assert(cylDim.hasLength === true && cylDim.hasBreadth === false && cylDim.hasHeight === true, '/cylarea enables Dia D & Height H, disables B');
const cylQty = calculateRowQuantity({ nos: 1, length: '2', width: '888', heightDepth: '5', formula: '/cylarea' });
const expectedCyl = Number((Math.PI * 2 * 5).toFixed(3));
assert(cylQty === expectedCyl, `/cylarea calculates π * 2 * 5 = ${expectedCyl} ignoring disabled B (got ${cylQty})`);

// 4. /door: B (Width W) & H enabled, L disabled
const doorDim = getRowDimensionConfig('/door');
assert(doorDim.hasLength === false && doorDim.hasBreadth === true && doorDim.hasHeight === true, '/door disables L, enables Width W & Height H');
assert(doorDim.breadthLabel === 'Width W', '/door labels Breadth as "Width W"');
const doorQty = calculateRowQuantity({ nos: 2, length: '777', width: '1.2', heightDepth: '2.1', formula: '/door' });
const expectedDoor = Number((-1 * 2 * 1.2 * 2.1).toFixed(3));
assert(doorQty === expectedDoor, `/door calculates deduction -1 * 2 * 1.2 * 2.1 = ${expectedDoor} ignoring disabled L (got ${doorQty})`);

// 5. /length: L enabled, B & H disabled
const lenDim = getRowDimensionConfig('/length');
assert(lenDim.hasLength === true && lenDim.hasBreadth === false && lenDim.hasHeight === false, '/length enables L and disables B & H');
const lenQty = calculateRowQuantity({ nos: 3, length: '15', width: '44', heightDepth: '55', formula: '/length' });
assert(lenQty === 45, `/length calculates 3 * 15 = 45 ignoring disabled B & H (got ${lenQty})`);

// 6. Default /vol or LxWxH: ALL enabled
const volDim = getRowDimensionConfig('LxWxH');
assert(volDim.hasLength === true && volDim.hasBreadth === true && volDim.hasHeight === true, 'LxWxH enables L, B, H');
const volQty = calculateRowQuantity({ nos: 1, length: '3', width: '4', heightDepth: '5', formula: 'LxWxH' });
assert(volQty === 60, `LxWxH calculates 1 * 3 * 4 * 5 = 60.000 (got ${volQty})`);

// 7. Cell arithmetic in enabled cells
const mathQty = calculateRowQuantity({ nos: '2+1', length: '10/2', width: '=4*2', heightDepth: '', formula: '/area' });
assert(mathQty === 120, `/area calculates cell math (2+1) * (10/2) * (4*2) = 3 * 5 * 8 = 120 (got ${mathQty})`);

console.log('================================================================');
console.log(`Summary: ${passed}/${total} assertions passed (${((passed / total) * 100).toFixed(0)}%)`);
console.log('================================================================');
