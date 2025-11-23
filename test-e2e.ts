/**
 * End-to-End Testing Script
 * 
 * Complete workflow:
 * 1. Create a new tenant
 * 2. Create 10 users and add them to the tenant
 * 3. Create a course with modules and lessons
 * 4. Assign course to users
 * 5. Simulate users watching lessons and check progress
 * 
 * Run: npx ts-node test-e2e.ts
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

interface TestData {
  tenant?: {
    id: string;
    name: string;
  };
  admin?: {
    id: string;
    email: string;
    token: string;
    tenantId: string;
  };
  users: Array<{
    id: string;
    email: string;
    token: string;
    tenantId: string;
  }>;
  course?: {
    id: string;
    title: string;
    modules: Array<{
      id: string;
      title: string;
      lessons: Array<{
        id: string;
        title: string;
        videoDuration: number;
      }>;
    }>;
  };
}

const testData: TestData = {
  users: []
};

// Helper functions
function log(section: string, message: string, type: 'info' | 'success' | 'error' | 'step' = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const color = type === 'success' ? colors.green : type === 'error' ? colors.red : type === 'step' ? colors.cyan : colors.blue;
  const symbol = type === 'success' ? '✓' : type === 'error' ? '✗' : type === 'step' ? '→' : 'ℹ';
  console.log(`${colors.bright}${color}[${symbol} ${section}]${colors.reset} ${message} ${colors.yellow}(${timestamp})${colors.reset}`);
}

function logHeader(title: string) {
  console.log(`\n${colors.bright}${colors.magenta}${'='.repeat(80)}${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}${title.padStart(Math.floor(title.length + (80 - title.length) / 2))}${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}${'='.repeat(80)}${colors.reset}\n`);
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// PHASE 1: CREATE TENANT & ADMIN USER
// ============================================================================

async function phase1CreateTenant() {
  logHeader('PHASE 1: CREATE TENANT & ADMIN USER');

  try {
    // Create tenant
    log('TENANT', 'Creating new tenant...');
    const tenantRes = await axios.post(
      `${API_BASE_URL}/tenants`,
      { name: `e2e-test-${Date.now()}` }
    );
    testData.tenant = tenantRes.data;
    log('TENANT', `Created tenant: ${testData.tenant?.name} (ID: ${testData.tenant?.id})`, 'success');

    // Create admin user
    log('AUTH', 'Creating admin user...');
    const adminEmail = `admin-e2e-${Date.now()}@test.com`;
    const adminPassword = 'Admin123!@#';

    try {
      await axios.post(`${API_BASE_URL}/auth/register`, {
        email: adminEmail,
        password: adminPassword,
        displayName: 'E2E Admin'
      });
      log('AUTH', `Admin user registered: ${adminEmail}`, 'success');
    } catch (err: any) {
      if (err.response?.status === 409) {
        log('AUTH', 'Admin user already exists', 'info');
      }
    }

    // Login admin
    const adminLoginRes = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: adminEmail,
      password: adminPassword
    });

    testData.admin = {
      id: adminLoginRes.data.userId,
      email: adminEmail,
      token: adminLoginRes.data.accessToken,
      tenantId: adminLoginRes.data.tenantId
    };

    log('AUTH', `Admin logged in successfully`, 'success');

    // Assign admin role to user in tenant
    log('TENANT', 'Assigning admin role to user...');
    await axios.post(
      `${API_BASE_URL}/users/${testData.admin.id}/add-to-tenant`,
      {
        tenantId: testData.tenant?.id,
        roles: ['superadmin', 'training_manager', 'org_admin']
      },
      { headers: { Authorization: `Bearer ${testData.admin.token}` } }
    );
    log('TENANT', 'Admin roles assigned', 'success');

  } catch (error: any) {
    log('ERROR', `Failed: ${error.response?.data?.message || error.message}`, 'error');
    throw error;
  }
}

// ============================================================================
// PHASE 2: CREATE 10 USERS
// ============================================================================

async function phase2CreateUsers() {
  logHeader('PHASE 2: CREATE 10 USERS');

  try {
    for (let i = 1; i <= 10; i++) {
      const userEmail = `user${i}-e2e-${Date.now()}@test.com`;
      const userPassword = `User${i}123!@#`;

      // Register
      log('USERS', `[${i}/10] Registering user${i}...`);
      try {
        await axios.post(`${API_BASE_URL}/auth/register`, {
          email: userEmail,
          password: userPassword,
          displayName: `E2E Test User ${i}`
        });
      } catch (err: any) {
        if (err.response?.status !== 409) throw err;
      }

      // Login
      const loginRes = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: userEmail,
        password: userPassword
      });

      const user = {
        id: loginRes.data.userId,
        email: userEmail,
        token: loginRes.data.accessToken,
        tenantId: loginRes.data.tenantId
      };

      // Add to test tenant
      await axios.post(
        `${API_BASE_URL}/users/${user.id}/add-to-tenant`,
        {
          tenantId: testData.tenant?.id,
          roles: ['learner']
        },
        { headers: { Authorization: `Bearer ${testData.admin?.token}` } }
      );

      testData.users.push(user);
      log('USERS', `[${i}/10] User${i} created and added to tenant`, 'success');
      await sleep(100); // Small delay to avoid rate limiting
    }

    log('USERS', `All 10 users created successfully!`, 'success');

  } catch (error: any) {
    log('ERROR', `Failed: ${error.response?.data?.message || error.message}`, 'error');
    throw error;
  }
}

// ============================================================================
// PHASE 3: CREATE COURSE WITH MODULES & LESSONS
// ============================================================================

async function phase3CreateCourse() {
  logHeader('PHASE 3: CREATE COURSE WITH MODULES & LESSONS');

  try {
    // Create course
    log('COURSE', 'Creating course...');
    const courseRes = await axios.post(
      `${API_BASE_URL}/courses`,
      {
        tenantId: testData.tenant?.id,
        title: 'Advanced JavaScript - E2E Test',
        summary: 'Complete guide to advanced JavaScript concepts',
        level: 'Advanced',
        ownerUserId: testData.admin?.id
      },
      { headers: { Authorization: `Bearer ${testData.admin?.token}` } }
    );

    testData.course = courseRes.data;
    log('COURSE', `Course created: ${testData.course?.title} (ID: ${testData.course?.id})`, 'success');

    // Create modules
    const modules: typeof testData.course.modules = [];

    for (let m = 1; m <= 2; m++) {
      log('MODULE', `Creating Module ${m}...`);
      const moduleRes = await axios.post(
        `${API_BASE_URL}/courses/modules/create`,
        {
          courseId: testData.course?.id,
          title: `Module ${m}: ${m === 1 ? 'Basics' : 'Advanced Topics'}`,
          description: `${m === 1 ? 'Learn the fundamentals' : 'Deep dive into advanced concepts'}`,
          displayOrder: m
        },
        { headers: { Authorization: `Bearer ${testData.admin?.token}` } }
      );

      const moduleData = {
        id: moduleRes.data.id,
        title: moduleRes.data.title,
        lessons: [] as typeof testData.course.modules[0].lessons
      };

      // Create lessons for each module
      for (let l = 1; l <= 3; l++) {
        log('LESSON', `  Creating Lesson ${l} in Module ${m}...`);
        const lessonRes = await axios.post(
          `${API_BASE_URL}/courses/lessons/create`,
          {
            moduleId: moduleData.id,
            title: `Lesson ${l}: ${['Introduction', 'Core Concepts', 'Advanced Techniques'][l - 1]}`,
            description: `Deep dive into ${['basics', 'intermediate', 'advanced'][l - 1]} concepts`,
            displayOrder: l
          },
          { headers: { Authorization: `Bearer ${testData.admin?.token}` } }
        );

        moduleData.lessons.push({
          id: lessonRes.data.id,
          title: lessonRes.data.title,
          videoDuration: 3600 + (l * 600) // 60 min + 10 min per lesson
        });

        log('LESSON', `    Lesson created: ${lessonRes.data.title}`, 'success');
      }

      modules.push(moduleData);
      log('MODULE', `Module ${m} completed with 3 lessons`, 'success');
    }

    if (testData.course) {
      testData.course.modules = modules;
    }

    log('COURSE', `Course structure complete: 2 modules × 3 lessons = 6 lessons total`, 'success');

  } catch (error: any) {
    log('ERROR', `Failed: ${error.response?.data?.message || error.message}`, 'error');
    throw error;
  }
}

// ============================================================================
// PHASE 4: ASSIGN COURSE TO USERS
// ============================================================================

async function phase4AssignCourse() {
  logHeader('PHASE 4: ASSIGN COURSE TO USERS');

  try {
    const userIds = testData.users.map(u => u.id);

    log('ASSIGNMENT', `Assigning course to ${userIds.length} users...`);

    const assignRes = await axios.post(
      `${API_BASE_URL}/courses/assign`,
      {
        tenantId: testData.tenant?.id,
        courseId: testData.course?.id,
        assignToUserIds: userIds,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      },
      { headers: { Authorization: `Bearer ${testData.admin?.token}` } }
    );

    log('ASSIGNMENT', `Course assigned to all users`, 'success');
    log('ASSIGNMENT', `Assignment ID: ${assignRes.data.results[0]?.assignmentId}`, 'info');

    // Show assignment summary
    const assigned = assignRes.data.results.filter((r: any) => r.status === 'assigned').length;
    const alreadyAssigned = assignRes.data.results.filter((r: any) => r.status === 'already_assigned').length;

    log('ASSIGNMENT', `Summary: ${assigned} newly assigned, ${alreadyAssigned} already assigned`, 'success');

  } catch (error: any) {
    log('ERROR', `Failed: ${error.response?.data?.message || error.message}`, 'error');
    throw error;
  }
}

// ============================================================================
// PHASE 5: SIMULATE USER PROGRESS (DIFFERENT COMPLETION LEVELS)
// ============================================================================

async function phase5SimulateProgress() {
  logHeader('PHASE 5: SIMULATE USER PROGRESS');

  try {
    // Distribute users across different progress levels
    const progressLevels = [
      { range: [0, 2], name: 'Not Started', progress: 0 },
      { range: [3, 4], name: 'Started (25%)', progress: 0.25 },
      { range: [5, 7], name: 'In Progress (50%)', progress: 0.50 },
      { range: [8, 9], name: 'Almost Complete (90%)', progress: 0.90 }
    ];

    for (const level of progressLevels) {
      const [start, end] = level.range;
      for (let i = start; i <= end; i++) {
        const user = testData.users[i];
        const totalLessons = 6;
        const lessonsToComplete = Math.round(totalLessons * level.progress);

        log('PROGRESS', `User ${i + 1}: Simulating ${level.name} (${lessonsToComplete}/${totalLessons} lessons)`);

        // Process each lesson
        let lessonCount = 0;
        for (const module of testData.course?.modules || []) {
          for (const lesson of module.lessons) {
            if (lessonCount < lessonsToComplete) {
              // Complete the lesson
              const isLastLesson = lessonCount === lessonsToComplete - 1;
              const watchedDuration = isLastLesson ? lesson.videoDuration : Math.random() * lesson.videoDuration;

              await axios.post(
                `${API_BASE_URL}/courses/lessons/${lesson.id}/progress`,
                {
                  watchedDuration: Math.round(watchedDuration),
                  isCompleted: isLastLesson && watchedDuration >= lesson.videoDuration * 0.9
                },
                { headers: { Authorization: `Bearer ${user.token}` } }
              );

              log('PROGRESS', `  Lesson ${lessonCount + 1}: ${watchedDuration >= lesson.videoDuration * 0.9 ? 'COMPLETED' : 'IN PROGRESS'}`, 'success');
              lessonCount++;
            }
          }
        }

        log('PROGRESS', `User ${i + 1}: Progress simulated successfully\n`);
      }
    }

  } catch (error: any) {
    log('ERROR', `Failed: ${error.response?.data?.message || error.message}`, 'error');
    throw error;
  }
}

// ============================================================================
// PHASE 6: CHECK USER PROGRESS
// ============================================================================

async function phase6CheckProgress() {
  logHeader('PHASE 6: CHECK USER PROGRESS');

  try {
    log('PROGRESS', 'Retrieving progress for all users...\n');

    for (let i = 0; i < testData.users.length; i++) {
      const user = testData.users[i];

      try {
        const progressRes = await axios.get(
          `${API_BASE_URL}/courses/progress/${testData.course?.id}`,
          { headers: { Authorization: `Bearer ${user.token}` } }
        );

        const progress = progressRes.data.overallProgress;
        const assignment = progressRes.data.assignment;

        const progressBar = createProgressBar(progress.progressPercentage);

        log('PROGRESS', `User ${i + 1}: ${user.email.split('@')[0]}`);
        console.log(`${colors.cyan}           Status: ${progress.status.toUpperCase()}${colors.reset}`);
        console.log(`${colors.cyan}           Progress: ${progressBar} ${progress.progressPercentage}%${colors.reset}`);
        console.log(`${colors.cyan}           Lessons: ${progress.lessonsCompleted}/${progress.lessonsTotal}${colors.reset}`);
        console.log(`${colors.cyan}           Started: ${progress.startedAt ? new Date(progress.startedAt).toLocaleDateString() : 'Not started'}${colors.reset}`);
        if (assignment.dueDate) {
          const daysLeft = Math.ceil((new Date(assignment.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          console.log(`${colors.cyan}           Due: ${new Date(assignment.dueDate).toLocaleDateString()} (${daysLeft} days left)${colors.reset}`);
        }
        console.log('');
      } catch (err: any) {
        log('PROGRESS', `User ${i + 1}: Error retrieving progress - ${err.response?.status}`, 'error');
      }

      await sleep(100);
    }

  } catch (error: any) {
    log('ERROR', `Failed: ${error.response?.data?.message || error.message}`, 'error');
    throw error;
  }
}

// ============================================================================
// PHASE 7: CHECK TENANT STATISTICS
// ============================================================================

async function phase7CheckTenantStats() {
  logHeader('PHASE 7: CHECK TENANT STATISTICS');

  try {
    log('STATS', 'Retrieving tenant-wide statistics...');

    const statsRes = await axios.get(
      `${API_BASE_URL}/courses/tenant-stats`,
      { headers: { Authorization: `Bearer ${testData.admin?.token}` } }
    );

    const stats = statsRes.data;

    console.log(`\n${colors.bright}${colors.green}=== TENANT STATISTICS ===${colors.reset}\n`);
    console.log(`${colors.cyan}Total Courses:        ${colors.bright}${stats.totalCourses}${colors.reset}`);
    console.log(`${colors.cyan}Total Assignments:   ${colors.bright}${stats.totalAssignments}${colors.reset}`);
    console.log(`${colors.cyan}Total Users:         ${colors.bright}${stats.totalUsers}${colors.reset}`);
    console.log(`${colors.cyan}Average Progress:    ${colors.bright}${stats.averageProgress}%${colors.reset}`);
    console.log(`${colors.cyan}Overdue:             ${colors.bright}${stats.overdueAssignments}${colors.reset}`);

    console.log(`\n${colors.bright}${colors.yellow}Progress Distribution:${colors.reset}`);
    console.log(`${colors.cyan}  Not Started:       ${colors.bright}${stats.userProgressByStatus.not_started || 0}${colors.reset}`);
    console.log(`${colors.cyan}  In Progress:       ${colors.bright}${stats.userProgressByStatus.in_progress || 0}${colors.reset}`);
    console.log(`${colors.cyan}  Completed:         ${colors.bright}${stats.userProgressByStatus.completed || 0}${colors.reset}\n`);

    log('STATS', 'Statistics retrieved successfully', 'success');

  } catch (error: any) {
    log('ERROR', `Failed: ${error.response?.data?.message || error.message}`, 'error');
    throw error;
  }
}

// ============================================================================
// PHASE 8: CHECK MY COURSES (USER VIEW)
// ============================================================================

async function phase8CheckMyCourses() {
  logHeader('PHASE 8: CHECK MY COURSES (USER VIEW)');

  try {
    log('COURSES', 'Checking "My Courses" for each user...\n');

    for (let i = 0; i < Math.min(3, testData.users.length); i++) {
      const user = testData.users[i];

      const coursesRes = await axios.get(
        `${API_BASE_URL}/courses/my-courses`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      const courses = coursesRes.data;

      log('COURSES', `User ${i + 1} Assigned Courses: ${courses.length}`);
      courses.forEach((course: any, idx: number) => {
        const progressBar = createProgressBar(course.progress.progressPercentage);
        console.log(`${colors.cyan}  [${idx + 1}] ${course.course.title}${colors.reset}`);
        console.log(`${colors.cyan}      ${progressBar} ${course.progress.progressPercentage}% (${course.progress.lessonsCompleted}/${course.progress.lessonsTotal})${colors.reset}`);
        console.log(`${colors.cyan}      Status: ${course.progress.status}${colors.reset}`);
        if (course.dueDate) {
          console.log(`${colors.cyan}      Due: ${new Date(course.dueDate).toLocaleDateString()}${colors.reset}`);
        }
      });
      console.log('');
    }

    log('COURSES', 'My Courses check completed', 'success');

  } catch (error: any) {
    log('ERROR', `Failed: ${error.response?.data?.message || error.message}`, 'error');
    throw error;
  }
}

// ============================================================================
// HELPER: CREATE PROGRESS BAR
// ============================================================================

function createProgressBar(percentage: number, width: number = 20): string {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);

  if (percentage >= 75) return `${colors.green}${bar}${colors.reset}`;
  if (percentage >= 50) return `${colors.yellow}${bar}${colors.reset}`;
  if (percentage >= 25) return `${colors.yellow}${bar}${colors.reset}`;
  return `${colors.blue}${bar}${colors.reset}`;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  logHeader('END-TO-END TESTING - COURSE ASSIGNMENT & PROGRESS TRACKING');

  try {
    console.log(`${colors.bright}${colors.yellow}Starting comprehensive E2E test...${colors.reset}\n`);

    await phase1CreateTenant();
    await sleep(500);

    await phase2CreateUsers();
    await sleep(500);

    await phase3CreateCourse();
    await sleep(500);

    await phase4AssignCourse();
    await sleep(500);

    await phase5SimulateProgress();
    await sleep(500);

    await phase6CheckProgress();
    await sleep(500);

    await phase7CheckTenantStats();
    await sleep(500);

    await phase8CheckMyCourses();

    logHeader('✓ ALL TESTS COMPLETED SUCCESSFULLY');

    console.log(`${colors.bright}${colors.green}Test Summary:${colors.reset}`);
    console.log(`${colors.cyan}  Tenant ID:        ${testData.tenant?.id}${colors.reset}`);
    console.log(`${colors.cyan}  Course ID:        ${testData.course?.id}${colors.reset}`);
    console.log(`${colors.cyan}  Users Created:    ${testData.users.length}${colors.reset}`);
    console.log(`${colors.cyan}  Lessons Created:  ${testData.course?.modules.reduce((sum, m) => sum + m.lessons.length, 0)}${colors.reset}`);
    console.log(`${colors.cyan}  Progress Tracked: ✓${colors.reset}\n`);

  } catch (error) {
    logHeader('✗ TEST FAILED');
    console.error(`${colors.bright}${colors.bright}\nFatal Error: ${error}${colors.reset}\n`);
    process.exit(1);
  }
}

main();
