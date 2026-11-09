# Session File Format

Recorded sessions are stored on the device as plain files. This document is the reference for that format, for the library itself and for any tool that reads session files.

**Current schema version: `1`**

## Location

Files are private to the app and excluded from device and cloud backups.

| Platform | Directory |
|---|---|
| iOS | `Library/Application Support/network-tools/sessions/` (backup exclusion set on `network-tools/`) |
| Android | `<noBackupFilesDir>/network-tools/sessions/` |

On the iOS simulator, `xcrun simctl get_app_container booted <bundle-id> data` returns the app's data folder. On a debuggable Android app, `adb exec-out run-as <package> ls no_backup/network-tools/sessions` lists the files.

## Layout

```
network-tools/sessions/
├── index.json       list of stored sessions
└── <id>.ndjson      one file per session
```

Sessions are only written when a recording stops. Each file is written to a temporary file and then renamed into place, so a reader never sees a partly written file. The session file is written before `index.json`, so every session listed in the index has a complete file.

## `index.json`

```json
{
  "schemaVersion": 1,
  "sessions": [
    {
      "id": "7F3A2C1E-…",
      "name": "api-recording-2026-11-07T14-32-05",
      "status": "stopped",
      "startTime": 1794062525000,
      "endTime": 1794062610000,
      "requestCount": 42,
      "limitReached": false,
      "sizeBytes": 183402,
      "schemaVersion": 1,
      "platform": "ios",
      "appId": "com.example.app",
      "appVersion": "1.4.0",
      "libraryVersion": "0.4.0"
    }
  ]
}
```

| Field | Type | Meaning |
|---|---|---|
| `schemaVersion` (top level) | number | Schema version of everything in the folder |
| `sessions` | array | Stored sessions, in no guaranteed order. Sort by `startTime`. |
| `id` | string | Unique session id (UUID). Also the session file's base name. |
| `name` | string | `api-recording-YYYY-MM-DDTHH-mm-ss`, local time at start. Not unique. |
| `status` | string | Always `"stopped"` for stored sessions |
| `startTime` / `endTime` | number | Epoch milliseconds when recording started and stopped |
| `requestCount` | number | Number of lines in the session file |
| `limitReached` | boolean | `true` if capture stopped at the per-session request limit |
| `sizeBytes` | number | Size of the session file in bytes |
| `schemaVersion` (entry) | number | Schema version the session was written with |
| `platform` | string | `"ios"` or `"android"` |
| `appId` | string | Bundle identifier (iOS) or package name (Android) |
| `appVersion` | string | `CFBundleShortVersionString` (iOS) or `versionName` (Android) |
| `libraryVersion` | string | `react-native-network-tools` version that recorded the session |

## `<id>.ndjson`

Newline-delimited JSON: UTF-8, one JSON object per line, each line ending in `\n`, ordered by `seq`. Each object is one captured request.

| Field | Type | Meaning |
|---|---|---|
| `seq` | number | Capture order within the session, starting at 1 |
| `id` | string | Request id, unique within the session |
| `url` | string | Full request URL |
| `method` | string | HTTP method |
| `requestTime` | number | Epoch ms when the request started |
| `responseTime` | number | Epoch ms when the request completed |
| `duration` | number | `responseTime - requestTime`, in ms |
| `responseCode` | number | HTTP status, or `0` if no response was received |
| `requestHeaders` / `responseHeaders` | object | Header name → value. Redacted values are `"[redacted]"`. |
| `redactedRequestHeaders` / `redactedResponseHeaders` | string[] | Names of headers whose values were redacted |
| `requestBody` / `responseBody` | string | Captured body text. Only the captured bytes; no marker text is ever appended. Empty when encoding is `omitted`. |
| `requestBodyTruncated` / `responseBodyTruncated` | boolean | `true` if the body was cut at the capture limit (`maxBodyCaptureBytes`) |
| `requestBodyEncoding` / `responseBodyEncoding` | string | `"utf8"`: the body is the captured bytes decoded as UTF-8. `"omitted"`: the body was binary or not valid UTF-8, so no text was kept. |
| `requestContentType` / `responseContentType` | string | `Content-Type` of the body. Absent when unknown. |
| `error` | string | Transport error message, or `""` |

## Versioning

- Changes to the format are **additive only**. New fields can be added in any release without changing the schema version. Existing fields never change meaning and are never removed without a version change.
- Readers must ignore fields they don't recognise.
- When the library starts and finds data with a different `schemaVersion`, it deletes all stored sessions.
