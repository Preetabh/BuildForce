/**
 * Decimal-safe currency and monetary calculation utilities in INR for BudgetPilot
 * Prevents floating point errors in measurement books, estimate formulas, and rate sheets.
 */

export class CurrencyUtil {
  /**
   * Convert Rupees to Paisa (integer)
   */
  public static toPaisa(rupees: number | string): number {
    const num = typeof rupees === 'string' ? parseFloat(rupees) : rupees;
    if (isNaN(num)) return 0;
    return Math.round((num + Number.EPSILON) * 100);
  }

  /**
   * Convert Paisa to Rupees (number with exact 2 decimal places)
   */
  public static toRupees(paisa: number): number {
    return Math.round((paisa / 100 + Number.EPSILON) * 100) / 100;
  }

  /**
   * Decimal-safe addition of two amounts
   */
  public static add(a: number, b: number): number {
    return Math.round((a + b + Number.EPSILON) * 100) / 100;
  }

  /**
   * Multiply quantity by unit rate with exact decimal-safe precision
   * Symmetric and accurate regardless of parameter order.
   */
  public static calculateAmount(a: number, b: number): number {
    if (!a || !b || isNaN(a) || isNaN(b)) return 0;
    const aScaled = BigInt(Math.round((a + Number.EPSILON) * 10000));
    const bScaled = BigInt(Math.round((b + Number.EPSILON) * 10000));
    const productScaled = aScaled * bScaled;
    const unscaledRupees = Number(productScaled / BigInt(10000)) / 10000;
    return Math.round((unscaledRupees + Number.EPSILON) * 100) / 100;
  }

  /**
   * Round to 2 decimal places safely
   */
  public static round2(val: number): number {
    if (isNaN(val)) return 0;
    return Math.round((val + Number.EPSILON) * 100) / 100;
  }

  /**
   * Format INR currency string e.g. ₹ 1,23,456.78
   */
  public static formatINR(amount: number): string {
    const safeAmount = CurrencyUtil.round2(amount);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeAmount);
  }
}
