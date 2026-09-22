import jwt from 'jsonwebtoken';
import { env } from '../config/env';

async function test() {
  console.log('Testing GET http://localhost:5000/api/sor/schedules/hierarchy ...');
  
  // Create a valid JWT token
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

  try {
    const res = await fetch('http://localhost:5000/api/sor/schedules/hierarchy', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('HTTP Status:', res.status);
    const data = await res.json();
    console.log('Response Body:', JSON.stringify(data, null, 2));
  } catch (err: any) {
    console.error('HTTP Error:', err.message);
  }

  // Also test smart-search
  try {
    console.log('\nTesting GET http://localhost:5000/api/sor/items/smart-search?search=2.1.1 ...');
    const res = await fetch('http://localhost:5000/api/sor/items/smart-search?search=2.1.1', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('HTTP Status:', res.status);
    const data = await res.json();
    console.log('Smart Search items count:', data?.data?.length);
    console.log('First item:', data?.data?.[0]);
  } catch (err: any) {
    console.error('Smart Search HTTP Error:', err.message);
  }
}

test().catch(console.error);
