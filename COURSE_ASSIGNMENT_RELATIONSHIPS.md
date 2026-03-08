# Course Assignment Table Relationships

This document explains how the main tables interact in the database when a user is assigned a course, and provides the definition of each relevant table.

## Table Relationships Diagram

```
erDiagram
  USER ||--o{ COURSE_ASSIGNMENT : "has"
  COURSE ||--o{ COURSE_ASSIGNMENT : "assigned in"
  TENANT ||--o{ COURSE_ASSIGNMENT : "has"
  COURSE_ASSIGNMENT ||--o{ USER_PROGRESS : "creates"
  USER {
    string id
    string email
    ...
  }
  COURSE {
    string id
    string title
    ...
  }
  TENANT {
    string id
    ...
  }
  COURSE_ASSIGNMENT {
    string id
    string tenantId
    string courseId
    string tenantUserId
    string assignedBy
    date dueDate
    ...
  }
  USER_PROGRESS {
    string id
    string userId
    string courseAssignmentId
    ...
  }
```

## Table Definitions

### User
Represents a user in the system.
```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  // ...other fields (e.g., name, profileImage)
  courseAssignments CourseAssignment[]
  userProgress      UserProgress[]
}
```

### Course
Represents a course that can be assigned to users.
```prisma
model Course {
  id           String   @id @default(uuid())
  title        String
  // ...other fields (e.g., description, image)
  courseAssignments CourseAssignment[]
}
```

### Tenant
Represents a tenant (for multi-tenant systems).
```prisma
model Tenant {
  id           String   @id @default(uuid())
  // ...other fields
  courseAssignments CourseAssignment[]
}
```

### CourseAssignment
Represents the assignment of a course to a user.
```prisma
model CourseAssignment {
  id           String   @id @default(uuid())
  tenantId     String
  courseId     String
  tenantUserId String
  assignedBy   String
  dueDate      DateTime?
  status       String
  assignedAt   DateTime
  createdAt    DateTime
  updatedAt    DateTime
  // ...other fields
  tenant       Tenant   @relation(fields: [tenantId], references: [id])
  course       Course   @relation(fields: [courseId], references: [id])
  user         User     @relation(fields: [tenantUserId], references: [id])
  userProgress UserProgress[]
}
```

### UserProgress
Tracks a user's progress in an assigned course.
```prisma
model UserProgress {
  id                 String   @id @default(uuid())
  userId             String
  courseAssignmentId String
  // ...other fields (e.g., lessonsCompleted, progressPercentage)
  user               User     @relation(fields: [userId], references: [id])
  courseAssignment   CourseAssignment @relation(fields: [courseAssignmentId], references: [id])
}
```

---

**Summary:**
- When a user is assigned a course, a `CourseAssignment` record is created linking the user, course, and tenant.
- A `UserProgress` record is also created to track the user's progress in the assigned course.
- The relationships ensure referential integrity and allow easy querying of assignments and progress.
