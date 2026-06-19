# Payroll Management System - Backend Development Rulebook v1

---

# 1. Technology Stack

## Backend

* Node.js
* Express.js

## Database

* PostgreSQL

## ORM

* Sequelize

## Authentication

* JWT
* Access Token
* Refresh Token

## Validation

* Joi

## Logging

* Winston

## Scheduler

* Node Cron

## Database IDs

* UUID

## File Storage

* uploads/ (Phase 1)
* AWS S3 (Future)

## Report Generation

* ExcelJS
* PDFKit

---

# 2. Folder Structure

```text
src/

config/
database/
middlewares/
utils/

modules/

auth/

company/
employee/
kyc/
contractor/
address/

packing-wages/
bidi-roller-wages/
professional-tax/
office-salary/
challan-setup/

office-entry/
packer-entry/
bidi-entry/
challan-entry/
resignation/

salary-sheet/
ecr-report/
esic-report/
pf-report/
bonus/
gratuity/

calendar/
user-management/
import-export/
backup/
restore/

audit/
notifications/

uploads/
logs/

app.js
server.js
```

---

# 3. Environment Variables

```env
PORT=

DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

UPLOAD_PATH=
```

---

# 4. Universal API Response Structure

## Success

```json
{
  "status": true,
  "code": "EMPLOYEE_CREATED",
  "message": "Employee created successfully",
  "messageToShow": "Employee created successfully",
  "data": {}
}
```

## Error

```json
{
  "status": false,
  "code": "EMPLOYEE_NOT_FOUND",
  "message": "Employee record not found",
  "messageToShow": "Employee not found",
  "data": null
}
```

## Rules

* status → Frontend checking
* code → Frontend business logic
* message → Developer debugging
* messageToShow → User display message
* data → Response payload

---

# 5. Database Standards

Every table must contain:

```sql
id UUID PRIMARY KEY

created_at
updated_at

created_by
updated_by

deleted_at
deleted_by

is_deleted BOOLEAN DEFAULT FALSE
```

---

# 6. Company Isolation Rule

Every transactional table must contain:

```sql
company_id UUID NOT NULL
```

Every query must filter:

```sql
WHERE company_id = loggedInUser.company_id
```

No user should access another company's payroll data.

---

# 7. Authentication Module

## Login Only

### Input

```text
user_id
password
company_id
```

### Flow

```text
Request
↓
Joi Validation
↓
Find User
↓
Verify Password
↓
Generate Access Token
↓
Generate Refresh Token
↓
Store Refresh Token
↓
Create Login Audit Log
↓
Return Response
```

---

# 8. Password Security

Never store passwords directly.

Use bcrypt.

### Registration

```text
Password
↓
Hash + Salt
↓
Store Hash
```

### Login

```text
Password
↓
bcrypt.compare()
↓
Match
```

### bcrypt rounds

```text
10
```

---

# 9. Access Token

## Purpose

Authorize APIs

## Expiry

```text
15 Minutes
```

## Stored

```text
Frontend Memory
```

## Contains

```json
{
  "user_id": "",
  "company_id": "",
  "role_id": ""
}
```

---

# 10. Refresh Token

## Purpose

Generate New Access Token

## Expiry

```text
7 Days
```

## Stored

```text
HTTP Only Cookie
```

## Database Table

```text
refresh_tokens
```

Fields:

```text
id
user_id
token
expires_at
```

---

# 11. Roles & Permissions

## Tables

```text
roles
permissions
user_roles
role_permissions
```

## Examples

```text
employee.create
employee.update
employee.delete

salary.process

ecr.generate
esic.generate

report.view

backup.create
```

---

# 12. Permission Middleware

Every Route Must Be Protected

### Example

```http
POST /api/v1/employee
```

Required Permission

```text
employee.create
```

### Flow

```text
JWT Verify
↓
Get User Permissions
↓
Check Permission
↓
Allow / Deny
```

---

# 13. Validation Rules

Every Request Must Pass Joi

Never Trust Frontend

Validate:

```text
email
mobile
aadhaar
pan
uan
esic
gst
password
uuid
pagination
dates
amounts
```

---

# 14. Controller Rules

Controller Responsibilities

* Receive Request
* Validate Input
* Call Service
* Return Response

Nothing Else.

No Business Logic.

---

# 15. Service Rules

All Business Logic Goes Here.

Examples:

```text
Salary Calculation
PF Calculation
ESIC Calculation
Bonus Calculation
Gratuity Calculation
Audit Log Creation
Notification Trigger
Database Operations
```

---

# 16. Payroll Formula Standards

Never calculate inside:

```text
Controller
Route
Frontend
```

Only:

```text
Formula Services
```

Example:

```text
pf.service.js
esic.service.js
salary.service.js
bonus.service.js
gratuity.service.js
professionalTax.service.js
```

---

# 17. Logging Standards

Use Winston

Log Levels

```text
INFO
WARN
ERROR
DEBUG
```

Log:

```text
Login
Logout
Employee Created
Salary Processed
PF Generated
ESIC Generated
ECR Generated
Backup Created
API Failures
Database Failures
```

---

# 18. Audit Trail Standards

Track:

```text
CREATE
UPDATE
DELETE
LOGIN
LOGOUT
IMPORT
EXPORT
SALARY_PROCESS
```

Table:

```text
audit_logs
```

Fields:

```text
id
table_name
record_id
action
old_value
new_value
changed_by
changed_at
```

---

# 19. Security Checklist

Mandatory:

```text
Helmet
CORS
Rate Limiter
Password Hashing
JWT
Refresh Token Rotation
HTTP Only Cookies
Parameterized Queries
Joi Validation
Input Sanitization
```

---

# 20. File Upload Standards

```text
uploads/

employees/
kyc/
imports/
exports/
reports/
backup/
profile/
```

Database Stores:

```text
file_name
file_path
mime_type
size
```

---

# 21. Soft Delete Rules

Never Delete Data

Instead:

```sql
is_deleted = true
deleted_at = current_timestamp
deleted_by = user_id
```

---

# 22. API Versioning

All APIs

```text
/api/v1/
```

Examples:

```text
/ api/v1/auth

/ api/v1/company

/ api/v1/employee

/ api/v1/contractor

/ api/v1/office-entry

/ api/v1/packer-entry

/ api/v1/bidi-entry

/ api/v1/ecr

/ api/v1/esic

/ api/v1/gratuity
```

---

# 23. Development Sequence

## Step 1

Database Setup

## Step 2

Users Module

## Step 3

Roles Module

## Step 4

Permissions Module

## Step 5

Auth Module

## Step 6

Refresh Token Module

## Step 7

RBAC Middleware

## Step 8

Logging

## Step 9

Audit Trail

## Step 10

Company Module

## Step 11

Employee Module

## Step 12

Contractor Module

## Step 13

KYC Module

## Step 14

Payroll Setup Modules

## Step 15

Payroll Entry Modules

## Step 16

Reports Module

## Step 17

Import Export Module

## Step 18

Backup Restore Module

## Step 19

Testing

## Step 20

Production Deployment

---

# Golden Rule

```text
Controller = Thin

Service = Smart

Formula Engine = Single Source of Truth

Database = Source of Truth

Audit Everything

Never Trust Frontend

Never Hard Delete

Everything Versioned

Everything Logged

Every Salary Reproducible

Every Report Traceable
```
