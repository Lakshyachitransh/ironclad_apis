/**
 * Predefined permissions - granular level
 * Format: resource.action
 * World-class permission system
 */

export interface PermissionDefinition {
  code: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  category: string;
}

export const PERMISSIONS: PermissionDefinition[] = [
  // User Management (20 permissions)
  {
    code: 'users.create',
    name: 'Create User',
    description: 'Create new users in the system',
    resource: 'users',
    action: 'create',
    category: 'User Management'
  },
  {
    code: 'users.read',
    name: 'View Users',
    description: 'View user list and user details',
    resource: 'users',
    action: 'read',
    category: 'User Management'
  },
  {
    code: 'users.update',
    name: 'Update User',
    description: 'Update user information and profile',
    resource: 'users',
    action: 'update',
    category: 'User Management'
  },
  {
    code: 'users.delete',
    name: 'Delete User',
    description: 'Permanently delete users from system',
    resource: 'users',
    action: 'delete',
    category: 'User Management'
  },
  {
    code: 'users.suspend',
    name: 'Suspend User',
    description: 'Suspend or deactivate user accounts',
    resource: 'users',
    action: 'suspend',
    category: 'User Management'
  },
  {
    code: 'users.export',
    name: 'Export Users',
    description: 'Export user data to CSV or other formats',
    resource: 'users',
    action: 'export',
    category: 'User Management'
  },
  {
    code: 'users.bulk-upload',
    name: 'Bulk Upload Users',
    description: 'Create multiple users via bulk upload',
    resource: 'users',
    action: 'bulk-upload',
    category: 'User Management'
  },
  {
    code: 'users.reset-password',
    name: 'Reset User Password',
    description: 'Reset or change user passwords',
    resource: 'users',
    action: 'reset-password',
    category: 'User Management'
  },

  // Role Management (15 permissions)
  {
    code: 'roles.create',
    name: 'Create Role',
    description: 'Create new custom roles',
    resource: 'roles',
    action: 'create',
    category: 'Role Management'
  },
  {
    code: 'roles.read',
    name: 'View Roles',
    description: 'View list of available roles',
    resource: 'roles',
    action: 'read',
    category: 'Role Management'
  },
  {
    code: 'roles.update',
    name: 'Update Role',
    description: 'Update role details and metadata',
    resource: 'roles',
    action: 'update',
    category: 'Role Management'
  },
  {
    code: 'roles.delete',
    name: 'Delete Role',
    description: 'Delete custom roles from system',
    resource: 'roles',
    action: 'delete',
    category: 'Role Management'
  },
  {
    code: 'roles.assign-permission',
    name: 'Assign Permissions to Role',
    description: 'Assign or remove permissions from roles',
    resource: 'roles',
    action: 'assign-permission',
    category: 'Role Management'
  },

  // Permission Management (10 permissions)
  {
    code: 'permissions.read',
    name: 'View Permissions',
    description: 'View available permissions in system',
    resource: 'permissions',
    action: 'read',
    category: 'Permission Management'
  },
  {
    code: 'permissions.create',
    name: 'Create Permission',
    description: 'Create new custom permissions',
    resource: 'permissions',
    action: 'create',
    category: 'Permission Management'
  },
  {
    code: 'permissions.update',
    name: 'Update Permission',
    description: 'Update permission details',
    resource: 'permissions',
    action: 'update',
    category: 'Permission Management'
  },
  {
    code: 'permissions.delete',
    name: 'Delete Permission',
    description: 'Delete permissions from system',
    resource: 'permissions',
    action: 'delete',
    category: 'Permission Management'
  },

  // Course Management (18 permissions)
  {
    code: 'courses.create',
    name: 'Create Course',
    description: 'Create new courses',
    resource: 'courses',
    action: 'create',
    category: 'Course Management'
  },
  {
    code: 'courses.read',
    name: 'View Courses',
    description: 'View course list and details',
    resource: 'courses',
    action: 'read',
    category: 'Course Management'
  },
  {
    code: 'courses.update',
    name: 'Update Course',
    description: 'Edit course content and settings',
    resource: 'courses',
    action: 'update',
    category: 'Course Management'
  },
  {
    code: 'courses.delete',
    name: 'Delete Course',
    description: 'Delete courses from system',
    resource: 'courses',
    action: 'delete',
    category: 'Course Management'
  },
  {
    code: 'courses.publish',
    name: 'Publish Course',
    description: 'Publish courses for learners',
    resource: 'courses',
    action: 'publish',
    category: 'Course Management'
  },
  {
    code: 'courses.assign',
    name: 'Assign Course',
    description: 'Assign courses to users or groups',
    resource: 'courses',
    action: 'assign',
    category: 'Course Management'
  },
  {
    code: 'courses.export',
    name: 'Export Course',
    description: 'Export course content and data',
    resource: 'courses',
    action: 'export',
    category: 'Course Management'
  },

  // Module & Lesson Management (14 permissions)
  {
    code: 'modules.create',
    name: 'Create Module',
    description: 'Create course modules',
    resource: 'modules',
    action: 'create',
    category: 'Content Management'
  },
  {
    code: 'modules.read',
    name: 'View Modules',
    description: 'View modules and structure',
    resource: 'modules',
    action: 'read',
    category: 'Content Management'
  },
  {
    code: 'modules.update',
    name: 'Update Module',
    description: 'Edit module content',
    resource: 'modules',
    action: 'update',
    category: 'Content Management'
  },
  {
    code: 'modules.delete',
    name: 'Delete Module',
    description: 'Delete modules',
    resource: 'modules',
    action: 'delete',
    category: 'Content Management'
  },
  {
    code: 'lessons.create',
    name: 'Create Lesson',
    description: 'Create lessons within modules',
    resource: 'lessons',
    action: 'create',
    category: 'Content Management'
  },
  {
    code: 'lessons.read',
    name: 'View Lessons',
    description: 'View lessons and content',
    resource: 'lessons',
    action: 'read',
    category: 'Content Management'
  },
  {
    code: 'lessons.update',
    name: 'Update Lesson',
    description: 'Edit lesson content',
    resource: 'lessons',
    action: 'update',
    category: 'Content Management'
  },
  {
    code: 'lessons.delete',
    name: 'Delete Lesson',
    description: 'Delete lessons',
    resource: 'lessons',
    action: 'delete',
    category: 'Content Management'
  },

  // Quiz Management (12 permissions)
  {
    code: 'quizzes.create',
    name: 'Create Quiz',
    description: 'Create quizzes and assessments',
    resource: 'quizzes',
    action: 'create',
    category: 'Assessment Management'
  },
  {
    code: 'quizzes.read',
    name: 'View Quizzes',
    description: 'View quizzes and questions',
    resource: 'quizzes',
    action: 'read',
    category: 'Assessment Management'
  },
  {
    code: 'quizzes.update',
    name: 'Update Quiz',
    description: 'Edit quiz questions and settings',
    resource: 'quizzes',
    action: 'update',
    category: 'Assessment Management'
  },
  {
    code: 'quizzes.delete',
    name: 'Delete Quiz',
    description: 'Delete quizzes',
    resource: 'quizzes',
    action: 'delete',
    category: 'Assessment Management'
  },
  {
    code: 'quizzes.generate-ai',
    name: 'Generate Quiz with AI',
    description: 'Use AI to generate quiz questions',
    resource: 'quizzes',
    action: 'generate-ai',
    category: 'Assessment Management'
  },
  {
    code: 'quizzes.publish',
    name: 'Publish Quiz',
    description: 'Publish quizzes for learners',
    resource: 'quizzes',
    action: 'publish',
    category: 'Assessment Management'
  },

  // Live Class Management (12 permissions)
  {
    code: 'live-class.create',
    name: 'Create Live Class',
    description: 'Schedule live classes',
    resource: 'live-class',
    action: 'create',
    category: 'Live Class Management'
  },
  {
    code: 'live-class.read',
    name: 'View Live Classes',
    description: 'View live class schedule',
    resource: 'live-class',
    action: 'read',
    category: 'Live Class Management'
  },
  {
    code: 'live-class.update',
    name: 'Update Live Class',
    description: 'Edit live class details',
    resource: 'live-class',
    action: 'update',
    category: 'Live Class Management'
  },
  {
    code: 'live-class.delete',
    name: 'Delete Live Class',
    description: 'Cancel live classes',
    resource: 'live-class',
    action: 'delete',
    category: 'Live Class Management'
  },
  {
    code: 'live-class.start',
    name: 'Start Live Class',
    description: 'Start live class session',
    resource: 'live-class',
    action: 'start',
    category: 'Live Class Management'
  },
  {
    code: 'live-class.record',
    name: 'Record Live Class',
    description: 'Record live class sessions',
    resource: 'live-class',
    action: 'record',
    category: 'Live Class Management'
  },

  // Tenant Management (12 permissions)
  {
    code: 'tenants.create',
    name: 'Create Tenant',
    description: 'Create new organizations/tenants',
    resource: 'tenants',
    action: 'create',
    category: 'Tenant Management'
  },
  {
    code: 'tenants.read',
    name: 'View Tenants',
    description: 'View tenant information',
    resource: 'tenants',
    action: 'read',
    category: 'Tenant Management'
  },
  {
    code: 'tenants.update',
    name: 'Update Tenant',
    description: 'Update tenant settings',
    resource: 'tenants',
    action: 'update',
    category: 'Tenant Management'
  },
  {
    code: 'tenants.delete',
    name: 'Delete Tenant',
    description: 'Delete tenants from system',
    resource: 'tenants',
    action: 'delete',
    category: 'Tenant Management'
  },
  {
    code: 'tenants.create-admin',
    name: 'Create Tenant Admin',
    description: 'Appoint tenant administrators',
    resource: 'tenants',
    action: 'create-admin',
    category: 'Tenant Management'
  },
  {
    code: 'tenants.manage-settings',
    name: 'Manage Tenant Settings',
    description: 'Configure tenant settings',
    resource: 'tenants',
    action: 'manage-settings',
    category: 'Tenant Management'
  },

  // License Management (10 permissions)
  {
    code: 'licenses.create',
    name: 'Create License',
    description: 'Create application licenses',
    resource: 'licenses',
    action: 'create',
    category: 'License Management'
  },
  {
    code: 'licenses.read',
    name: 'View Licenses',
    description: 'View license information',
    resource: 'licenses',
    action: 'read',
    category: 'License Management'
  },
  {
    code: 'licenses.update',
    name: 'Update License',
    description: 'Edit license details',
    resource: 'licenses',
    action: 'update',
    category: 'License Management'
  },
  {
    code: 'licenses.delete',
    name: 'Delete License',
    description: 'Delete licenses',
    resource: 'licenses',
    action: 'delete',
    category: 'License Management'
  },
  {
    code: 'licenses.assign',
    name: 'Assign License',
    description: 'Assign licenses to users',
    resource: 'licenses',
    action: 'assign',
    category: 'License Management'
  },

  // Reporting & Analytics (15 permissions)
  {
    code: 'reports.read',
    name: 'View Reports',
    description: 'View system and analytics reports',
    resource: 'reports',
    action: 'read',
    category: 'Reporting'
  },
  {
    code: 'reports.create',
    name: 'Create Report',
    description: 'Generate custom reports',
    resource: 'reports',
    action: 'create',
    category: 'Reporting'
  },
  {
    code: 'reports.export',
    name: 'Export Reports',
    description: 'Export reports to files',
    resource: 'reports',
    action: 'export',
    category: 'Reporting'
  },
  {
    code: 'progress.read',
    name: 'View Progress',
    description: 'View learner progress and analytics',
    resource: 'progress',
    action: 'read',
    category: 'Reporting'
  },
  {
    code: 'attendance.read',
    name: 'View Attendance',
    description: 'View attendance records',
    resource: 'attendance',
    action: 'read',
    category: 'Reporting'
  },
  {
    code: 'analytics.read',
    name: 'View Analytics',
    description: 'View advanced analytics and dashboards',
    resource: 'analytics',
    action: 'read',
    category: 'Reporting'
  },

  // Administration (18 permissions)
  {
    code: 'admin.manage',
    name: 'Manage Administration',
    description: 'Access administrative features',
    resource: 'admin',
    action: 'manage',
    category: 'Administration'
  },
  {
    code: 'admin.view-audit-logs',
    name: 'View Audit Logs',
    description: 'View system audit and activity logs',
    resource: 'admin',
    action: 'view-audit-logs',
    category: 'Administration'
  },
  {
    code: 'admin.configure-settings',
    name: 'Configure System Settings',
    description: 'Modify system settings and configurations',
    resource: 'admin',
    action: 'configure-settings',
    category: 'Administration'
  },
  {
    code: 'admin.backup-restore',
    name: 'Backup & Restore',
    description: 'Perform system backup and restore',
    resource: 'admin',
    action: 'backup-restore',
    category: 'Administration'
  },
  {
    code: 'admin.view-logs',
    name: 'View System Logs',
    description: 'View system and application logs',
    resource: 'admin',
    action: 'view-logs',
    category: 'Administration'
  },
  {
    code: 'admin.manage-notifications',
    name: 'Manage Notifications',
    description: 'Configure notifications and emails',
    resource: 'admin',
    action: 'manage-notifications',
    category: 'Administration'
  },
  {
    code: 'admin.batch-operations',
    name: 'Execute Batch Operations',
    description: 'Run batch jobs and operations',
    resource: 'admin',
    action: 'batch-operations',
    category: 'Administration'
  },

  // Content Management (10 permissions)
  {
    code: 'content.upload',
    name: 'Upload Content',
    description: 'Upload media and files',
    resource: 'content',
    action: 'upload',
    category: 'Content Management'
  },
  {
    code: 'content.delete',
    name: 'Delete Content',
    description: 'Delete uploaded content',
    resource: 'content',
    action: 'delete',
    category: 'Content Management'
  },
  {
    code: 'content.manage',
    name: 'Manage Content',
    description: 'Full content management',
    resource: 'content',
    action: 'manage',
    category: 'Content Management'
  },
];

// Group permissions by category
export const PERMISSION_CATEGORIES = {
  'User Management': PERMISSIONS.filter(p => p.category === 'User Management'),
  'Role Management': PERMISSIONS.filter(p => p.category === 'Role Management'),
  'Permission Management': PERMISSIONS.filter(p => p.category === 'Permission Management'),
  'Course Management': PERMISSIONS.filter(p => p.category === 'Course Management'),
  'Content Management': PERMISSIONS.filter(p => p.category === 'Content Management'),
  'Assessment Management': PERMISSIONS.filter(p => p.category === 'Assessment Management'),
  'Live Class Management': PERMISSIONS.filter(p => p.category === 'Live Class Management'),
  'Tenant Management': PERMISSIONS.filter(p => p.category === 'Tenant Management'),
  'License Management': PERMISSIONS.filter(p => p.category === 'License Management'),
  'Reporting': PERMISSIONS.filter(p => p.category === 'Reporting'),
  'Administration': PERMISSIONS.filter(p => p.category === 'Administration'),
};

// Predefined role-permission mappings
export const PREDEFINED_ROLE_PERMISSIONS = {
  platform_admin: PERMISSIONS.map(p => p.code), // All permissions
  tenant_admin: [
    // User Management
    'users.create', 'users.read', 'users.update', 'users.delete', 'users.suspend', 'users.export', 'users.bulk-upload', 'users.reset-password',
    // Course Management
    'courses.create', 'courses.read', 'courses.update', 'courses.delete', 'courses.publish', 'courses.assign', 'courses.export',
    // Content Management
    'modules.create', 'modules.read', 'modules.update', 'modules.delete',
    'lessons.create', 'lessons.read', 'lessons.update', 'lessons.delete',
    'content.upload', 'content.delete', 'content.manage',
    // Assessments
    'quizzes.create', 'quizzes.read', 'quizzes.update', 'quizzes.delete', 'quizzes.publish',
    // Live Class
    'live-class.create', 'live-class.read', 'live-class.update', 'live-class.delete', 'live-class.start', 'live-class.record',
    // Role Management (limited)
    'roles.read', 'roles.create', 'roles.update', 'roles.assign-permission',
    // Permissions (limited)
    'permissions.read',
    // Reports
    'reports.read', 'reports.create', 'reports.export',
    'progress.read', 'attendance.read', 'analytics.read',
    // Admin (limited)
    'admin.manage', 'admin.view-audit-logs', 'admin.manage-notifications',
  ],
  trainer: [
    'courses.read', 'courses.update',
    'modules.read', 'modules.update',
    'lessons.read', 'lessons.update',
    'content.upload', 'content.manage',
    'quizzes.read', 'quizzes.create', 'quizzes.update', 'quizzes.publish',
    'live-class.read', 'live-class.create', 'live-class.start', 'live-class.record',
    'progress.read', 'attendance.read',
    'users.read',
  ],
  instructor: [
    'courses.read',
    'modules.read',
    'lessons.read',
    'content.upload',
    'quizzes.read',
    'live-class.read', 'live-class.create', 'live-class.start',
    'progress.read',
  ],
  learner: [
    'courses.read',
    'modules.read',
    'lessons.read',
    'quizzes.read',
    'live-class.read',
    'progress.read',
  ],
};
