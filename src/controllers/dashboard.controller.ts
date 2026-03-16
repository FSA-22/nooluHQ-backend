import { Request, Response } from 'express';
import User from '../models/users.model.ts';
import Subscription from '../models/subscription.model.ts';

export const getDashboardMetrics = async (_: Request, res: Response): Promise<void> => {
  try {
    const [totalUsers, activeSubscriptions, latestUsers, planDistribution] = await Promise.all([
      User.countDocuments(),
      Subscription.countDocuments({ status: 'active' }),
      User.find().sort({ createdAt: -1 }).limit(10),
      Subscription.aggregate([
        {
          $group: {
            _id: '$plan',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    res.status(200).json({
      totalUsers,
      activeSubscriptions,
      latestUsers,
      planDistribution,
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
