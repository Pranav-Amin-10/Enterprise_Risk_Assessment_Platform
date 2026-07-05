-- Seeding Default Cyber Threats
INSERT OR IGNORE INTO threats (id, threat_id, name, description, category, is_custom, created_at) VALUES 
('t1', 'THR-001', 'Ransomware', 'Malicious software designed to block access to a computer system until a sum of money is paid.', 'Malware', 0, 1783321200000),
('t2', 'THR-002', 'Phishing Campaign', 'Social engineering attack where target users are contacted by email, telephone or text message by someone posing as a legitimate institution.', 'Social Engineering', 0, 1783321200000),
('t3', 'THR-003', 'Insider Threat', 'A security risk that originates from within the targeted organization (e.g. employees, former employees, contractors).', 'Internal Risk', 0, 1783321200000),
('t4', 'THR-004', 'Supply Chain Compromise', 'An attack that targets less-secure elements in the supply network to compromise the ultimate target.', 'Third-Party Risk', 0, 1783321200000),
('t5', 'THR-005', 'Zero-Day Exploit', 'An attack that exploits a previously unknown software vulnerability before a patch or security fix is available.', 'Exploitation', 0, 1783321200000),
('t6', 'THR-006', 'DDoS Attack', 'Distributed Denial of Service attack designed to overwhelm systems, causing service degradation or complete unavailability.', 'Network Threat', 0, 1783321200000),
('t7', 'THR-007', 'Credential Theft & Stuffing', 'Automated injection of stolen username/password pairs to gain unauthorized access to user accounts.', 'Identity Theft', 0, 1783321200000),
('t8', 'THR-008', 'Cloud Misconfiguration', 'Insecure configuration settings in cloud resources, such as publicly readable storage buckets or overly permissive security groups.', 'Infrastructure Risk', 0, 1783321200000),
('t9', 'THR-009', 'Business Email Compromise (BEC)', 'A sophisticated scam targeting businesses to execute unauthorized wire transfers or exfiltrate sensitive credentials.', 'Social Engineering', 0, 1783321200000);

-- Seeding Default Vulnerabilities
INSERT OR IGNORE INTO vulnerabilities (id, vuln_id, name, description, severity, is_custom, created_at) VALUES 
('v1', 'VUL-001', 'Missing Multi-Factor Authentication (MFA)', 'No multi-factor authentication enforced on critical user administrative access points.', 'critical', 0, 1783321200000),
('v2', 'VUL-002', 'Weak/Default Passwords', 'System or application utilizes default credentials or does not enforce a strong password complexity policy.', 'critical', 0, 1783321200000),
('v3', 'VUL-003', 'Unpatched Operating System or Software', 'Presence of known vulnerabilities (CVEs) in outdated system packages that lack vendor security patches.', 'high', 0, 1783321200000),
('v4', 'VUL-004', 'Misconfigured Network Firewall', 'Firewall rules permit unrestricted inbound access to internal server ports from public IP addresses.', 'high', 0, 1783321200000),
('v5', 'VUL-005', 'Exposed Database / DB Open Ports', 'Database servers directly binding to public network adapters without encrypted VPN tunnels.', 'critical', 0, 1783321200000),
('v6', 'VUL-006', 'Missing Endpoint Protection (EDR)', 'Workstations or servers lack security agent monitoring for malware detection and activity logging.', 'high', 0, 1783321200000),
('v7', 'VUL-007', 'Unencrypted Sensitive Data at Rest', 'Confidential customer records, logs, or databases stored on disk volumes without hardware/software encryption.', 'medium', 0, 1783321200000),
('v8', 'VUL-008', 'Inadequate Logging and Audit Trails', 'Lack of centralized event log collection preventing security analysts from auditing access logs during a breach investigation.', 'medium', 0, 1783321200000),
('v9', 'VUL-009', 'Insecure API Authentication', 'API endpoints failing to perform JWT signature checks, token expirations, or authorization rate limiting.', 'high', 0, 1783321200000);
