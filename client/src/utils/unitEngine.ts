/**
 * Physical Dimension Categories and Unit Normalization Engine (Client)
 * BudgetPilot Construction ERP
 */

export type PhysicalDimension = 'VOLUME' | 'AREA' | 'LENGTH' | 'WEIGHT' | 'COUNT' | 'TIME' | 'CUSTOM';

export interface UnitDefinition {
  canonicalSymbol: string;
  dimension: PhysicalDimension;
  aliases: string[];
  description: string;
}

export const STANDARD_UNITS: Record<string, UnitDefinition> = {
  // Volume units [L^3]
  cum: { canonicalSymbol: 'm³', dimension: 'VOLUME', aliases: ['cum', 'm3', 'm³', 'cu.m', 'cu m', 'cubic meter', 'cubic metre', 'c.m.'], description: 'Cubic Metre' },
  litre: { canonicalSymbol: 'L', dimension: 'VOLUME', aliases: ['litre', 'liter', 'l', 'ltr', 'litres', 'liters'], description: 'Litre' },
  kl: { canonicalSymbol: 'kL', dimension: 'VOLUME', aliases: ['kl', 'kilolitre', 'kiloliter'], description: 'Kilolitre' },
  cft: { canonicalSymbol: 'cft', dimension: 'VOLUME', aliases: ['cft', 'cu.ft', 'cubic feet', 'cubic foot'], description: 'Cubic Feet' },

  // Area units [L^2]
  sqm: { canonicalSymbol: 'm²', dimension: 'AREA', aliases: ['sqm', 'm2', 'm²', 'sq.m', 'sq m', 'square meter', 'square metre', 's.m.'], description: 'Square Metre' },
  sqft: { canonicalSymbol: 'sq.ft', dimension: 'AREA', aliases: ['sqft', 'sq.ft', 'sq ft', 'square feet', 'square foot', 'sft'], description: 'Square Feet' },
  hectare: { canonicalSymbol: 'ha', dimension: 'AREA', aliases: ['ha', 'hectare', 'hectares'], description: 'Hectare' },
  acre: { canonicalSymbol: 'acre', dimension: 'AREA', aliases: ['acre', 'acres'], description: 'Acre' },

  // Length / Linear units [L^1]
  metre: { canonicalSymbol: 'm', dimension: 'LENGTH', aliases: ['m', 'metre', 'meter', 'metres', 'meters', 'rmt', 'rm', 'running metre', 'running meter'], description: 'Metre' },
  km: { canonicalSymbol: 'km', dimension: 'LENGTH', aliases: ['km', 'kilometre', 'kilometer'], description: 'Kilometre' },
  cm: { canonicalSymbol: 'cm', dimension: 'LENGTH', aliases: ['cm', 'centimetre', 'centimeter'], description: 'Centimetre' },
  mm: { canonicalSymbol: 'mm', dimension: 'LENGTH', aliases: ['mm', 'millimetre', 'millimeter'], description: 'Millimetre' },
  ft: { canonicalSymbol: 'ft', dimension: 'LENGTH', aliases: ['ft', 'feet', 'foot'], description: 'Feet' },
  inch: { canonicalSymbol: 'inch', dimension: 'LENGTH', aliases: ['inch', 'inches', 'in'], description: 'Inch' },

  // Weight / Mass units [M^1]
  tonne: { canonicalSymbol: 'tonne', dimension: 'WEIGHT', aliases: ['tonne', 'ton', 'metric ton', 'metric tonne', 'mt', 't'], description: 'Metric Tonne' },
  quintal: { canonicalSymbol: 'quintal', dimension: 'WEIGHT', aliases: ['quintal', 'qtl', 'q'], description: 'Quintal (100 kg)' },
  kg: { canonicalSymbol: 'kg', dimension: 'WEIGHT', aliases: ['kg', 'kilogram', 'kilograms', 'kilo'], description: 'Kilogram' },
  gram: { canonicalSymbol: 'g', dimension: 'WEIGHT', aliases: ['g', 'gram', 'grams', 'gm'], description: 'Gram' },

  // Count / Discrete items [1]
  nos: { canonicalSymbol: 'Nos', dimension: 'COUNT', aliases: ['nos', 'no', 'number', 'numbers', 'each', 'ea', 'unit', 'units', 'item', 'items', 'pc', 'pcs', 'piece', 'pieces'], description: 'Numbers / Count' },
  set: { canonicalSymbol: 'Set', dimension: 'COUNT', aliases: ['set', 'sets'], description: 'Set' },
  pair: { canonicalSymbol: 'Pair', dimension: 'COUNT', aliases: ['pair', 'pairs'], description: 'Pair' },
  bag: { canonicalSymbol: 'Bag', dimension: 'COUNT', aliases: ['bag', 'bags', '50kg bag'], description: 'Bag' },
  trip: { canonicalSymbol: 'Trip', dimension: 'COUNT', aliases: ['trip', 'trips'], description: 'Trip' },

  // Time units [T^1]
  day: { canonicalSymbol: 'Day', dimension: 'TIME', aliases: ['day', 'days', 'manday', 'mandays'], description: 'Day' },
  hour: { canonicalSymbol: 'Hr', dimension: 'TIME', aliases: ['hr', 'hrs', 'hour', 'hours'], description: 'Hour' },
  month: { canonicalSymbol: 'Month', dimension: 'TIME', aliases: ['month', 'months'], description: 'Month' },
};

export class UnitDimensionEngine {
  /**
   * Resolve physical dimension from a raw unit string
   */
  public static getPhysicalDimension(rawUnit?: string): PhysicalDimension {
    if (!rawUnit) return 'CUSTOM';
    const clean = rawUnit.trim().toLowerCase();

    for (const key of Object.keys(STANDARD_UNITS)) {
      const def = STANDARD_UNITS[key];
      if (def.aliases.includes(clean) || clean === key || clean === def.canonicalSymbol.toLowerCase()) {
        return def.dimension;
      }
    }

    // Heuristics for compound or non-standard civil units
    if (clean.includes('cum') || clean.includes('m3') || clean.includes('m³') || clean.includes('cubic')) return 'VOLUME';
    if (clean.includes('sqm') || clean.includes('m2') || clean.includes('m²') || clean.includes('square')) return 'AREA';
    if (clean === 'm' || clean.includes('metre') || clean.includes('meter') || clean.includes('rmt')) return 'LENGTH';
    if (clean.includes('ton') || clean.includes('kg') || clean.includes('quintal')) return 'WEIGHT';
    if (clean.includes('no') || clean.includes('each') || clean.includes('set') || clean.includes('bag')) return 'COUNT';

    return 'CUSTOM';
  }

  /**
   * Get expected physical dimension for a measurement formula
   */
  public static getExpectedDimensionForFormula(formula?: string): PhysicalDimension {
    if (!formula) return 'VOLUME';
    const form = formula.trim().toUpperCase();

    if (
      form === 'LXWXH' ||
      form === 'LXWXD' ||
      form.includes('LXWXD') ||
      form.includes('LXWXH') ||
      form === 'VOLUME' ||
      form === '3D'
    ) {
      return 'VOLUME';
    }

    if (
      form === 'LXW' ||
      form === 'LXH' ||
      form.includes('LXW') ||
      form.includes('LXH') ||
      form === 'AREA' ||
      form === '2D'
    ) {
      return 'AREA';
    }

    if (
      form === 'LENGTH' ||
      form === 'RUNNING' ||
      form === 'LINEAR' ||
      form === 'L'
    ) {
      return 'LENGTH';
    }

    if (
      form === 'WEIGHT' ||
      form.includes('WEIGHT') ||
      form.includes('STEEL') ||
      form.includes('REBAR') ||
      form.includes('REINFORCEMENT')
    ) {
      return 'WEIGHT';
    }

    if (
      form === 'COUNT' ||
      form === 'NOSXQTY' ||
      form === 'NUMBERS' ||
      form === 'NOS'
    ) {
      return 'COUNT';
    }

    return 'CUSTOM';
  }

  /**
   * Get canonical display symbol for a unit string (e.g. 'cum' -> 'm³', 'sqm' -> 'm²')
   */
  public static getCanonicalUnit(rawUnit?: string, fallbackFormula?: string): string {
    if (!rawUnit) {
      const expDim = this.getExpectedDimensionForFormula(fallbackFormula);
      switch (expDim) {
        case 'VOLUME': return 'm³';
        case 'AREA': return 'm²';
        case 'LENGTH': return 'm';
        case 'WEIGHT': return 'tonne';
        case 'COUNT': return 'Nos';
        default: return 'unit';
      }
    }

    const clean = rawUnit.trim().toLowerCase();
    for (const key of Object.keys(STANDARD_UNITS)) {
      const def = STANDARD_UNITS[key];
      if (def.aliases.includes(clean) || clean === key || clean === def.canonicalSymbol.toLowerCase()) {
        return def.canonicalSymbol;
      }
    }

    return rawUnit.trim();
  }

  /**
   * Strictly validate dimensional compatibility between a formula and an item's unit.
   */
  public static validateDimensionalCompatibility(
    formula: string,
    rawUnit: string,
    itemCode?: string
  ): {
    isValid: boolean;
    errorCode?: 'DATA_CONFIGURATION_ERROR' | 'DIMENSIONAL_MISMATCH';
    errorMessage?: string;
    expectedDimension: PhysicalDimension;
    actualDimension: PhysicalDimension;
    canonicalUnit: string;
  } {
    const expectedDim = this.getExpectedDimensionForFormula(formula);
    const actualDim = this.getPhysicalDimension(rawUnit);
    const canonical = this.getCanonicalUnit(rawUnit, formula);

    if (expectedDim === 'CUSTOM' || actualDim === 'CUSTOM') {
      return {
        isValid: true,
        expectedDimension: expectedDim,
        actualDimension: actualDim,
        canonicalUnit: canonical,
      };
    }

    if (expectedDim === actualDim) {
      return {
        isValid: true,
        expectedDimension: expectedDim,
        actualDimension: actualDim,
        canonicalUnit: canonical,
      };
    }

    const codeStr = itemCode ? `for item '${itemCode}' ` : '';
    const msg = `DATA_CONFIGURATION_ERROR: Dimensional mismatch ${codeStr}- Formula '${formula}' produces a ${expectedDim} quantity (${this.getCanonicalUnit('', formula)}), but the configured item unit is '${rawUnit}' which represents ${actualDim}. Please select a compatible formula or correct the master item unit.`;

    return {
      isValid: false,
      errorCode: 'DATA_CONFIGURATION_ERROR',
      errorMessage: msg,
      expectedDimension: expectedDim,
      actualDimension: actualDim,
      canonicalUnit: canonical,
    };
  }

  /**
   * Format rate display string with correct unit (e.g. "₹5,850.00 / m³", "₹245.00 / m²")
   */
  public static formatRateWithUnit(rate: number, rawUnit: string, fallbackFormula?: string): string {
    const canonicalUnit = this.getCanonicalUnit(rawUnit, fallbackFormula);
    const formattedRate = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(rate);

    return `${formattedRate} / ${canonicalUnit}`;
  }
}
