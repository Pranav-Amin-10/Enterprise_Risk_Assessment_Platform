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
const getTable = (key: string, defaultData: any[] = []): any[] => {
  const data = localStorage.getItem(`grc_mock_${key}`);
  if (!data) {
    localStorage.setItem(`grc_mock_${key}`, JSON.stringify(defaultData));
    return defaultData;
  }
  return JSON.parse(data);
};

const saveTable = (key: string, data: any[]) => {
  localStorage.setItem(`grc_mock_${key}`, JSON.stringify(data));
};

// Seed initial database state for Option A Demo
export const seedDemoStorage = (companyName: string = 'Enterprise HQ') => {
  const timestamp = new Date();
  
  // 1. Seed Org nodes
  const orgs = [
    { id: 'org-root', name: companyName, type: 'company', parentId: null, location: 'HQ Node' },
    { id: 'org-infosec', name: 'Information Security', type: 'department', parentId: 'org-root', location: 'HQ' },
    { id: 'org-infra', name: 'Cloud Infrastructure', type: 'department', parentId: 'org-root', location: 'AWS Cloud' },
    { id: 'org-hr', name: 'Human Resources', type: 'department', parentId: 'org-root', location: 'HQ' },
  ];
  saveTable('orgs', orgs);

  // 2. Seed default users directory
  const users = [
    { id: 'mock-user-123', email: 'admin@platform.local', name: 'SecOps Administrator', role: 'super_admin', status: 'active' },
    { id: 'mock-user-456', email: 'ciso@company.com', name: 'Chief Information Security Officer', role: 'ciso', status: 'active' },
    { id: 'mock-user-789', email: 'manager@company.com', name: 'Risk Assessment Manager', role: 'risk_manager', status: 'active' },
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
    }
  ];
  saveTable('risks', risks);

  // 6. Seed default Treatment plans
  const treatments = [
    {
      id: 'tr-01',
      riskId: 'r-01',
      description: 'Reconfigure firewall routes and bind adapters exclusively to secure AWS VPC subnets.',
      ownerId: 'mock-user-123',
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      budget: 1500,
      progressPercent: 60,
      status: 'active',
      createdAt: timestamp,
      updatedAt: timestamp,
    }
  ];
  saveTable('treatments', treatments);

  // 7. Seed default Audit logs
  const logs = [
    { id: 'l-01', userEmail: 'admin@platform.local', action: 'BOOTSTRAP', details: 'GRC Local Simulation bootstrapped successfully.', ipAddress: '127.0.0.1', createdAt: timestamp.toISOString() },
    { id: 'l-02', userEmail: 'admin@platform.local', action: 'ASSET_CREATE', details: 'Created asset: AST-101 (Oracle Production DB)', ipAddress: '127.0.0.1', createdAt: timestamp.toISOString() },
    { id: 'l-03', userEmail: 'admin@platform.local', action: 'RISK_CREATE', details: 'Created risk: RSK-101 (Database Exposed on Public Port)', ipAddress: '127.0.0.1', createdAt: timestamp.toISOString() },
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

  // --- BOOTSTRAP CHECK ---
  if (path.endsWith('/api/setup/check')) {
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
    return new Response(JSON.stringify({
      id: 'mock-user-123',
      email: 'admin@platform.local',
      name: 'SecOps Administrator',
      role: 'super_admin',
      status: 'active'
    }), { status: 200 });
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
        status: body.status || 'pending'
      };
      users.push(newUser);
      saveTable('users', users);
      return new Response(JSON.stringify(newUser), { status: 201 });
    }
  }

  // --- ASSETS INVENTORY ---
  if (path.endsWith('/api/assets')) {
    const assets = getTable('assets');
    if (method === 'GET') {
      return new Response(JSON.stringify(assets), { status: 200 });
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

  // --- RISK REGISTER ---
  if (path.endsWith('/api/risks')) {
    const risks = getTable('risks');
    const assets = getTable('assets');
    
    if (method === 'GET') {
      // Map joined fields (assetName, assetCriticality)
      const joinedRisks = risks.map(r => {
        const asset = assets.find(a => a.id === r.assetId);
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

  // --- TREATMENTS PLAN ---
  if (path.endsWith('/api/treatments')) {
    const treatments = getTable('treatments');
    const risks = getTable('risks');
    const users = getTable('users');
    
    if (method === 'GET') {
      const joinedTreatments = treatments.map(t => {
        const risk = risks.find(r => r.id === t.riskId);
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
    const risks = getTable('risks');
    const assets = getTable('assets');

    const totalRisks = risks.length;
    const closedRisks = risks.filter(r => r.status === 'closed').length;
    const treatingRisks = risks.filter(r => r.status === 'treating').length;
    
    // Aggregation summary cards
    const summary = {
      totalRisks,
      openRisks: totalRisks - closedRisks,
      treatingRisks,
      mitigatedRisks: closedRisks
    };

    // Construct risk heatmaps distribution
    const heatmapCounts: Record<string, number> = {};
    risks.forEach(r => {
      const key = `${r.inherentLikelihood}-${r.inherentImpact}`;
      heatmapCounts[key] = (heatmapCounts[key] || 0) + 1;
    });

    const heatmaps = Object.entries(heatmapCounts).map(([key, count]) => {
      const [l, i] = key.split('-').map(Number);
      return { likelihood: l, impact: i, count };
    });

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

    const risksByDepartment = Object.entries(deptCounts).map(([name, count]) => ({ departmentName: name, count }));

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
