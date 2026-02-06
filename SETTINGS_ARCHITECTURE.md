# HyFern Settings Architecture

## Component Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER ACCESS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ADMIN+ Role                          OWNER Role Only            │
│  ├─ /settings                         ├─ /settings/jvm          │
│  │  └─ Server Config                  │  └─ JVM Config           │
│  │                                     │                          │
└──┴─────────────────────────────────────┴──────────────────────────┘
       │                                         │
       │                                         │
       ▼                                         ▼
┌─────────────────────┐              ┌─────────────────────┐
│  settings/page.tsx  │              │settings/jvm/page.tsx│
│  ┌───────────────┐  │              │  ┌───────────────┐  │
│  │ DashboardShell│  │              │  │ DashboardShell│  │
│  └───────────────┘  │              │  └───────────────┘  │
│         │           │              │         │           │
│         ▼           │              │         ▼           │
│  ┌───────────────┐  │              │  ┌───────────────┐  │
│  │settings-content│ │              │  │ jvm-settings- │  │
│  │               │  │              │  │   content     │  │
│  └───────────────┘  │              │  └───────────────┘  │
└─────────┬───────────┘              └─────────┬───────────┘
          │                                    │
          ▼                                    ▼
┌─────────────────────┐              ┌─────────────────────┐
│  ConfigEditor       │              │  JVMConfigurator    │
│  ┌───────────────┐  │              │  ┌───────────────┐  │
│  │ ServerName    │  │              │  │ Memory Config │  │
│  │ MOTD          │  │              │  │ GC Selector   │  │
│  │ Password      │  │              │  │ Optimizations │  │
│  │ MaxPlayers    │  │              │  │ Presets       │  │
│  │ MaxViewRadius │  │              │  └───────────────┘  │
│  └───────────────┘  │              └─────────┬───────────┘
└─────────┬───────────┘                        │
          │                                    │
          │                              ┌─────┴─────┐
          │                              │           │
          │                              ▼           ▼
          │                    ┌──────────────┐  ┌────────────┐
          │                    │ LiveMetrics  │  │  Presets   │
          │                    │ ┌──────────┐ │  │  - Casual  │
          │                    │ │Heap Usage│ │  │  - Commty  │
          │                    │ │   TPS    │ │  │  - Perf    │
          │                    │ │GC Stats  │ │  │  - Ultra   │
          │                    │ │ViewDist  │ │  └────────────┘
          │                    │ └──────────┘ │
          │                    └──────┬───────┘
          │                           │
          │                           │
          ▼                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  /api/server/config     /api/jvm          /api/server/metrics   │
│  ┌─────────────────┐   ┌──────────────┐  ┌──────────────────┐  │
│  │ GET: Read config│   │ GET: Read JVM│  │ GET: Live Metrics│  │
│  │ PUT: Write cfg  │   │ PUT: Save JVM│  │ (Prometheus)     │  │
│  │ ADMIN+ required │   │ OWNER only   │  │ ADMIN+ required  │  │
│  └────────┬────────┘   └──────┬───────┘  └────────┬─────────┘  │
└───────────┼────────────────────┼──────────────────┼─────────────┘
            │                    │                  │
            ▼                    ▼                  ▼
┌─────────────────┐   ┌──────────────────┐   ┌──────────────┐
│  WingsClient    │   │  PelicanClient   │   │ Prometheus   │
│  ┌───────────┐  │   │  ┌────────────┐  │   │  ┌────────┐  │
│  │ getFile   │  │   │  │getStartup  │  │   │  │ Heap   │  │
│  │ writeFile │  │   │  │Variables   │  │   │  │ GC     │  │
│  └───────────┘  │   │  │updateJVM   │  │   │  │ TPS    │  │
└────────┬────────┘   │  │Flags       │  │   │  └────────┘  │
         │            │  └────────────┘  │   └──────────────┘
         ▼            └─────────┬────────┘
┌─────────────────┐            │
│ Wings API       │            ▼
│ (Pterodactyl)   │   ┌──────────────────┐
│  ┌───────────┐  │   │ Pelican Panel API│
│  │/files/... │  │   │  ┌────────────┐  │
│  │config.json│  │   │  │/startup/...│  │
│  └───────────┘  │   │  │STARTUP var │  │
└─────────────────┘   │  └────────────┘  │
                      └──────────────────┘
```

## Data Flow

### Server Configuration Flow
```
User Input → ConfigEditor → /api/server/config (PUT)
    → WingsClient.writeFile() → Wings API → config.json
    → Response → "Restart Required" Banner
```

### JVM Configuration Flow
```
User Input → JVMConfigurator → /api/jvm (PUT)
    → jvmConfigToFlags() → PelicanClient.updateJVMFlags()
    → Pelican API → STARTUP variable
    → Response → "Restart Required" Banner
```

### Preset Application Flow
```
Preset Button → onApplyPreset() → /api/jvm (PUT with preset)
    → JVM_PRESETS[preset].config → jvmConfigToFlags()
    → PelicanClient.updateJVMFlags() → Pelican API
    → Response → UI Update + "Restart Required"
```

### Live Metrics Flow
```
LiveMetrics (SWR 5s) → /api/server/metrics (GET)
    → Prometheus queries → Parse results
    → JVMMetrics → UI Cards Update
```

## Role-Based Access Control

```
┌──────────────────────────────────────────────────────────┐
│                    ROLE HIERARCHY                         │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  OWNER (Level 4)                                          │
│  ├─ All ADMIN permissions                                 │
│  ├─ JVM Configuration (exclusive)                         │
│  └─ Server reinstall/rebuild                              │
│                                                            │
│  ADMIN (Level 3)                                          │
│  ├─ All MODERATOR permissions                             │
│  ├─ Server Configuration                                  │
│  ├─ Live Metrics                                          │
│  ├─ Server power controls                                 │
│  └─ Console access                                        │
│                                                            │
│  MODERATOR (Level 2)                                      │
│  ├─ View-only access                                      │
│  └─ Basic monitoring                                      │
│                                                            │
│  VIEWER (Level 1)                                         │
│  └─ Read-only dashboard                                   │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

## Component Dependencies

```
ConfigEditor
├─ Button
├─ Input
├─ Textarea
├─ Label
├─ Slider
├─ Card
└─ toast (sonner)

JVMConfigurator
├─ Button
├─ Label
├─ Slider
├─ Switch
├─ Textarea
├─ Card
├─ Tabs
├─ Badge
└─ toast (sonner)

LiveMetrics
├─ Card
├─ Progress
├─ Badge
└─ useSWR
```

## Type System

```
JVMConfig
├─ minMemory: number (1-32)
├─ maxMemory: number (1-32)
├─ gcType: 'G1GC' | 'ZGC'
├─ maxGCPauseMillis: number (50-1000)
├─ parallelRefProc: boolean
├─ useAOTCache: boolean
├─ enableBackups: boolean
├─ enableSentry: boolean
└─ customFlags: string

JVMPreset = 'casual' | 'community' | 'performance' | 'ultra'

JVMMetrics
├─ heapUsed: number (MB)
├─ heapMax: number (MB)
├─ heapUsedPercent: number
├─ gcPauseTimeMs: number
├─ gcCount: number
├─ tps: { current, average, min, max }
├─ viewDistance: { configured, effective }
└─ timestamp: number
```

## Environment Variables

```
WINGS_API_URL ──────────┐
WINGS_API_KEY ──────────┼──> WingsClient (config.json)
WINGS_SERVER_UUID ──────┘

PELICAN_API_URL ────────┐
PELICAN_API_KEY ────────┼──> PelicanClient (JVM flags)
PELICAN_SERVER_UUID ────┘

PROMETHEUS_URL ─────────┐
PROMETHEUS_JOB ─────────┴──> Live Metrics

DATABASE_URL ───────────────> Prisma (Auth)
NEXTAUTH_SECRET ────────────> NextAuth
REDIS_URL ──────────────────> Rate Limiting
```

## Error Handling

```
API Route Error Flow:
1. Try-Catch around all operations
2. Check authentication (401)
3. Check permissions (403)
4. Validate inputs (400)
5. Handle API errors (500)
6. Return structured error response

Client Error Flow:
1. Try-Catch in async handlers
2. Display error toast
3. Keep form in current state
4. Log to console for debugging
5. Show user-friendly message
```
