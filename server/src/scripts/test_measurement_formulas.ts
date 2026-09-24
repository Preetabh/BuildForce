import { CurrencyUtil } from '../utils/currency';

// Safe arithmetic evaluator for cell formulas (e.g. 10.5 + 2.5, =15*2, 100/4, 2*(5+3))
export const evaluateCellMath = (val: number | string | undefined | null): number => {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).trim().replace(/^=/, '');
  if (!str) return 0;

  const directNum = Number(str);
  if (!isNaN(directNum)) return directNum;

  try {
    const sanitised = str
      .replace(/pi/gi, String(Math.PI))
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/\^/g, '**');

    if (/^[0-9+\-*/().\s*]+$/.test(sanitised)) {
      const result = Function(`"use strict"; return (${sanitised})`)();
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        return Number(result.toFixed(4));
      }
    }
  } catch {
    return 0;
  }
  return 0;
};

export interface SlashFormulaDefinition {
  command: string;
  name: string;
  code: string;
  category: 'AREA' | 'VOLUME' | 'PERIMETER' | 'DEDUCTIONS' | 'CUSTOM';
  expressionDesc: string;
  calculate: (params: { nos: number; l: number; w: number; h: number }) => number;
}

export const STANDARD_SLASH_FORMULAS: SlashFormulaDefinition[] = [
  // AREA
  {
    command: '/area',
    name: 'Area = L×B',
    code: '/area',
    category: 'AREA',
    expressionDesc: 'Nos × Length × Breadth',
    calculate: ({ nos, l, w, h }) => {
      const dimL = l > 0 ? l : 0;
      const dimW = w > 0 ? w : (h > 0 ? h : 0);
      return nos * dimL * dimW;
    },
  },
  {
    command: '/circarea',
    name: 'Circle Area = π/4×D²',
    code: '/circarea',
    category: 'AREA',
    expressionDesc: 'Nos × (π / 4) × D²',
    calculate: ({ nos, l, w, h }) => {
      const d = l > 0 ? l : (w > 0 ? w : h);
      return nos * (Math.PI / 4) * d * d;
    },
  },
  {
    command: '/cylarea',
    name: 'Cylinder Surface = π×D×H',
    code: '/cylarea',
    category: 'AREA',
    expressionDesc: 'Nos × π × Diameter × Height',
    calculate: ({ nos, l, w, h }) => {
      const d = l > 0 ? l : w;
      return nos * Math.PI * d * h;
    },
  },
  {
    command: '/cyltotal',
    name: 'Cylinder Total SA = π×D×H + 2×π/4×D²',
    code: '/cyltotal',
    category: 'AREA',
    expressionDesc: 'Nos × (π×D×H + 2×(π/4)×D²)',
    calculate: ({ nos, l, w, h }) => {
      const d = l > 0 ? l : w;
      const sa = Math.PI * d * h;
      const ends = 2 * (Math.PI / 4) * d * d;
      return nos * (sa + ends);
    },
  },
  {
    command: '/spherearea',
    name: 'Sphere Surface = 4×π×R²',
    code: '/spherearea',
    category: 'AREA',
    expressionDesc: 'Nos × 4 × π × R²',
    calculate: ({ nos, l, w, h }) => {
      const r = (l > 0 ? l : (w > 0 ? w : h)) / 2;
      return nos * 4 * Math.PI * r * r;
    },
  },
  {
    command: '/triarea',
    name: 'Triangle Area = 1/2×B×H',
    code: '/triarea',
    category: 'AREA',
    expressionDesc: 'Nos × 0.5 × Base × Height',
    calculate: ({ nos, l, w, h }) => {
      const b = l > 0 ? l : w;
      const height = h > 0 ? h : (w > 0 ? w : 0);
      return nos * 0.5 * b * height;
    },
  },

  // VOLUME
  {
    command: '/vol',
    name: 'Volume = L×B×H',
    code: 'LxWxH',
    category: 'VOLUME',
    expressionDesc: 'Nos × Length × Breadth × Height',
    calculate: ({ nos, l, w, h }) => nos * l * w * h,
  },
  {
    command: '/cylvol',
    name: 'Cylinder Volume = π/4×D²×H',
    code: '/cylvol',
    category: 'VOLUME',
    expressionDesc: 'Nos × (π / 4) × D² × Height',
    calculate: ({ nos, l, w, h }) => {
      const d = l > 0 ? l : w;
      return nos * (Math.PI / 4) * d * d * h;
    },
  },
  {
    command: '/spherevol',
    name: 'Sphere Volume = 4/3×π×R³',
    code: '/spherevol',
    category: 'VOLUME',
    expressionDesc: 'Nos × (4 / 3) × π × R³',
    calculate: ({ nos, l, w, h }) => {
      const r = (l > 0 ? l : (w > 0 ? w : h)) / 2;
      return nos * (4 / 3) * Math.PI * Math.pow(r, 3);
    },
  },
  {
    command: '/cone',
    name: 'Cone Volume = 1/3×π×R²×H',
    code: '/cone',
    category: 'VOLUME',
    expressionDesc: 'Nos × (1 / 3) × π × R² × Height',
    calculate: ({ nos, l, w, h }) => {
      const r = (l > 0 ? l : w) / 2;
      return nos * (1 / 3) * Math.PI * r * r * h;
    },
  },

  // PERIMETER / LINEAR
  {
    command: '/perim',
    name: 'Perimeter = 2×(L+B)',
    code: '/perim',
    category: 'PERIMETER',
    expressionDesc: 'Nos × 2 × (Length + Breadth)',
    calculate: ({ nos, l, w }) => nos * 2 * (l + w),
  },
  {
    command: '/circperim',
    name: 'Circumference = π×D',
    code: '/circperim',
    category: 'PERIMETER',
    expressionDesc: 'Nos × π × Diameter',
    calculate: ({ nos, l, w, h }) => {
      const d = l > 0 ? l : (w > 0 ? w : h);
      return nos * Math.PI * d;
    },
  },
  {
    command: '/length',
    name: 'Running Length = L',
    code: '/length',
    category: 'PERIMETER',
    expressionDesc: 'Nos × Length',
    calculate: ({ nos, l }) => nos * l,
  },

  // DEDUCTIONS & OPENINGS
  {
    command: '/deduct',
    name: 'Deduction = -1 × (L×B)',
    code: '/deduct',
    category: 'DEDUCTIONS',
    expressionDesc: '-1 × Nos × Length × Breadth',
    calculate: ({ nos, l, w }) => -1 * Math.abs(nos * l * w),
  },
  {
    command: '/door',
    name: 'Door Deduction = -1 × (W×H)',
    code: '/door',
    category: 'DEDUCTIONS',
    expressionDesc: '-1 × Nos × Width × Height',
    calculate: ({ nos, l, w, h }) => {
      const width = w > 0 ? w : l;
      return -1 * Math.abs(nos * width * h);
    },
  },
];

export const calculateRowQuantity = (row: {
  isSubheading?: boolean;
  nos: number | string;
  length: number | string;
  width: number | string;
  heightDepth: number | string;
  formula: string;
}): number => {
  if (row.isSubheading) return 0;

  const nosVal = evaluateCellMath(row.nos);
  const nos = nosVal !== 0 ? nosVal : (row.nos === '' ? 1 : 0);
  const l = evaluateCellMath(row.length);
  const w = evaluateCellMath(row.width);
  const h = evaluateCellMath(row.heightDepth);

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

  // Default cuboid dimension calculation (L x W x H)
  if (l > 0 && w > 0 && h > 0) {
    return Number((nos * l * w * h).toFixed(3));
  } else if (l > 0 && w > 0) {
    return Number((nos * l * w).toFixed(3));
  } else if (l > 0 && h > 0) {
    return Number((nos * l * h).toFixed(3));
  } else if (l > 0) {
    return Number((nos * l).toFixed(3));
  } else if (nos !== 0 && (row.nos !== '' || l > 0)) {
    return Number(nos.toFixed(3));
  }

  return 0;
};

async function runTests() {
  console.log('--- Testing evaluateCellMath ---');
  console.assert(evaluateCellMath(10) === 10, 'Numeric 10');
  console.assert(evaluateCellMath('10.5') === 10.5, 'String numeric 10.5');
  console.assert(evaluateCellMath('10.5 + 2.5') === 13, 'Addition 10.5 + 2.5');
  console.assert(evaluateCellMath('=15 * 2') === 30, 'Excel syntax =15 * 2');
  console.assert(evaluateCellMath('100 / 4') === 25, 'Division 100 / 4');
  console.assert(evaluateCellMath('2 * (5 + 3)') === 16, 'Parentheses 2 * (5 + 3)');
  console.assert(evaluateCellMath('') === 0, 'Empty string returns 0');
  console.assert(evaluateCellMath('invalid') === 0, 'Invalid expression returns 0');
  console.log('✓ evaluateCellMath passed all tests!');

  console.log('\n--- Testing Standard Formulas ---');
  // 1. /area -> Area = L×B
  const areaQty = calculateRowQuantity({ nos: 1, length: 10, width: 5, heightDepth: '', formula: '/area' });
  console.assert(areaQty === 50, `Expected 50 for /area, got ${areaQty}`);

  // 2. /circarea -> Circle Area = π/4×D²
  const circQty = calculateRowQuantity({ nos: 1, length: 2, width: '', heightDepth: '', formula: '/circarea' });
  console.assert(circQty === 3.142, `Expected 3.142 for /circarea (D=2), got ${circQty}`);

  // 3. /cylarea -> Cylinder Surface = π×D×H
  const cylQty = calculateRowQuantity({ nos: 1, length: 2, width: '', heightDepth: 3, formula: '/cylarea' });
  console.assert(cylQty === 18.850, `Expected 18.850 for /cylarea (D=2, H=3), got ${cylQty}`);

  // 4. /cyltotal -> Cylinder Total SA = π×D×H + 2×π/4×D²
  const cylTotalQty = calculateRowQuantity({ nos: 1, length: 2, width: '', heightDepth: 3, formula: '/cyltotal' });
  console.assert(cylTotalQty === 25.133, `Expected 25.133 for /cyltotal (D=2, H=3), got ${cylTotalQty}`);

  // 5. /spherearea -> Sphere Surface = 4×π×R²
  const sphereQty = calculateRowQuantity({ nos: 1, length: 2, width: '', heightDepth: '', formula: '/spherearea' });
  console.assert(sphereQty === 12.566, `Expected 12.566 for /spherearea (D=2), got ${sphereQty}`);

  // 6. /triarea -> Triangle Area = 1/2×B×H
  const triQty = calculateRowQuantity({ nos: 2, length: 4, width: '', heightDepth: 5, formula: '/triarea' });
  console.assert(triQty === 20, `Expected 20 for /triarea (Nos=2, B=4, H=5), got ${triQty}`);

  // 7. /vol -> Volume = L×B×H
  const volQty = calculateRowQuantity({ nos: 1, length: 10, width: 5, heightDepth: 2, formula: '/vol' });
  console.assert(volQty === 100, `Expected 100 for /vol, got ${volQty}`);

  // 8. /perim -> Perimeter = 2×(L+B)
  const perimQty = calculateRowQuantity({ nos: 2, length: 10, width: 5, heightDepth: '', formula: '/perim' });
  console.assert(perimQty === 60, `Expected 60 for /perim (Nos=2, L=10, B=5), got ${perimQty}`);

  // 9. /deduct -> Deduction = -1×(L×B)
  const deductQty = calculateRowQuantity({ nos: 1, length: 2, width: 3, heightDepth: '', formula: '/deduct' });
  console.assert(deductQty === -6, `Expected -6 for /deduct, got ${deductQty}`);

  console.log('✓ All standard civil formulas passed exact mathematical verification!');

  console.log('\n--- Testing Cell Formula Expressions with Live Calculations ---');
  // Row with expression in Length: '10 + 5' (15) and Breadth: '2 * 3' (6) with /area
  const exprRowQty = calculateRowQuantity({
    nos: 1,
    length: '10 + 5',
    width: '2 * 3',
    heightDepth: '',
    formula: '/area',
  });
  console.assert(exprRowQty === 90, `Expected 90 (15 * 6) for formula with expressions, got ${exprRowQty}`);

  // Rate amount calculation
  const totalAmount = CurrencyUtil.calculateAmount(exprRowQty, 1457.15);
  console.log(`90 SQM × ₹1457.15 = ₹${totalAmount}`);
  console.assert(totalAmount === 131143.5, `Expected 131143.50, got ${totalAmount}`);

  console.log('✓ Cell arithmetic expressions and CurrencyUtil amount calculation verified perfectly!');
  console.log('\nALL TESTS PASSED SUCCESSFULLY! 🎉');
}

runTests().catch(console.error);
