import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { Company } from '../models/Company';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { AuditLog } from '../models/AuditLog';
import { SorMaster, SorItem } from '../models/SorMaster';
import { Material } from '../models/Material';
import { LabourType } from '../models/Labour';
import { MachineryType } from '../models/Machinery';
import { Boq, BoqItem } from '../models/Boq';
import { Measurement } from '../models/Measurement';
import { BomItem } from '../models/Bom';
import { ManpowerItem } from '../models/Manpower';
import { MachineryItem } from '../models/Machinery';
import { RunningBill } from '../models/RunningBill';
import { logger } from '../config/logger';

const seedDatabase = async () => {
  try {
    logger.info(`Connecting to MongoDB at ${env.MONGODB_URI} for seeding...`);
    await mongoose.connect(env.MONGODB_URI);

    // Clean existing data for clean slate
    await Promise.all([
      Company.deleteMany({}),
      User.deleteMany({}),
      Project.deleteMany({}),
      AuditLog.deleteMany({}),
      SorMaster.deleteMany({}),
      SorItem.deleteMany({}),
      Material.deleteMany({}),
      LabourType.deleteMany({}),
      MachineryType.deleteMany({}),
      Boq.deleteMany({}),
      BoqItem.deleteMany({}),
      Measurement.deleteMany({}),
      BomItem.deleteMany({}),
      ManpowerItem.deleteMany({}),
      MachineryItem.deleteMany({}),
      RunningBill.deleteMany({}),
    ]);

    logger.info('Cleaned old records.');

    // 1. Create Company
    const company = await Company.create({
      name: 'Digi Epitome Technology',
      code: 'APEX-INFR',
      address: 'Plot 42, Cyber Gateway, Udyog Vihar, Gurugram, India',
      contactEmail: 'admin@civilguruji.com',
      taxId: '07AAAAA0000A1Z5',
    });
    logger.info(`Company created: ${company.name} [${company.code}]`);

    // 2. Create Users
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Civil@123', salt);

    const adminUser = await User.create({
      name: 'Er. Rajesh Sharma',
      email: 'admin@civilguruji.com',
      passwordHash,
      role: 'ADMIN',
      companyId: company._id,
      isActive: true,
    });

    const managerUser = await User.create({
      name: 'Er. Priya Patel',
      email: 'manager@civilguruji.com',
      passwordHash,
      role: 'MANAGER',
      companyId: company._id,
      isActive: true,
    });

    logger.info(`Created Users: ${adminUser.email} (ADMIN), ${managerUser.email} (MANAGER)`);

    // 3. Create Rate Master (SOR Master & SOR Items)
    const sorMaster = await SorMaster.create({
      companyId: company._id,
      authority: 'CPWD',
      sorName: 'Delhi Schedule of Rates (DSR) 2023 - Civil',
      version: '2023.1',
      effectiveFrom: new Date('2023-10-01'),
      sourceDocument: 'CPWD_DSR_2023_Civil.pdf',
      status: 'ACTIVE',
    });

    const sorItemsData = [
      {
        sorId: sorMaster._id,
        itemCode: '2.8.1',
        descriptionEnglish:
          'Earth work in excavation by mechanical means (Hydraulic excavator) / manual means in foundation trenches or drains not exceeding 1.5 m in width or 10 sqm on plan, including dressing of sides and ramming of bottoms.',
        unit: 'cum',
        rate: 195.4,
        chapter: 'Sub-Head 02: Earth Work',
        subChapter: 'Excavation',
      },
      {
        sorId: sorMaster._id,
        itemCode: '4.1.3',
        descriptionEnglish:
          'Providing and laying in position cement concrete of specified grade excluding the cost of centering and shuttering - All work up to plinth level: 1:2:4 (1 cement : 2 coarse sand : 4 graded stone aggregate 20 mm nominal size).',
        unit: 'cum',
        rate: 5850.0,
        chapter: 'Sub-Head 04: Concrete Work',
        subChapter: 'Plain Cement Concrete',
      },
      {
        sorId: sorMaster._id,
        itemCode: '5.1.2',
        descriptionEnglish:
          'Reinforced cement concrete work in beams, suspended floors, roofs having slope up to 15°, landings, balconies, shelves, chajjas, lintels, bands, plain window sills, staircases and spiral staircases up to floor five level, excluding the cost of centering, shuttering, finishing and reinforcement with 1:1.5:3 (1 cement : 1.5 coarse sand : 3 graded stone aggregate 20 mm nominal size).',
        unit: 'cum',
        rate: 8950.0,
        chapter: 'Sub-Head 05: Reinforced Cement Concrete',
        subChapter: 'RCC Beams and Slabs',
      },
      {
        sorId: sorMaster._id,
        itemCode: '5.22.6',
        descriptionEnglish:
          'Thermo-Mechanically Treated bars of grade Fe-500D or more for R.C.C. work including straightening, cutting, bending, placing in position and binding all complete up to plinth level.',
        unit: 'kg',
        rate: 78.5,
        chapter: 'Sub-Head 05: Reinforced Cement Concrete',
        subChapter: 'Steel Reinforcement',
      },
      {
        sorId: sorMaster._id,
        itemCode: '6.1.1',
        descriptionEnglish:
          'Brick work with common burnt clay F.P.S. (non modular) bricks of class designation 7.5 in foundation and plinth in cement mortar 1:6 (1 cement : 6 coarse sand).',
        unit: 'cum',
        rate: 5420.0,
        chapter: 'Sub-Head 06: Brick Work',
        subChapter: 'Substructure Brickwork',
      },
      {
        sorId: sorMaster._id,
        itemCode: '13.1.1',
        descriptionEnglish:
          '12 mm cement plaster of mix 1:6 (1 cement: 6 fine sand) on fair side of brick / concrete wall including scaffolding and curing complete.',
        unit: 'sqm',
        rate: 245.0,
        chapter: 'Sub-Head 13: Finishing',
        subChapter: 'Cement Plastering',
      },
      {
        sorId: sorMaster._id,
        itemCode: '11.41.2',
        descriptionEnglish:
          'Providing and laying vitrified floor tiles in different sizes (thickness to be specified by the manufacturer) with water absorption less than 0.08% and conforming to IS: 15622, of approved make, in all colours and shades, laid on 20mm thick cement mortar 1:4 (1 cement : 4 coarse sand), including grouting the joints with white cement and matching pigments.',
        unit: 'sqm',
        rate: 1120.0,
        chapter: 'Sub-Head 11: Flooring',
        subChapter: 'Tile Flooring',
      },
      {
        sorId: sorMaster._id,
        itemCode: '13.43.1',
        descriptionEnglish:
          'Applying one coat of water thinnable cement primer of approved brand and manufacture on wall surface including preparation of surface.',
        unit: 'sqm',
        rate: 48.0,
        chapter: 'Sub-Head 13: Finishing',
        subChapter: 'Painting & Primer',
      },
    ];

    const seededSorItems = await SorItem.insertMany(sorItemsData);
    logger.info(`Seeded ${seededSorItems.length} published SOR items into Rate Master.`);

    // 4. Create Material Master Catalog
    const materialsData = [
      { companyId: company._id, code: 'MAT-CEM-43', name: 'OPC 43 Grade Cement', category: 'Cement', unit: 'Bag', standardRate: 380 },
      { companyId: company._id, code: 'MAT-SND-CRS', name: 'Coarse River Sand / M-Sand', category: 'Sand', unit: 'cum', standardRate: 1450 },
      { companyId: company._id, code: 'MAT-AGG-20', name: '20mm Graded Stone Aggregate', category: 'Aggregates', unit: 'cum', standardRate: 1350 },
      { companyId: company._id, code: 'MAT-AGG-10', name: '10mm Graded Stone Aggregate', category: 'Aggregates', unit: 'cum', standardRate: 1400 },
      { companyId: company._id, code: 'MAT-STL-TMT', name: 'TMT 500D Reinforcement Steel', category: 'Steel', unit: 'kg', standardRate: 68 },
      { companyId: company._id, code: 'MAT-BRK-RED', name: 'Clay Red Bricks Class 7.5', category: 'Bricks', unit: 'nos', standardRate: 9 },
      { companyId: company._id, code: 'MAT-TLE-VIT', name: 'Vitrified Tiles 600x600mm', category: 'Tiles', unit: 'sqm', standardRate: 550 },
    ];
    await Material.insertMany(materialsData);
    logger.info('Seeded Material catalog.');

    // 5. Create Dynamic Labour Types
    const labourData = [
      { companyId: company._id, code: 'LAB-MAS-01', name: 'Head Mason / Raj Mistry', category: 'Supervisory', standardDailyRate: 1100, unit: 'Day' },
      { companyId: company._id, code: 'LAB-MAS-02', name: 'Mason (Brick / Plaster)', category: 'Skilled', standardDailyRate: 950, unit: 'Day' },
      { companyId: company._id, code: 'LAB-CRP-01', name: 'Shuttering Carpenter', category: 'Skilled', standardDailyRate: 950, unit: 'Day' },
      { companyId: company._id, code: 'LAB-BBD-01', name: 'Bar Bender / Steel Fixer', category: 'Skilled', standardDailyRate: 900, unit: 'Day' },
      { companyId: company._id, code: 'LAB-HLP-01', name: 'General Site Helper / Beldar', category: 'Unskilled', standardDailyRate: 650, unit: 'Day' },
      { companyId: company._id, code: 'LAB-OPT-01', name: 'Equipment Operator', category: 'Specialist', standardDailyRate: 1200, unit: 'Day' },
    ];
    await LabourType.insertMany(labourData);
    logger.info('Seeded Labour types master.');

    // 6. Create Dynamic Machinery Types
    const machineryData = [
      { companyId: company._id, code: 'MAC-EXC-01', name: 'Hydraulic Excavator (20T)', category: 'Earthmoving', standardHourlyRate: 2200, unit: 'Hour' },
      { companyId: company._id, code: 'MAC-JCB-01', name: 'JCB Backhoe Loader', category: 'Earthmoving', standardHourlyRate: 1400, unit: 'Hour' },
      { companyId: company._id, code: 'MAC-MIX-10', name: 'Concrete Mixer 10/7 with Hopper', category: 'Concreting', standardHourlyRate: 350, unit: 'Hour' },
      { companyId: company._id, code: 'MAC-TMX-06', name: 'Transit Mixer 6 cum', category: 'Concreting', standardHourlyRate: 1600, unit: 'Hour' },
      { companyId: company._id, code: 'MAC-CRN-40', name: 'Mobile Tower Crane 40T', category: 'Lifting', standardHourlyRate: 2800, unit: 'Hour' },
      { companyId: company._id, code: 'MAC-TRK-10', name: 'Tipper Dump Truck 10 Wheel', category: 'Hauling', standardHourlyRate: 1100, unit: 'Hour' },
    ];
    await MachineryType.insertMany(machineryData);
    logger.info('Seeded Machinery types master.');

    // 7. Create Realistic Construction Projects
    const projectsData = [
      {
        companyId: company._id,
        name: 'Skyline Business Park - Phase 2',
        code: 'PRJ-DEL-01',
        clientName: 'DLF Cyber City Developers',
        location: 'Sector 25A, Gurugram, Haryana',
        description:
          'Construction of twin G+24 commercial office towers including 3 basements, composite steel framing, high-performance double-glazed curtain wall facade, and complete MEP fitouts.',
        projectType: 'Commercial',
        status: 'active',
        progress: 48,
        estimatedValue: 400000000,
        contractValue: 425000000,
        currency: 'INR',
        startDate: new Date('2024-03-15'),
        endDate: new Date('2026-11-30'),
        phases: 4,
        isArchived: false,
        createdBy: adminUser._id,
      },
      {
        companyId: company._id,
        name: 'NH-48 Expressway 6-Lane Widening & Flyover',
        code: 'PRJ-NHAI-09',
        clientName: 'National Highways Authority of India (NHAI)',
        location: 'Jaipur - Delhi Highway Corridor, Rajasthan',
        description:
          'Widening of 38 km corridor into 6-lane access-controlled expressway with 2 elevated flyovers, 4 vehicular underpasses, and rigid concrete pavement.',
        projectType: 'Infrastructure',
        status: 'active',
        progress: 72,
        estimatedValue: 178000000,
        contractValue: 185000000,
        currency: 'INR',
        startDate: new Date('2023-08-01'),
        endDate: new Date('2025-06-30'),
        phases: 3,
        isArchived: false,
        createdBy: adminUser._id,
      },
      {
        companyId: company._id,
        name: 'Metro Elevated Viaduct & 4 Stations Package',
        code: 'PRJ-MTR-104',
        clientName: 'Delhi Metro Rail Corporation (DMRC)',
        location: 'Janakpuri West to RK Ashram Marg, New Delhi',
        description:
          'Design and construction of 7.4 km elevated viaduct, precast segmental box girders, and 4 elevated metro stations with architectural finishes.',
        projectType: 'Infrastructure',
        status: 'active',
        progress: 35,
        estimatedValue: 920000000,
        contractValue: 960000000,
        currency: 'INR',
        startDate: new Date('2024-01-10'),
        endDate: new Date('2027-03-31'),
        phases: 5,
        isArchived: false,
        createdBy: adminUser._id,
      },
      {
        companyId: company._id,
        name: 'Aura Green Luxury Residential Towers',
        code: 'PRJ-RES-55',
        clientName: 'Godrej Properties Urban Ltd.',
        location: 'Whitefield, Bengaluru, Karnataka',
        description:
          'Premium residential enclave comprising three 32-storey residential towers, podium landscaped amenities, clubhouse, and automated multi-level car parking.',
        projectType: 'Residential',
        status: 'draft',
        progress: 5,
        estimatedValue: 250000000,
        contractValue: 248000000,
        currency: 'INR',
        startDate: new Date('2025-02-01'),
        endDate: new Date('2027-12-15'),
        phases: 3,
        isArchived: false,
        createdBy: managerUser._id,
      },
      {
        companyId: company._id,
        name: 'Industrial Cold Storage & Smart Logistics Park',
        code: 'PRJ-IND-88',
        clientName: 'IndoSpace Logistics Parks',
        location: 'Chakan MIDC Industrial Zone, Pune, Maharashtra',
        description:
          'Turnkey execution of pre-engineered building (PEB) warehouse facility (450,000 sq ft) with industrial flooring, automated docking bays, and cold rooms.',
        projectType: 'Industrial',
        status: 'completed',
        progress: 100,
        estimatedValue: 85000000,
        contractValue: 89000000,
        currency: 'INR',
        startDate: new Date('2023-04-10'),
        endDate: new Date('2024-10-31'),
        phases: 2,
        isArchived: false,
        createdBy: adminUser._id,
      },
      {
        companyId: company._id,
        name: 'AIIMS Super Speciality Hospital Wing',
        code: 'PRJ-HSP-12',
        clientName: 'Ministry of Health & Family Welfare',
        location: 'Ansari Nagar, New Delhi',
        description:
          '500-bed trauma and super-speciality medical wing with state-of-the-art modular operation theatres, medical gas pipeline systems, and radiation oncology bunkers.',
        projectType: 'Institutional',
        status: 'on_hold',
        progress: 60,
        estimatedValue: 315000000,
        contractValue: 310000000,
        currency: 'INR',
        startDate: new Date('2023-11-01'),
        endDate: new Date('2026-08-15'),
        phases: 3,
        isArchived: false,
        createdBy: adminUser._id,
      },
    ];

    const insertedProjects = await Project.insertMany(projectsData);
    logger.info(`Seeded ${insertedProjects.length} realistic projects.`);

    const sampleProj = insertedProjects[0]; // Skyline Business Park

    // 8. Create Sample BOQ for the First Project
    const sampleBoq = await Boq.create({
      companyId: company._id,
      projectId: sampleProj._id,
      title: 'Main Civil Works BOQ',
      version: '1.0',
      status: 'Approved',
      totalItems: 4,
      totalQuantity: 2840,
      totalBoqValue: 9757900,
      createdBy: adminUser._id,
      approvedBy: adminUser._id,
      approvedAt: new Date(),
    });

    const boqItemsSeed = [
      {
        companyId: company._id,
        projectId: sampleProj._id,
        boqId: sampleBoq._id,
        itemNumber: 1,
        itemCode: '2.8.1',
        description: 'Earth work in excavation by mechanical means in foundation trenches...',
        unit: 'cum',
        quantity: 1200,
        rate: 195.4,
        amount: 234480,
        sorReference: {
          sorId: sorMaster._id,
          sorItemId: seededSorItems[0]._id,
          scheduleName: sorMaster.sorName,
          version: sorMaster.version,
          snapshotRate: 195.4,
        },
        chapter: 'Earth Work',
        executedQuantity: 600,
        balanceQuantity: 600,
        progressPercent: 50,
      },
      {
        companyId: company._id,
        projectId: sampleProj._id,
        boqId: sampleBoq._id,
        itemNumber: 2,
        itemCode: '4.1.3',
        description: 'PCC 1:2:4 in foundation plinth level with graded stone aggregate 20mm...',
        unit: 'cum',
        quantity: 240,
        rate: 5850,
        amount: 1404000,
        sorReference: {
          sorId: sorMaster._id,
          sorItemId: seededSorItems[1]._id,
          scheduleName: sorMaster.sorName,
          version: sorMaster.version,
          snapshotRate: 5850,
        },
        chapter: 'Concrete Work',
        executedQuantity: 120,
        balanceQuantity: 120,
        progressPercent: 50,
      },
      {
        companyId: company._id,
        projectId: sampleProj._id,
        boqId: sampleBoq._id,
        itemNumber: 3,
        itemCode: '5.1.2',
        description: 'RCC 1:1.5:3 in columns, beams, suspended floors up to floor 5 level...',
        unit: 'cum',
        quantity: 800,
        rate: 8950,
        amount: 7160000,
        sorReference: {
          sorId: sorMaster._id,
          sorItemId: seededSorItems[2]._id,
          scheduleName: sorMaster.sorName,
          version: sorMaster.version,
          snapshotRate: 8950,
        },
        chapter: 'RCC Work',
        executedQuantity: 360,
        balanceQuantity: 440,
        progressPercent: 45,
      },
      {
        companyId: company._id,
        projectId: sampleProj._id,
        boqId: sampleBoq._id,
        itemNumber: 4,
        itemCode: '6.1.1',
        description: 'Brick work in cement mortar 1:6 in foundation and plinth...',
        unit: 'cum',
        quantity: 600,
        rate: 5420,
        amount: 3252000,
        sorReference: {
          sorId: sorMaster._id,
          sorItemId: seededSorItems[4]._id,
          scheduleName: sorMaster.sorName,
          version: sorMaster.version,
          snapshotRate: 5420,
        },
        chapter: 'Brick Work',
        executedQuantity: 150,
        balanceQuantity: 450,
        progressPercent: 25,
      },
    ];

    const seededBoqItems = await BoqItem.insertMany(boqItemsSeed);
    logger.info('Seeded project BOQ items.');

    // 9. Create Sample Measurement Book (MB) Entries
    await Measurement.create({
      companyId: company._id,
      projectId: sampleProj._id,
      boqId: sampleBoq._id,
      boqItemId: seededBoqItems[0]._id, // Earthwork item
      measurementDate: new Date('2024-04-10'),
      status: 'Approved',
      totalQuantity: 600,
      entries: [
        {
          description: 'Basement 1 Grid A to D excavation',
          location: 'Tower A Core',
          levelFloor: 'Basement -1',
          nos: 1,
          length: 30,
          width: 10,
          heightDepth: 2,
          unit: 'cum',
          formula: 'LxWxH',
          calculatedQuantity: 600,
          remarks: 'Inspected and verified with total station',
        },
      ],
      createdBy: adminUser._id,
      approvedBy: adminUser._id,
      approvedAt: new Date('2024-04-12'),
    });

    await Measurement.create({
      companyId: company._id,
      projectId: sampleProj._id,
      boqId: sampleBoq._id,
      boqItemId: seededBoqItems[1]._id, // PCC item
      measurementDate: new Date('2024-04-20'),
      status: 'Approved',
      totalQuantity: 120,
      entries: [
        {
          description: 'PCC bed 1:2:4 for raft foundation',
          location: 'Raft Section 1',
          levelFloor: 'Sub-base',
          nos: 1,
          length: 40,
          width: 20,
          heightDepth: 0.15,
          unit: 'cum',
          formula: 'LxWxH',
          calculatedQuantity: 120,
          remarks: '150mm thick PCC bed laid',
        },
      ],
      createdBy: adminUser._id,
      approvedBy: adminUser._id,
      approvedAt: new Date('2024-04-22'),
    });
    logger.info('Seeded Measurement Book entries.');

    // 10. Create Sample BOM Items
    await BomItem.create([
      {
        companyId: company._id,
        projectId: sampleProj._id,
        boqId: sampleBoq._id,
        boqItemId: seededBoqItems[1]._id,
        materialName: 'OPC 43 Grade Cement',
        unit: 'Bag',
        coefficient: 6.4,
        boqQuantity: 240,
        requiredQuantity: 1536,
        unitRate: 380,
        amount: 583680,
        source: 'RATE_ANALYSIS',
      },
      {
        companyId: company._id,
        projectId: sampleProj._id,
        boqId: sampleBoq._id,
        boqItemId: seededBoqItems[1]._id,
        materialName: 'Coarse Sand',
        unit: 'cum',
        coefficient: 0.45,
        boqQuantity: 240,
        requiredQuantity: 108,
        unitRate: 1450,
        amount: 156600,
        source: 'RATE_ANALYSIS',
      },
      {
        companyId: company._id,
        projectId: sampleProj._id,
        boqId: sampleBoq._id,
        boqItemId: seededBoqItems[1]._id,
        materialName: '20mm Graded Stone Aggregate',
        unit: 'cum',
        coefficient: 0.88,
        boqQuantity: 240,
        requiredQuantity: 211.2,
        unitRate: 1350,
        amount: 285120,
        source: 'RATE_ANALYSIS',
      },
    ]);
    logger.info('Seeded BOM items.');

    // 11. Create Sample Manpower Items
    await ManpowerItem.create([
      {
        companyId: company._id,
        projectId: sampleProj._id,
        boqId: sampleBoq._id,
        boqItemId: seededBoqItems[1]._id,
        labourType: 'Mason (Brick / Plaster)',
        coefficient: 0.1,
        boqQuantity: 240,
        requiredManpower: 24,
        unitRate: 950,
        amount: 22800,
        source: 'RATE_ANALYSIS',
      },
      {
        companyId: company._id,
        projectId: sampleProj._id,
        boqId: sampleBoq._id,
        boqItemId: seededBoqItems[1]._id,
        labourType: 'General Site Helper / Beldar',
        coefficient: 0.7,
        boqQuantity: 240,
        requiredManpower: 168,
        unitRate: 650,
        amount: 109200,
        source: 'RATE_ANALYSIS',
      },
    ]);
    logger.info('Seeded Manpower items.');

    // 12. Create Sample Machinery Items
    await MachineryItem.create([
      {
        companyId: company._id,
        projectId: sampleProj._id,
        boqId: sampleBoq._id,
        boqItemId: seededBoqItems[1]._id,
        machineryType: 'Concrete Mixer 10/7 with Hopper',
        coefficient: 0.15,
        boqQuantity: 240,
        requiredHours: 36,
        unitRate: 350,
        amount: 12600,
        source: 'RATE_ANALYSIS',
      },
    ]);
    logger.info('Seeded Machinery items.');

    // 13. Create Sample Running Bill (RA-01)
    await RunningBill.create({
      companyId: company._id,
      projectId: sampleProj._id,
      billNumber: 'RA-01',
      billDate: new Date('2024-05-01'),
      periodFrom: new Date('2024-04-01'),
      periodTo: new Date('2024-04-30'),
      status: 'Approved',
      totalPreviousAmount: 0,
      totalCurrentAmount: 819240,
      totalCumulativeAmount: 819240,
      items: [
        {
          boqItemId: seededBoqItems[0]._id,
          itemCode: '2.8.1',
          description: seededBoqItems[0].description,
          unit: 'cum',
          rate: 195.4,
          boqQuantity: 1200,
          previouslyBilledQuantity: 0,
          currentQuantity: 600,
          cumulativeQuantity: 600,
          balanceQuantity: 600,
          currentAmount: 117240,
          cumulativeAmount: 117240,
        },
        {
          boqItemId: seededBoqItems[1]._id,
          itemCode: '4.1.3',
          description: seededBoqItems[1].description,
          unit: 'cum',
          rate: 5850,
          boqQuantity: 240,
          previouslyBilledQuantity: 0,
          currentQuantity: 120,
          cumulativeQuantity: 120,
          balanceQuantity: 120,
          currentAmount: 702000,
          cumulativeAmount: 702000,
        },
      ],
      remarks: 'Running Account Bill No. 1 approved for substructure concrete and earthwork.',
      submittedBy: adminUser._id,
      submittedAt: new Date('2024-05-02'),
      approvedBy: adminUser._id,
      approvedAt: new Date('2024-05-05'),
    });
    logger.info('Seeded Running Bill RA-01.');

    logger.info('=======================================================');
    logger.info('🎉 Full Construction ERP Database seeded successfully!');
    logger.info('=======================================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
