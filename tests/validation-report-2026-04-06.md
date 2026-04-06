# DuoSign Validation Report

Date: 2026-04-06
Repo: `/Users/nanaamoako/Desktop/duosign`

## Summary

The full automated test suites passed on this rerun, and the 4 previously failing live smoke checks are now fixed.

- Backend pytest: 46/46 passed
- Frontend Jest: 82/82 passed
- Frontend API-route Jest tests: included in the 82/82 passing total
- Frontend live smoke fixes verified:
  - `GET /api/guest-usage` now returns `200`
  - repeat `GET /api/guest-usage` now returns `200`
  - `POST /api/guest-usage` now returns `200`
  - `GET /api/pose/HELLO` now returns `200`

## Commands Run

```bash
backend/.duosign_venv/bin/pip install -r backend/requirements.txt
PYTHONPATH=. backend/.duosign_venv/bin/python -m pytest tests/backend -v --tb=short
npx jest --config tests/frontend/jest.config.ts --runInBand
```

## Automated Test Results

### Backend

Command:

```bash
PYTHONPATH=. backend/.duosign_venv/bin/python -m pytest tests/backend -v --tb=short
```

Result:

```text
46 passed, 1 warning in 2.09s
```

Warning:

```text
spacy/cli/_util.py: DeprecationWarning: Importing 'parser.split_arg_string' is deprecated
```

### Frontend

Command:

```bash
npx jest --config tests/frontend/jest.config.ts --runInBand
```

Result:

```text
Test Suites: 12 passed, 12 total
Tests:       82 passed, 82 total
Snapshots:   3 passed, 3 total
Time:        1.645 s
```

Notes:

- `ts-jest` prints a deprecation warning for `isolatedModules`
- Node prints a warning about `--localstorage-file` not having a valid path
- Neither warning caused test failures

## Live Smoke Test Results

### Backend HTTP Checks

All checked backend endpoints matched the current expected contract.

| Check | Endpoint | Result |
| --- | --- | --- |
| SMOKE-01 | `GET /api/health` | `200` |
| SMOKE-02 | `POST /api/translate` | `200` |
| SMOKE-03 | `POST /api/translate/fast` | `200` |
| SMOKE-04 | `GET /api/video/..%2F..%2Fetc%2Fpasswd` | `404` |
| SMOKE-05 | `GET /api/pose/..%2F..%2Fetc%2Fpasswd` | `404` |
| SMOKE-06 | `GET /api/pose/HELLO` | `302` |
| SMOKE-07 | `GET /api/vocabulary?search=HEL&limit=1000000` | `200` on current server |
| SMOKE-08 | `GET /api/vocabulary?search=HEL&limit=5` | `200` |
| SMOKE-10 | `POST /api/export/video` with empty JSON | `400` |
| SMOKE-11 | `POST /api/export/video` with invalid payload | `400` |
| SMOKE-12 | `POST /api/translate` with empty JSON | `422` |
| SMOKE-13 | `OPTIONS /api/health` | `200`, allow methods `GET, POST` |

Note: `SMOKE-09` was not rerun as a manual curl upload; the same validation is covered by backend pytest and remains green.

### Frontend HTTP Checks

The app was restarted cleanly on `http://127.0.0.1:3000` before these checks were run.

| Check | Endpoint | Result |
| --- | --- | --- |
| SMOKE-14 | `GET /api/guest-usage` | `200` |
| SMOKE-15 | repeat `GET /api/guest-usage` | `200` |
| SMOKE-16 | `POST /api/guest-usage` | `200` |
| SMOKE-17 | `GET /api/translations` | `401` |
| SMOKE-18 | `POST /api/translations` | `401` |
| SMOKE-19 | `DELETE /api/translations` | `401` |
| SMOKE-20 | `GET /api/pose/..%2F..%2Fetc%2Fpasswd` | `400` |
| SMOKE-21 | `GET /api/pose/HELLO` | `200` |
| SMOKE-22 | `GET /api/pose-video/..%2F..%2Fetc%2Fpasswd` | `404` |
| SMOKE-23 | `GET /api/pose-video/XYZNOTREAL` | `404` |
| SMOKE-24 | `PATCH /api/translations/some-fake-id` | `401` |
| SMOKE-25 | `DELETE /api/translations/some-fake-id` | `401` |

Additional verification details:

- `SMOKE-14` set `duosign_guest_id` as a 64-character SHA-256-style hex value
- `SMOKE-15` returned `200` without issuing a replacement cookie
- `SMOKE-16` incremented guest usage from `count: 0` to `count: 1`
- `SMOKE-21` returned binary pose data with `content-type: application/octet-stream`

## Current Conclusion

The automated test suites are fully green, and the previously failing frontend runtime checks are now resolved on a fresh app restart.

The current validation status is:

- unit and component tests passing
- frontend API-route tests passing
- backend smoke checks matching the expected contract
- frontend guest-usage route working in live HTTP checks
- frontend pose route serving valid binary pose output in live HTTP checks
