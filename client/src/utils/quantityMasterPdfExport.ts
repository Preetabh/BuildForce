import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  MasterMaterial,
  MasterLabour,
  MasterMachinery,
  MasterFormula,
  MasterRateList,
} from '../types';

/**
 * Format Indian Rupee currency
 */
const formatINR = (val?: number | null): string => {
  if (val === undefined || val === null || isNaN(val)) return '₹0.00';
  return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Common Header and Footer styling helper
 */
const applyDocumentDecorations = (
  doc: jsPDF,
  title: string,
  subtitle: string,
  metaInfo: string[]
) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Top Navy Branded Header Bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Accent line
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(0, 28, pageWidth, 2, 'F');

  // Title & Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('BuildForce 360 — ' + title, 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(subtitle, 14, 21);

  // Meta info on the right
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  const nowStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Generated: ${nowStr}`, pageWidth - 14, 13, { align: 'right' });
  if (metaInfo.length > 0) {
    doc.text(metaInfo.join('  |  '), pageWidth - 14, 21, { align: 'right' });
  }

  // Footer function via didDrawPage in autoTable
};

const addPageFooters = (doc: jsPDF) => {
  const totalPages = (doc as any).internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139); // slate-500

    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.text(
      'BuildForce 360 Construction ERP Platform — Confidential & Internal Use Only',
      14,
      pageHeight - 7
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
  }
};

/**
 * 1. EXPORT MATERIALS TO PDF
 */
export const exportMaterialsPdf = (materials: MasterMaterial[], filterName?: string) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  applyDocumentDecorations(
    doc,
    'Materials Master Catalog',
    'Standard Construction Materials & Rates Schedule',
    [`Total Items: ${materials.length}`, filterName ? `Filter: ${filterName}` : 'All Categories']
  );

  const tableBody = materials.map((m, idx) => [
    (idx + 1).toString(),
    m.name + (m.subcategory ? ` (${m.subcategory})` : ''),
    m.category || 'General',
    m.code || '—',
    (m.unit || 'NOS').toUpperCase(),
    formatINR(m.effectiveRate ?? m.standardRate),
    m.status || 'ACTIVE',
  ]);

  autoTable(doc, {
    startY: 35,
    head: [['#', 'Material Name', 'Category', 'Code', 'Unit', 'Rate (₹)', 'Status']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [15, 23, 42],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto', fontStyle: 'bold' },
      2: { cellWidth: 32 },
      3: { cellWidth: 26, halign: 'center', font: 'courier' },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
      6: { cellWidth: 20, halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        if (data.cell.raw === 'ACTIVE') {
          data.cell.styles.textColor = [16, 185, 129]; // emerald
          data.cell.styles.fontStyle = 'bold';
        } else if (data.cell.raw === 'ARCHIVED') {
          data.cell.styles.textColor = [168, 85, 247]; // purple
        } else {
          data.cell.styles.textColor = [245, 158, 11]; // amber
        }
      }
    },
    margin: { top: 35, bottom: 18, left: 14, right: 14 },
  });

  addPageFooters(doc);
  doc.save(`BuildForce360_Materials_Master_${new Date().toISOString().slice(0, 10)}.pdf`);
};

/**
 * 2. EXPORT MANPOWER TO PDF
 */
export const exportManpowerPdf = (labourItems: MasterLabour[], filterName?: string) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  applyDocumentDecorations(
    doc,
    'Manpower & Labour Master',
    'Standard Trade Wages & Daily Rates Schedule',
    [`Total Trades: ${labourItems.length}`, filterName ? `Filter: ${filterName}` : 'All Categories']
  );

  const tableBody = labourItems.map((l, idx) => [
    (idx + 1).toString(),
    l.name,
    l.category || 'Civil Work',
    l.skillType || 'Skilled',
    l.code || '—',
    formatINR(l.standardDailyRate),
    l.unit || 'Day',
    l.status || 'ACTIVE',
  ]);

  autoTable(doc, {
    startY: 35,
    head: [['#', 'Trade / Role Name', 'Category', 'Skill Level', 'Code', 'Daily Rate (₹)', 'Unit', 'Status']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [15, 23, 42],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto', fontStyle: 'bold' },
      2: { cellWidth: 28 },
      3: { cellWidth: 24, halign: 'center' },
      4: { cellWidth: 24, halign: 'center', font: 'courier' },
      5: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
      6: { cellWidth: 16, halign: 'center' },
      7: { cellWidth: 18, halign: 'center' },
    },
    margin: { top: 35, bottom: 18, left: 14, right: 14 },
  });

  addPageFooters(doc);
  doc.save(`BuildForce360_Manpower_Master_${new Date().toISOString().slice(0, 10)}.pdf`);
};

/**
 * 3. EXPORT MACHINERY TO PDF
 */
export const exportMachineryPdf = (machineryItems: MasterMachinery[], filterName?: string) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  applyDocumentDecorations(
    doc,
    'Machinery & Equipment Master',
    'Heavy Plant & Construction Equipment Rates Schedule',
    [`Total Equipment: ${machineryItems.length}`, filterName ? `Filter: ${filterName}` : 'All Categories']
  );

  const tableBody = machineryItems.map((m, idx) => [
    (idx + 1).toString(),
    m.name,
    m.category || 'General Plant',
    m.code || '—',
    formatINR(m.standardHourlyRate),
    m.rateType || 'Hourly',
    m.unit || 'Hour',
    m.status || 'ACTIVE',
  ]);

  autoTable(doc, {
    startY: 35,
    head: [['#', 'Equipment Name', 'Category', 'Code', 'Rate (₹)', 'Billing Basis', 'Unit', 'Status']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [15, 23, 42],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto', fontStyle: 'bold' },
      2: { cellWidth: 30 },
      3: { cellWidth: 26, halign: 'center', font: 'courier' },
      4: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 22, halign: 'center' },
      6: { cellWidth: 16, halign: 'center' },
      7: { cellWidth: 20, halign: 'center' },
    },
    margin: { top: 35, bottom: 18, left: 14, right: 14 },
  });

  addPageFooters(doc);
  doc.save(`BuildForce360_Machinery_Master_${new Date().toISOString().slice(0, 10)}.pdf`);
};

/**
 * 4. EXPORT FORMULAS TO PDF
 */
export const exportFormulasPdf = (formulas: MasterFormula[]) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  applyDocumentDecorations(
    doc,
    'Calculation Formulas Master',
    'Work-wise Rate Analysis Formulas & Resource Coefficients',
    [`Total Formulas: ${formulas.length}`]
  );

  const tableBody = formulas.map((f, idx) => {
    const matSummary = (f.materialFactors || [])
      .map((m) => `${m.name}: ${m.factor} ${m.unit}`)
      .join(', ');
    const labSummary = (f.labourFactors || [])
      .map((l) => `${l.name}: ${l.factor} ${l.unit}`)
      .join(', ');
    const macSummary = (f.machineryFactors || [])
      .map((m) => `${m.name}: ${m.factor} ${m.unit}`)
      .join(', ');

    return [
      (idx + 1).toString(),
      f.code || '—',
      f.name,
      f.category || 'Civil Work',
      (f.unit || 'CUM').toUpperCase(),
      matSummary || 'None',
      labSummary || 'None',
      macSummary || 'None',
    ];
  });

  autoTable(doc, {
    startY: 35,
    head: [['#', 'Code', 'Work Item / Formula Name', 'Category', 'Unit', 'Materials Required', 'Labour Required', 'Machinery Required']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [15, 23, 42],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 24, font: 'courier', halign: 'center' },
      2: { cellWidth: 50, fontStyle: 'bold' },
      3: { cellWidth: 26 },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 50 },
      6: { cellWidth: 46 },
      7: { cellWidth: 46 },
    },
    margin: { top: 35, bottom: 18, left: 14, right: 14 },
  });

  addPageFooters(doc);
  doc.save(`BuildForce360_Formulas_Master_${new Date().toISOString().slice(0, 10)}.pdf`);
};

/**
 * 5. EXPORT RATE LISTS TO PDF
 */
export const exportRateListsPdf = (rateLists: MasterRateList[]) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  applyDocumentDecorations(
    doc,
    'Custom Rate Lists Master',
    'Location/Project Specific Price Overrides for Materials, Manpower & Machinery',
    [`Total Rate Schedules: ${rateLists.length}`]
  );

  const tableBody = rateLists.map((rl, idx) => [
    (idx + 1).toString(),
    rl.name + (rl.isDefault ? ' (Default)' : ''),
    rl.code || '—',
    rl.description || 'Standard Price Overrides',
    `${rl.materialRates?.length || 0} Materials`,
    `${rl.labourRates?.length || 0} Manpower`,
    `${rl.machineryRates?.length || 0} Machinery`,
    rl.createdAt ? new Date(rl.createdAt).toLocaleDateString('en-IN') : '—',
  ]);

  autoTable(doc, {
    startY: 35,
    head: [['#', 'Rate List Name', 'Code', 'Description', 'Materials Overrides', 'Labour Overrides', 'Machinery Overrides', 'Created Date']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [15, 23, 42],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 45, fontStyle: 'bold' },
      2: { cellWidth: 26, font: 'courier', halign: 'center' },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 22, halign: 'center' },
      6: { cellWidth: 22, halign: 'center' },
      7: { cellWidth: 22, halign: 'center' },
    },
    margin: { top: 35, bottom: 18, left: 14, right: 14 },
  });

  addPageFooters(doc);
  doc.save(`BuildForce360_Rate_Lists_${new Date().toISOString().slice(0, 10)}.pdf`);
};

/**
 * 6. GENERATE & DOWNLOAD SAMPLE TEMPLATE PDF FOR EASY IMPORT
 */
export const downloadSamplePdfTemplate = (type: 'materials' | 'manpower' | 'machinery' | 'formulas' | 'rate-lists') => {
  const doc = new jsPDF({ orientation: type === 'formulas' ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });

  if (type === 'materials') {
    applyDocumentDecorations(
      doc,
      'Materials Bulk Import Template',
      'Fill your materials below or use as reference layout for fast PDF bulk import',
      ['Sample Template']
    );

    const sampleRows = [
      ['1', 'Portland Pozzolana Cement (PPC)', 'Cement & Aggregates', 'MAT-CEM-001', 'BAG', '385.00', 'ACTIVE'],
      ['2', 'Ordinary Portland Cement 43 Grade', 'Cement & Aggregates', 'MAT-CEM-002', 'BAG', '410.00', 'ACTIVE'],
      ['3', 'TMT Steel Fe500D 12mm', 'Steel & Metals', 'MAT-STL-001', 'KG', '68.50', 'ACTIVE'],
      ['4', 'TMT Steel Fe550D 16mm', 'Steel & Metals', 'MAT-STL-002', 'KG', '72.00', 'ACTIVE'],
      ['5', 'River Sand / Coarse Sand', 'Cement & Aggregates', 'MAT-SND-001', 'CUM', '1450.00', 'ACTIVE'],
      ['6', 'Coarse Aggregate 20mm Nominal', 'Cement & Aggregates', 'MAT-AGG-001', 'CUM', '1280.00', 'ACTIVE'],
      ['7', 'Red Clay Bricks (Class 7.5)', 'Masonry', 'MAT-BRK-001', 'NOS', '9.50', 'ACTIVE'],
      ['8', 'AAC Blocks 600x200x150mm', 'Masonry', 'MAT-AAC-001', 'NOS', '65.00', 'ACTIVE'],
      ['9', 'Vitrified Floor Tiles 600x600mm', 'Finishing', 'MAT-TLE-001', 'SQM', '480.00', 'ACTIVE'],
      ['10', 'Acrylic Emulsion Paint (Exterior)', 'Paints & Finishes', 'MAT-PNT-001', 'LTR', '320.00', 'ACTIVE'],
    ];

    autoTable(doc, {
      startY: 35,
      head: [['#', 'Material Name', 'Category', 'Code', 'Unit', 'Rate (₹)', 'Status']],
      body: sampleRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 'auto', fontStyle: 'bold' },
        2: { cellWidth: 36 },
        3: { cellWidth: 28, halign: 'center', font: 'courier' },
        4: { cellWidth: 16, halign: 'center' },
        5: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
        6: { cellWidth: 20, halign: 'center' },
      },
    });
  } else if (type === 'manpower') {
    applyDocumentDecorations(
      doc,
      'Manpower Bulk Import Template',
      'Fill your trade designations & wages for fast PDF bulk import',
      ['Sample Template']
    );

    const sampleRows = [
      ['1', 'Mason (Head / Grade 1)', 'Civil Work', 'Specialist', 'LAB-MAS-001', '950.00', 'Day', 'ACTIVE'],
      ['2', 'Mason (General)', 'Civil Work', 'Skilled', 'LAB-MAS-002', '800.00', 'Day', 'ACTIVE'],
      ['3', 'Bar Bender / Steel Fixer', 'Steel Fixing', 'Skilled', 'LAB-BAR-001', '850.00', 'Day', 'ACTIVE'],
      ['4', 'Carpenter (Shuttering)', 'Formwork', 'Skilled', 'LAB-CRP-001', '850.00', 'Day', 'ACTIVE'],
      ['5', 'Plumber (Licensed)', 'Plumbing', 'Skilled', 'LAB-PLM-001', '820.00', 'Day', 'ACTIVE'],
      ['6', 'Electrician (Grade A)', 'Electrical', 'Skilled', 'LAB-ELC-001', '850.00', 'Day', 'ACTIVE'],
      ['7', 'Beldar / Helper (Male)', 'General Labour', 'Unskilled', 'LAB-HLP-001', '550.00', 'Day', 'ACTIVE'],
      ['8', 'Coolie / Helper (Female)', 'General Labour', 'Unskilled', 'LAB-HLP-002', '550.00', 'Day', 'ACTIVE'],
      ['9', 'Site Supervisor / Foreman', 'Supervision', 'Supervisory', 'LAB-SUP-001', '1200.00', 'Day', 'ACTIVE'],
    ];

    autoTable(doc, {
      startY: 35,
      head: [['#', 'Trade / Role Name', 'Category', 'Skill Level', 'Code', 'Daily Rate (₹)', 'Unit', 'Status']],
      body: sampleRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    });
  } else if (type === 'machinery') {
    applyDocumentDecorations(
      doc,
      'Machinery Bulk Import Template',
      'Fill your machinery & equipment fleet for fast PDF bulk import',
      ['Sample Template']
    );

    const sampleRows = [
      ['1', 'Concrete Mixer 10/7 CFT (Diesel)', 'Concreting', 'MAC-MIX-001', '350.00', 'Hourly', 'Hour', 'ACTIVE'],
      ['2', 'Needle Concrete Vibrator 40/60mm', 'Concreting', 'MAC-VIB-001', '120.00', 'Hourly', 'Hour', 'ACTIVE'],
      ['3', 'JCB 3DX Backhoe Excavator Loader', 'Earthmoving', 'MAC-JCB-001', '1450.00', 'Hourly', 'Hour', 'ACTIVE'],
      ['4', 'Hydraulic Mobile Crane 15T', 'Lifting', 'MAC-CRN-001', '2200.00', 'Hourly', 'Hour', 'ACTIVE'],
      ['5', 'Transit Mixer 6 CUM Capacity', 'Concreting', 'MAC-TRM-001', '1800.00', 'Hourly', 'Hour', 'ACTIVE'],
      ['6', 'Plate Compactor 5 HP', 'Compaction', 'MAC-CMP-001', '250.00', 'Hourly', 'Hour', 'ACTIVE'],
      ['7', 'Diesel Generator 62.5 KVA', 'Power', 'MAC-GEN-001', '600.00', 'Hourly', 'Hour', 'ACTIVE'],
    ];

    autoTable(doc, {
      startY: 35,
      head: [['#', 'Equipment Name', 'Category', 'Code', 'Rate (₹)', 'Billing Basis', 'Unit', 'Status']],
      body: sampleRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    });
  } else if (type === 'formulas') {
    applyDocumentDecorations(
      doc,
      'Formulas Bulk Import Template',
      'Fill calculation formulas & resource factors for fast PDF bulk import',
      ['Sample Template']
    );

    const sampleRows = [
      [
        '1',
        'FORM-RCC-M20',
        'RCC M20 (1:1.5:3) in Beams & Columns',
        'Concrete',
        'CUM',
        'Cement: 8.2 BAG, Sand: 0.42 CUM, Agg 20mm: 0.84 CUM',
        'Mason: 0.25 Day, Beldar: 1.50 Day',
        'Mixer: 0.15 Hour, Vibrator: 0.20 Hour',
      ],
      [
        '2',
        'FORM-PLS-12MM',
        'Cement Plaster 12mm thick in 1:4 mix',
        'Plastering',
        'SQM',
        'Cement: 0.14 BAG, Sand: 0.018 CUM',
        'Mason: 0.08 Day, Helper: 0.10 Day',
        'None',
      ],
      [
        '3',
        'FORM-BRK-14',
        'Brickwork in 1:6 cement mortar in superstructure',
        'Masonry',
        'CUM',
        'Bricks: 500 NOS, Cement: 1.25 BAG, Sand: 0.25 CUM',
        'Mason: 0.70 Day, Beldar: 1.10 Day',
        'None',
      ],
    ];

    autoTable(doc, {
      startY: 35,
      head: [['#', 'Code', 'Work Item / Formula Name', 'Category', 'Unit', 'Materials Required', 'Labour Required', 'Machinery Required']],
      body: sampleRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    });
  } else {
    // rate-lists
    applyDocumentDecorations(
      doc,
      'Rate Lists Bulk Import Template',
      'Sample price schedule with location/contract specific overrides',
      ['Sample Template']
    );

    const sampleRows = [
      ['1', 'MAT-CEM-001', 'Portland Pozzolana Cement (PPC)', 'BAG', '395.00', 'Material'],
      ['2', 'MAT-STL-001', 'TMT Steel Fe500D 12mm', 'KG', '71.50', 'Material'],
      ['3', 'LAB-MAS-001', 'Mason (Grade 1)', 'Day', '900.00', 'Manpower'],
      ['4', 'LAB-HLP-001', 'Beldar / Helper', 'Day', '580.00', 'Manpower'],
      ['5', 'MAC-MIX-001', 'Concrete Mixer 10/7 CFT', 'Hour', '380.00', 'Machinery'],
      ['6', 'MAC-JCB-001', 'JCB Excavator Loader', 'Hour', '1550.00', 'Machinery'],
    ];

    autoTable(doc, {
      startY: 35,
      head: [['#', 'Item Code', 'Item Description', 'Unit', 'Override Rate (₹)', 'Resource Type']],
      body: sampleRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    });
  }

  addPageFooters(doc);
  doc.save(`Sample_${type.toUpperCase()}_Template.pdf`);
};

/**
 * Common Helper: Trigger Excel/CSV Download
 */
export const downloadWorkbook = (wb: XLSX.WorkBook, fileName: string) => {
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * EXPORT MATERIALS TO EXCEL
 */
export const exportMaterialsExcel = (materials: MasterMaterial[]) => {
  const rows = materials.map((m, idx) => ({
    '#': idx + 1,
    'Material Name': m.name,
    Category: m.category || 'General',
    Subcategory: m.subcategory || '',
    Code: m.code,
    Unit: (m.unit || 'NOS').toUpperCase(),
    'Rate (INR)': m.effectiveRate ?? m.standardRate,
    Status: m.status || 'ACTIVE',
    Specification: m.specification || '',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Materials');
  downloadWorkbook(wb, `Materials_Master_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

/**
 * EXPORT MANPOWER TO EXCEL
 */
export const exportManpowerExcel = (labourItems: MasterLabour[]) => {
  const rows = labourItems.map((l, idx) => ({
    '#': idx + 1,
    'Trade / Role Name': l.name,
    Category: l.category || 'Civil Work',
    'Skill Level': l.skillType || 'Skilled',
    Code: l.code,
    'Daily Rate (INR)': l.standardDailyRate,
    Unit: l.unit || 'Day',
    Status: l.status || 'ACTIVE',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Manpower');
  downloadWorkbook(wb, `Manpower_Master_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

/**
 * EXPORT MACHINERY TO EXCEL
 */
export const exportMachineryExcel = (machineryItems: MasterMachinery[]) => {
  const rows = machineryItems.map((m, idx) => ({
    '#': idx + 1,
    'Equipment Name': m.name,
    Category: m.category || 'General Plant',
    Code: m.code,
    'Hourly Rate (INR)': m.standardHourlyRate,
    'Billing Basis': m.rateType || 'Hourly',
    Unit: m.unit || 'Hour',
    Status: m.status || 'ACTIVE',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Machinery');
  downloadWorkbook(wb, `Machinery_Master_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

/**
 * EXPORT FORMULAS TO EXCEL
 */
export const exportFormulasExcel = (formulas: MasterFormula[]) => {
  const rows = formulas.map((f, idx) => ({
    '#': idx + 1,
    Code: f.code,
    'Work Item / Formula Name': f.name,
    Category: f.category || 'Civil Work',
    Unit: (f.unit || 'CUM').toUpperCase(),
    'Materials Required': (f.materialFactors || []).map((m) => `${m.name}: ${m.factor} ${m.unit}`).join(', '),
    'Labour Required': (f.labourFactors || []).map((l) => `${l.name}: ${l.factor} ${l.unit}`).join(', '),
    'Machinery Required': (f.machineryFactors || []).map((m) => `${m.name}: ${m.factor} ${m.unit}`).join(', '),
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Formulas');
  downloadWorkbook(wb, `Formulas_Master_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

/**
 * EXPORT RATE LISTS TO EXCEL
 */
export const exportRateListsExcel = (rateLists: MasterRateList[]) => {
  const rows = rateLists.map((rl, idx) => ({
    '#': idx + 1,
    'Rate List Name': rl.name + (rl.isDefault ? ' (Default)' : ''),
    Code: rl.code,
    Description: rl.description || 'Standard Overrides',
    'Materials Coverage': `${rl.materialRates?.length || 0} Materials`,
    'Labour Coverage': `${rl.labourRates?.length || 0} Manpower`,
    'Machinery Coverage': `${rl.machineryRates?.length || 0} Machinery`,
    'Created Date': rl.createdAt ? new Date(rl.createdAt).toLocaleDateString('en-IN') : '',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rate_Lists');
  downloadWorkbook(wb, `Rate_Lists_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

/**
 * DOWNLOAD SAMPLE EXCEL TEMPLATE (.XLSX)
 */
export const downloadSampleExcelTemplate = (type: 'materials' | 'manpower' | 'machinery' | 'formulas' | 'rate-lists') => {
  const wb = XLSX.utils.book_new();

  if (type === 'materials') {
    const sampleRows = [
      {
        'Material Name': 'Portland Pozzolana Cement (PPC)',
        Category: 'Cement & Aggregates',
        Code: 'MAT-CEM-001',
        Unit: 'BAG',
        'Standard Rate': 385.0,
        Status: 'ACTIVE',
        Specification: 'IS 1489 Part 1',
      },
      {
        'Material Name': 'Ordinary Portland Cement 43 Grade',
        Category: 'Cement & Aggregates',
        Code: 'MAT-CEM-002',
        Unit: 'BAG',
        'Standard Rate': 410.0,
        Status: 'ACTIVE',
        Specification: 'IS 8112',
      },
      {
        'Material Name': 'TMT Steel Rebars Fe500D 12mm',
        Category: 'Steel & Metals',
        Code: 'MAT-STL-001',
        Unit: 'KG',
        'Standard Rate': 68.5,
        Status: 'ACTIVE',
        Specification: 'IS 1786',
      },
      {
        'Material Name': 'River Sand / Coarse Sand',
        Category: 'Cement & Aggregates',
        Code: 'MAT-SND-001',
        Unit: 'CUM',
        'Standard Rate': 1450.0,
        Status: 'ACTIVE',
        Specification: 'Zone II Sand',
      },
      {
        'Material Name': 'Coarse Aggregate 20mm Nominal',
        Category: 'Cement & Aggregates',
        Code: 'MAT-AGG-001',
        Unit: 'CUM',
        'Standard Rate': 1280.0,
        Status: 'ACTIVE',
        Specification: 'Graded Crushed Stone',
      },
      {
        'Material Name': 'Red Clay Bricks Class 7.5',
        Category: 'Masonry',
        Code: 'MAT-BRK-001',
        Unit: 'NOS',
        'Standard Rate': 9.5,
        Status: 'ACTIVE',
        Specification: 'Standard 19x9x9 cm',
      },
      {
        'Material Name': 'AAC Blocks 600x200x150mm',
        Category: 'Masonry',
        Code: 'MAT-AAC-001',
        Unit: 'NOS',
        'Standard Rate': 65.0,
        Status: 'ACTIVE',
        Specification: 'Grade 1 AAC',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleRows);
    XLSX.utils.book_append_sheet(wb, ws, 'Materials_Sample');
    downloadWorkbook(wb, 'Sample_Materials_Template.xlsx');
  } else if (type === 'manpower') {
    const sampleRows = [
      {
        'Role / Designation': 'Mason (Head / Grade 1)',
        Category: 'Civil Work',
        'Skill Level': 'Specialist',
        Code: 'LAB-MAS-001',
        'Daily Rate': 950.0,
        Unit: 'Day',
        Status: 'ACTIVE',
      },
      {
        'Role / Designation': 'Mason (General)',
        Category: 'Civil Work',
        'Skill Level': 'Skilled',
        Code: 'LAB-MAS-002',
        'Daily Rate': 800.0,
        Unit: 'Day',
        Status: 'ACTIVE',
      },
      {
        'Role / Designation': 'Bar Bender / Steel Fixer',
        Category: 'Steel Fixing',
        'Skill Level': 'Skilled',
        Code: 'LAB-BAR-001',
        'Daily Rate': 850.0,
        Unit: 'Day',
        Status: 'ACTIVE',
      },
      {
        'Role / Designation': 'Carpenter (Shuttering)',
        Category: 'Formwork',
        'Skill Level': 'Skilled',
        Code: 'LAB-CRP-001',
        'Daily Rate': 850.0,
        Unit: 'Day',
        Status: 'ACTIVE',
      },
      {
        'Role / Designation': 'Beldar / Helper (Male)',
        Category: 'General Labour',
        'Skill Level': 'Unskilled',
        Code: 'LAB-HLP-001',
        'Daily Rate': 550.0,
        Unit: 'Day',
        Status: 'ACTIVE',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleRows);
    XLSX.utils.book_append_sheet(wb, ws, 'Manpower_Sample');
    downloadWorkbook(wb, 'Sample_Manpower_Template.xlsx');
  } else if (type === 'machinery') {
    const sampleRows = [
      {
        'Equipment Name': 'Concrete Mixer 10/7 CFT (Diesel)',
        Category: 'Concreting',
        Code: 'MAC-MIX-001',
        'Hourly Rate': 350.0,
        'Billing Basis': 'Hourly',
        Unit: 'Hour',
        Status: 'ACTIVE',
      },
      {
        'Equipment Name': 'Needle Concrete Vibrator 40/60mm',
        Category: 'Concreting',
        Code: 'MAC-VIB-001',
        'Hourly Rate': 120.0,
        'Billing Basis': 'Hourly',
        Unit: 'Hour',
        Status: 'ACTIVE',
      },
      {
        'Equipment Name': 'JCB 3DX Backhoe Excavator Loader',
        Category: 'Earthmoving',
        Code: 'MAC-JCB-001',
        'Hourly Rate': 1450.0,
        'Billing Basis': 'Hourly',
        Unit: 'Hour',
        Status: 'ACTIVE',
      },
      {
        'Equipment Name': 'Hydraulic Mobile Crane 15T',
        Category: 'Lifting',
        Code: 'MAC-CRN-001',
        'Hourly Rate': 2200.0,
        'Billing Basis': 'Hourly',
        Unit: 'Hour',
        Status: 'ACTIVE',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleRows);
    XLSX.utils.book_append_sheet(wb, ws, 'Machinery_Sample');
    downloadWorkbook(wb, 'Sample_Machinery_Template.xlsx');
  } else if (type === 'formulas') {
    const sampleRows = [
      {
        'Formula Name': 'RCC M20 (1:1.5:3) in Beams & Columns',
        Code: 'FORM-RCC-M20',
        Category: 'Concrete',
        Unit: 'CUM',
        Description: 'Complete M20 concrete rate analysis',
      },
      {
        'Formula Name': 'Cement Plaster 12mm thick in 1:4 mix',
        Code: 'FORM-PLS-12MM',
        Category: 'Plastering',
        Unit: 'SQM',
        Description: '12mm single coat wall plaster',
      },
      {
        'Formula Name': 'Brickwork in 1:6 cement mortar in superstructure',
        Code: 'FORM-BRK-14',
        Category: 'Masonry',
        Unit: 'CUM',
        Description: 'Burnt clay brick masonry',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleRows);
    XLSX.utils.book_append_sheet(wb, ws, 'Formulas_Sample');
    downloadWorkbook(wb, 'Sample_Formulas_Template.xlsx');
  } else {
    const sampleRows = [
      {
        'Item Code': 'MAT-CEM-001',
        'Item Description': 'Portland Pozzolana Cement (PPC)',
        Unit: 'BAG',
        'Override Rate': 395.0,
        'Resource Type': 'Material',
      },
      {
        'Item Code': 'LAB-MAS-001',
        'Item Description': 'Mason (Grade 1)',
        Unit: 'Day',
        'Override Rate': 900.0,
        'Resource Type': 'Manpower',
      },
      {
        'Item Code': 'MAC-MIX-001',
        'Item Description': 'Concrete Mixer 10/7 CFT',
        Unit: 'Hour',
        'Override Rate': 380.0,
        'Resource Type': 'Machinery',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleRows);
    XLSX.utils.book_append_sheet(wb, ws, 'Rate_List_Sample');
    downloadWorkbook(wb, 'Sample_Rate_List_Template.xlsx');
  }
};
