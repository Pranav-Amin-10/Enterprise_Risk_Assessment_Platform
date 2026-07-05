import { Hono } from 'hono';
import { getDb } from '../db';
import { risks, assets, organizations, treatments } from '../db/schema';
import { eq, gte, lt } from 'drizzle-orm';
import type { Env, Variables } from '../middleware/auth';

const dashboardRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

dashboardRouter.get('/stats', async (c) => {
  const db = getDb(c.env.DB);

  try {
    // 1. Fetch all risks and treatments to aggregate programmatically
    const allRisks = await db.select({
      id: risks.id,
      riskId: risks.riskId,
      title: risks.title,
      inherentImpact: risks.inherentImpact,
      inherentLikelihood: risks.inherentLikelihood,
      inherentScore: risks.inherentScore,
      residualImpact: risks.residualImpact,
      residualLikelihood: risks.residualLikelihood,
      residualScore: risks.residualScore,
      status: risks.status,
      reviewDate: risks.reviewDate,
      assetId: risks.assetId,
      assetName: assets.name,
      assetType: assets.type,
      departmentId: assets.departmentId,
      departmentName: organizations.name,
    })
    .from(risks)
    .leftJoin(assets, eq(risks.assetId, assets.id))
    .leftJoin(organizations, eq(assets.departmentId, organizations.id))
    .all();

    const allTreatments = await db.select().from(treatments).all();

    // --- Core Counters ---
    const totalRisks = allRisks.length;
    const highRisksCount = allRisks.filter(r => r.inherentScore >= 12).length;
    const activeTreatmentsCount = allTreatments.filter(t => t.status === 'in_progress' || t.status === 'planned').length;
    
    const now = new Date().getTime();
    const overdueTreatmentsCount = allTreatments.filter(t => 
      (t.status === 'in_progress' || t.status === 'planned') && 
      t.dueDate.getTime() < now
    ).length;

    const overdueRiskReviewsCount = allRisks.filter(r => 
      r.reviewDate && r.reviewDate.getTime() < now
    ).length;

    // --- Heatmap Intersections (5x5 matrix for Inherent & Residual) ---
    // Structure: matrix[likelihood-1][impact-1] = count
    const inherentMatrix = Array(5).fill(null).map(() => Array(5).fill(0));
    const residualMatrix = Array(5).fill(null).map(() => Array(5).fill(0));

    allRisks.forEach(r => {
      const inhL = Math.max(1, Math.min(5, r.inherentLikelihood)) - 1;
      const inhI = Math.max(1, Math.min(5, r.inherentImpact)) - 1;
      inherentMatrix[inhL][inhI]++;

      const resL = Math.max(1, Math.min(5, r.residualLikelihood)) - 1;
      const resI = Math.max(1, Math.min(5, r.residualImpact)) - 1;
      residualMatrix[resL][resI]++;
    });

    // --- Status Distribution ---
    const statusCounts: Record<string, number> = {
      identified: 0,
      assessing: 0,
      treating: 0,
      accepted: 0,
      mitigated: 0,
      closed: 0,
    };
    allRisks.forEach(r => {
      if (statusCounts[r.status] !== undefined) {
        statusCounts[r.status]++;
      }
    });

    // --- Risk by Department ---
    const deptMap: Record<string, { name: string; count: number; sumScore: number }> = {};
    allRisks.forEach(r => {
      const deptName = r.departmentName || 'Unassigned';
      if (!deptMap[deptName]) {
        deptMap[deptName] = { name: deptName, count: 0, sumScore: 0 };
      }
      deptMap[deptName].count++;
      deptMap[deptName].sumScore += r.inherentScore;
    });
    const risksByDepartment = Object.values(deptMap).map(d => ({
      department: d.name,
      count: d.count,
      avgRiskScore: Math.round((d.sumScore / d.count) * 10) / 10,
    }));

    // --- Risk by Asset Type ---
    const assetTypeMap: Record<string, number> = {};
    allRisks.forEach(r => {
      const type = r.assetType || 'Unknown';
      assetTypeMap[type] = (assetTypeMap[type] || 0) + 1;
    });
    const risksByAssetType = Object.entries(assetTypeMap).map(([type, count]) => ({
      assetType: type,
      count,
    }));

    // --- Top Risks ---
    const topRisks = [...allRisks]
      .sort((a, b) => b.inherentScore - a.inherentScore)
      .slice(0, 5)
      .map(r => ({
        id: r.id,
        riskId: r.riskId,
        title: r.title,
        inherentScore: r.inherentScore,
        residualScore: r.residualScore,
        status: r.status,
      }));

    // --- Compliance Overview (KPI) ---
    // Define simple compliance % as mitigated/closed/accepted risks over total
    const resolvedRisks = allRisks.filter(r => 
      r.status === 'mitigated' || r.status === 'closed' || r.status === 'accepted'
    ).length;
    const complianceIndex = totalRisks > 0 ? Math.round((resolvedRisks / totalRisks) * 100) : 100;

    return c.json({
      summary: {
        totalRisks,
        highRisks: highRisksCount,
        activeTreatments: activeTreatmentsCount,
        overdueTreatments: overdueTreatmentsCount,
        overdueReviews: overdueRiskReviewsCount,
        complianceIndex,
      },
      heatmaps: {
        inherent: inherentMatrix,
        residual: residualMatrix,
      },
      statusDistribution: Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
      })),
      risksByDepartment,
      risksByAssetType,
      topRisks,
    });

  } catch (err: any) {
    console.error('Fetch dashboard stats error:', err);
    return c.json({ error: err.message }, 500);
  }
});

export default dashboardRouter;
