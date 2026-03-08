# Backend API Documentation for Frontend Team

This document summarizes the main backend API endpoints, authentication, and data models to help the frontend team build and integrate the UI with the backend.

---

## Authentication
- **Register:** `POST /auth/register`
  - Request: `{ email, password, displayName? }`
  - Response: `{ user, access_token, refresh_token }`
- **Login:** `POST /auth/login`
  - Request: `{ email, password }`
  - Response: `{ user, access_token, refresh_token }`
- **JWT Bearer Auth:**
  - All protected endpoints require `Authorization: Bearer <access_token>`

---

## Users
- **Create User:** `POST /users` (tenant admin only)
  - Request: `{ email, password, displayName, tenantName }`
  - Response: Created user object
- **Delete User:** `DELETE /users/:id` (tenant admin only)
- **Get User Info:** `GET /users/me`

---

## Courses
- **Create Course:** `POST /courses` (requires `courses.create` permission)
  - Request: `{ title, summary, level, ... }`
  - Response: Course object
- **List Courses:** `GET /courses`
- **Assign Course:** `POST /courses/assign` (manager only)
- **Upload Course Video:** `POST /courses/:id/upload-video`

---

## AI Tutor
- **Ask Question:** `POST /ai-tutor/ask-question`
  - Request: `{ question, context? }`
  - Response: `{ answer }`
- **Generate Exercise:** `POST /ai-tutor/generate-exercise`
- **Review Code Submission:** `POST /ai-tutor/review-code`

---

## Live Classes
- **Create Live Class:** `POST /live-classes` (requires permission)
- **List Live Classes:** `GET /live-classes`
- **Track Attendance:** `POST /live-classes/:id/attendance`

---

## General Notes
- All endpoints (except `/auth/*`) require JWT Bearer authentication.
- Roles: `platform_admin`, `tenant_admin`, `training_manager`, `learner`, etc.
- Tenancy: Platform admins can access all tenants; others are restricted to their tenant.
- Permissions are enforced via guards and decorators (e.g., `@RequirePermission('courses.create')`).
- Most endpoints return standard REST responses (201 for create, 200 for get, 400/401 for errors).

---

## Example Request (Authenticated)
```http
GET /courses
Authorization: Bearer <access_token>
```

---

## Predefined Permissions

Below is the complete list of predefined permissions available in the backend. Each permission has a code, name, and description. These are used for role-based access control and should be referenced when building permission-based UI or workflows.

| Code | Name | Description |
|------|------|-------------|
| users.create | Create User | Create new users in the system |
| users.read | View Users | View user list and user details |
| users.update | Update User | Update user information and profile |
| users.delete | Delete User | Permanently delete users from system |
| users.suspend | Suspend User | Suspend or deactivate user accounts |
| users.export | Export Users | Export user data to CSV or other formats |
| users.bulk-upload | Bulk Upload Users | Create multiple users via bulk upload |
| users.reset-password | Reset User Password | Reset or change user passwords |
| roles.create | Create Role | Create new custom roles |
| roles.read | View Roles | View list of available roles |
| roles.update | Update Role | Update role details and metadata |
| roles.delete | Delete Role | Delete custom roles from system |
| roles.assign-permission | Assign Permissions to Role | Assign or remove permissions from roles |
| permissions.read | View Permissions | View available permissions in system |
| permissions.create | Create Permission | Create new custom permissions |
| permissions.update | Update Permission | Update permission details |
| permissions.delete | Delete Permission | Delete permissions from system |
| courses.create | Create Course | Create new courses |
| courses.read | View Courses | View course list and details |
| courses.update | Update Course | Edit course content and settings |
| courses.delete | Delete Course | Delete courses from system |
| courses.publish | Publish Course | Publish courses for learners |
| courses.assign | Assign Course | Assign courses to users or groups |
| courses.export | Export Course | Export course content and data |
| modules.create | Create Module | Create course modules |
| modules.read | View Modules | View modules and structure |
| modules.update | Update Module | Edit module content |
| modules.delete | Delete Module | Delete modules |
| lessons.create | Create Lesson | Create lessons within modules |
| lessons.read | View Lessons | View lessons and content |
| lessons.update | Update Lesson | Edit lesson content |
| lessons.delete | Delete Lesson | Delete lessons |
| quizzes.create | Create Quiz | Create quizzes and assessments |
| quizzes.read | View Quizzes | View quizzes and questions |
| quizzes.update | Update Quiz | Edit quiz questions and settings |
| quizzes.delete | Delete Quiz | Delete quizzes |
| quizzes.generate-ai | Generate Quiz with AI | Use AI to generate quiz questions |
| quizzes.publish | Publish Quiz | Publish quizzes for learners |
| live-class.create | Create Live Class | Schedule live classes |
| live-class.read | View Live Classes | View live class schedule |
| live-class.update | Update Live Class | Edit live class details |
| live-class.delete | Delete Live Class | Cancel live classes |
| live-class.start | Start Live Class | Start live class session |
| live-class.record | Record Live Class | Record live class sessions |
| tenants.create | Create Tenant | Create new organizations/tenants |
| tenants.read | View Tenants | View tenant information |
| tenants.update | Update Tenant | Update tenant settings |
| tenants.delete | Delete Tenant | Delete tenants from system |
| tenants.manage-settings | Manage Tenant Settings | Configure tenant settings |
| licenses.create | Create License | Create application licenses |
| licenses.read | View Licenses | View license information |
| licenses.update | Update License | Edit license details |
| licenses.delete | Delete License | Delete licenses |
| licenses.assign | Assign License | Assign licenses to users |
| reports.read | View Reports | View system and analytics reports |
| reports.create | Create Report | Generate custom reports |
| reports.export | Export Reports | Export reports to files |
| progress.read | View Progress | View learner progress and analytics |
| attendance.read | View Attendance | View attendance records |
| analytics.read | View Analytics | View advanced analytics and dashboards |
| admin.manage | Manage Administration | Access administrative features |
| admin.view-audit-logs | View Audit Logs | View system audit and activity logs |
| admin.configure-settings | Configure System Settings | Modify system settings and configurations |
| admin.backup-restore | Backup & Restore | Perform system backup and restore |
| admin.view-logs | View System Logs | View system and application logs |
| admin.manage-notifications | Manage Notifications | Configure notifications and emails |
| admin.batch-operations | Execute Batch Operations | Run batch jobs and operations |
| content.upload | Upload Content | Upload media and files |
| content.delete | Delete Content | Delete uploaded content |
| content.manage | Manage Content | Full content management |

---

For detailed request/response schemas, refer to the backend Swagger docs or ask the backend team for specific DTOs.
