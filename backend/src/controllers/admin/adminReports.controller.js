const Candidate = require('../../models/Candidate');
const Recruiter = require('../../models/Recruiter');
const Job = require('../../models/Job');
const Application = require('../../models/Application');
const Payment = require('../../models/Payment');
const Notification = require('../../models/Notification');
const Dispute = require('../../models/Dispute');
const DeliveryLog = require('../../models/DeliveryLog');

function parseDateRange(range, from, to) {
  const now = new Date();
  let start = new Date(now);
  let end = now;
  if (range === 'custom' && from && to) {
    start = new Date(`${from}T00:00:00.000Z`);
    end = new Date(`${to}T23:59:59.999Z`);
  } else if (range === '1D') {
    start.setHours(0, 0, 0, 0);
  } else if (range === '7D') {
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  } else if (range === '1M') {
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
  } else if (range === '6M') {
    start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  } else if (range === '1Y') {
    start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  } else if (range === '5Y') {
    start = new Date(now.getFullYear() - 4, 0, 1);
  } else {
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  }
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    throw new Error('Invalid report date range');
  }
  return { start, end };
}

function getBuckets(range, start, end) {
  const monthly = ['6M', '1Y'].includes(range);
  const yearly = range === '5Y';
  const buckets = [];
  const cursor = new Date(start);
  if (monthly) cursor.setDate(1);
  if (yearly) cursor.setMonth(0, 1);
  while (cursor <= end) {
    const bucketStart = new Date(cursor);
    const bucketEnd = monthly
      ? new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999)
      : yearly
        ? new Date(cursor.getFullYear(), 11, 31, 23, 59, 59, 999)
        : new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), 23, 59, 59, 999);
    buckets.push({
      start: bucketStart < start ? new Date(start) : bucketStart,
      end: bucketEnd > end ? new Date(end) : bucketEnd,
      label: yearly ? String(cursor.getFullYear()) : monthly ? cursor.toLocaleString('en-US', { month: 'short' }) : cursor.toLocaleString('en-US', { month: 'short', day: 'numeric' }),
    });
    if (monthly) cursor.setMonth(cursor.getMonth() + 1);
    else if (yearly) cursor.setFullYear(cursor.getFullYear() + 1);
    else cursor.setDate(cursor.getDate() + 1);
  }
  return buckets;
}

async function bucketCounts(Model, field, buckets, match = {}) {
  const result = await Model.aggregate([
    { $match: { ...match, [field]: { $gte: buckets[0].start, $lte: buckets[buckets.length - 1].end } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: `$${field}` } }, count: { $sum: 1 } } },
  ]);
  const byDay = new Map(result.map((item) => [item._id, item.count]));
  return buckets.map((bucket) => {
    let total = 0;
    for (let day = new Date(bucket.start); day <= bucket.end; day.setUTCDate(day.getUTCDate() + 1)) {
      total += byDay.get(day.toISOString().slice(0, 10)) || 0;
    }
    return total;
  });
}

async function bucketSums(Model, field, buckets, match = {}, amountField = 'amount') {
  const result = await Model.aggregate([
    { $match: { ...match, [field]: { $gte: buckets[0].start, $lte: buckets[buckets.length - 1].end } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: `$${field}` } }, total: { $sum: `$${amountField}` } } },
  ]);
  const byDay = new Map(result.map((item) => [item._id, item.total]));
  return buckets.map((bucket) => {
    let total = 0;
    for (let day = new Date(bucket.start); day <= bucket.end; day.setUTCDate(day.getUTCDate() + 1)) {
      total += byDay.get(day.toISOString().slice(0, 10)) || 0;
    }
    return total;
  });
}

function paymentDateMatch(start, end) {
  return {
    $or: [
      { paidAt: { $gte: start, $lte: end } },
      { paidAt: null, createdAt: { $gte: start, $lte: end } },
    ],
  };
}

async function bucketPaymentSums(Model, buckets, match = {}, amountField = 'amount') {
  const result = await Model.aggregate([
    {
      $match: {
        ...match,
        $or: [
          { paidAt: { $gte: buckets[0].start, $lte: buckets[buckets.length - 1].end } },
          { paidAt: null, createdAt: { $gte: buckets[0].start, $lte: buckets[buckets.length - 1].end } },
        ],
      },
    },
    {
      $project: {
        bucketDate: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: { $ifNull: ['$paidAt', '$createdAt'] },
          },
        },
        [amountField]: 1,
      },
    },
    { $group: { _id: '$bucketDate', total: { $sum: `$${amountField}` } } },
  ]);

  const byDay = new Map(result.map((item) => [item._id, item.total]));
  return buckets.map((bucket) => {
    let total = 0;
    for (let day = new Date(bucket.start); day <= bucket.end; day.setUTCDate(day.getUTCDate() + 1)) {
      const iso = day.toISOString().slice(0, 10);
      total += byDay.get(iso) || 0;
    }
    return total;
  });
}

exports.getReports = async (req, res) => {
  try {
    const range = req.query.range || '7D';
    const { start, end } = parseDateRange(range, req.query.from, req.query.to);
    const buckets = getBuckets(range, start, end);
    const dateMatch = { createdAt: { $gte: start, $lte: end } };
    const applicationDateMatch = { appliedAt: { $gte: start, $lte: end } };

    const paymentDateFilter = paymentDateMatch(start, end);
    const [
      candidates, recruiters, jobs, applications, hired, openJobs, revenueAgg, refundAgg, revenueSources,
      candidateCounts, recruiterCounts, applicationCounts, paymentCounts, refundCounts, jobStatus, funnel,
      recruiterPerformance, recruiterResponseTimes, deliveryStats, notifications, disputes, paymentHealth,
    ] = await Promise.all([
      Candidate.countDocuments(dateMatch), Recruiter.countDocuments({ ...dateMatch, registrationStatus: 'complete' }), Job.countDocuments(dateMatch),
      Application.countDocuments(applicationDateMatch), Application.countDocuments({ ...applicationDateMatch, status: 'hired' }),
      Job.countDocuments({ status: { $in: ['open', 'active'] } }),
      Payment.aggregate([{ $match: { ...paymentDateFilter, status: 'success' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Payment.aggregate([{ $match: { ...paymentDateFilter, status: 'refunded' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Payment.aggregate([{ $match: { ...paymentDateFilter, status: 'success' } }, { $group: { _id: '$purpose', value: { $sum: '$amount' } } }]),
      bucketCounts(Candidate, 'createdAt', buckets), bucketCounts(Recruiter, 'createdAt', buckets, { registrationStatus: 'complete' }),
      bucketCounts(Application, 'appliedAt', buckets), bucketPaymentSums(Payment, buckets, { status: 'success' }, 'amount'),
      bucketPaymentSums(Payment, buckets, { status: 'refunded' }, 'amount'),
      Job.aggregate([{ $match: dateMatch }, { $group: { _id: '$status', value: { $sum: 1 } } }]),
      Application.aggregate([{ $match: applicationDateMatch }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Application.aggregate([
        { $match: applicationDateMatch },
        { $group: { _id: '$recruiter', jobsPosted: { $addToSet: '$job' }, hires: { $sum: { $cond: [{ $eq: ['$status', 'hired'] }, 1, 0] } } } },
        { $sort: { hires: -1 } }, { $limit: 5 }, { $lookup: { from: 'recruiters', localField: '_id', foreignField: '_id', as: 'recruiter' } },
        { $unwind: '$recruiter' },
      ]),
      Application.aggregate([
        { $match: { ...applicationDateMatch, viewedAt: { $exists: true } } },
        { $group: {
          _id: '$recruiter',
          avgResponseTimeMs: { $avg: { $subtract: ['$viewedAt', '$appliedAt'] } },
          count: { $sum: 1 }
        }},
      ]),
      DeliveryLog.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: {
          _id: '$type',
          sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
          delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          total: { $sum: 1 }
        }},
      ]),
      Notification.countDocuments(dateMatch),
      Dispute.aggregate([{ $match: dateMatch }, { $group: { _id: '$status', value: { $sum: 1 } } }]),
      Payment.aggregate([{ $match: paymentDateFilter }, { $group: { _id: '$status', value: { $sum: 1 } } }]),
    ]);

    const series = buckets.map((bucket, index) => ({ label: bucket.label, candidates: candidateCounts[index], recruiters: recruiterCounts[index], applications: applicationCounts[index], revenue: paymentCounts[index], refunds: refundCounts[index] }));
    const sumBy = (items, key = 'value') => Object.fromEntries(items.map((item) => [item._id || 'unknown', item[key]]));
    const jobStatusMap = sumBy(jobStatus);
    const funnelMap = sumBy(funnel, 'count');
    const disputeMap = sumBy(disputes);
    const paymentHealthMap = sumBy(paymentHealth);
    const revenueSourceTotal = revenueSources.reduce((total, item) => total + item.value, 0);

    // Map recruiter response times by recruiter ID
    const responseTimeMap = new Map(
      recruiterResponseTimes.map((item) => [
        item._id.toString(),
        {
          avgMs: item.avgResponseTimeMs,
          count: item.count
        }
      ])
    );

    // Helper function to format milliseconds to human-readable format
    const formatResponseTime = (avgMs) => {
      if (!avgMs || Number.isNaN(avgMs)) return 'N/A';
      const hours = avgMs / (1000 * 60 * 60);
      if (hours < 1) {
        const minutes = Math.round((avgMs / (1000 * 60)));
        return `${minutes}m`;
      } else if (hours < 24) {
        return `${Math.round(hours)}h`;
      } else {
        const days = Math.round(hours / 24);
        return `${days}d`;
      }
    };

    res.json({
      range: { key: range, from: start.toISOString(), to: end.toISOString() },
      kpis: { candidates, recruiters, revenue: revenueAgg[0]?.total || 0, activeJobs: openJobs, applications, hired },
      growth: series.map(({ label, candidates: value, recruiters: rec }) => ({ label, candidates: value, recruiters: rec })),
      revenue: series.map(({ label, revenue: value, refunds }) => ({ label, revenue: value, refunds })),
      revenueSources: revenueSources.map((item) => ({ name: item._id, value: item.value, percentage: revenueSourceTotal ? Math.round((item.value / revenueSourceTotal) * 100) : 0 })),
      jobs: Object.entries(jobStatusMap).map(([name, value]) => ({ name, value })),
      funnel: ['applied', 'shortlisted', 'interview_scheduled', 'offered', 'hired'].map((stage) => ({ stage, count: funnelMap[stage] || 0 })),
      recruitersPerformance: recruiterPerformance.map((item) => {
        const responseData = responseTimeMap.get(item._id.toString());
        return {
          company: item.recruiter.companyName,
          jobsPosted: item.jobsPosted.length,
          hires: item.hires,
          avgResponse: responseData ? formatResponseTime(responseData.avgMs) : 'N/A',
          score: item.jobsPosted.length ? Math.round((item.hires / item.jobsPosted.length) * 100) : 0
        };
      }),
      health: {
        candidates,
        applications,
        notifications,
        disputes: disputeMap,
        paymentHealth: paymentHealthMap,
        refunds: refundAgg[0]?.total || 0,
        deliveryTracked: deliveryStats.length > 0,
        deliveryStats: Object.fromEntries(
          deliveryStats.map((d) => [
            d._id,
            { sent: d.sent || 0, delivered: d.delivered || 0, failed: d.failed || 0, total: d.total || 0 }
          ])
        ),
      },
    });
  } catch (error) {
    console.error('Admin reports error:', error);
    res.status(400).json({ error: error.message || 'Unable to load reports' });
  }
};