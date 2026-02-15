# Integration Testing Guide

## Quick Start

### 1. Start the Backend

```bash
cd rizon-backend
go build -o rizon-backend main.go
./rizon-backend
```

Backend will run on `http://localhost:8080`

### 2. Start the Frontend

```bash
# In a new terminal, from the project root
npx expo start
```

### 3. Test Flow - New User on Device A

#### Step 1: Send Auth Link

```bash
curl -X POST http://localhost:8080/api/auth/send-link \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

Response:

```json
{
  "message": "Auth link created (dev mode)",
  "email": "test@example.com",
  "token": "some-uuid-token",
  "link": "rizon://auth?token=some-uuid-token"
}
```

#### Step 2: Verify Auth Link

```bash
curl -X POST http://localhost:8080/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"token": "some-uuid-token"}'
```

Response:

```json
{
  "session_token": "session-uuid",
  "user": {
    "id": "user-uuid",
    "email": "test@example.com",
    "created_at": "2026-02-14T...",
    "onboarding_complete": false,
    "is_new_user": true
  },
  "is_new_user": true
}
```

✓ **Frontend receives:** `is_new_user: true`, `onboarding_complete: false`
✓ **Frontend action:** Shows InitialOnboardingSheet

#### Step 3: Check Onboarding Status

```bash
curl -X GET http://localhost:8080/api/onboarding/status \
  -H "Authorization: Bearer session-uuid" \
  -H "Content-Type: application/json"
```

Response:

```json
{
  "onboarding_complete": false,
  "is_new_user": true
}
```

✓ **Frontend confirms:** Onboarding should be shown

#### Step 4: Complete Onboarding (via Frontend)

User goes through onboarding flow:

1. Sees initial sheet with options
2. Option A: Provide feedback → FeedbackSheet → Submit feedback → Complete
3. Option B: Leave review → ReviewSheet → Complete

Frontend calls:

```bash
curl -X POST http://localhost:8080/api/onboarding/complete \
  -H "Authorization: Bearer session-uuid" \
  -H "Content-Type: application/json"
```

Response:

```json
{
  "success": true,
  "message": "Onboarding marked as complete"
}
```

✓ **Backend updates:** `onboarding_complete: true`, `is_new_user: false`
✓ **Frontend action:** Hides InitialOnboardingSheet

#### Step 5: Check Status Again (Backend Updated)

```bash
curl -X GET http://localhost:8080/api/onboarding/status \
  -H "Authorization: Bearer session-uuid"
```

Response:

```json
{
  "onboarding_complete": true,
  "is_new_user": false
}
```

✓ **Backend confirms:** Onboarding is complete

---

### 4. Test Flow - Same User on Device B

#### Step 1-2: Log in Same User Again

```bash
# Send link to same email
curl -X POST http://localhost:8080/api/auth/send-link \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Get the new token and verify
curl -X POST http://localhost:8080/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"token": "new-token"}'
```

Response includes:

```json
{
  "user": {
    "onboarding_complete": true, // ← From backend!
    "is_new_user": false
  }
}
```

✓ **Frontend receives:** `onboarding_complete: true`
✓ **Frontend action:** Does NOT show InitialOnboardingSheet
✓ **Result:** Consistent across devices!

---

## Expected Behavior

### For New Users

- [ ] First login shows onboarding sheet
- [ ] Completing onboarding updates backend
- [ ] Second device: No onboarding sheet shown
- [ ] Backend consistently returns `onboarding_complete: true`

### For Returning Users

- [ ] Login shows no onboarding sheet
- [ ] `/api/onboarding/status` returns `onboarding_complete: true`
- [ ] Multiple devices all skip onboarding

### Offline Behavior (Optional)

- [ ] If backend is down, falls back to AsyncStorage
- [ ] Still functional for testing
- [ ] Syncs when backend comes back online

---

## API Reference

### New Endpoints

#### GET /api/onboarding/status

Check if user has completed onboarding

- **Auth:** Required (Bearer token)
- **Response:** `OnboardingStatusResponse`

#### POST /api/onboarding/complete

Mark user's onboarding as complete

- **Auth:** Required (Bearer token)
- **Body:** Empty or `{}`
- **Response:** `CompleteOnboardingResponse`

#### GET /api/auth/me

Get current user info (includes onboarding status)

- **Auth:** Required (Bearer token)
- **Response:** User object with `onboarding_complete` and `is_new_user`

---

## Debugging

### Backend Logs

Look for these messages in terminal:

```
[ONBOARDING] Checking onboarding status from backend
[ONBOARDING] Backend onboarding status: {...}
[ONBOARDING] Completing onboarding
```

### Frontend Logs

Check React Native console for:

```
[ONBOARDING_CONTEXT] Checking onboarding status from backend
[ONBOARDING_CONTEXT] Onboarding status from backend: {...}
[ONBOARDING_CONTEXT] Showing initial onboarding sheet
[ONBOARDING_CONTEXT] Completing onboarding
```

### Database Check

```bash
sqlite3 rizon.db
sqlite> SELECT id, email, onboarding_complete, is_new_user FROM users;
```

---

## Troubleshooting

**Issue:** Onboarding sheet shows even after completing

- **Solution:** Check backend still has `onboarding_complete: true` in DB
- **Command:** `sqlite3 rizon.db "SELECT * FROM users WHERE email='test@example.com';"`

**Issue:** Sheet doesn't show for new user

- **Solution:** Verify `is_new_user: true` is returned in auth/verify
- **Check:** Backend logs during login

**Issue:** Different behavior on different devices

- **Solution:** Verify backend is returning updated status
- **Test:** Query `/api/onboarding/status` with different session tokens

**Issue:** Frontend not syncing

- **Solution:** Check network requests in browser/app network tab
- **Verify:** POST to `/api/onboarding/complete` succeeds

---

## Key Points to Verify

1. ✓ Backend builds without errors
2. ✓ Database tables have `onboarding_complete` and `is_new_user` columns
3. ✓ Endpoints `/api/onboarding/status` and `/api/onboarding/complete` exist
4. ✓ Frontend fetches from backend (not just local storage)
5. ✓ Onboarding status syncs between devices
6. ✓ User can't see onboarding twice

---

## Success Criteria

- [ ] New user on Device A: Sees onboarding ✓
- [ ] New user completes onboarding ✓
- [ ] Backend marks `onboarding_complete: true` ✓
- [ ] Same user on Device B: No onboarding ✓
- [ ] Multiple logins preserve state ✓
- [ ] Offline mode works as fallback ✓
