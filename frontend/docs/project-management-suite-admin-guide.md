# Project Management Suite — Admin Usage Guide

**Phase**: 7C.2  
**Suite**: Project Management  
**Version**: 1.0  
**Last Updated**: January 2026

---

## Overview

The Project Management Suite is a lightweight, practical project tracking system designed for Nigerian SMEs. It enables businesses to:

- Track projects from inception to completion
- Manage milestones, tasks, and deadlines
- Assign staff and external contributors
- Monitor project budgets (NGN-based)
- Maintain activity history and accountability

This guide covers the Admin UI features available in the `/project-management-suite` section.

---

## Getting Started

### Accessing the Suite

Navigate to:
```
/project-management-suite
```

You will see the **Dashboard** with:
- Quick navigation cards (Projects, Milestones, Tasks, Team, Budget)
- Summary statistics (Active Projects, Tasks In Progress, Overdue Tasks, Completed)
- Active project cards with progress indicators
- Due Today task list

### Demo Mode

When viewing demo data, a **"Demo Mode"** badge appears in the header. This indicates you are viewing sample Nigerian project data for demonstration purposes.

---

## Dashboard

The Dashboard provides an at-a-glance overview of all project activity:

### Key Metrics

| Metric | Description |
|--------|-------------|
| **Active Projects** | Number of projects currently in ACTIVE status |
| **Tasks In Progress** | Tasks with status IN_PROGRESS |
| **Overdue Tasks** | Tasks past their due date but not completed |
| **Completed** | Projects marked as COMPLETED this month |

### Project Health Indicators

| Color | Status | Meaning |
|-------|--------|---------|
| 🟢 Green | ON_TRACK | Project progressing as planned |
| 🟡 Yellow | AT_RISK | Potential delays or issues identified |
| 🔴 Red | DELAYED | Project is behind schedule |

---

## Projects

**Route**: `/project-management-suite/projects`

### Project List Features

- **Search**: Filter by project name, code, or category
- **Status Filter**: DRAFT, ACTIVE, ON_HOLD, COMPLETED, CANCELLED
- **Grid View**: Cards showing project summary, progress, team size

### Creating a New Project

1. Click **"New Project"** button
2. Fill in required fields:
   - Project Name
   - Category (Construction, NGO Program, Client Project, Internal, Consulting)
   - Priority (Low, Medium, High, Critical)
3. Set dates (Start Date, Target End Date)
4. Enter budget in NGN (₦)
5. Optionally add client name
6. Click **"Create Project"**

### Project Actions

From the project card menu (⋯):
- **View Details**: See full project information
- **Edit**: Modify project settings
- **Start Project**: Move DRAFT to ACTIVE (available for DRAFT projects)
- **Put on Hold**: Pause active project
- **Mark Complete**: Finish project (sets progress to 100%)
- **Delete**: Remove project (use with caution)

---

## Milestones

**Route**: `/project-management-suite/milestones`

Milestones represent major deliverables or phases within a project.

### Milestone List Features

- **Search**: Find milestones by name or project
- **Project Filter**: View milestones for specific project
- **Status Filter**: Completed, In Progress, Not Started, Overdue

### Milestone Information

Each milestone card shows:
- **Order Number**: Sequence within the project (1, 2, 3...)
- **Name & Description**: What the milestone delivers
- **Project Association**: Which project this belongs to
- **Due Date**: Target completion date
- **Progress Bar**: Tasks completed vs total tasks
- **Status Badge**: Completed (green), Overdue (red)

### Creating a Milestone

1. Click **"New Milestone"** button
2. Select the parent project
3. Enter milestone name and target date
4. Add optional description
5. Click **"Create Milestone"**

---

## Tasks

**Route**: `/project-management-suite/tasks`

Tasks are individual work items assigned to team members.

### Task Status Flow

```
TODO → IN_PROGRESS → REVIEW → DONE
         ↓
      BLOCKED (can occur at any stage)
```

### Task List Features

- **Search**: Find tasks by title, project, or assignee
- **Status Filter**: TODO, IN_PROGRESS, REVIEW, DONE, BLOCKED
- **Priority Filter**: LOW, MEDIUM, HIGH, CRITICAL

### Task Information

Each task shows:
- **Title**: What needs to be done
- **Status Badge**: Color-coded status
- **Priority Badge**: Urgency level
- **Project**: Parent project name
- **Milestone**: Associated milestone (if any)
- **Assignee**: Team member responsible
- **Due Date**: When it's expected
- **Estimated Hours**: Time budget

### Creating a Task

1. Click **"New Task"** button
2. Select the project
3. Enter task title
4. Set priority and due date
5. Optionally assign to team member
6. Add estimated hours
7. Click **"Create Task"**

### Overdue Indicators

- Tasks past due date show **"Overdue"** badge in red
- The summary bar shows total overdue and unassigned tasks

---

## Team

**Route**: `/project-management-suite/team`

Manage team members across all projects.

### Team Roles

| Role | Permissions |
|------|-------------|
| **OWNER** | Full control, can delete project |
| **MANAGER** | Manage tasks, team, budget |
| **LEAD** | Manage tasks, view budget |
| **MEMBER** | Work on assigned tasks |
| **OBSERVER** | View-only access |

### Team List Features

- **Search**: Find by name, email, or department
- **Role Filter**: Filter by team role

### Member Information

Each member card shows:
- **Avatar**: Initials circle
- **Name**: Full name
- **Department**: Organizational unit
- **Role Badge**: With icon
- **Email**: Contact address
- **Project Count**: Number of projects assigned
- **Task Stats**: Active tasks / Completed tasks

### Adding a Team Member

1. Click **"Add Member"** button
2. Select member type (Internal Staff / External)
3. Choose from HR directory or add new
4. Assign to specific projects
5. Set their role
6. Click **"Add Member"**

---

## Budget

**Route**: `/project-management-suite/budget`

Track project budgets in Nigerian Naira (₦).

### View Modes

- **By Project**: Summarized budget per project
- **All Items**: Individual budget line items

### Budget Summary Metrics

| Metric | Description |
|--------|-------------|
| **Total Budgeted** | Sum of all estimated amounts |
| **Total Spent** | Sum of actual amounts recorded |
| **Remaining** | Budgeted minus spent |
| **Budget Health** | "On Track" or "X Over" warning |

### Project Budget View

Each project card shows:
- **Project Name & Code**
- **Progress Bar**: Percentage of budget used
- **Budgeted Amount**: Estimated total (₦)
- **Spent Amount**: Actual to date (₦)
- **Remaining**: Positive = under budget, Negative = over budget

### Budget Item Categories

- Materials
- Labor
- Equipment
- Consulting
- Travel
- Communication
- Training
- Logistics
- Permits & Licenses
- Contingency
- Other

### Adding a Budget Item

1. Click **"Add Item"** button
2. Select the project
3. Choose category
4. Enter description
5. Set estimated amount (₦)
6. Optionally record actual amount if spent
7. Click **"Add Item"**

### Budget Status Badges

- **Approved** (green checkmark): Budget item approved for spending
- **Pending** (orange clock): Awaiting approval

---

## Nigeria-First Design

The suite is designed with Nigerian business context:

### Currency

- All amounts displayed in **NGN (₦)**
- Format: ₦1,000,000 (with thousands separator)
- Budget ranges typical for Nigerian SMEs: ₦100K - ₦100M

### Sample Data Categories

| Category | Nigerian Context |
|----------|------------------|
| **Construction** | Office renovation, site development |
| **NGO Program** | Donor-funded projects (Ford Foundation, etc.) |
| **Client Project** | Work for Nigerian companies (Dangote, MTN, banks) |
| **Internal** | Company improvements, audits |
| **Consulting** | Advisory engagements |

### Team Names

Demo data uses authentic Nigerian names:
- Yoruba: Tunde, Funke, Olumide
- Igbo: Chidi, Amaka, Ngozi
- Hausa: Ibrahim, Fatima, Yusuf

---

## Best Practices

### Project Setup

1. Start with a clear project name and description
2. Set realistic target dates
3. Create milestones for major deliverables
4. Assign an owner immediately

### Task Management

1. Keep tasks small (2-8 hours estimated)
2. Assign tasks to specific team members
3. Update status regularly
4. Mark blocked tasks with reason

### Budget Tracking

1. Create budget items before spending
2. Get approval before procurement
3. Record actual amounts as soon as spent
4. Monitor variance weekly

### Team Coordination

1. Assign clear roles at project start
2. Use Owner/Manager for accountability
3. Add external consultants as needed
4. Review team capacity before new projects

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Cannot see projects | Check tenant access and filter settings |
| Task not appearing | Verify project and milestone selection |
| Budget shows incorrect | Ensure all items have estimated amounts |
| Team member missing | Add them through Team page first |

### Support

For technical issues, contact your system administrator or refer to the WebWaka support documentation.

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 2026 | Initial release with S5 Admin UI |

---

*This documentation is part of the WebWaka Project Management Suite (Phase 7C.2)*
