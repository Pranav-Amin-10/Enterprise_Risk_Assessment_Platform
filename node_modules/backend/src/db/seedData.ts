export const defaultThreats = [
  {
    threatId: 'THR-001',
    name: 'Ransomware',
    description: 'Malicious software designed to block access to a computer system until a sum of money is paid.',
    category: 'Malware',
    isCustom: 0
  },
  {
    threatId: 'THR-002',
    name: 'Phishing Campaign',
    description: 'Social engineering attack where target users are contacted by email, telephone or text message by someone posing as a legitimate institution.',
    category: 'Social Engineering',
    isCustom: 0
  },
  {
    threatId: 'THR-003',
    name: 'Insider Threat',
    description: 'A security risk that originates from within the targeted organization (e.g. employees, former employees, contractors).',
    category: 'Internal Risk',
    isCustom: 0
  },
  {
    threatId: 'THR-004',
    name: 'Supply Chain Compromise',
    description: 'An attack that targets less-secure elements in the supply network to compromise the ultimate target.',
    category: 'Third-Party Risk',
    isCustom: 0
  },
  {
    threatId: 'THR-005',
    name: 'Zero-Day Exploit',
    description: 'An attack that exploits a previously unknown software vulnerability before a patch or security fix is available.',
    category: 'Exploitation',
    isCustom: 0
  },
  {
    threatId: 'THR-006',
    name: 'DDoS Attack',
    description: 'Distributed Denial of Service attack designed to overwhelm systems, causing service degradation or complete unavailability.',
    category: 'Network Threat',
    isCustom: 0
  },
  {
    threatId: 'THR-007',
    name: 'Credential Theft & Stuffing',
    description: 'Automated injection of stolen username/password pairs to gain unauthorized access to user accounts.',
    category: 'Identity Theft',
    isCustom: 0
  },
  {
    threatId: 'THR-008',
    name: 'Cloud Misconfiguration',
    description: 'Insecure configuration settings in cloud resources, such as publicly readable storage buckets or overly permissive security groups.',
    category: 'Infrastructure Risk',
    isCustom: 0
  },
  {
    threatId: 'THR-009',
    name: 'Business Email Compromise (BEC)',
    description: 'A sophisticated scam targeting businesses to execute unauthorized wire transfers or exfiltrate sensitive credentials.',
    category: 'Social Engineering',
    isCustom: 0
  }
];

export const defaultVulnerabilities = [
  {
    vulnId: 'VUL-001',
    name: 'Missing Multi-Factor Authentication (MFA)',
    description: 'No multi-factor authentication enforced on critical user administrative access points.',
    severity: 'critical' as const,
    isCustom: 0
  },
  {
    vulnId: 'VUL-002',
    name: 'Weak/Default Passwords',
    description: 'System or application utilizes default credentials or does not enforce a strong password complexity policy.',
    severity: 'critical' as const,
    isCustom: 0
  },
  {
    vulnId: 'VUL-003',
    name: 'Unpatched Operating System or Software',
    description: 'Presence of known vulnerabilities (CVEs) in outdated system packages that lack vendor security patches.',
    severity: 'high' as const,
    isCustom: 0
  },
  {
    vulnId: 'VUL-004',
    name: 'Misconfigured Network Firewall',
    description: 'Firewall rules permit unrestricted inbound access to internal server ports from public IP addresses.',
    severity: 'high' as const,
    isCustom: 0
  },
  {
    vulnId: 'VUL-005',
    name: 'Exposed Database / DB Open Ports',
    description: 'Database servers directly binding to public network adapters without encrypted VPN tunnels.',
    severity: 'critical' as const,
    isCustom: 0
  },
  {
    vulnId: 'VUL-006',
    name: 'Missing Endpoint Protection (EDR)',
    description: 'Workstations or servers lack security agent monitoring for malware detection and activity logging.',
    severity: 'high' as const,
    isCustom: 0
  },
  {
    vulnId: 'VUL-007',
    name: 'Unencrypted Sensitive Data at Rest',
    description: 'Confidential customer records, logs, or databases stored on disk volumes without hardware/software encryption.',
    severity: 'medium' as const,
    isCustom: 0
  },
  {
    vulnId: 'VUL-008',
    name: 'Inadequate Logging and Audit Trails',
    description: 'Lack of centralized event log collection preventing security analysts from auditing access logs during a breach investigation.',
    severity: 'medium' as const,
    isCustom: 0
  },
  {
    vulnId: 'VUL-009',
    name: 'Insecure API Authentication',
    description: 'API endpoints failing to perform JWT signature checks, token expirations, or authorization rate limiting.',
    severity: 'high' as const,
    isCustom: 0
  }
];
