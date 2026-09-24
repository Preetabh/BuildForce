import mongoose from 'mongoose';
import { KeywordAlias } from '../models/KeywordAlias';
import { env } from '../config/env';

async function testKeywordAliases() {
  console.log('--- Testing KeywordAlias Model & Persistence ---');
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    const testCompanyId = new mongoose.Types.ObjectId();

    // 1. Create Keyword Alias
    const alias = new KeywordAlias({
      companyId: testCompanyId,
      keyword: '12mm Internal Plaster (12 mm 1:4)',
      clause: '13.1',
      subclause: '13.1.1',
      extra: '',
      workCategory: 'Plaster Work',
      stage: 'Finishing',
      rate: 347.05,
      unit: 'SQM',
      clauseDesc: '12 mm cement plaster of mix',
      subclauseDesc: '1:4 (1 cement: 4 fine sand)',
      isSaved: true,
    });
    await alias.save();
    console.log('✓ Created alias:', alias.keyword, alias.clause, alias.subclause);

    // 2. Query
    const found = await KeywordAlias.findOne({ _id: alias._id });
    if (!found || found.keyword !== '12mm Internal Plaster (12 mm 1:4)') {
      throw new Error('Failed to find created alias');
    }
    console.log('✓ Queried alias successfully');

    // 3. Update (Inline Edit simulation)
    found.keyword = '12mm Internal Plaster (Updated)';
    await found.save();
    console.log('✓ Updated alias inline successfully');

    // 4. Cleanup
    await KeywordAlias.deleteOne({ _id: alias._id });
    console.log('✓ Deleted test alias');

    await mongoose.disconnect();
    console.log('ALL KEYWORD ALIAS TESTS PASSED! 🎉');
  } catch (err: any) {
    console.error('Test error:', err.message);
    process.exit(1);
  }
}

testKeywordAliases();
