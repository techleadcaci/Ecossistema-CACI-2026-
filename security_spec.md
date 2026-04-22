# Security Specification - Ecossistema CACI

## 1. Data Invariants
- A user profile must be created with the 'user' role by default.
- Only admins/superadmins/diretoria can change user roles.
- Organizations must be owned by the user who created them.
- Diagnostics must be linked to a valid organization and the authenticated user.
- Audit logs should be append-only for standard users (though the rules allow creation, they shouldn't allow editing).
- Global stats are read-only for public/standard users.

## 2. The Dirty Dozen (Threat Matrix)

| ID | Attack Vector | Expected Result |
|---|---|---|
| P1 | Create user with `role: 'superadmin'` | PERMISSION_DENIED |
| P2 | Update another user's `id_ccgu` | PERMISSION_DENIED |
| P3 | Create organization with `owner_user_id` of another user | PERMISSION_DENIED |
| P4 | Delete an audit log entry | PERMISSION_DENIED |
| P5 | Update `global_stats/current` as a standard user | PERMISSION_DENIED |
| P6 | List all users in `/users` as a standard user | PERMISSION_DENIED |
| P7 | Read `/audit_logs` as a non-admin | PERMISSION_DENIED |
| P8 | Update an organization name as someone other than the owner/admin | PERMISSION_DENIED |
| P9 | Create a diagnostic for an organization the user doesn't belong to (relational) | PERMISSION_DENIED |
| P10 | Injection attack: Create organization with 1MB string as CNPJ | PERMISSION_DENIED (Size check) |
| P11 | Update an immutable field like `created_at` in any document | PERMISSION_DENIED |
| P12 | Bypass MFA: Access `/users` admin list without `email_verified: true` | PERMISSION_DENIED |

## 3. Test Runner Path
Tests will be implemented in `firestore.rules.test.ts`.
