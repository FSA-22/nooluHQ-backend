import type { Request, Response } from 'express';
import User from '../models/users.model.js';
import Subscription from '../models/subscription.model.js';
import { getPercentageChange } from '../utils/percentageChange.js';

export const getDashboard = async (req: Request, res: Response) => {
  try {
    const now = new Date();

    const last30Days = new Date();
    last30Days.setDate(now.getDate() - 30);

    const prev30Days = new Date();
    prev30Days.setDate(now.getDate() - 60);

    const range = (req.query.range as string) || 'monthly';

    const groupFormat =
      range === 'weekly'
        ? { $week: '$startDate' }
        : range === 'yearly'
          ? { $year: '$startDate' }
          : { $month: '$startDate' };

    const [
      currentRevenueAgg,
      prevRevenueAgg,
      currentChurnAgg,
      prevChurnAgg,
      currentUsers,
      prevUsers,
      revenueOverTime,
      thirdPlan,
      usersByCountry,
      latestUsers,
    ] = await Promise.all([
      // Revenue
      Subscription.aggregate([
        {
          $match: {
            status: 'active',
            startDate: { $gte: last30Days },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      Subscription.aggregate([
        {
          $match: {
            status: 'active',
            startDate: { $gte: prev30Days, $lt: last30Days },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // Churn
      Subscription.aggregate([
        {
          $match: {
            status: 'cancelled',
            endDate: { $gte: last30Days },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      Subscription.aggregate([
        {
          $match: {
            status: 'cancelled',
            endDate: { $gte: prev30Days, $lt: last30Days },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // Active Users
      User.countDocuments({ lastLoginAt: { $gte: last30Days } }),
      User.countDocuments({
        lastLoginAt: { $gte: prev30Days, $lt: last30Days },
      }),

      // Revenue Over Time
      Subscription.aggregate([
        {
          $group: {
            _id: groupFormat,
            total: { $sum: '$amount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Third performing plan
      Subscription.aggregate([
        { $match: { status: 'active' } },
        {
          $group: {
            _id: '$planName',
            totalRevenue: { $sum: '$amount' },
            subscribers: { $sum: 1 },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $skip: 2 },
        { $limit: 1 },
      ]),

      // Users by country
      User.aggregate([
        {
          $group: {
            _id: '$country',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),

      //  Latest users (NO populate)
      User.find().select('name email createdAt').sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    // Subscription lookup
    const subscriptions = await Subscription.find({
      user: { $in: latestUsers.map((u) => u._id) },
    }).lean();

    const subscriptionMap = new Map(subscriptions.map((s) => [s.user?.toString(), s]));

    // Get the logged-in user details
    const currentUser = await User.findById(req.user?.id)
      .select('name email profile')
      .populate('profile');

    const userName =
      currentUser?.name ||
      (typeof currentUser?.profile === 'object' && currentUser.profile !== null
        ? (currentUser.profile as any).name
        : null) ||
      currentUser?.email.split('@')[0];

    //  Clean mapping (uses user.name)
    const latestSignups = latestUsers.map((user) => {
      const sub = subscriptionMap.get(user._id.toString());

      return {
        name: user.name || user.email.split('@')[0],
        email: user.email,
        plan: sub?.planName || 'Free',
        joined: user.createdAt,
        status: sub?.status || 'inactive',
      };
    });

    const currentRevenue = currentRevenueAgg[0]?.total ?? 0;
    const prevRevenue = prevRevenueAgg[0]?.total ?? 0;

    const churnedRevenue = currentChurnAgg[0]?.total ?? 0;
    const prevChurnedRevenue = prevChurnAgg[0]?.total ?? 0;

    return res.json({
      user: {
        id: currentUser?._id,
        name: userName,
        email: currentUser?.email,
      },
      revenue: {
        total: currentRevenue,
        change: getPercentageChange(currentRevenue, prevRevenue),
      },
      churnedRevenue: {
        total: churnedRevenue,
        change: getPercentageChange(churnedRevenue, prevChurnedRevenue),
      },
      activeUsers: {
        total: currentUsers,
        change: getPercentageChange(currentUsers, prevUsers),
      },
      revenueOverTime,
      thirdPerformingPlan: thirdPlan[0] || 60,
      usersByCountry,
      latestSignups,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ message: 'Dashboard fetch failed' });
  }
};
