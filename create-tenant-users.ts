import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:3000';
const PLATFORM_ADMIN_EMAIL = process.env.PLATFORM_ADMIN_EMAIL || 'admin@ironclad.local';
const PLATFORM_ADMIN_PASSWORD = process.env.PLATFORM_ADMIN_PASSWORD || 'Admin@123456';

interface CreateUserResponse {
  id: string;
  email: string;
  displayName: string;
  tenantName: string;
  roles: string[];
}

async function createTenantUsers() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║    Creating Tenant Users with Platform Admin                   ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // Step 1: Login as platform admin
    console.log('🔐 Logging in as platform admin...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: PLATFORM_ADMIN_EMAIL,
      password: PLATFORM_ADMIN_PASSWORD
    });

    const accessToken = loginRes.data.access_token;
    console.log('✅ Login successful\n');

    // Step 2: Create users for Airtel tenant
    const tenantName = 'Airtel';
    const users = [
      { email: 'learner1@airtel.com', displayName: 'Learner 1', roles: ['learner'] },
      { email: 'learner2@airtel.com', displayName: 'Learner 2', roles: ['learner'] },
      { email: 'trainer1@airtel.com', displayName: 'Trainer 1', roles: ['trainer', 'learner'] },
      { email: 'admin@airtel.com', displayName: 'Airtel Admin', roles: ['admin', 'trainer'] },
    ];

    console.log(`📝 Creating ${users.length} users for "${tenantName}" tenant:\n`);

    const createdUsers: CreateUserResponse[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (const user of users) {
      try {
        const tempPassword = `TempPass${Math.random().toString(36).substring(2, 10)}!`;
        
        const createRes = await axios.post(
          `${API_URL}/users`,
          {
            email: user.email,
            password: tempPassword,
            displayName: user.displayName,
            tenantName: tenantName,
            roles: user.roles
          },
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        createdUsers.push(createRes.data);
        successCount++;
        console.log(`✅ ${user.email} - Created (ID: ${createRes.data.id})`);
      } catch (error: any) {
        failureCount++;
        const errorMsg = error.response?.data?.message || error.message;
        console.log(`❌ ${user.email} - Failed: ${errorMsg}`);
      }
    }

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                         RESULTS                                ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log(`📊 Summary:`);
    console.log(`  • Total Users: ${users.length}`);
    console.log(`  • Successful: ${successCount}`);
    console.log(`  • Failed: ${failureCount}\n`);

    if (createdUsers.length > 0) {
      console.log('✅ Created Users:\n');
      console.table(createdUsers.map(u => ({
        Email: u.email,
        'Display Name': u.displayName,
        'Tenant': u.tenantName,
        'Roles': u.roles.join(', '),
        'User ID': u.id
      })));
    }

    // Step 3: Display the user IDs for course assignment
    console.log('\n📋 User IDs for Course Assignment:\n');
    console.log('Use these IDs in the assignToUserIds array:\n');
    const userIds = createdUsers.map(u => u.id);
    console.log(JSON.stringify(userIds, null, 2));

  } catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

createTenantUsers();
