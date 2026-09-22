import jwt from 'jsonwebtoken';
import { createApp } from '../app';
import { env } from '../config/env';
import { connectDatabase } from '../config/db';
import mongoose from 'mongoose';

async function testApp() {
  await connectDatabase();
  const app = createApp();

  const token = jwt.sign(
    {
      userId: '6aae1e4dca306ed48ca9ce8c',
      companyId: '6aae1e4dca306ed48ca9ce8b',
      role: 'ADMIN',
      email: 'admin@buildforce.com',
      name: 'Admin User',
    },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  const server = app.listen(5001, async () => {
    console.log('Test Server listening on port 5001');

    try {
      const res = await fetch('http://localhost:5001/api/sor/schedules/hierarchy', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Direct App Test HTTP Status:', res.status);
      const data = await res.json();
      console.log('Direct App Test Response:', JSON.stringify(data, null, 2));
    } catch (err: any) {
      console.error('Direct App Test Error:', err);
    } finally {
      server.close();
      await mongoose.disconnect();
    }
  });
}

testApp().catch(console.error);
