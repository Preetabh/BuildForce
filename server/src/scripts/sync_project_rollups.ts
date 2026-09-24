import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Project } from '../models/Project';
import { BoqItem } from '../models/Boq';

async function syncRollups() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to MongoDB');

    const allProjects = await Project.find({ deletedAt: null });

    // Step 1: Update individual projects from direct BOQ items if budget is 0
    for (const p of allProjects) {
      const boqs = await BoqItem.find({ projectId: p._id });
      const totalBoq = boqs.reduce((s, b) => s + (b.amount || 0), 0);
      const executedBoq = boqs.reduce((s, b) => s + ((b.executedQuantity || 0) * (b.rate || 0)), 0);
      const prog = totalBoq > 0 ? Number(((executedBoq / totalBoq) * 100).toFixed(0)) : p.progress;

      let changed = false;
      if (!p.contractValue && !p.estimatedValue && totalBoq > 0) {
        p.estimatedValue = totalBoq;
        changed = true;
      }
      if (p.progress !== prog && totalBoq > 0) {
        p.progress = prog;
        changed = true;
      }
      if (changed) {
        await p.save();
        console.log(`Updated project ${p.name} (${p.code}): estimatedValue=${p.estimatedValue}, progress=${p.progress}%`);
      }
    }

    // Step 2: Roll up subprojects to parents
    const parentProjects = await Project.find({
      deletedAt: null,
      $or: [{ parentId: null }, { parentId: { $exists: false } }],
    });

    for (const parent of parentProjects) {
      const subs = await Project.find({ parentId: parent._id, deletedAt: null });
      if (subs.length > 0) {
        const sumVal = subs.reduce((s, sub) => s + (sub.contractValue || sub.estimatedValue || 0), 0);
        const avgProg = Number((subs.reduce((s, sub) => s + (sub.progress || 0), 0) / subs.length).toFixed(0));

        let changed = false;
        if (!parent.contractValue && (!parent.estimatedValue || parent.estimatedValue < sumVal)) {
          parent.estimatedValue = sumVal;
          changed = true;
        }
        if (parent.progress !== avgProg) {
          parent.progress = avgProg;
          changed = true;
        }
        if (changed) {
          await parent.save();
          console.log(`Rolled up to parent ${parent.name} (${parent.code}): estimatedValue=${parent.estimatedValue}, progress=${parent.progress}%`);
        }
      }
    }

    console.log('Sync completed successfully');
  } catch (err) {
    console.error('Error during rollup sync:', err);
  } finally {
    await mongoose.disconnect();
  }
}

syncRollups();
