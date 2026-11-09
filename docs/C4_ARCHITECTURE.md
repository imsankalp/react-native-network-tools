# C4 Architecture

This document describes the architecture of react-native-network-tools using the [C4 model](https://c4model.com): system context, containers, components, and two dynamic views (capturing a request, recording a session). The last section, [Session subsystem in depth](#session-subsystem-in-depth), explains how the recorder, the events and listeners, and the NDJSON file store work together.

The diagrams are Mermaid flowcharts drawn in C4 notation, because Mermaid's native C4 syntax lays out poorly on GitHub. Legend:

| Shape / colour | C4 element |
| --- | --- |
| Dark blue box | Person |
| Blue box | Element inside the scope of the diagram (system, container or component) |
| Grey box | External system or element outside the scope |
| Cylinder | Data store |
| Dashed box | Planned, not built yet |

---

## Level 1 — System context

The library runs inside the host app's process. It sees the app's HTTP traffic from inside the app's own networking stack, so there is no proxy and nothing leaves the device.

```mermaid
flowchart TB
  dev["<b>Developer / QA tester</b><br/>[Person]<br/>Inspects the app's network traffic and records sessions of a flow"]

  subgraph device["Device (debug build)"]
    host["<b>Host React Native app</b><br/>[Software system]<br/>The app under test; wraps its root in NetworkMonitorProvider"]
    nt["<b>react-native-network-tools</b><br/>[Software system]<br/>Captures every HTTP request the app makes, shows it in an in-app inspector, and records sessions to disk"]
  end

  api["<b>Backend APIs</b><br/>[External system]<br/>Any HTTP server the app talks to"]

  replay["<b>Session replay</b><br/>[Planned]<br/>Serves a saved session as mock responses"]
  mcp["<b>AI agent via MCP</b><br/>[Planned]<br/>Reads saved sessions through tool calls"]

  dev -- "Opens inspector, starts/stops recordings<br/>[floating button / dev menu]" --> nt
  dev -- "Uses" --> host
  host -- "fetch / XMLHttpRequest / axios" --> api
  nt -. "Observes requests and responses<br/>[in-process interceptor]" .- host
  replay -. "Reads session files" .-> nt
  mcp -. "Reads session files" .-> nt

  classDef person fill:#08427b,stroke:#052e56,color:#fff
  classDef system fill:#1168bd,stroke:#0b4884,color:#fff
  classDef external fill:#999,stroke:#6b6b6b,color:#fff
  classDef planned fill:#fff,stroke:#999,color:#555,stroke-dasharray:5 5
  class dev person
  class nt system
  class host,api external
  class replay,mcp planned
  style device fill:none,stroke:#888,stroke-dasharray:3 3
```

---

## Level 2 — Containers

The system has a JavaScript part, a native part per platform, and an on-device file store. The JS part and the native part talk through one TurboModule (`NetworkTools`) and two native events.

```mermaid
flowchart TB
  dev["<b>Developer / QA tester</b><br/>[Person]"]
  rnnet["<b>React Native networking</b><br/>[External container]<br/>RCTNetworking (iOS, NSURLSession) /<br/>NetworkingModule (Android, OkHttp)"]
  api["<b>Backend APIs</b><br/>[External system]"]

  subgraph nt["react-native-network-tools"]
    js["<b>JS layer</b><br/>[TypeScript, React]<br/>Provider, in-memory stores, inspector UI,<br/>public API and hooks"]
    ios["<b>iOS native module</b><br/>[Objective-C, NSURLProtocol]<br/>Intercepts requests, buffers them,<br/>records and persists sessions"]
    android["<b>Android native module</b><br/>[Kotlin, OkHttp interceptor]<br/>Same responsibilities as iOS"]
    buffer[("<b>Request buffer</b><br/>[In-memory, native singleton]<br/>Last maxRequests requests;<br/>survives JS reloads")]
    files[("<b>Session files</b><br/>[NDJSON + index.json]<br/>One file per session, 20 kept,<br/>excluded from backups")]
  end

  dev -- "Taps, reads" --> js
  rnnet -- "HTTP" --> api
  rnnet -. "Intercepted by<br/>[NSURLProtocol]" .-> ios
  rnnet -. "Intercepted by<br/>[OkHttp interceptor]" .-> android
  js -- "Calls<br/>[TurboModule NetworkTools, sync + async]" --> ios
  js -- "Calls<br/>[TurboModule NetworkTools / NetworkToolsLegacy]" --> android
  ios -- "NetworkTools:onRequest<br/>NetworkTools:onSessionChange" --> js
  android -- "NetworkTools:onRequest<br/>NetworkTools:onSessionChange" --> js
  ios --> buffer
  android --> buffer
  ios -- "Writes on Stop, reads on demand<br/>[atomic file writes]" --> files
  android -- "Writes on Stop, reads on demand<br/>[AtomicFile]" --> files

  classDef person fill:#08427b,stroke:#052e56,color:#fff
  classDef container fill:#438dd5,stroke:#2e6295,color:#fff
  classDef external fill:#999,stroke:#6b6b6b,color:#fff
  class dev person
  class js,ios,android,buffer,files container
  class rnnet,api external
  style nt fill:none,stroke:#1168bd
```

**Build gating.** Capture is debug-only. On iOS the interceptor is registered only inside `#if DEBUG` in `NetworkToolsManager.activate`. On Android it follows `BuildConfig.NETWORK_TOOLS_ENABLED`, which is true only for the debug build type, and the `android-no-op` artifact registers no module at all. In a release build the JS layer finds capture inactive (or the module missing) and shows the "capture off" state. No session folder is ever created.

---

## Level 3 — Components: JS layer

```mermaid
flowchart TB
  hostapp["<b>Host app code</b><br/>[External]"]
  native["<b>Native module</b><br/>[Container: iOS / Android]"]

  subgraph js["JS layer (src/)"]
    api["<b>Public API</b><br/>[index.tsx]<br/>getAllRequests, clearAllRequests,<br/>annotateNetworkRequestError, useSessions …"]
    spec["<b>TurboModule spec</b><br/>[NativeNetworkTools.ts]<br/>Typed bridge; falls back to an<br/>'unavailable' module when native is missing"]
    provider["<b>NetworkMonitorProvider</b><br/>[context/NetworkMonitorContext.tsx]<br/>Pushes config to native, rehydrates the buffer,<br/>subscribes to native events"]
    nstore["<b>NetworkStore</b><br/>[store/NetworkStore.ts]<br/>Live request list, subscribe/notify"]
    sstore["<b>SessionStore</b><br/>[store/SessionStore.ts]<br/>Availability, active session,<br/>saved-session list"]
    hooks["<b>Hooks</b><br/>[useNetworkMonitor, useSessions,<br/>useNetworkAnalytics]"]
    shell["<b>Monitor shell</b><br/>[network-monitor-shell, floating-button]<br/>FAB overlay (red dot while recording),<br/>dev-menu item, panel Modal"]
    nav["<b>Navigator</b><br/>[navigation/]<br/>Custom tab + stack reducer<br/>(PUSH, POP, REPLACE)"]
    reqs["<b>Requests feature</b><br/>[features/network-requests]<br/>List, search, 4-tab detail"]
    sess["<b>Sessions feature</b><br/>[features/sessions]<br/>List, recording, session detail"]
    other["<b>Insights / WebSocket</b><br/>[features/insights, websocket]"]
  end

  hostapp -- "Wraps root, calls API" --> api
  api --> spec
  api --> nstore
  hostapp --> provider
  provider -- "setMaxRequests, setRedactHeaders,<br/>getAllRequests" --> spec
  provider -- "onRequest → add" --> nstore
  provider -- "init(emitter)" --> sstore
  sstore -- "startSession, stopSession,<br/>listSessions, getSessionRequest …" --> spec
  spec <--> native
  hooks --> nstore
  hooks --> sstore
  provider --> shell
  shell --> nav
  nav --> reqs
  nav --> sess
  nav --> other
  reqs --> hooks
  sess --> hooks
  reqs -. "Request detail of a saved session<br/>[sessionId param]" .-> sstore

  classDef component fill:#85bbf0,stroke:#5d82a8,color:#000
  classDef external fill:#999,stroke:#6b6b6b,color:#fff
  class api,spec,provider,nstore,sstore,hooks,shell,nav,reqs,sess,other component
  class hostapp,native external
  style js fill:none,stroke:#438dd5
```

---

## Level 3 — Components: native module

iOS and Android use the same component layout. Each row names the iOS class first and the Android class second.

```mermaid
flowchart TB
  js["<b>JS layer</b><br/>[Container]"]
  rnnet["<b>RN networking</b><br/>[External]"]
  disk[("<b>Session files</b><br/>[Container]")]

  subgraph native["Native module (ios/ · android/…/networktools/)"]
    module["<b>Module</b><br/>NetworkTools.mm ·<br/>NetworkToolsModule / LegacyModule → ModuleDelegate<br/>Exposes the spec; gates session calls on isCaptureActive"]
    manager["<b>Manager</b><br/>NetworkToolsManager (both)<br/>Activation, build gate, redact list,<br/>event emission"]
    interceptor["<b>Interceptor</b><br/>NetworkToolsInterceptor (both)<br/>Captures headers, bodies (UTF-8 / omitted,<br/>truncation), timing, errors"]
    storage["<b>Request storage</b><br/>NetworkToolsStorage · NetworkRequestStorage<br/>Ring buffer of maxRequests"]
    recorder["<b>Session recorder</b><br/>NetworkToolsSessionRecorder · SessionRecorder<br/>One active session; keeps requests that start<br/>and finish inside the window"]
    sstore["<b>Session store</b><br/>NetworkToolsSessionStore · SessionFileStore<br/>Serial queue; writes NDJSON then index,<br/>retention 20, cleanup, schema check"]
    reader["<b>Session reader</b><br/>NetworkToolsSessionReader · SessionFileReader<br/>Parses index and session files"]
    emitter["<b>Event emitter</b><br/>RCTEventEmitter · NetworkToolsEventEmitter<br/>onRequest, onSessionChange"]
  end

  rnnet -- "Each request" --> interceptor
  js -- "TurboModule calls" --> module
  module --> manager
  module --> storage
  module --> recorder
  module --> sstore
  manager -- "Registers" --> interceptor
  interceptor -- "Completed request" --> storage
  interceptor -- "Completed request" --> recorder
  interceptor -- "Completed request" --> emitter
  recorder -- "On Stop: persist" --> sstore
  recorder -- "started / request /<br/>limitReached / stopped" --> emitter
  sstore --> reader
  sstore <--> disk
  emitter --> js

  classDef component fill:#85bbf0,stroke:#5d82a8,color:#000
  classDef external fill:#999,stroke:#6b6b6b,color:#fff
  class module,manager,interceptor,storage,recorder,sstore,reader,emitter component
  class js,rnnet,disk external
  style native fill:none,stroke:#438dd5
```

---

## Dynamic view — capturing a request

```mermaid
sequenceDiagram
  autonumber
  participant App as Host app
  participant Net as RN networking
  participant Int as Interceptor
  participant API as Backend
  participant Buf as Request storage
  participant Rec as Session recorder
  participant JS as Provider / NetworkStore

  App->>Net: fetch(url, {body})
  Net->>Int: request (NSURLProtocol / OkHttp chain)
  Int->>Int: Copy headers and body (redact, truncate copy only)
  Int->>API: Forward the full, unchanged request
  API-->>Int: Response
  Int->>Int: Copy response (UTF-8 or omitted, truncated flag)
  Int-->>Net: Response, unchanged
  Net-->>App: Response
  Int->>Buf: add(request)
  Int->>Rec: offer(request) — kept only if a session is active
  Int-)JS: NetworkTools:onRequest
  JS->>JS: networkStore.add → UI re-renders
```

After a JS reload, the provider calls `getAllRequests()` to refill `NetworkStore` from the native buffer. The native buffer outlives the JS runtime.

---

## Dynamic view — recording a session

```mermaid
sequenceDiagram
  autonumber
  actor Dev as Developer
  participant UI as Sessions screens
  participant SS as SessionStore (JS)
  participant Mod as Native module
  participant Rec as Session recorder
  participant Store as Session store
  participant Disk as Session files

  Dev->>UI: Start recording
  UI->>SS: start()
  SS->>Mod: startSession()
  Mod->>Rec: start (name api-recording-YYYY-MM-DDTHH-mm-ss)
  Rec-)SS: onSessionChange {started}
  Note over Dev,Rec: Panel may be closed, and the FAB shows a red dot.<br/>Requests that start and finish in the window are buffered in memory.
  Rec-)SS: onSessionChange {request} (per request)
  Dev->>UI: Stop
  UI->>SS: stop()
  SS->>Mod: stopSession()
  Mod->>Rec: stop
  Rec->>Store: persist(session)
  Store->>Disk: write <id>.ndjson (atomic)
  Store->>Disk: update index.json (atomic), prune to 20
  Store-->>Mod: sessionId
  Mod-->>SS: resolve(sessionId)
  Rec-)SS: onSessionChange {stopped}
  UI->>UI: REPLACE → session-detail
  UI->>SS: getSessionSummaries(id) / getSessionRequest(id, reqId)
  SS->>Mod: read
  Mod->>Store: read via Session reader
  Store->>Disk: read
```


---

## Session subsystem in depth

A session moves through three places, each owned by one component:

| Where | Owner | Holds | Lifetime |
| --- | --- | --- | --- |
| Native memory | Session recorder | The active session: id, name, start time, the request list, `limitReached` | From Start to Stop. Survives JS reloads, lost if the app process dies. |
| Disk | Session store | `index.json` plus one `<id>.ndjson` per saved session | Until deleted, pushed out by retention, or wiped by a schema change |
| JS memory | `SessionStore` (JS) | A **view** of both: `availability`, `activeSession`, `activeRequests` (summaries), `sessions` (index entries) | One JS runtime. Rebuilt from native on every `init`. |

The JS store owns no session data of its own. Native is the source of truth, and the JS store mirrors it through two channels: **calls** (JS asks, native answers) and **events** (native tells JS that something changed).

### How the pieces connect

```mermaid
flowchart LR
  subgraph JS["JS runtime"]
    direction TB
    screens["<b>Session screens + FAB</b><br/>SessionList / Recording / Detail,<br/>floating button red dot"]
    hook["<b>useSessions()</b><br/>useSyncExternalStore"]
    jstore["<b>SessionStore</b><br/>state + listener Set"]
    emitter["<b>NativeEventEmitter</b><br/>created by the Provider"]
    nav["<b>Navigator initial state</b><br/>reads getState() once"]
  end

  subgraph Native["Native (singletons)"]
    direction TB
    module["<b>Module</b><br/>TurboModule methods"]
    rec["<b>Session recorder</b><br/>lock-guarded active session"]
    store["<b>Session store</b><br/>serial queue / single-thread executor"]
    reader["<b>Session reader</b><br/>parse index + NDJSON,<br/>build summaries"]
    interceptor["<b>Interceptor</b>"]
  end

  disk[("index.json<br/>&lt;id&gt;.ndjson")]

  screens -- "render state" --> hook
  hook -- "subscribe / getState" --> jstore
  screens -- "start / stop / delete / read" --> jstore
  nav -. "resume recording screen?" .-> jstore
  jstore -- "sync: startSession, getActiveSession,<br/>getActiveSessionSummaries, isCaptureActive" --> module
  jstore -- "async (Promise): stopSession, listSessions,<br/>getSessionSummaries, getSessionRequest,<br/>deleteSession, clearSessions" --> module
  module --> rec
  module --> store
  interceptor -- "recordRequest(request)" --> rec
  rec -- "Stop: saveSession(entry, requests)" --> store
  store <--> disk
  store --> reader
  rec -- "onSessionChange" --> emitter
  emitter -- "handleEvent" --> jstore

  classDef c fill:#85bbf0,stroke:#5d82a8,color:#000
  class screens,hook,jstore,emitter,nav,module,rec,store,reader,interceptor c
  style JS fill:none,stroke:#438dd5
  style Native fill:none,stroke:#438dd5
```

### Recorder states

The recorder is a singleton with one lock. `_sessionId` (`sessionId` on Android) being set **is** the "recording" state, so only one recording can exist at a time.

```mermaid
stateDiagram-v2
  [*] --> Idle
  Idle --> Recording: startSession()<br/>[capture active, no session]<br/>emit started
  Idle --> Idle: startSession() refused<br/>(capture inactive)
  Recording --> Recording: startSession() refused<br/>(already recording)
  Recording --> Recording: request completes,<br/>requestTime ≥ startTime,<br/>count < maxRequests<br/>append with seq, emit request
  Recording --> LimitReached: count = maxRequests<br/>emit limitReached (once)
  LimitReached --> LimitReached: further requests dropped
  Recording --> Idle: stopSession()<br/>snapshot + clear, emit stopped,<br/>hand off to session store
  LimitReached --> Idle: stopSession()
  Recording --> [*]: app process killed<br/>(unsaved recording lost)
```

Which requests belong to a session is decided in one place, `recordRequest`. The interceptor calls it when a request **completes**. The recorder keeps the request only if a session is active at that moment **and** the request's `requestTime` is at or after the session's start. A request that started before Start is ignored, and one still in flight at Stop arrives after the session is cleared and is ignored too. The per-session limit reuses `maxRequests`.

On Stop the recorder copies its list and clears its state while holding the lock, then emits `stopped` and hands the copy to the session store. A request that completes during the disk write cannot slip into the stopped session.

### The event contract: `NetworkTools:onSessionChange`

Every event carries the full current `activeSession` (or `null`), so the JS side can always replace its copy instead of patching it.

| `type` | Sent when | `activeSession` | Extra | JS `SessionStore` reaction |
| --- | --- | --- | --- | --- |
| `started` | `startSession()` succeeded | the new session | — | set `activeSession`, empty `activeRequests` |
| `request` | a request was added | updated `requestCount` | `addedRequest`: a summary (`id, seq, method, url, responseCode, duration, requestTime, error`) | append the summary unless its `id` is already listed |
| `limitReached` | the first request over the limit | `limitReached: true` | — | update `activeSession` (the Recording screen shows the notice) |
| `stopped` | `stopSession()` cleared the recorder | `null` | — | clear `activeSession` and `activeRequests` |

Events carry **summaries**, never full requests, so a recording with large bodies does not push megabytes across the bridge. Full requests are read from disk only when a detail screen asks for one.

The duplicate check on `request` handles a race during `init`: JS reads `getActiveSessionSummaries()` and subscribes right after, so a request completing in between can arrive in both.

Native events are emitted **outside** the recorder lock, so a slow JS listener can never block the interceptor thread.

### The listener chain

```mermaid
sequenceDiagram
  autonumber
  participant Int as Interceptor (network thread)
  participant Rec as Session recorder
  participant Em as NativeEventEmitter (JS)
  participant SS as SessionStore (JS)
  participant Hook as useSessions() via useSyncExternalStore
  participant UI as Recording screen / FAB

  Note over SS: Provider mount: init(emitter)<br/>1. availability from isCaptureActive()<br/>2. rehydrate activeSession + summaries (sync)<br/>3. addListener('NetworkTools:onSessionChange')<br/>4. refreshSessions() (async)
  Int->>Rec: recordRequest(request)
  Rec->>Rec: lock, append (seq = n+1), unlock
  Rec-)Em: onSessionChange {type: request, activeSession, addedRequest}
  Em->>SS: handleEvent(event)
  SS->>SS: setState(new object), notify listener Set
  SS->>Hook: listener() — React re-reads getState()
  Hook->>UI: re-render (count, list, red dot)
```

The JS store is a plain external store with a `subscribe` / `getState` pair, the shape `useSyncExternalStore` expects. Each `setState` replaces the state object, so React's identity check sees the change and every mounted consumer re-renders: the floating button's red dot, the list banner, and the live list on the Recording screen. Consumers that are not mounted (the panel is closed) are not notified, but the store keeps updating, so reopening the panel shows current data.

The Provider owns the subscription. On unmount it calls `sessionStore.dispose()`, which removes the native listener. A JS reload destroys the JS store, and the next mount rebuilds it from native.

### Writing to disk: NDJSON and the save protocol

Why NDJSON (one JSON object per line) instead of one JSON array or a database:

- **Append-shaped.** A session is an ordered list of independent records, so each line is complete on its own. A future streaming writer could append lines during recording with no format change.
- **Damage stays local.** The reader skips any line that does not parse, so one bad line costs one request, not the session.
- **Tool-friendly.** `jq`, `grep` and `wc -l` work on it directly, and an MCP server or a replay engine can stream it line by line without loading the whole file.
- **No dependency.** Both platforms write it with their built-in JSON serializers; nothing needs a migration.

`index.json` is the catalogue. Listing sessions reads only the index, never the session files.

All file work runs on one serial queue (iOS `dispatch_queue` "com.networktools.sessions", Android single-thread executor). Saves, reads, deletes and housekeeping therefore never interleave, with no file locks. Results go back to the module through completion callbacks, which resolve the JS promise.

```mermaid
sequenceDiagram
  autonumber
  participant Rec as Session recorder
  participant Q as Session store queue
  participant FS as File system

  Rec->>Q: saveSession(entry, requests)
  Q->>Q: first task ever? run housekeeping
  Q->>FS: ensure sessions/ exists (iOS: exclude network-tools/ from backup)
  Q->>Q: serialize each request + "\n"
  Q->>FS: write <id>.ndjson — temp file, then rename
  alt write failed
    Q-->>Rec: completion(null) — index untouched
  else written
    Q->>Q: entry + sizeBytes + schemaVersion
    Q->>FS: read index.json, add entry, sort by startTime desc, keep 20
    Q->>FS: write index.json — temp file, then rename
    Q->>FS: delete .ndjson files of sessions beyond 20
    Q-->>Rec: completion(entry) → JS promise resolves
  end
```

**Crash safety follows from the order:** session file first, index second, both written atomically (iOS `NSDataWritingAtomic`, Android `AtomicFile`).

| Crash point | State on disk | Recovery |
| --- | --- | --- |
| During the `.ndjson` write | Old files untouched, temp file left over | None needed; nothing references it |
| After the `.ndjson`, before the index | A session file the index doesn't list (orphan) | Housekeeping deletes it on next start |
| During the index write | Previous `index.json` intact | The new session is an orphan, as above |
| After both | Consistent | — |

The invariant is: **every session listed in the index has a complete file.** Readers can trust the index.

### Housekeeping

Housekeeping runs once per process, before the first task on the queue.

```mermaid
flowchart TB
  start([First queue task]) --> exists{sessions/ exists?}
  exists -- no --> done([Done])
  exists -- yes --> schema{index.json<br/>schemaVersion == 1?}
  schema -- "no / unreadable" --> wipe[Delete the whole sessions/ folder] --> done
  schema -- yes --> listed[Keep index entries whose<br/>.ndjson is readable]
  listed --> changed{Entries dropped?}
  changed -- yes --> rewrite[Rewrite index.json<br/>with retention] --> orphans
  changed -- no --> orphans[Delete .ndjson files<br/>not in the index]
  orphans --> done
```

### Reading back

| JS call | Native work on the queue | Returns |
| --- | --- | --- |
| `listSessions()` | read `index.json` | index entries (JS sorts newest first) |
| `getSessionSummaries(id)` | parse `<id>.ndjson` line by line, project each line to a summary | summaries (JS sorts by `seq`) |
| `getSessionRequest(id, reqId)` | parse `<id>.ndjson`, return the line with that `id` | one full request |
| `deleteSession(id)` | remove the entry from the index, then delete the file | — then JS calls `refreshSessions()` |
| `clearSessions()` | delete the whole folder | — then JS calls `refreshSessions()` |

If a session file is missing or not valid UTF-8 when read, the store removes that session from the index and returns nothing, so a broken session disappears instead of failing every time. Saved-session reads go through the store, never through `SessionStore` state, because JS state holds only the index and the active session.

The request detail screen is shared by live and saved requests. Without a `sessionId` param it reads `NetworkStore` (live traffic); with one it calls `getSessionRequest`.

### What survives what

| Event | Active recording | Saved sessions | JS session state |
| --- | --- | --- | --- |
| Panel closed | keeps recording (red dot on FAB) | kept | kept |
| JS reload (Fast Refresh, Metro reload) | keeps recording in native memory | kept | rebuilt by `init`; the navigator opens on the Recording screen |
| App killed or crashed | **lost** (never written) | kept | — |
| App reinstalled / data cleared | lost | lost | — |
| Library upgrade with a new `schemaVersion` | — | wiped by housekeeping | — |
| Device backup / restore | — | not included (excluded from backup) | — |

The file layout and field reference are in [SESSION_FILE_FORMAT.md](./SESSION_FILE_FORMAT.md).
