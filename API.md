# RESTful API Specifications

The Hono worker exposes a RESTful API routing requests under the `/api` prefix. All endpoints (except setup check) require a valid Firebase ID Token passed in the `Authorization: Bearer <ID_TOKEN>` header.

---

## 1. Setup & Bootstrap Routes

### Check Setup Status
* **Endpoint**: `GET /api/setup/check`
* **Authentication**: None required.
* **Response**:
  ```json
  { "needsSetup": true }
  ```

### Bootstrap System
* **Endpoint**: `POST /api/setup/bootstrap`
* **Authentication**: Valid Firebase Token (will serve as the admin account UID).
* **Body Request**:
  ```json
  {
    "name": "Super Admin Name",
    "companyName": "Corporate Legal Name",
    "location": "HQ Location City"
  }
  ```
* **Response**:
  ```json
  {
    "success": true,
    "message": "System bootstrapped successfully",
    "user": {
      "id": "FIREBASE_UID_123",
      "email": "admin@company.com",
      "name": "Super Admin Name",
      "role": "super_admin"
    }
  }
  ```

---

## 2. Authentication & User Sync

### Sync Current Profile
* **Endpoint**: `GET /api/auth/me`
* **Response**:
  ```json
  {
    "id": "FIREBASE_UID_123",
    "email": "user@company.com",
    "name": "Employee Name",
    "role": "risk_manager",
    "status": "active"
  }
  ```

---

## 3. Risk Assessment Register

### Get All Risks
* **Endpoint**: `GET /api/risks`
* **Response**:
  ```json
  [
    {
      "id": "UUID_RISK_ID",
      "riskId": "RSK-102",
      "title": "Unauthenticated API Database Access",
      "description": "Database system directly exposed to public networks...",
      "assetName": "Oracle database",
      "assetCriticality": "high",
      "inherentScore": 15,
      "residualScore": 4,
      "treatmentStrategy": "mitigate",
      "status": "treating"
    }
  ]
  ```

### Register New Risk Event
* **Endpoint**: `POST /api/risks`
* **Roles Allowed**: `super_admin`, `ciso`, `risk_manager`, `risk_owner`
* **Body Request**:
  ```json
  {
    "riskId": "RSK-102",
    "title": "Unauthenticated API Database Access",
    "description": "Database system directly exposed to public networks...",
    "assetId": "UUID_ASSET_ID",
    "threatId": "UUID_THREAT_ID",
    "vulnerabilityId": "UUID_VULN_ID",
    "inherentImpact": 5,
    "inherentLikelihood": 3,
    "residualImpact": 2,
    "residualLikelihood": 2,
    "treatmentStrategy": "mitigate",
    "riskOwnerId": "USER_ID",
    "status": "treating",
    "controls": [
      {
        "controlName": "VPN Tunnel Binding",
        "controlDescription": "Restrict DB bind adapters to VPN interfaces only",
        "status": "implemented"
      }
    ]
  }
  ```

---

## 4. Evidence Object Coordinator

### Upload Document
* **Endpoint**: `POST /api/evidence/upload`
* **Payload**: `multipart/form-data` containing `file` (max 5MB), and string properties `riskId`, `assetId`, or `treatmentId`.
* **Response**:
  ```json
  {
    "id": "UUID_FILE_ID",
    "name": "security_audit_2026.pdf",
    "size": 1048576,
    "mimeType": "application/pdf"
  }
  ```

### Download Attachment
* **Endpoint**: `GET /api/evidence/:id/download`
* **Response**: Binary file stream with corresponding headers (`Content-Type`, `Content-Disposition`).
