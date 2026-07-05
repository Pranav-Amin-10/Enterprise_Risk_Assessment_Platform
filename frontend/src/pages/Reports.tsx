import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/useAuthStore';
import { exportToPDF, exportToExcel, exportToCSV } from '../utils/exporters';
import { FileText, FileSpreadsheet, Download, ShieldAlert, Library, History, Calendar, CheckSquare } from 'lucide-react';
import { toast } from '../store/useToastStore';

export const Reports: React.FC = () => {
  const token = useAuthStore((state) => state.token);
  const { user } = useAuthStore() as any;
  const [downloading, setDownloading] = useState<string | null>(null);

  // Fetch corporate profile for metadata
  const { data: orgs = [] } = useQuery<any[]>({
    queryKey: ['organizations'],
    queryFn: async () => {
      const res = await fetch('/api/orgs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!token,
  });

  const companyNode = orgs.find(o => o.type === 'company');
  const companyName = companyNode ? companyNode.name : 'Enterprise risk assessment';

  // --- DOWNLOAD TRIGGERS ---

  const handleDownload = async (reportType: string, format: 'pdf' | 'excel' | 'csv') => {
    setDownloading(`${reportType}-${format}`);
    try {
      let endpoint = '';
      let filename = '';
      let title = '';
      let subtitle = '';
      let headers: string[] = [];
      let keys: string[] = [];
      
      if (reportType === 'risks') {
        endpoint = '/api/risks';
        filename = 'Risk_Register_Report';
        title = 'Enterprise Risk Register Assessment';
        subtitle = 'Complete listing of identified business, tech, and security risks';
        headers = ['Risk ID', 'Title', 'Asset Name', 'Inherent Score', 'Residual Score', 'Strategy', 'Status'];
        keys = ['riskId', 'title', 'assetName', 'inherentScore', 'residualScore', 'treatmentStrategy', 'status'];
      } else if (reportType === 'high_risks') {
        endpoint = '/api/risks';
        filename = 'High_Exposure_Risk_Report';
        title = 'High & Critical Exposure Risk Summary';
        subtitle = 'Top-tier enterprise risks (Inherent index score >= 12) requiring review';
        headers = ['Risk ID', 'Title', 'Asset Name', 'Inherent Score', 'Residual Score', 'Owner', 'Status'];
        keys = ['riskId', 'title', 'assetName', 'inherentScore', 'residualScore', 'riskOwnerId', 'status'];
      } else if (reportType === 'assets') {
        endpoint = '/api/assets';
        filename = 'Asset_Inventory_Report';
        title = 'Corporate Systems & Asset Inventory';
        subtitle = 'Catalog of servers, databases, cloud, and business processes';
        headers = ['Asset ID', 'Name', 'Type', 'Criticality', 'Confidentiality', 'Integrity', 'Availability', 'Data Classification'];
        keys = ['assetId', 'name', 'type', 'criticality', 'ciaConfidentiality', 'ciaIntegrity', 'ciaAvailability', 'dataClassification'];
      } else if (reportType === 'threats') {
        endpoint = '/api/library/threats';
        filename = 'Threat_Catalogue_Report';
        title = 'Cyber Threat Library Catalog';
        subtitle = 'Predefined system threat profiles and custom risk events';
        headers = ['Threat ID', 'Name', 'Category', 'Description'];
        keys = ['threatId', 'name', 'category', 'description'];
      } else if (reportType === 'vulnerabilities') {
        endpoint = '/api/library/vulnerabilities';
        filename = 'Vulnerability_Catalogue_Report';
        title = 'Security Vulnerability Catalog';
        subtitle = 'System weakness definitions, control gaps, and CVE records';
        headers = ['Vuln ID', 'Name', 'Severity', 'Description'];
        keys = ['vulnId', 'name', 'severity', 'description'];
      } else if (reportType === 'treatments') {
        endpoint = '/api/treatments';
        filename = 'Mitigation_Treatments_Report';
        title = 'Risk Mitigation & Corrective Action Treatments';
        subtitle = 'Track progress, owners, and budgets of risk treatment plans';
        headers = ['Risk ID', 'Strategy Summary', 'Owner', 'Budget ($)', 'Progress (%)', 'Status'];
        keys = ['riskIdentifier', 'description', 'ownerName', 'budget', 'progressPercent', 'status'];
      } else if (reportType === 'audit') {
        endpoint = '/api/audit';
        filename = 'Immutable_Audit_Log_Report';
        title = 'GRC Security Compliance Audit Ledger';
        subtitle = 'Append-only chronological audit log records';
        headers = ['Timestamp', 'User Email', 'Action Event', 'IP Address'];
        keys = ['createdAt', 'userEmail', 'action', 'ipAddress'];
      }

      // Fetch fresh data
      const res = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Data fetch failed');
      let data = await res.json();

      // Client-side Filters
      if (reportType === 'high_risks') {
        data = data.filter((r: any) => r.inherentScore >= 12);
      } else if (reportType === 'audit') {
        // Convert timestamp strings
        data = data.map((d: any) => ({
          ...d,
          createdAt: new Date(d.createdAt).toLocaleString()
        }));
      }

      const metadata = {
        user: user?.name || 'Analyst',
        company: companyName,
      };

      // Trigger Export
      if (format === 'pdf') {
        exportToPDF({ title, subtitle, headers, keys, data, metadata }, filename);
      } else if (format === 'excel') {
        await exportToExcel([{ name: filename.substring(0, 30), headers, keys, data }], filename);
      } else if (format === 'csv') {
        exportToCSV(data, headers, keys, filename);
      }

      toast.success(`${filename} exported successfully.`);
    } catch (err: any) {
      console.error(err);
      toast.error(`Report generation failed: ${err.message}`);
    } finally {
      setDownloading(null);
    }
  };

  const reportsList = [
    {
      id: 'risks',
      name: 'Complete Risk Register',
      desc: 'Export the complete list of all identified corporate risks with joined asset, threat, and scores.',
      icon: ShieldAlert,
    },
    {
      id: 'high_risks',
      name: 'High Exposure Risk Report',
      desc: 'Filter and export only critical vulnerabilities and threats with inherent index scores >= 12.',
      icon: FileText,
    },
    {
      id: 'assets',
      name: 'Asset Inventory Ledger',
      desc: 'Export detailed records of company servers, applications, databases, cloud, and CIA ratings.',
      icon: FileSpreadsheet,
    },
    {
      id: 'treatments',
      name: 'Risk Treatment & Progress',
      desc: 'Export current mitigation plans, project progress percentage, allocated budgets, and task owners.',
      icon: CheckSquare,
    },
    {
      id: 'threats',
      name: 'Cyber Threats Library',
      desc: 'Export the catalog of preseeded and custom-defined cyber threats and risk vectors.',
      icon: Library,
    },
    {
      id: 'vulnerabilities',
      name: 'Vulnerability Catalog',
      desc: 'Export mapped control gaps, unpatched vulnerabilities, and software security weaknesses.',
      icon: Library,
    },
    {
      id: 'audit',
      name: 'immutable Compliance Audit Trails',
      desc: 'Export raw chronological system audit logs (restricted access for CISOs and Auditors).',
      icon: History,
      adminOnly: true,
    },
  ];

  const allowedReports = reportsList.filter(r => 
    !r.adminOnly || ['super_admin', 'ciso', 'auditor'].includes(user?.role)
  );

  return (
    <div className="space-y-6 text-xs text-dark-text">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Reports Center</h1>
        <p className="text-xs text-dark-muted">Generate auditor-ready enterprise compliance reports in PDF, Excel, and CSV formats.</p>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allowedReports.map((report) => {
          const Icon = report.icon;
          return (
            <div 
              key={report.id}
              className="bg-dark-card border border-dark-border rounded-xl p-5 shadow-sm hover:border-brand-500/30 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-lg bg-[#232d45]/30 border border-dark-border flex items-center justify-center text-brand-500">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">{report.name}</h3>
                  <p className="text-xs text-dark-muted leading-relaxed min-h-[50px]">
                    {report.desc}
                  </p>
                </div>
              </div>

              {/* Action Downloads */}
              <div className="border-t border-dark-border/40 pt-4 mt-6 grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleDownload(report.id, 'pdf')}
                  disabled={downloading !== null}
                  className="flex items-center justify-center gap-1 bg-[#232d45]/30 hover:bg-dark-border text-white py-2 px-1.5 rounded font-semibold transition-colors border border-dark-border disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  PDF
                </button>
                <button
                  onClick={() => handleDownload(report.id, 'excel')}
                  disabled={downloading !== null}
                  className="flex items-center justify-center gap-1 bg-[#232d45]/30 hover:bg-dark-border text-white py-2 px-1.5 rounded font-semibold transition-colors border border-dark-border disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  Excel
                </button>
                <button
                  onClick={() => handleDownload(report.id, 'csv')}
                  disabled={downloading !== null}
                  className="flex items-center justify-center gap-1 bg-[#232d45]/30 hover:bg-dark-border text-white py-2 px-1.5 rounded font-semibold transition-colors border border-dark-border disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  CSV
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
