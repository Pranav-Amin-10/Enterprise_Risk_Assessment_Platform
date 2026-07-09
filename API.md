# RESTful API Specifications & Endpoints Guide

The Aegis GRC backend server runs a high-performance Hono API route engine prefixing all endpoints with `/api`. 

This document details request payload schemas, HTTP status codes, role authorizations, and response payloads for both technical developers integrating third-party software and non-technical managers reviewing system workflows.

---

## 🔒 Global Security & Headers
Every request (except `/api/setup/check`) must pass a valid authorization token in the request headers:

| Header | Value Type | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <Firebase_ID_Token>` | Secures endpoints at the edge. The worker validates the JWT signature and extracts the user UID. |
| `Content-Type` | `application/json` | Enforces JSON formats. *(Required for POST and PUT requests).* |

---

## 🧭 Endpoint Access Control Matrix

The platform checks user permissions before fulfilling API actions. Here is the REST route restriction grid:

| Route Path | Method | Allowed Roles | Scoping Behavior |
| :--- | :---: | :--- | :--- |
| `/api/setup/*` | POST/GET | Public / Super Admin | Activates GRC environment |
| `/api/auth/me` | GET | All Authenticated Users | Resolves user profile details |
| `/api/orgs` | GET | All Roles | Lists company branches |
| `/api/orgs` | POST/PUT/DELETE | `super_admin`, `ciso` | Alters department hierarchy nodes |
| `/api/users` | GET | `super_admin`, `ciso`, `auditor` | Returns employee directories |
| `/api/users` | POST/PUT/DELETE | `super_admin`, `ciso` | Manages employee accounts |
| `/api/assets` | GET | All Roles | **Department Head:** Filtered by department scope |
| `/api/assets` | POST/PUT/DELETE | `super_admin`, `ciso`, `risk_manager`, `asset_owner` | Manages server and database inventories |
| `/api/risks` | GET | All Roles | **Department Head:** Filtered by department scope |
| `/api/risks` | POST/PUT/DELETE | `super_admin`, `ciso`, `risk_manager`, `risk_owner` | Manages risk items and controls |
| `/api/treatments` | GET | All Roles | **Department Head:** Filtered by department scope |
| `/api/treatments` | POST/PUT/DELETE | `super_admin`, `ciso`, `risk_manager`, `risk_owner` | Manages treatment and remediation plans |
| `/api/evidence/*` | POST/GET | `super_admin`, `ciso`, `risk_manager`, `risk_owner`, `asset_owner` | Uploads/downloads audit attachment files |
| `/api/audit-logs` | GET | `super_admin`, `ciso`, `auditor` | Returns immutable operation logs |

---

## 1. Setup & System Bootstrapping

### Check Setup Status
Checks if the D1 database is empty or requires bootstrapping.
* **HTTP Method**: `GET`
* **Route**: `/api/setup/check`
* **Authentication**: None
* **Sample Response (Needs Setup)**:
  ```json
  { "needsSetup": true }
  ```

### Bootstrap System (Zero Configuration Launch)
Registers the first company organizational node, seeds the threats/vulnerabilities libraries, and provisions the initial Super Admin.
* **HTTP Method**: `POST`
* **Route**: `/api/setup/bootstrap`
* **Authentication**: Valid Firebase Token (registers this token UUID as Super Admin).
* **Request Body**:
  ```json
  {
    "name": "Alex Mercer",
    "companyName": "Initech Systems Ltd",
    "location": "Dallas HQ Office"
  }
  ```
* **Sample Response**:
  ```json
  {
    "success": true,
    "message": "System bootstrapped successfully",
    "user": {
      "id": "firebase-uid-alex-mercer",
      "email": "alex.mercer@initech.com",
      "name": "Alex Mercer",
      "role": "super_admin"
    }
  }
  ```

---

## 2. Profile Sync & User Management

### Sync Current Profile
Gets details of the currently signed-in user.
* **HTTP Method**: `GET`
* **Route**: `/api/auth/me`
* **Sample Response**:
  ```json
  {
    "id": "firebase-uid-alex-mercer",
    "email": "alex.mercer@initech.com",
    "name": "Alex Mercer",
    "role": "super_admin",
    "status": "active",
    "departmentId": null
  }
  ```

### Pre-Register / Update Employee Account
Pre-authorizes an email address with a specific RBAC role.
* **HTTP Method**: `POST` or `PUT` (for updates)
* **Route**: `/api/users` / `/api/users/:id`
* **Request Body**:
  ```json
  {
    "email": "john.doe@initech.com",
    "name": "John Doe",
    "role": "department_head",
    "status": "active",
    "departmentId": "org-infra-uuid"
  }
  ```
* **Sample Response**:
  ```json
  {
    "id": "d1-pk-temp-uuid-or-firebase-uid",
    "email": "john.doe@initech.com",
    "name": "John Doe",
    "role": "department_head",
    "status": "active",
    "departmentId": "org-infra-uuid",
    "createdAt": 1783452391290
  }
  ```

---

## 3. Asset Inventory Endpoints

### Get Asset List
Returns the inventory of hardware, software, databases, or API components.
* **HTTP Method**: `GET`
* **Route**: `/api/assets`
* **Sample Response**:
  ```json
  [
    {
      "id": "asset-uuid-001",
      "assetId": "AST-101",
      "name": "Oracle Production DB",
      "type": "database",
      "criticality": "critical",
      "ciaConfidentiality": 3,
      "ciaIntegrity": 3,
      "ciaAvailability": 3,
      "dataClassification": "restricted",
      "businessOwnerId": "mock-user-456",
      "technicalOwnerId": "mock-user-123",
      "departmentId": "org-infra-uuid",
      "description": "Core financial transactional database hosting billing history."
    }
  ]
  ```

### Create / Update Asset
Saves a new asset record or edits an existing one.
* **HTTP Method**: `POST` or `PUT`
* **Route**: `/api/assets` / `/api/assets/:id`
* **Request Body**:
  ```json
  {
    "assetId": "AST-102",
    "name": "AWS S3 Assets Bucket",
    "type": "cloud_storage",
    "criticality": "high",
    "ciaConfidentiality": 2,
    "ciaIntegrity": 3,
    "ciaAvailability": 2,
    "dataClassification": "confidential",
    "businessOwnerId": "mock-user-789",
    "technicalOwnerId": "mock-user-123",
    "departmentId": "org-infra-uuid",
    "description": "Public attachments storage."
  }
  ```

---

## 4. Risk Register Endpoints

### Get Risk Register
Returns the list of identified risk entries.
* **HTTP Method**: `GET`
* **Route**: `/api/risks`
* **Sample Response**:
  ```json
  [
    {
      "id": "risk-uuid-001",
      "riskId": "RSK-101",
      "title": "Database Exposed on Public Port",
      "description": "Oracle database firewalls permit public connections on port 1521.",
      "assetId": "asset-uuid-001",
      "assetName": "Oracle Production DB",
      "assetCriticality": "critical",
      "inherentScore": 20,
      "residualScore": 3,
      "treatmentStrategy": "mitigate",
      "riskOwnerId": "user-uuid-123",
      "status": "treating",
      "controls": [
        { "controlName": "VPN Tunneling", "controlDescription": "Restrict bindings", "status": "implemented" }
      ]
    }
  ]
  ```

### Create / Update Risk Record
Registers a risk event. Calculating inherent and residual scores is done automatically by Hono based on inputs.
* **HTTP Method**: `POST` or `PUT`
* **Route**: `/api/risks` / `/api/risks/:id`
* **Request Body**:
  ```json
  {
    "riskId": "RSK-101",
    "title": "Database Exposed on Public Port",
    "description": "Oracle production server firewalls allow public connections on port 1521.",
    "assetId": "asset-uuid-001",
    "threatId": "threat-uuid-ransomware",
    "vulnerabilityId": "vuln-uuid-exposed-port",
    "inherentImpact": 5,
    "inherentLikelihood": 4,
    "residualImpact": 3,
    "residualLikelihood": 1,
    "treatmentStrategy": "mitigate",
    "riskOwnerId": "user-uuid-123",
    "status": "treating",
    "controls": [
      {
        "controlName": "IP Whitelisting",
        "controlDescription": "Only allow connections from corporate VPN subnets",
        "status": "implemented"
      }
    ]
  }
  ```

---

## 5. Audit Evidence Attachments

### Upload Evidence Document
Attaches PDF or image documents as supporting evidence for a risk, asset, or treatment.
* **HTTP Method**: `POST`
* **Route**: `/api/evidence/upload`
* **Payload Format**: `multipart/form-data`
* **Form Parameters**:
  * `file`: The document payload binary (maximum 5MB).
  * `riskId` (Optional): Mapped risk uuid.
  * `assetId` (Optional): Mapped asset uuid.
  * `treatmentId` (Optional): Mapped treatment uuid.
* **Sample Response**:
  ```json
  {
    "id": "file-uuid-789",
    "name": "network_audit_2026.pdf",
    "size": 1048576,
    "mimeType": "application/pdf"
  }
  ```

### Download Document
Fetches the file binary content.
* **HTTP Method**: `GET`
* **Route**: `/api/evidence/:id/download`
* **Response Headers**:
  * `Content-Type`: Matches uploaded MIME (e.g. `application/pdf`).
  * `Content-Disposition`: `attachment; filename="network_audit_2026.pdf"`

---

## 6. Dashboard Aggregation Analytics

### Get Dashboard Statistics
Returns aggregated metrics for rendering the executive dashboards and interactive charts.
* **HTTP Method**: `GET`
* **Route**: `/api/dashboard/stats`
* **Sample Response**:
  ```json
  {
    "summary": {
      "totalRisks": 6,
      "openRisks": 3,
      "treatingRisks": 3,
      "mitigatedRisks": 3,
      "complianceIndex": 50,
      "highRisks": 4,
      "activeTreatments": 3
    },
    "heatmaps": {
      "inherent": [
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 1, 1],
        [0, 0, 0, 2, 2]
      ]
    },
    "risksByDepartment": [
      { "department": "Cloud Infrastructure", "count": 3 },
      { "department": "Information Security", "count": 2 }
    ],
    "risksByAssetType": [
      { "assetType": "database", "count": 2 },
      { "assetType": "server", "count": 2 }
    ],
    "topRisks": [
      { "id": "r-01", "riskId": "RSK-101", "title": "Database Exposed on Public Port", "inherentScore": 20, "residualScore": 3, "status": "treating" }
    ]
  }
  ```
