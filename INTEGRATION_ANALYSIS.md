# Frontend-Backend Integration Analysis Report

## Summary

The frontend and backend integration has **several critical issues** that prevent proper data flow from backend to frontend for onboarding status management. The current implementation relies too heavily on local AsyncStorage flags instead of backend authority.

---

## Critical Issues Found

### 1. ⚠️ **MISSING: Backend Onboarding Status Endpoints**

**Issue:** There is NO backend endpoint to mark onboarding as complete or retrieve onboarding status.

**Current Flow:**

- Backend marks user as new during auth verification ✓
- Frontend receives `is_new_user` flag ✓
- Frontend stores it locally in AsyncStorage
- **Frontend sets `hasSeenInitialOnboarding` ONLY locally** ❌
- No sync back to backend ❌

**Required Endpoints Missing:**

```
POST /api/onboarding/complete  - Mark user onboarding as done
GET  /api/onboarding/status    - Check if user has completed onboarding
```

**Impact:**

- If user logs in on a different device, the onboarding status isn't synced
- Backend doesn't have a record of whether user completed onboarding
- Violates requirement: "Onboarding should be shown only once per user per device"

---

### 2. ⚠️ **Backend User Model Has Fields But Doesn't Use Them**

**Issue:** The User model has `OnboardingComplete` and `IsNewUser` fields but they're never:

- Returned in API responses
- Updated after onboarding is completed
- Checked before showing onboarding

**Current Model** (models.go):

```go
type User struct {
    ID        string    `json:"id"`
    Email     string    `json:"email"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
    OnboardingComplete bool `json:"onboarding_complete"`  // ← Stored but never used
    IsNewUser          bool `json:"is_new_user"`           // ← Stored but never used
}
```

**Expected Response** (currently returned):

```json
{
  "session_token": "...",
  "user": {
    "id": "...",
    "email": "...",
    "created_at": "...",
    "updated_at": "..."
    // Missing: onboarding_complete, is_new_user
  },
  "is_new_user": true // ← Workaround, should be in User object
}
```

**Impact:** Frontend can't rely on backend for truth of onboarding state.

---

### 3. ⚠️ **Response Field Naming Mismatch**

**Issue:** The backend response uses snake_case (`session_token`, `is_new_user`) but should be consistent.

**Backend Response Structure** (handler.go):

```go
type VerifyAuthLinkResponse struct {
    SessionToken string `json:"session_token"`  // snake_case
    User         *User  `json:"user"`
    IsNewUser    bool   `json:"is_new_user"`    // snake_case
}
```

**Frontend Expected** (auth.service.ts):

```typescript
const data = await response.json();
console.log(data.session_token); // ✓ Works
console.log(data.is_new_user); // ✓ Works
```

This works but is inconsistent. The `User` object fields use camelCase in JSON tags but API response uses snake_case.

---

### 4. ⚠️ **No Backend Onboarding Data Persistence**

**Current Implementation Problems:**

| Requirement                         | Frontend            | Backend                      |
| ----------------------------------- | ------------------- | ---------------------------- |
| Check if user has seen onboarding   | ✓ AsyncStorage only | ❌ Not stored                |
| Mark onboarding complete            | ✓ AsyncStorage only | ❌ No endpoint               |
| Retrieve on new login               | ✓ Local only        | ❌ Can't sync across devices |
| Mark specific onboarding sheet seen | ✓ AsyncStorage      | ❌ Not tracked by backend    |

**Current localStorage setup:**

```typescript
// Frontend only
await AsyncStorage.setItem("hasSeenInitialOnboarding", "true");
await AsyncStorage.setItem("onboardingTriggered", "true");
```

---

### 5. ⚠️ **Auth Service Returns Data But Not Used for Onboarding**

**Issue:** The `verifyAuthLink()` returns `isNewUser` but the onboarding context doesn't use it properly.

**Frontend Flow Problem:**

```
Auth Service verifyAuthLink()
    ↓
Returns: { user, sessionToken, isNewUser: true/false }  ✓
    ↓
Auth Context stores isNewUser locally
    ↓
triggerOnboardingAfterLogin() is called  ✓
    ↓
Sets AsyncStorage "onboardingTriggered" flag  ✓
    ↓
OnboardingService.checkOnboardingStatus() called
    ↓
Reads "hasSeenInitialOnboarding" from storage
    ↓
Shows initial sheet based on LOCAL flags, not backend  ❌
```

**Problem:** The backend data (`isNewUser`) is not being used to determine if onboarding should show. Instead, it's relying on local AsyncStorage flags that might not be consistent.

---

### 6. ⚠️ **GET /api/auth/me Endpoint Not Fully Utilized**

**Issue:** The endpoint exists but doesn't return onboarding status.

**Current behavior:**

- Returns: `User` object, `SessionToken` (should already have it)
- Missing: `OnboardingComplete` status

**Expected Response:**

```json
{
  "user": {
    "id": "...",
    "email": "...",
    "created_at": "...",
    "onboarding_complete": false,
    "is_new_user": true
  }
}
```

---

## Data Flow Diagram - Current vs Expected

### ❌ Current (Problematic)

```
Backend                              Frontend
─────────────────────────────────────────────────
User Created
  (OnboardingComplete: false)
  (IsNewUser: true)
           │
           │ verifyAuthLink response
           ├─→ is_new_user: true ─→ Stored in AsyncStorage ✓
           │
           └─→ User object ─→ No onboarding status included ❌
                    │
                    └─→ Stored in AsyncStorage only

No endpoint to:
  - Mark onboarding complete ❌
  - Check onboarding status ❌
  - Sync across devices ❌

Frontend triggers onboarding using LOCAL flags:
  - AsyncStorage "onboardingTriggered"
  - AsyncStorage "hasSeenInitialOnboarding"
  (Not synced back to backend)
```

### ✓ Expected (Correct)

```
Backend                              Frontend
─────────────────────────────────────────────────
User Created
  (onboarding_complete: false)
  (is_new_user: true)
           │
           │ GET /api/auth/verify OR /api/auth/me
           ├─→ User object includes:
           │     - onboarding_complete: false ✓
           │     - is_new_user: true ✓
           │
           └─→ Frontend uses this data to show onboarding

GET /api/onboarding/status
  ← Returns: { onboarding_complete: false }
  ← Decided by backend, frontend respects it

POST /api/onboarding/complete
  ← Marks onboarding as complete on backend
  ← Frontend syncs this information

Result: Onboarding shown only once per user (backend enforces)
        Consistent across all devices ✓
```

---

## What Needs to Be Fixed

### Backend Changes Required

#### 1. Update User Model Response

```go
// In models.go, update User struct to include onboarding fields
type User struct {
    ID                   string    `json:"id"`
    Email                string    `json:"email"`
    CreatedAt            time.Time `json:"created_at"`
    UpdatedAt            time.Time `json:"updated_at"`
    OnboardingComplete   bool      `json:"onboarding_complete"`  // NOW INCLUDED IN RESPONSE
    IsNewUser            bool      `json:"is_new_user"`           // NOW INCLUDED IN RESPONSE
}
```

#### 2. Add Missing Endpoints

```go
// Add to handler.go routes
POST /api/onboarding/complete  // Mark user onboarding as complete
GET  /api/onboarding/status    // Get user's onboarding status
```

#### 3. Update Database Schema

```
ALTER TABLE users ADD COLUMN onboarding_complete BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN is_new_user BOOLEAN DEFAULT true;
```

#### 4. Fix endpoint responses to return onboarding status

### Frontend Changes Required

#### 1. Use Backend Data for Onboarding Decision

```typescript
// Instead of relying on AsyncStorage, use:
const onboardingStatus = await fetch(`/api/onboarding/status`, {
  headers: { Authorization: `Bearer ${sessionToken}` },
});

if (onboardingStatus.onboarding_complete === false) {
  showOnboarding();
}
```

#### 2. Mark Onboarding Complete on Backend

```typescript
// When user completes onboarding:
await fetch(`/api/onboarding/complete`, {
  method: "POST",
  headers: { Authorization: `Bearer ${sessionToken}` },
});
```

#### 3. Remove Local-Only Onboarding Flags

- Remove reliance on AsyncStorage for onboarding decisions
- Use backend as source of truth

---

## Current Test Scenario - What's Broken

**Scenario:** User logs in, sees onboarding, then reinstalls app

1. ✓ Backend creates user with `is_new_user: true`, `onboarding_complete: false`
2. ✓ Frontend receives `is_new_user: true`
3. ✓ Frontend shows onboarding
4. ✓ Frontend marks `hasSeenInitialOnboarding` in AsyncStorage
5. ❌ Backend has NO RECORD of onboarding completion
6. ❌ User reinstalls app
7. ❌ Frontend checks local AsyncStorage, not backend
8. ❌ Backend still thinks user hasn't completed onboarding
9. **RESULT:** Inconsistent state, might show onboarding again

---

## Summary of Integration Issues

| Issue                              | Severity | Impact                        | Component          |
| ---------------------------------- | -------- | ----------------------------- | ------------------ |
| No backend onboarding endpoints    | CRITICAL | Can't sync across devices     | Backend API        |
| User model fields not in responses | CRITICAL | Frontend can't trust backend  | Backend Models     |
| Onboarding only tracked locally    | CRITICAL | No source of truth in backend | Frontend + Backend |
| Missing onboarding status endpoint | HIGH     | Can't check server state      | Backend API        |
| Field naming inconsistency         | MEDIUM   | Maintainability issue         | Backend API        |

---

## Recommendations

1. **Priority 1:** Add backend onboarding endpoints (`/api/onboarding/complete` and `/api/onboarding/status`)
2. **Priority 2:** Include `onboarding_complete` and `is_new_user` in User response objects
3. **Priority 3:** Update frontend to fetch and trust backend onboarding status
4. **Priority 4:** Ensure database has fields to store onboarding state
5. **Priority 5:** Add authorization checks to onboarding endpoints (user can only update their own)

---

## Files That Need Changes

### Backend

- `rizon-backend/internal/api/handler.go` - Add new endpoints + update responses
- `rizon-backend/internal/models/models.go` - Update User struct + responses
- `rizon-backend/internal/services/auth.go` - Update response handling
- `rizon-backend/internal/storage/sqlite_store.go` - Add/update onboarding methods
- `rizon-backend/internal/services/onboarding.go` - Create new service (if not exists)

### Frontend

- `services/auth.service.ts` - More robust backend data handling
- `services/onboarding.service.ts` - Fetch from backend instead of local storage
- `contexts/onboarding.context.tsx` - Use backend data as source of truth
- `contexts/auth.context.tsx` - Include onboarding status in auth flow
