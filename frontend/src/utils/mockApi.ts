// client-side Mock Database Simulator for GRC Demo Fallback Mode

const DEFAULT_THREATS = [
  { id: 't-101', threatId: 'THR-101', name: 'Ransomware Attack', category: 'Malware', description: 'Malicious encryption of critical data assets by unauthorized threat actors.' },
  { id: 't-102', threatId: 'THR-102', name: 'Phishing Campaign', category: 'Social Engineering', description: 'Targeted email scams designed to harvest employee authentication credentials.' },
  { id: 't-103', threatId: 'THR-103', name: 'DDoS Attack', category: 'Denial of Service', description: 'Distributed network inundation targeting customer-facing portals.' },
  { id: 't-104', threatId: 'THR-104', name: 'SQL Injection', category: 'Software Weakness', description: 'Exploitation of unvalidated input fields to execute database commands.' },
  { id: 't-105', threatId: 'THR-105', name: 'Insider Threat', category: 'Human Factor', description: 'Unauthorized data extraction or damage caused by an internal employee.' },
];

const DEFAULT_VULNERABILITIES = [
  { id: 'v-201', vulnId: 'VUL-201', name: 'Unencrypted Cloud Storage', severity: 'high', description: 'AWS S3 buckets configured with public read permissions and no KMS encryption.' },
  { id: 'v-202', vulnId: 'VUL-202', name: 'Outdated OS Patching', severity: 'medium', description: 'Production Linux servers running legacy kernel versions vulnerable to privilege escalations.' },
  { id: 'v-203', vulnId: 'VUL-203', name: 'Weak Password Policies', severity: 'high', description: 'Lack of multi-factor authentication (MFA) on corporate domain networks.' },
  { id: 'v-204', vulnId: 'VUL-204', name: 'Missing Input Sanitization', severity: 'critical', description: 'Direct binding of user parameter fields into backend query builders.' },
  { id: 'v-205', vulnId: 'VUL-205', name: 'Unrestricted Firewall Rules', severity: 'critical', description: 'Database management ports (3306, 1433) exposed directly to public internet CIDRs.' },
];

// Helper to load/save tables
export const getTable = (key: string, defaultData: any[] = []): any[] => {
  const data = localStorage.getItem(`grc_mock_${key}`);
  if (!data) {
    localStorage.setItem(`grc_mock_${key}`, JSON.stringify(defaultData));
    return defaultData;
  }
  return JSON.parse(data);
};

export const saveTable = (key: string, data: any[]) => {
  localStorage.setItem(`grc_mock_${key}`, JSON.stringify(data));
};

// Seed initial database state for Option A Demo
export const seedDemoStorage = (
  companyName: string = 'Enterprise HQ',
  adminEmail: string = 'admin@platform.local',
  adminName: string = 'SecOps Administrator',
  locationName: string = 'HQ Node'
) => {
  const timestamp = new Date();
  
  // 1. Seed Org nodes
  const orgs = [
    { id: 'org-root', name: companyName, type: 'company', parentId: null, location: locationName },
    { id: 'org-infosec', name: 'Information Security', type: 'department', parentId: 'org-root', location: 'HQ' },
    { id: 'org-infra', name: 'Cloud Infrastructure', type: 'department', parentId: 'org-root', location: 'AWS Cloud' },
    { id: 'org-hr', name: 'Human Resources', type: 'department', parentId: 'org-root', location: 'HQ' },
  ];
  saveTable('orgs', orgs);

  // 2. Seed default users directory
  const users = [
    { id: 'mock-user-123', email: adminEmail, name: adminName, role: 'super_admin', status: 'active', password: 'password123', departmentId: null },
    { id: 'mock-user-456', email: 'ciso@company.com', name: 'Chief Information Security Officer', role: 'ciso', status: 'active', password: 'password123', departmentId: null },
    { id: 'mock-user-789', email: 'manager@company.com', name: 'Risk Assessment Manager', role: 'risk_manager', status: 'active', password: 'password123', departmentId: null },
    { id: 'mock-user-auditor', email: 'auditor@company.com', name: 'Internal Audit Lead', role: 'auditor', status: 'active', password: 'password123', departmentId: null },
    { id: 'mock-user-asset', email: 'asset@company.com', name: 'IT Infrastructure Lead', role: 'asset_owner', status: 'active', password: 'password123', departmentId: 'org-infra' },
    { id: 'mock-user-riskowner', email: 'riskowner@company.com', name: 'System Remediation Specialist', role: 'risk_owner', status: 'active', password: 'password123', departmentId: 'org-infra' },
    { id: 'mock-user-depthead', email: 'depthead@company.com', name: 'VP Cloud Operations Operations', role: 'department_head', status: 'active', password: 'password123', departmentId: 'org-infra' },
    { id: 'mock-user-viewer', email: 'viewer@company.com', name: 'Executive Compliance Viewer', role: 'viewer', status: 'active', password: 'password123', departmentId: null },
  ];
  saveTable('users', users);

  // 3. Seed default Threat/Vuln libraries
  saveTable('threats', DEFAULT_THREATS);
  saveTable('vulnerabilities', DEFAULT_VULNERABILITIES);

  // 4. Seed default Assets
  const assets = [
    { id: 'a-01', assetId: 'AST-101', name: 'Oracle Production DB', type: 'database', criticality: 'critical', ciaConfidentiality: 3, ciaIntegrity: 3, ciaAvailability: 3, dataClassification: 'restricted', businessOwnerId: 'mock-user-456', technicalOwnerId: 'mock-user-123', departmentId: 'org-infra', description: 'Core financial transaction database.' },
    { id: 'a-02', assetId: 'AST-102', name: 'AWS S3 Static Attachments', type: 'cloud_storage', criticality: 'high', ciaConfidentiality: 2, ciaIntegrity: 3, ciaAvailability: 2, dataClassification: 'confidential', businessOwnerId: 'mock-user-789', technicalOwnerId: 'mock-user-123', departmentId: 'org-infra', description: 'Public attachments repository.' },
    { id: 'a-03', assetId: 'AST-103', name: 'Corporate HR Portal Server', type: 'application', criticality: 'medium', ciaConfidentiality: 3, ciaIntegrity: 2, ciaAvailability: 2, dataClassification: 'internal', businessOwnerId: 'mock-user-789', technicalOwnerId: 'mock-user-123', departmentId: 'org-hr', description: 'Internal employee record portal.' },
    { id: 'a-04', assetId: 'AST-104', name: 'Active Directory Domain Controller', type: 'server', criticality: 'critical', ciaConfidentiality: 3, ciaIntegrity: 3, ciaAvailability: 3, dataClassification: 'restricted', businessOwnerId: 'mock-user-456', technicalOwnerId: 'mock-user-123', departmentId: 'org-infosec', description: 'Primary domain controller managing user authentication and security groups.' },
    { id: 'a-05', assetId: 'AST-105', name: 'Customer Payment Gateway API', type: 'api', criticality: 'critical', ciaConfidentiality: 3, ciaIntegrity: 3, ciaAvailability: 3, dataClassification: 'restricted', businessOwnerId: 'mock-user-789', technicalOwnerId: 'mock-user-123', departmentId: 'org-infra', description: 'Public facing API endpoint integrating payment processing workflows.' },
    { id: 'a-06', assetId: 'AST-106', name: 'Corporate Email Exchange Server', type: 'server', criticality: 'high', ciaConfidentiality: 3, ciaIntegrity: 2, ciaAvailability: 2, dataClassification: 'internal', businessOwnerId: 'mock-user-789', technicalOwnerId: 'mock-user-123', departmentId: 'org-infosec', description: 'Internal mail flow and collaboration exchange nodes.' },
    { id: 'a-07', assetId: 'AST-107', name: 'GitHub Enterprise Repository', type: 'cloud_resource', criticality: 'medium', ciaConfidentiality: 2, ciaIntegrity: 3, ciaAvailability: 2, dataClassification: 'confidential', businessOwnerId: 'mock-user-789', technicalOwnerId: 'mock-user-123', departmentId: 'org-infosec', description: 'Repository hosting proprietary platform source code.' }
  ];
  saveTable('assets', assets);

  // 5. Seed default Risks
  const risks = [
    {
      id: 'r-01',
      riskId: 'RSK-101',
      title: 'Database Exposed on Public Port',
      description: 'Oracle production server firewalls allow public connections on port 1521, exposing it to automated scanners.',
      assetId: 'a-01',
      threatId: 't-105', // Insider Threat / unauthorized network bind
      vulnerabilityId: 'v-205', // Exposed database ports
      inherentImpact: 5,
      inherentLikelihood: 4,
      inherentScore: 20, // Critical
      residualImpact: 3,
      residualLikelihood: 1,
      residualScore: 3, // Low
      treatmentStrategy: 'mitigate',
      riskOwnerId: 'mock-user-123',
      status: 'treating',
      controls: [
        { controlName: 'IP Whitelisting', controlDescription: 'Only allow traffic from corporate VPN subnet', status: 'implemented' },
        { controlName: 'Database Encryption', controlDescription: 'Enable TDE on tablespaces', status: 'implemented' }
      ]
    },
    {
      id: 'r-02',
      riskId: 'RSK-102',
      title: 'Unencrypted S3 Buckets containing Attachments',
      description: 'Financial file attachments are uploaded to S3 without AES-256 server-side encryption enabled.',
      assetId: 'a-02',
      threatId: 't-101', // Ransomware / Data exposure
      vulnerabilityId: 'v-201', // Unencrypted cloud storage
      inherentImpact: 4,
      inherentLikelihood: 3,
      inherentScore: 12, // High
      residualImpact: 4,
      residualLikelihood: 1,
      residualScore: 4, // Low
      treatmentStrategy: 'mitigate',
      riskOwnerId: 'mock-user-789',
      status: 'closed',
      controls: [
        { controlName: 'KMS policy binding', controlDescription: 'Enforce default KMS encryption policy', status: 'implemented' }
      ]
    },
    {
      id: 'r-03',
      riskId: 'RSK-103',
      title: 'Weak Active Directory Password Complexity',
      description: 'The primary Active Directory domain controller allows standard 8-character passwords without MFA enforcement.',
      assetId: 'a-04',
      threatId: 't-102', // Social engineering / Phishing
      vulnerabilityId: 'v-203', // Weak password policies
      inherentImpact: 4,
      inherentLikelihood: 4,
      inherentScore: 16, // Critical
      residualImpact: 2,
      residualLikelihood: 2,
      residualScore: 4, // Low
      treatmentStrategy: 'mitigate',
      riskOwnerId: 'mock-user-789',
      status: 'treating',
      controls: [
        { controlName: 'MFA integration', controlDescription: 'Deploy MFA for VPN gateway authentications', status: 'partially_implemented' }
      ]
    },
    {
      id: 'r-04',
      riskId: 'RSK-104',
      title: 'SQL Injection on Customer Payment API',
      description: 'Payment API endpoints do not completely sanitize user input parameter fields, permitting unauthorized queries.',
      assetId: 'a-05',
      threatId: 't-104', // SQL injection
      vulnerabilityId: 'v-204', // Missing input sanitization
      inherentImpact: 5,
      inherentLikelihood: 3,
      inherentScore: 15, // Critical
      residualImpact: 3,
      residualLikelihood: 1,
      residualScore: 3, // Low
      treatmentStrategy: 'mitigate',
      riskOwnerId: 'mock-user-123',
      status: 'treating',
      controls: [
        { controlName: 'WAF ruleset bind', controlDescription: 'Apply OWASP Top 10 rules to Web Application Firewall', status: 'implemented' }
      ]
    },
    {
      id: 'r-05',
      riskId: 'RSK-105',
      title: 'Outdated Linux Kernel on Email Server',
      description: 'The email exchange server operates on a deprecated OS version susceptible to privilege escalation exploits.',
      assetId: 'a-06',
      threatId: 't-101', // Ransomware
      vulnerabilityId: 'v-202', // Outdated OS patching
      inherentImpact: 3,
      inherentLikelihood: 3,
      inherentScore: 9, // Medium
      residualImpact: 2,
      residualLikelihood: 1,
      residualScore: 2, // Low
      treatmentStrategy: 'mitigate',
      riskOwnerId: 'mock-user-789',
      status: 'closed',
      controls: [
        { controlName: 'Monthly patch routine', controlDescription: 'Schedule kernel updates during weekend maintenance windows', status: 'implemented' }
      ]
    },
    {
      id: 'r-06',
      riskId: 'RSK-106',
      title: 'Missing MFA on GitHub Codebase Access',
      description: 'Several developer accounts in the GitHub organization do not have mandatory two-factor authentication enabled.',
      assetId: 'a-07',
      threatId: 't-105', // Insider Threat
      vulnerabilityId: 'v-203', // Weak password policies
      inherentImpact: 4,
      inherentLikelihood: 5,
      inherentScore: 20, // Critical
      residualImpact: 2,
      residualLikelihood: 1,
      residualScore: 2, // Low
      treatmentStrategy: 'accept',
      riskOwnerId: 'mock-user-456',
      status: 'accepted',
      controls: []
    }
  ];
  saveTable('risks', risks);

  // 6. Seed default Treatment plans
  const treatments = [
    {
      id: 'tr-01',
      riskId: 'r-01',
      description: 'Reconfigure firewall routes and bind database adapters exclusively to secure AWS VPC subnets.',
      ownerId: 'mock-user-123',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      budget: 1500,
      progressPercent: 60,
      status: 'in_progress',
      createdAt: timestamp.toISOString(),
      updatedAt: timestamp.toISOString(),
    },
    {
      id: 'tr-02',
      riskId: 'r-03',
      description: 'Implement group policy objects (GPO) enforcing 12+ character lengths, history limits, and mandatory MFA.',
      ownerId: 'mock-user-789',
      dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      budget: 3200,
      progressPercent: 40,
      status: 'in_progress',
      createdAt: timestamp.toISOString(),
      updatedAt: timestamp.toISOString(),
    },
    {
      id: 'tr-03',
      riskId: 'r-04',
      description: 'Deploy parameterized queries across API database adapters and integrate static analysis (SAST) tools in CI/CD pipelines.',
      ownerId: 'mock-user-123',
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      budget: 4500,
      progressPercent: 80,
      status: 'in_progress',
      createdAt: timestamp.toISOString(),
      updatedAt: timestamp.toISOString(),
    }
  ];
  saveTable('treatments', treatments);

  // 7. Seed default Audit logs
  const logs = [
    { id: 'l-01', userEmail: adminEmail, action: 'BOOTSTRAP', details: 'GRC Local Simulation bootstrapped successfully.', ipAddress: '127.0.0.1', createdAt: timestamp.toISOString() },
    { id: 'l-02', userEmail: adminEmail, action: 'ASSET_CREATE', details: 'Created asset: AST-101 (Oracle Production DB)', ipAddress: '127.0.0.1', createdAt: timestamp.toISOString() },
    { id: 'l-03', userEmail: adminEmail, action: 'RISK_CREATE', details: 'Created risk: RSK-101 (Database Exposed on Public Port)', ipAddress: '127.0.0.1', createdAt: timestamp.toISOString() },
  ];
  saveTable('logs', logs);

  // 8. Seed Notifications
  const notifications = [
    { id: 'n-01', message: 'Corporate profile bootstrapped locally. Welcome to Enterprise Risk Platform!', read: false, createdAt: timestamp.toISOString() },
    { id: 'n-02', message: 'Urgent: Risk RSK-101 exceeds inherent threshold. Treatment required.', read: false, createdAt: timestamp.toISOString() }
  ];
  saveTable('notifications', notifications);

  localStorage.setItem('grc_mock_bootstrapped', 'true');
};

// Simulation Route Handler
export const handleMockRequest = async (url: string, init?: RequestInit): Promise<Response> => {
  const method = init?.method || 'GET';
  const body = init?.body ? JSON.parse(init.body as string) : {};
  const path = url.split('?')[0];

  // Delay helper to feel realistic
  await new Promise(resolve => setTimeout(resolve, 200));

  const users = getTable('users');
  const loggedInEmail = localStorage.getItem('grc_logged_in_user_email');
  const currentUser = users.find(u => u.email === loggedInEmail) || users.find(u => u.role === 'super_admin');

  // Helper functions to get scoped datasets for Department Head
  const getScopedAssets = () => {
    const allAssets = getTable('assets');
    if (currentUser?.role === 'department_head' && currentUser?.departmentId) {
      return allAssets.filter(a => a.departmentId === currentUser.departmentId);
    }
    return allAssets;
  };

  const getScopedRisks = () => {
    const allRisks = getTable('risks');
    if (currentUser?.role === 'department_head' && currentUser?.departmentId) {
      const allowedAssetIds = getScopedAssets().map(a => a.id);
      return allRisks.filter(r => allowedAssetIds.includes(r.assetId));
    }
    return allRisks;
  };

  const getScopedTreatments = () => {
    const allTreatments = getTable('treatments');
    if (currentUser?.role === 'department_head' && currentUser?.departmentId) {
      const allowedRiskIds = getScopedRisks().map(r => r.id);
      return allTreatments.filter(t => allowedRiskIds.includes(t.riskId));
    }
    return allTreatments;
  };

  // --- BOOTSTRAP CHECK ---
  if (path.endsWith('/api/setup/check')) {
    const savedVersion = localStorage.getItem('grc_mock_db_version');
    if (savedVersion !== '1.3.0') {
      localStorage.removeItem('grc_mock_bootstrapped');
      localStorage.setItem('grc_mock_db_version', '1.3.0');
    }
    const isBootstrapped = localStorage.getItem('grc_mock_bootstrapped') === 'true';
    return new Response(JSON.stringify({ needsSetup: !isBootstrapped }), { status: 200 });
  }

  if (path.endsWith('/api/setup/bootstrap')) {
    seedDemoStorage(body.companyName || 'Enterprise HQ');
    return new Response(JSON.stringify({
      success: true,
      message: 'Mock Database bootstrapped successfully',
      user: { id: 'mock-user-123', email: 'admin@platform.local', name: body.name || 'Setup Administrator', role: 'super_admin' }
    }), { status: 200 });
  }

  // --- AUTH ME ROUTE ---
  if (path.endsWith('/api/auth/me')) {
    const users = getTable('users');
    const loggedInEmail = localStorage.getItem('grc_logged_in_user_email');
    const currentUser = users.find(u => u.email === loggedInEmail) || users.find(u => u.role === 'super_admin') || {
      id: 'mock-user-123',
      email: 'admin@platform.local',
      name: 'SecOps Administrator',
      role: 'super_admin',
      status: 'active'
    };
    return new Response(JSON.stringify(currentUser), { status: 200 });
  }

  // --- ORGANIZATION NODES ---
  if (path.endsWith('/api/orgs')) {
    const orgs = getTable('orgs');
    if (method === 'GET') {
      return new Response(JSON.stringify(orgs), { status: 200 });
    }
    if (method === 'POST') {
      const newNode = {
        id: crypto.randomUUID(),
        name: body.name,
        type: body.type || 'department',
        parentId: body.parentId || null,
        location: body.location || ''
      };
      orgs.push(newNode);
      saveTable('orgs', orgs);
      return new Response(JSON.stringify(newNode), { status: 201 });
    }
  }

  // --- USER ACCOUNTS ---
  if (path.endsWith('/api/users')) {
    const users = getTable('users');
    if (method === 'GET') {
      return new Response(JSON.stringify(users), { status: 200 });
    }
    if (method === 'POST') {
      const newUser = {
        id: crypto.randomUUID(),
        email: body.email,
        name: body.name,
        role: body.role || 'viewer',
        status: body.status || 'pending',
        password: body.password || 'password123',
        departmentId: body.departmentId || null
      };
      users.push(newUser);
      saveTable('users', users);
      return new Response(JSON.stringify(newUser), { status: 201 });
    }
  }
  if (path.includes('/api/users/')) {
    const id = path.split('/').pop();
    const users = getTable('users');
    if (method === 'PUT') {
      let updatedUser: any = null;
      users.forEach((u, i) => {
        if (u.id === id) {
          users[i] = { ...u, ...body };
          updatedUser = users[i];
        }
      });
      saveTable('users', users);
      return new Response(JSON.stringify(updatedUser), { status: 200 });
    }
    if (method === 'DELETE') {
      const remainingUsers = users.filter(u => u.id !== id);
      saveTable('users', remainingUsers);
      return new Response(null, { status: 204 });
    }
  }

  if (path.endsWith('/api/assets')) {
    const assets = getTable('assets');
    if (method === 'GET') {
      const scopedAssets = getScopedAssets();
      return new Response(JSON.stringify(scopedAssets), { status: 200 });
    }
    if (method === 'POST') {
      let asset;
      if (body.id) {
        // Edit
        assets.forEach((a, i) => {
          if (a.id === body.id) {
            assets[i] = { ...a, ...body };
            asset = assets[i];
          }
        });
      } else {
        // Create
        asset = { ...body, id: crypto.randomUUID() };
        assets.push(asset);
      }
      saveTable('assets', assets);
      return new Response(JSON.stringify(asset), { status: body.id ? 200 : 201 });
    }
  }
  if (path.includes('/api/assets/')) {
    const id = path.split('/').pop();
    if (method === 'DELETE') {
      const assets = getTable('assets').filter(a => a.id !== id);
      saveTable('assets', assets);
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    if (method === 'PUT') {
      const assets = getTable('assets');
      let asset;
      assets.forEach((a, i) => {
        if (a.id === id) {
          assets[i] = { ...a, ...body };
          asset = assets[i];
        }
      });
      saveTable('assets', assets);
      return new Response(JSON.stringify(asset), { status: 200 });
    }
  }

  // --- THREATS & VULNERABILITIES LIBRARY ---
  if (path.endsWith('/api/library/threats')) {
    const threats = getTable('threats');
    if (method === 'GET') return new Response(JSON.stringify(threats), { status: 200 });
    if (method === 'POST') {
      const entry = { ...body, id: crypto.randomUUID() };
      threats.push(entry);
      saveTable('threats', threats);
      return new Response(JSON.stringify(entry), { status: 201 });
    }
  }
  if (path.endsWith('/api/library/vulnerabilities')) {
    const vulns = getTable('vulnerabilities');
    if (method === 'GET') return new Response(JSON.stringify(vulns), { status: 200 });
    if (method === 'POST') {
      const entry = { ...body, id: crypto.randomUUID() };
      vulns.push(entry);
      saveTable('vulnerabilities', vulns);
      return new Response(JSON.stringify(entry), { status: 201 });
    }
  }

  if (path.endsWith('/api/risks')) {
    const risks = getTable('risks');
    if (method === 'GET') {
      const scopedRisks = getScopedRisks();
      const scopedAssets = getScopedAssets();
      // Map joined fields (assetName, assetCriticality)
      const joinedRisks = scopedRisks.map(r => {
        const asset = scopedAssets.find(a => a.id === r.assetId);
        return {
          ...r,
          assetName: asset ? asset.name : 'Unknown Asset',
          assetCriticality: asset ? asset.criticality : 'low'
        };
      });
      return new Response(JSON.stringify(joinedRisks), { status: 200 });
    }
    if (method === 'POST') {
      let risk;
      const inherentScore = body.inherentImpact * body.inherentLikelihood;
      const residualScore = body.residualImpact * body.residualLikelihood;

      if (body.id) {
        risks.forEach((r, i) => {
          if (r.id === body.id) {
            risks[i] = { ...r, ...body, inherentScore, residualScore };
            risk = risks[i];
          }
        });
      } else {
        risk = { ...body, id: crypto.randomUUID(), inherentScore, residualScore };
        risks.push(risk);
      }
      saveTable('risks', risks);
      return new Response(JSON.stringify(risk), { status: body.id ? 200 : 201 });
    }
  }
  if (path.includes('/api/risks/')) {
    const id = path.split('/').pop();
    if (method === 'DELETE') {
      const risks = getTable('risks').filter(r => r.id !== id);
      saveTable('risks', risks);
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    if (method === 'PUT') {
      const risks = getTable('risks');
      let risk;
      const inherentScore = body.inherentImpact * body.inherentLikelihood;
      const residualScore = body.residualImpact * body.residualLikelihood;

      risks.forEach((r, i) => {
        if (r.id === id) {
          risks[i] = { ...r, ...body, inherentScore, residualScore };
          risk = risks[i];
        }
      });
      saveTable('risks', risks);
      return new Response(JSON.stringify(risk), { status: 200 });
    }
  }

  if (path.endsWith('/api/treatments')) {
    const treatments = getTable('treatments');
    const users = getTable('users');
    if (method === 'GET') {
      const scopedTreatments = getScopedTreatments();
      const scopedRisks = getScopedRisks();
      const joinedTreatments = scopedTreatments.map(t => {
        const risk = scopedRisks.find(r => r.id === t.riskId);
        const owner = users.find(u => u.id === t.ownerId);
        return {
          ...t,
          riskIdentifier: risk ? risk.riskId : 'Unknown Risk',
          riskTitle: risk ? risk.title : 'Unknown Title',
          ownerName: owner ? owner.name : 'Unassigned',
        };
      });
      return new Response(JSON.stringify(joinedTreatments), { status: 200 });
    }
    if (method === 'POST') {
      let tr;
      if (body.id) {
        treatments.forEach((t, i) => {
          if (t.id === body.id) {
            treatments[i] = { ...t, ...body, updatedAt: new Date() };
            tr = treatments[i];
          }
        });
      } else {
        tr = { ...body, id: crypto.randomUUID(), createdAt: new Date(), updatedAt: new Date() };
        treatments.push(tr);
      }
      saveTable('treatments', treatments);
      return new Response(JSON.stringify(tr), { status: body.id ? 200 : 201 });
    }
  }
  if (path.includes('/api/treatments/')) {
    const id = path.split('/').pop();
    if (method === 'PUT') {
      const treatments = getTable('treatments');
      let tr;
      treatments.forEach((t, i) => {
        if (t.id === id) {
          treatments[i] = { ...t, ...body, updatedAt: new Date() };
          tr = treatments[i];
        }
      });
      saveTable('treatments', treatments);
      return new Response(JSON.stringify(tr), { status: 200 });
    }
  }

  // --- AUDIT COMPLIANCE LOGS ---
  if (path.endsWith('/api/audit')) {
    const logs = getTable('logs');
    return new Response(JSON.stringify(logs), { status: 200 });
  }

  // --- NOTIFICATIONS ---
  if (path.endsWith('/api/notifications')) {
    const notifications = getTable('notifications');
    return new Response(JSON.stringify(notifications), { status: 200 });
  }

  // --- EVIDENCE FILE COORDINATOR ---
  if (path.endsWith('/api/evidence/linked')) {
    return new Response(JSON.stringify([]), { status: 200 }); // Mock evidence list empty
  }

  // --- DASHBOARD STATISTICS AGGREGATOR ---
  if (path.endsWith('/api/dashboard/stats')) {
    const risks = getScopedRisks();
    const assets = getScopedAssets();

    const totalRisks = risks.length;
    const closedRisks = risks.filter(r => r.status === 'closed').length;
    const acceptedRisks = risks.filter(r => r.status === 'accepted').length;
    const mitigatedRisks = risks.filter(r => r.status === 'mitigated').length;
    
    const closedOrAcceptedCount = closedRisks + acceptedRisks + mitigatedRisks;
    const complianceIndex = totalRisks > 0 ? Math.round((closedOrAcceptedCount / totalRisks) * 100) : 100;

    // Calculate High & Critical Risks count
    const highRisks = risks.filter(r => r.inherentScore >= 12).length;

    // Calculate Active Treatments count
    const treatments = getTable('treatments');
    const scopedRiskIds = risks.map(r => r.id);
    const activeTreatments = treatments.filter(t => 
      scopedRiskIds.includes(t.riskId) && t.status === 'in_progress'
    ).length;

    // Aggregation summary cards
    const summary = {
      totalRisks,
      openRisks: totalRisks - closedOrAcceptedCount,
      treatingRisks: risks.filter(r => r.status === 'treating').length,
      mitigatedRisks: closedRisks + mitigatedRisks,
      complianceIndex,
      highRisks,
      activeTreatments
    };

    // Construct 5x5 inherent risk heatmap grid matrix (0-indexed for ECharts)
    const inherent = Array.from({ length: 5 }, () => Array(5).fill(0));
    risks.forEach(r => {
      const lIdx = Math.min(Math.max(r.inherentLikelihood - 1, 0), 4);
      const iIdx = Math.min(Math.max(r.inherentImpact - 1, 0), 4);
      inherent[lIdx][iIdx] += 1;
    });

    const heatmaps = {
      inherent
    };

    // Mapped risks by departments
    const deptCounts: Record<string, number> = {};
    const orgs = getTable('orgs');
    
    risks.forEach(r => {
      const asset = assets.find(a => a.id === r.assetId);
      if (asset && asset.departmentId) {
        const orgNode = orgs.find(o => o.id === asset.departmentId);
        const name = orgNode ? orgNode.name : 'General Operations';
        deptCounts[name] = (deptCounts[name] || 0) + 1;
      } else {
        deptCounts['General Operations'] = (deptCounts['General Operations'] || 0) + 1;
      }
    });

    const risksByDepartment = Object.entries(deptCounts).map(([name, count]) => ({ department: name, count }));

    // Risks by asset type
    const typeCounts: Record<string, number> = {};
    risks.forEach(r => {
      const asset = assets.find(a => a.id === r.assetId);
      const name = asset ? asset.type : 'Other';
      typeCounts[name] = (typeCounts[name] || 0) + 1;
    });

    const risksByAssetType = Object.entries(typeCounts).map(([name, count]) => ({ assetType: name, count }));

    // Return stats structure
    return new Response(JSON.stringify({
      summary,
      heatmaps,
      risksByDepartment,
      risksByAssetType,
      topRisks: risks.slice(0, 5) // Return 5 risks
    }), { status: 200 });
  }

  // Fallback 404
  return new Response(JSON.stringify({ error: 'Endpoint Mock Not Found' }), { status: 404 });
};
