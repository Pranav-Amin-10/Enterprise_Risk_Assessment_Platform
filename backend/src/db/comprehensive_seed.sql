-- Aegis GRC Platform Comprehensive Training & Practice Dataset
-- Populates Organizations, Users, Assets, Threats, Vulnerabilities, Risks, Controls, Treatments, Audits, Notifications

-- 1. Departments & Business Units
INSERT OR IGNORE INTO organizations (id, name, type, parent_id, location, created_at, updated_at) VALUES
('org-it-01', 'Information Technology', 'department', '8d61c22e-9126-4c40-b47b-a4b1b666b585', 'Dallas HQ', unixepoch(), unixepoch()),
('org-sec-02', 'Information Security & Compliance (SOC)', 'department', '8d61c22e-9126-4c40-b47b-a4b1b666b585', 'Dallas HQ', unixepoch(), unixepoch()),
('org-fin-03', 'Finance & Accounting', 'department', '8d61c22e-9126-4c40-b47b-a4b1b666b585', 'New York Branch', unixepoch(), unixepoch()),
('org-eng-04', 'Product & Platform Engineering', 'department', '8d61c22e-9126-4c40-b47b-a4b1b666b585', 'San Francisco Hub', unixepoch(), unixepoch()),
('org-hr-05', 'People Operations & Legal', 'department', '8d61c22e-9126-4c40-b47b-a4b1b666b585', 'Dallas HQ', unixepoch(), unixepoch()),
('org-cloud-06', 'Cloud Infrastructure & DevOps', 'team', 'org-it-01', 'Remote / US-East', unixepoch(), unixepoch());

-- 2. Team Members & GRC Role Personas
INSERT OR IGNORE INTO users (id, email, name, role, status, created_at, updated_at) VALUES
('usr-ciso-01', 'sarah.chen@enterprise.io', 'Sarah Chen', 'ciso', 'active', unixepoch(), unixepoch()),
('usr-rm-02', 'marcus.vance@enterprise.io', 'Marcus Vance', 'risk_manager', 'active', unixepoch(), unixepoch()),
('usr-aud-03', 'elena.rostova@auditpartners.com', 'Elena Rostova', 'auditor', 'active', unixepoch(), unixepoch()),
('usr-ao-04', 'david.kim@enterprise.io', 'David Kim', 'asset_owner', 'active', unixepoch(), unixepoch()),
('usr-ro-05', 'alicia.mendez@enterprise.io', 'Alicia Mendez', 'risk_owner', 'active', unixepoch(), unixepoch()),
('usr-dh-06', 'robert.sterling@enterprise.io', 'Robert Sterling', 'department_head', 'active', unixepoch(), unixepoch()),
('usr-vw-07', 'rachel.green@enterprise.io', 'Rachel Green', 'viewer', 'active', unixepoch(), unixepoch());

-- 3. User-Organization Departmental Linkages
INSERT OR IGNORE INTO user_organizations (user_id, organization_id) VALUES
('8DixxdSqlENeXF4VYN3qKcoaX873', '8d61c22e-9126-4c40-b47b-a4b1b666b585'),
('usr-ciso-01', 'org-sec-02'),
('usr-rm-02', 'org-sec-02'),
('usr-ao-04', 'org-it-01'),
('usr-ro-05', 'org-eng-04'),
('usr-dh-06', 'org-fin-03'),
('usr-vw-07', '8d61c22e-9126-4c40-b47b-a4b1b666b585');

-- 4. Expanded Cyber Threat Library
INSERT OR IGNORE INTO threats (id, threat_id, name, description, category, is_custom, created_at) VALUES
('t3', 'THR-003', 'Insider Threat', 'A security risk that originates from within the targeted organization (e.g. employees, former employees, contractors).', 'Internal Risk', 0, unixepoch()),
('t4', 'THR-004', 'Supply Chain Compromise', 'An attack that targets less-secure elements in the supply network to compromise the ultimate target.', 'Third-Party Risk', 0, unixepoch()),
('t5', 'THR-005', 'Zero-Day Exploit', 'An attack that exploits a previously unknown software vulnerability before a patch or security fix is available.', 'Exploitation', 0, unixepoch()),
('t6', 'THR-006', 'Distributed Denial of Service (DDoS)', 'Network flooding attack designed to overwhelm web endpoints, causing service outage.', 'Network Threat', 0, unixepoch()),
('t7', 'THR-007', 'Credential Stuffing & Brute Force', 'Automated injection of stolen credentials to gain unauthorized access to accounts.', 'Identity Theft', 0, unixepoch()),
('t8', 'THR-008', 'Cloud Storage Misconfiguration', 'Publicly accessible cloud storage volumes exposing sensitive corporate or customer documents.', 'Infrastructure Risk', 0, unixepoch()),
('t9', 'THR-009', 'Business Email Compromise (BEC)', 'Sophisticated social engineering scam targeting finance personnel to execute fraudulent transactions.', 'Social Engineering', 0, unixepoch()),
('t10', 'THR-010', 'SQL Injection & Data Exfiltration', 'Malicious SQL statements injected into input fields to bypass firewalls and dump relational databases.', 'Application Attack', 0, unixepoch()),
('t11', 'THR-011', 'Man-in-the-Middle (MitM) Eavesdropping', 'Interception of unencrypted network traffic traversing public or compromised wireless routers.', 'Network Threat', 0, unixepoch()),
('t12', 'THR-012', 'API Key & Secret Leakage', 'Inadvertent commit of cloud credentials or cryptographic keys into public version control repositories.', 'DevOps & Code Risk', 0, unixepoch());

-- 5. Expanded Vulnerability Catalog
INSERT OR IGNORE INTO vulnerabilities (id, vuln_id, name, description, severity, is_custom, created_at) VALUES
('v1', 'VUL-001', 'Missing Multi-Factor Authentication (MFA)', 'No multi-factor authentication enforced on critical user administrative access points.', 'critical', 0, unixepoch()),
('v2', 'VUL-002', 'Weak/Default Passwords', 'System or application utilizes default credentials or does not enforce a strong password complexity policy.', 'critical', 0, unixepoch()),
('v3', 'VUL-003', 'Unpatched Known CVE in Production Services', 'Presence of known vulnerabilities in outdated operating systems and software packages.', 'high', 0, unixepoch()),
('v4', 'VUL-004', 'Overly Permissive Network Firewall Rule (0.0.0.0/0)', 'Firewall rules permit unrestricted inbound access to internal ports from arbitrary public IP addresses.', 'high', 0, unixepoch()),
('v5', 'VUL-005', 'Exposed Production Database Without Bastion', 'Database servers directly binding to public network adapters without encrypted VPN tunnels.', 'critical', 0, unixepoch()),
('v6', 'VUL-006', 'Missing Endpoint Protection (EDR)', 'Staff workstations or servers lack security agent monitoring for malware detection and activity logging.', 'high', 0, unixepoch()),
('v7', 'VUL-007', 'Unencrypted Sensitive Customer PII at Rest', 'Confidential customer records, logs, or databases stored on disk volumes without hardware/software encryption.', 'medium', 0, unixepoch()),
('v8', 'VUL-008', 'Inadequate Logging and Audit Trails', 'Lack of centralized event log collection preventing security analysts from auditing access logs.', 'medium', 0, unixepoch()),
('v9', 'VUL-009', 'Broken Object-Level Authorization (BOLA) in REST API', 'API endpoints failing to validate whether the requesting user owns the requested entity ID.', 'high', 0, unixepoch()),
('v10', 'VUL-010', 'Absence of Automated Disaster Recovery Backups', 'Production data lacks geographically distributed, immutable point-in-time recovery copies.', 'critical', 0, unixepoch()),
('v11', 'VUL-011', 'Hardcoded API Secrets in Client-Side JavaScript', 'Static client bundles contain sensitive third-party service tokens and signing keys.', 'critical', 0, unixepoch()),
('v12', 'VUL-012', 'Absence of Third-Party Vendor SOC 2 Attestation', 'Critical SaaS vendors have not undergone independent security controls verification.', 'medium', 0, unixepoch());

-- 6. Information Asset Inventory
INSERT OR IGNORE INTO assets (id, asset_id, name, description, type, business_owner_id, technical_owner_id, department_id, criticality, cia_confidentiality, cia_integrity, cia_availability, asset_value, data_classification, lifecycle_status, tags, review_date, created_at, updated_at) VALUES
('ast-01', 'AST-001', 'Production PostgreSQL Database Cluster', 'Primary transactional database storing customer financial records, accounts, and ledger data.', 'database', 'usr-dh-06', 'usr-ao-04', 'org-it-01', 'critical', 3, 3, 3, 250000.0, 'restricted', 'active', 'pci-dss, core-db, financial', unixepoch() + 7776000, unixepoch(), unixepoch()),
('ast-02', 'AST-002', 'Enterprise REST API Gateway', 'Central API microservice router powering mobile apps, partner integrations, and web portals.', 'api', 'usr-ro-05', 'usr-ao-04', 'org-eng-04', 'critical', 3, 3, 3, 120000.0, 'confidential', 'active', 'cloud, edge, api-gateway', unixepoch() + 5184000, unixepoch(), unixepoch()),
('ast-03', 'AST-003', 'Corporate Web Banking & Client Portal', 'Customer-facing web application enabling self-service wire transactions and reporting.', 'application', 'usr-dh-06', 'usr-ro-05', 'org-fin-03', 'critical', 3, 3, 3, 350000.0, 'restricted', 'active', 'customer-facing, pci-dss, web', unixepoch() + 6048000, unixepoch(), unixepoch()),
('ast-04', 'AST-004', 'Cloudflare Edge Workers & Pages CDN', 'Serverless edge compute platform hosting API routing and web application distributions.', 'cloud_resource', 'usr-ao-04', 'usr-ao-04', 'org-cloud-06', 'high', 2, 3, 3, 85000.0, 'confidential', 'active', 'cloudflare, serverless, edge', unixepoch() + 10368000, unixepoch(), unixepoch()),
('ast-05', 'AST-005', 'Human Resources Payroll & Benefits System', 'SaaS platform processing employee salaries, health insurance, and tax records.', 'application', 'usr-ciso-01', 'usr-ao-04', 'org-hr-05', 'high', 3, 3, 2, 60000.0, 'confidential', 'active', 'hr, payroll, pii', unixepoch() + 4320000, unixepoch(), unixepoch()),
('ast-06', 'AST-006', 'Active Directory & Okta Identity Provider (IdP)', 'Centralized identity provider managing corporate single sign-on and directory access.', 'server', 'usr-ciso-01', 'usr-ao-04', 'org-sec-02', 'critical', 3, 3, 3, 180000.0, 'restricted', 'active', 'iam, sso, zero-trust', unixepoch() + 2592000, unixepoch(), unixepoch()),
('ast-07', 'AST-007', 'Analytical Data Lake (S3 & Snowflake)', 'Petabyte-scale analytical warehouse storing aggregated historical user behavior telemetry.', 'cloud_resource', 'usr-ro-05', 'usr-ao-04', 'org-eng-04', 'medium', 2, 2, 2, 45000.0, 'internal', 'active', 'analytics, data-lake, bi', unixepoch() + 12096000, unixepoch(), unixepoch()),
('ast-08', 'AST-008', 'Executive & Engineering Workstations (Fleet)', 'Managed Apple MacBook Pro and Dell laptops deployed to remote employees.', 'endpoint', 'usr-ciso-01', 'usr-ao-04', 'org-it-01', 'high', 3, 2, 2, 75000.0, 'confidential', 'active', 'endpoints, laptops, mdm', unixepoch() + 3456000, unixepoch(), unixepoch());

-- 7. Realistic Qualitative Risk Assessments (Covering 5x5 Matrix)
INSERT OR IGNORE INTO risks (id, risk_id, title, description, asset_id, threat_id, vulnerability_id, inherent_impact, inherent_likelihood, inherent_score, residual_impact, residual_likelihood, residual_score, treatment_strategy, risk_owner_id, status, review_date, notes, created_at, updated_at) VALUES
('rsk-01', 'RSK-001', 'Ransomware Encryption of Production Database', 'Adversaries compromise network edge and deploy ransomware payload on primary database volumes.', 'ast-01', '11e9834f-f1f6-402b-955c-ab5d72622cb0', 'v3', 5, 4, 20, 3, 2, 6, 'mitigate', 'usr-ro-05', 'treating', unixepoch() + 2592000, 'Requires hourly immutable snapshots and network micro-segmentation.', unixepoch(), unixepoch()),
('rsk-02', 'RSK-002', 'Customer Financial PII Exfiltration via Broken API Auth', 'Attackers manipulate URL account IDs in REST API endpoints to harvest unauthorized banking profiles.', 'ast-02', 't10', 'v9', 5, 3, 15, 2, 2, 4, 'mitigate', 'usr-ro-05', 'treating', unixepoch() + 1814400, 'Implementing automated integration tests verifying object-level tenant ownership.', unixepoch(), unixepoch()),
('rsk-03', 'RSK-003', 'Privileged Identity Takeover via Phishing & Lack of MFA', 'Administrative credentials harvested through spear-phishing campaign enabling domain compromise.', 'ast-06', '9526ec17-87b0-41e1-bd51-78d5c38dba83', 'v1', 5, 4, 20, 3, 1, 3, 'mitigate', 'usr-ciso-01', 'mitigated', unixepoch() + 5184000, 'FIDO2 hardware security keys (YubiKeys) mandated for all administrative accounts.', unixepoch(), unixepoch()),
('rsk-04', 'RSK-004', 'Wire Transfer Fraud via Business Email Compromise (BEC)', 'Spoofed executive email instructs finance clerk to execute emergency vendor wire transfer.', 'ast-03', 't9', 'v2', 4, 4, 16, 2, 2, 4, 'mitigate', 'usr-dh-06', 'treating', unixepoch() + 1209600, 'Dual-authorization verbal callback policy implemented for all transfers over $10,000.', unixepoch(), unixepoch()),
('rsk-05', 'RSK-005', 'Public Internet Exposure of Analytical Cloud Storage', 'Engineers mistakenly configure cloud storage ACLs to public-read during pipeline debugging.', 'ast-07', 't8', 'v4', 4, 3, 12, 2, 1, 2, 'mitigate', 'usr-ao-04', 'closed', unixepoch() + 7776000, 'AWS S3 Public Access Block enforced organization-wide via Service Control Policies.', unixepoch(), unixepoch()),
('rsk-06', 'RSK-006', 'Distributed Denial of Service (DDoS) on Banking Portal', 'Volumetric network attack saturates web server bandwidth causing prolonged customer downtime.', 'ast-03', 't6', 'v8', 4, 3, 12, 2, 2, 4, 'transfer', 'usr-ao-04', 'mitigated', unixepoch() + 6048000, 'Risk transferred through Cloudflare Enterprise DDoS Protection SLA.', unixepoch(), unixepoch()),
('rsk-07', 'RSK-007', 'Stolen Staff Laptop Resulting in Offline Data Compromise', 'Physical theft of unencrypted executive laptop from hotel room or transit vehicle.', 'ast-08', 't3', 'v6', 3, 3, 9, 2, 2, 4, 'mitigate', 'usr-ao-04', 'treating', unixepoch() + 3456000, 'Enforcing FileVault/BitLocker hardware encryption and remote wipe via Jamf MDM.', unixepoch(), unixepoch()),
('rsk-08', 'RSK-008', 'Third-Party SaaS Payroll Vendor Infrastructure Breach', 'Security incident at external payroll vendor exposes company employee compensation records.', 'ast-05', 't4', 'v12', 3, 3, 9, 3, 3, 9, 'accept', 'usr-ciso-01', 'accepted', unixepoch() + 15552000, 'CISO formally approved residual risk based on vendor SOC 2 Type II report review.', unixepoch(), unixepoch()),
('rsk-09', 'RSK-009', 'API Private Secrets Committed to Public Code Repository', 'Software engineer accidentally pushes environment config containing database credentials.', 'ast-02', 't12', 'v11', 4, 2, 8, 2, 1, 2, 'mitigate', 'usr-ro-05', 'assessing', unixepoch() + 2592000, 'Pre-commit hooks and GitGuardian real-time repository secret scanning installed.', unixepoch(), unixepoch());

-- 8. Existing & Planned Risk Controls
INSERT OR IGNORE INTO risk_controls (risk_id, control_name, control_description, status) VALUES
('rsk-01', 'Hourly Immutable Backup Snapshots', 'Write-Once-Read-Many (WORM) storage snapshots replicated across regions.', 'implemented'),
('rsk-01', 'Database Network Microsegmentation', 'Firewall rules restricted to application gateway subnet only.', 'partially_implemented'),
('rsk-02', 'Automated BOLA Integration Test Suite', 'CI/CD pipeline test asserting multi-tenant authorization barriers on all endpoints.', 'in_progress'),
('rsk-02', 'WAF API Inspection Shield', 'Cloudflare API Gateway validating request schemas and JWT signatures.', 'implemented'),
('rsk-03', 'Hardware Security Keys (FIDO2 / WebAuthn)', 'Mandatory physical YubiKeys for all domain and cloud administrative access.', 'implemented'),
('rsk-04', 'Out-of-Band Verbal Verification for Wires', 'Policy requiring secondary phone verification for financial transfers exceeding threshold.', 'implemented'),
('rsk-05', 'Cloud Custodian Policy Enforcer', 'Automated bot that auto-remediates public S3 buckets within 60 seconds.', 'implemented'),
('rsk-06', 'Cloudflare Magic Transit & DDoS Shield', 'Global anycast edge network absorbing Layer 3/4/7 DDoS traffic.', 'implemented'),
('rsk-07', 'Full-Disk Hardware Encryption (FileVault/BitLocker)', 'AES-256 bit hardware disk encryption enforced on all fleet endpoints.', 'implemented'),
('rsk-07', 'CrowdStrike Falcon EDR', 'Continuous behavioral monitoring with instant network isolation capability.', 'partially_implemented'),
('rsk-08', 'Annual Vendor Security Questionnaire & SOC 2 Review', 'Mandatory third-party risk assessment prior to annual contract renewal.', 'implemented'),
('rsk-09', 'TruffleHog / GitGuardian CI Pipeline Scanner', 'Static analysis blocker preventing git pushes with matching entropy secrets.', 'implemented');

-- 9. Active Remediation Treatments & Progress
INSERT OR IGNORE INTO treatments (id, risk_id, owner_id, budget, due_date, progress_percent, status, description, created_at, updated_at) VALUES
('trt-01', 'rsk-01', 'usr-ao-04', 35000.0, unixepoch() + 3888000, 65, 'in_progress', 'Deploy AWS Backup Vault Lock with compliance mode and validate bare-metal restoration procedure.', unixepoch(), unixepoch()),
('trt-02', 'rsk-02', 'usr-ro-05', 18000.0, unixepoch() + 2160000, 40, 'in_progress', 'Audit all REST route handlers and enforce tenant ID scoping middleware in backend microservices.', unixepoch(), unixepoch()),
('trt-03', 'rsk-03', 'usr-ciso-01', 12000.0, unixepoch() - 86400, 100, 'completed', 'Distributed 150 hardware security keys and disabled legacy SMS OTP fallback across all Okta profiles.', unixepoch(), unixepoch()),
('trt-04', 'rsk-04', 'usr-dh-06', 5000.0, unixepoch() + 1209600, 85, 'in_progress', 'Conduct mandatory anti-phishing training for accounting department and deploy inbound email spoof banner.', unixepoch(), unixepoch()),
('trt-05', 'rsk-05', 'usr-ao-04', 4500.0, unixepoch() - 604800, 100, 'completed', 'Enabled AWS Organizations SCP preventing any IAM identity from disabling S3 Block Public Access.', unixepoch(), unixepoch()),
('trt-06', 'rsk-07', 'usr-ao-04', 22000.0, unixepoch() + 4320000, 50, 'in_progress', 'Roll out CrowdStrike Falcon sensor to remaining 45 offshore developer workstations.', unixepoch(), unixepoch()),
('trt-07', 'rsk-09', 'usr-ro-05', 8500.0, unixepoch() + 1814400, 20, 'planned', 'Integrate GitGuardian pre-receive hooks on GitHub Enterprise to block credentials at push time.', unixepoch(), unixepoch());

-- 10. Audit History Ledger (Immutable Compliance Trail)
INSERT OR IGNORE INTO audit_logs (id, user_id, user_email, action, details, ip_address, created_at) VALUES
('aud-01', '8DixxdSqlENeXF4VYN3qKcoaX873', 'pranavamin.work@hotmail.com', 'SYSTEM_BOOTSTRAP', '{"message":"Platform initialized with primary administrator and baseline compliance modules."}', '103.21.244.12', unixepoch() - 86400),
('aud-02', 'usr-ciso-01', 'sarah.chen@enterprise.io', 'RISK_ASSESSMENT_CREATE', '{"riskId":"RSK-001","title":"Ransomware Encryption of Production Database","inherentScore":20}', '198.51.100.45', unixepoch() - 72000),
('aud-03', 'usr-rm-02', 'marcus.vance@enterprise.io', 'ASSET_CREATE', '{"assetId":"AST-001","name":"Production PostgreSQL Database Cluster","criticality":"critical"}', '198.51.100.12', unixepoch() - 64800),
('aud-04', 'usr-ciso-01', 'sarah.chen@enterprise.io', 'RISK_ACCEPTANCE_APPROVE', '{"riskId":"RSK-008","strategy":"accept","justification":"SaaS vendor SOC 2 Type II report audited with zero material exceptions."}', '198.51.100.45', unixepoch() - 43200),
('aud-05', 'usr-ao-04', 'david.kim@enterprise.io', 'TREATMENT_UPDATE', '{"treatmentId":"TRT-03","progress":100,"status":"completed","note":"YubiKey hardware tokens deployed."}', '198.51.100.78', unixepoch() - 21600),
('aud-06', 'usr-aud-03', 'elena.rostova@auditpartners.com', 'AUDIT_LEDGER_EXPORT', '{"exportType":"PDF_DOSSIER","recordsAudited":9,"complianceFramework":"ISO 27001 / SOC 2"}', '203.0.113.89', unixepoch() - 7200);

-- 11. In-App Notifications for Current User
INSERT OR IGNORE INTO notifications (id, user_id, title, message, type, is_read, created_at) VALUES
('notif-01', '8DixxdSqlENeXF4VYN3qKcoaX873', 'Quarterly Risk Review Due', 'Risk RSK-001 (Ransomware on Database) is scheduled for quarterly CISO re-evaluation in 30 days.', 'risk_review', 0, unixepoch() - 3600),
('notif-02', '8DixxdSqlENeXF4VYN3qKcoaX873', 'Treatment Milestone Reached', 'Treatment TRT-03 for Administrative MFA is marked 100% completed by David Kim.', 'treatment_due', 0, unixepoch() - 7200),
('notif-03', '8DixxdSqlENeXF4VYN3qKcoaX873', 'Critical Asset Review Pending', 'Asset AST-003 (Corporate Web Banking) requires biennial architecture review.', 'asset_review', 0, unixepoch() - 14400),
('notif-04', '8DixxdSqlENeXF4VYN3qKcoaX873', 'New Risk Assigned to Team', 'Risk RSK-009 (API Private Secrets Leakage) was logged and assigned to Engineering.', 'new_risk_assigned', 0, unixepoch() - 28800);
