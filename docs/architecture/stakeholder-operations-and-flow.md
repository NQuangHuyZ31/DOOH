# DOOH Stakeholder Operations & Real-World Flow

Comprehensive architectural and operational specification detailing stakeholder responsibilities, CMS interactions, API roles, and edge player hardware behaviors across the DOOH (Digital Out-of-Home) ecosystem.

---

## 1. Stakeholder Matrix & Responsibilities

In real-world DOOH operations, the ecosystem comprises five primary actors interacting with the platform:

| Stakeholder | Real-World Role | CMS Operations | Data Scope & Isolation |
|---|---|---|---|
| **1. Media Owner / Venue Partner** *(Supply Side)* | Owns premium physical real estate (outdoor LED billboards, building facades, shopping malls, elevator LCDs, airport terminals). Installs screens and mounts Android Box/PC hardware. | • Register Venues: Location, GPS coordinates, resolution ($1920 \times 1080, 1080 \times 1920$), operating hours ($06:00 - 22:00$).<br>• Obtain venue `code` and hardware `secret_key` to activate Player app.<br>• Monitor screen health (*Uptime, Heartbeat, hardware metrics*). | Read/write access strictly limited to owned Venues and hardware. Cannot view competitor pricing or external campaigns. |
| **2. Advertiser / Agency** *(Demand Side)* | Brands or media agencies (e.g. FMCG, E-commerce, Auto) launching brand awareness campaigns, product releases, or footfall promotions. | • Create Campaigns and select target venue clusters (by region or screen specs).<br>• Upload media assets (*Creatives: MP4, Image, HTML5, VAST tags*).<br>• Track delivery progress in real time (delivered impressions, % fulfilled).<br>• Download auditable **Proof of Play (PoP)** reports. | Isolated to own Campaigns, Line Items, Creatives, and performance metrics (Multi-tenant Data Isolation). |
| **3. Ad Ops / Media Planner** *(Platform Operator)* | In-house operational team ensuring inventory yield optimization (*Fill Rate*), content compliance, and collision-free ad loop delivery. | • **Creative QA & Verification**: Audit technical specs (H.264 codec, bitrate, aspect ratio, duration) and public compliance prior to **Approval**.<br>• **Scheduling & Pacing**: Create Line Items, set flight dates, daily impression caps, target impressions, and pacing mode (*Evenly* hourly or *ASAP* burst).<br>• **Ad Loop Optimization**: Sequence ad slots via Round-Robin, ensuring brand/industry collision separation within standard $120\text{s} - 300\text{s}$ loops. | Global administrative oversight across all venues, line items, and approval pipelines. |
| **4. Edge Player / Screen Device** *(Field Hardware)* | Dedicated Android Box / Mini PC mounted behind physical LED/LCD screens, connected via HDMI and 4G/Ethernet. | • Runs headless DOOH Web Player client.<br>• Periodically polls fresh Playlists via API.<br>• Preloads media files to local storage.<br>• Executes playback loops and fires automated beacons (*Impression/Complete*). | Bound to assigned `venue_id` authenticated via HMAC `secret_key`. |
| **5. Finance & Auditor** *(Billing & Reconciliation)* | Handles financial reconciliation between Platform, Advertisers, and Media Owners. | • Extract second-accurate **Proof of Play (PoP)** logs.<br>• 3-way reconciliation: Bill Advertisers on verified delivered impressions; disburse revenue share to Media Owners based on screen uptime/play logs. | Read-only access to Report, Invoicing, and Audit Trail modules. |

---

## 2. End-to-End Operational Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Tech as Media Owner / Field Tech
    actor Brand as Advertiser / Agency
    actor Ops as Ad Ops / Platform Operator
    participant CMS as CMS Portal (Laravel + React)
    participant Redis as Redis (Cache, Dedup & Queue)
    participant API as Delivery & Tracking API (Node.js)
    participant Player as Edge Player (Screen Hardware)
    participant DB as MongoDB (Audit Trail & Stats)
    actor Fin as Finance / Auditor

    %% Stage 1: Hardware Onboarding
    Note over Tech,CMS: 1. Screen & Venue Onboarding
    Tech->>CMS: Register Venue (GPS, 1920x1080, Operating Hours: 06:00-22:00)
    CMS-->>Tech: Issue Venue Code + Hardware secret_key
    Tech->>Player: Install Player App & authenticate with secret_key
    Player->>API: Send periodic heartbeats (Uptime & telemetry)

    %% Stage 2 & 3: Booking & Campaign Setup
    Note over Brand,Ops: 2 & 3. Campaign Booking & Pacing Setup
    Brand->>CMS: Create Campaign & upload MP4 Creative (15s)
    CMS->>CMS: Automated format validation (codec, bitrate, resolution)
    Ops->>CMS: Review & Approve Creative; Configure Line Item
    Ops->>CMS: Set: 7 days flight, Daily Cap: 1,000 imps/day, Pacing: Evenly

    %% Stage 4: Distribution & Field Playback
    Note over Player,API: 4. Playlist Ingestion & Live Playback
    loop Every 2 - 5 minutes
        Player->>API: GET /api/v1/delivery/playlist?venue_id=...
        API->>Redis: Check real-time daily caps & pacing counters
        API-->>Player: Return Playlist JSON (Media URLs + Encrypted Opaque Tokens :hash)
        Player->>Player: Preload assets to local cache & play sequential loop
        Player->>API: Start playback -> Fire Impression Beacon (/imp/:hash)
        API-->>Player: Immediate HTTP 204 No Content (< 3ms)
        API->>Redis: Dedup SETNX, atomic counter increment, push to raw queue
        Player->>API: Complete 100% video -> Fire Complete Beacon (/complete/:hash)
    end

    %% Stage 5: Proof of Play & Billing
    Note over Fin,Brand: 5. Proof of Play & Reconciliation
    API->>DB: Batch worker flushes queue to tracking_logs every 3-5s
    Fin->>CMS: Generate Proof of Play report (timestamp-accurate audit logs)
    CMS-->>Brand: Settlement invoice based on verified delivered impressions
    CMS-->>Tech: Revenue share disbursement to Media Owner
```

---

## 3. Component Deep Dive: API & Hardware Responsibilities

### 3.1. CMS Platform (Laravel 11/12 + React AntD)
* **Administrative Operations:** CRUD management of Venues, Advertisers, Campaigns, Line Items, and Creative media libraries.
* **Automated Asset Validation:** Immediate rejection of invalid video codecs, bitrates, aspect ratios, or duration mismatches upon upload.
* **Approval Pipeline:** Strict state machine enforcement: `draft` $\rightarrow$ `pending_review` $\rightarrow$ `approved` / `rejected`. Unapproved creatives are strictly excluded from playlist generation.
* **CMS Screen Simulator:** Renders real-time simulation mockups (16:9 landscape / 9:16 portrait LED frames) with live countdown timers and beacon inspection before physical field release.

### 3.2. Delivery & Tracking Engine (Pure Node.js + Redis)
Decoupled from CMS backend to achieve ultra-low latency under high concurrency across thousands of physical screens:
1. **Endpoint `GET /api/v1/delivery/playlist`:**
   * Reads real-time daily impression counts from Redis memory.
   * Excludes Line Items that have reached `daily_impression_cap` to prevent over-delivery.
   * Generates AES-256-GCM encrypted **Opaque Tokens (`:hash`)** encoding `{venue_id, line_item_id, timestamp}`. The edge player uses this token in tracking URLs without client-side cryptographic overhead or token tampering risks.
2. **Endpoints `GET /api/v1/log/imp/:hash` and `GET /api/v1/log/complete/:hash`:**
   * **Latency Guarantee:** Responds in **$< 3\text{ms}$** with `HTTP 204 No Content`.
   * **Anti-Fraud & Deduplication:** Executes `SET dedup:{hash} 1 EX 30 NX` in Redis. Duplicate beacons within the sliding 30-second window are dropped.
   * **Atomic Counter:** Increments real-time pacing counter via `HINCRBY stat:{date}:{line_item_id}:{venue_id} imp 1`.
   * **In-Memory Buffer:** Pushes audit payload to `RPUSH queue:tracking_logs`.
3. **Background Batch Worker:**
   * Scans `queue:tracking_logs` every 3–5 seconds.
   * Executes `bulkWrite` operations into MongoDB (`tracking_logs` audit trail and `daily_aggregated_reports`), eliminating heavy database I/O from the synchronous HTTP request path.

### 3.3. Edge Screen Hardware (Headless Player Client)
* **Asset Preloading:** Never streams media directly over mobile networks. The player downloads all media files locally before playback slot transition, preventing black screens or buffering glitches.
* **Offline Resiliency:** When field network drops (common in outdoor 4G/LTE environments):
  * The player continues continuous playback using the cached playlist.
  * Beacon URLs are enqueued in `localStorage` or `IndexedDB`.
  * Once connectivity is restored, the player automatically replays queued beacons in chronological batches.

---

## 4. Verification & Settlement (Proof of Play - PoP)

In DOOH, physical auditable proof of play serves as the contractual baseline for billing:
1. **Timestamped Evidence:** Granular logs documenting exact second, venue identifier, and creative displayed.
2. **Video Completion Rate:** Ratio of 100% completed video plays (`complete` beacons) versus rendered impressions (`impression` beacons).
3. **Contractual Reconciliation:** Discrepancy comparison between committed contractual targets and verified delivered plays to settle final billing invoices.
