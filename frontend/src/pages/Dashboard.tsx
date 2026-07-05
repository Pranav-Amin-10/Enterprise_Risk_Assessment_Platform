import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/useAuthStore';
import ReactECharts from 'echarts-for-react';
import { Shield, ShieldAlert, FileWarning, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { DashboardSkeleton } from '../components/ui/Skeleton';

export const Dashboard: React.FC = () => {
  const token = useAuthStore((state) => state.token);

  // Fetch Dashboard Stats from backend API
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch dashboard statistics');
      return res.json();
    },
    enabled: !!token,
  });

  if (isLoading) return <DashboardSkeleton />;
  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-dark-card border border-dark-border rounded-xl">
        <AlertTriangle className="h-10 w-10 text-red-500 mb-2" />
        <h3 className="text-white font-semibold">Failed to Load Dashboard</h3>
        <p className="text-xs text-dark-muted mt-1">Check network logs or database connections.</p>
      </div>
    );
  }

  const { summary, heatmaps, statusDistribution, risksByDepartment, risksByAssetType, topRisks } = stats;

  // Stat Cards Config
  const statCards = [
    { 
      name: 'Total Risks', 
      value: summary.totalRisks, 
      desc: 'Registered in register', 
      icon: FileWarning, 
      color: 'text-brand-500 bg-brand-500/10' 
    },
    { 
      name: 'High & Critical Risks', 
      value: summary.highRisks, 
      desc: 'Score of 12 or above', 
      icon: ShieldAlert, 
      color: 'text-red-400 bg-red-400/10' 
    },
    { 
      name: 'Active Treatments', 
      value: summary.activeTreatments, 
      desc: 'Mitigations in progress', 
      icon: Clock, 
      color: 'text-amber-400 bg-amber-400/10' 
    },
    { 
      name: 'Compliance Index', 
      value: `${summary.complianceIndex}%`, 
      desc: 'Mitigated or accepted risks', 
      icon: CheckCircle, 
      color: 'text-emerald-400 bg-emerald-400/10' 
    },
  ];

  // 1. Inherent Heatmap Option (5x5 Grid)
  const heatmapData: any[] = [];
  if (heatmaps?.inherent) {
    for (let l = 0; l < 5; l++) {
      for (let i = 0; i < 5; i++) {
        // [X, Y, Value] -> X = Impact (i), Y = Likelihood (l), Value = Count
        heatmapData.push([i, l, heatmaps.inherent[l][i]]);
      }
    }
  }

  const heatmapOption = {
    tooltip: {
      position: 'top',
      formatter: (params: any) => `Likelihood: ${params.value[1] + 1}<br/>Impact: ${params.value[0] + 1}<br/>Count: ${params.value[2]}`,
    },
    grid: {
      height: '70%',
      top: '10%',
      bottom: '15%',
      left: '10%',
      right: '5%',
    },
    xAxis: {
      type: 'category',
      data: ['1 - Negligible', '2 - Minor', '3 - Moderate', '4 - Major', '5 - Critical'],
      splitArea: { show: true },
      axisLabel: { color: '#9ca3af', fontSize: 10 },
      axisLine: { lineStyle: { color: '#232d45' } },
    },
    yAxis: {
      type: 'category',
      data: ['1 - Rare', '2 - Unlikely', '3 - Possible', '4 - Likely', '5 - Almost Certain'],
      splitArea: { show: true },
      axisLabel: { color: '#9ca3af', fontSize: 10 },
      axisLine: { lineStyle: { color: '#232d45' } },
    },
    visualMap: {
      min: 0,
      max: Math.max(...heatmapData.map(d => d[2]), 5),
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      textStyle: { color: '#9ca3af' },
      inRange: {
        // Red gradient scale
        color: ['rgba(35, 45, 69, 0.4)', '#f59e0b', '#ef4444', '#7c3aed']
      }
    },
    series: [{
      name: 'Inherent Risks',
      type: 'heatmap',
      data: heatmapData,
      label: {
        show: true,
        formatter: (p: any) => p.value[2] > 0 ? p.value[2] : '',
        color: '#fff',
        fontWeight: 'bold'
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  };

  // 2. Risks by Department Option
  const barOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '5%', containLabel: true },
    xAxis: {
      type: 'value',
      boundaryGap: [0, 0.01],
      splitLine: { lineStyle: { color: '#232d45' } },
      axisLabel: { color: '#9ca3af' },
    },
    yAxis: {
      type: 'category',
      data: risksByDepartment?.map((d: any) => d.department) || [],
      axisLabel: { color: '#9ca3af' },
      axisLine: { lineStyle: { color: '#232d45' } },
    },
    series: [
      {
        name: 'Risk Count',
        type: 'bar',
        data: risksByDepartment?.map((d: any) => d.count) || [],
        itemStyle: {
          color: '#0284c7',
          borderRadius: [0, 4, 4, 0],
        },
      }
    ]
  };

  // 3. Risks by Asset Type Option
  const pieOption = {
    tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
    legend: {
      orient: 'vertical',
      left: 'left',
      textStyle: { color: '#9ca3af' },
    },
    series: [
      {
        name: 'Assets Categories',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#161d30',
          borderWidth: 2
        },
        label: { show: false },
        data: risksByAssetType?.map((a: any) => ({
          name: a.assetType.toUpperCase().replace('_', ' '),
          value: a.count,
        })) || [],
      }
    ]
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-dark-muted">Real-time indicators of enterprise compliance and risk exposure.</p>
        </div>
      </div>

      {/* 2. Key Statistics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.name} className="bg-dark-card border border-dark-border rounded-xl p-5 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-dark-muted uppercase tracking-wider">{card.name}</p>
                <h3 className="text-2xl font-extrabold text-white">{card.value}</h3>
                <p className="text-[10px] text-gray-500">{card.desc}</p>
              </div>
              <div className={`p-3 rounded-lg shrink-0 ${card.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Heatmaps and Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Heatmap Card */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-5 lg:col-span-2 shadow-sm flex flex-col">
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-white">Inherent Risk Heatmap</h3>
            <p className="text-[11px] text-dark-muted">Risk counts aggregated by Likelihood vs. Impact intersections.</p>
          </div>
          <div className="flex-1 min-h-[320px]">
            <ReactECharts option={heatmapOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* Asset category distribution Card */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-5 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white">Risks by Asset Category</h3>
            <p className="text-[11px] text-dark-muted">Distribution of active threats across systems types.</p>
          </div>
          <div className="flex-1 min-h-[280px]">
            <ReactECharts option={pieOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

      </div>

      {/* 4. Bottom Row: Department chart + Top Risks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Risks by Department */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-5 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white">Risks by Business Department</h3>
            <p className="text-[11px] text-dark-muted">Risk density count comparison across business divisions.</p>
          </div>
          <div className="flex-1 min-h-[250px]">
            <ReactECharts option={barOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* Top Risks table */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white">Top 5 Inherent Risks</h3>
            <p className="text-[11px] text-dark-muted">Highest impact and likelihood threats requiring treatment.</p>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-dark-border text-dark-muted font-medium">
                  <th className="py-2.5">ID</th>
                  <th className="py-2.5">Risk Title</th>
                  <th className="py-2.5 text-center">Inherent Score</th>
                  <th className="py-2.5 text-center">Residual</th>
                  <th className="py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/40">
                {topRisks?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-dark-muted">No risks defined yet.</td>
                  </tr>
                ) : (
                  topRisks?.map((risk: any) => {
                    let scoreBg = 'bg-risk-low';
                    if (risk.inherentScore >= 15) scoreBg = 'bg-risk-critical';
                    else if (risk.inherentScore >= 10) scoreBg = 'bg-risk-high';
                    else if (risk.inherentScore >= 5) scoreBg = 'bg-risk-medium';

                    return (
                      <tr key={risk.id} className="hover:bg-dark-border/20 transition-colors">
                        <td className="py-3 font-semibold text-brand-500">{risk.riskId}</td>
                        <td className="py-3 font-medium text-dark-text truncate max-w-[150px]">{risk.title}</td>
                        <td className="py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${scoreBg}`}>
                            {risk.inherentScore}
                          </span>
                        </td>
                        <td className="py-3 text-center font-bold text-dark-text">{risk.residualScore}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 bg-dark-border text-dark-muted rounded-full text-[10px] font-semibold capitalize">
                            {risk.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
