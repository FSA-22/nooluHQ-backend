import mongoose from 'mongoose';
import Plan from '../models/plan.model.ts'; // adjust path

const PLANS = [
  {
    name: 'free',
    price: 0,
    billingCycle: 'monthly',
    features: ['basic_access'],
  },
  {
    name: 'pro',
    price: 49,
    billingCycle: 'monthly',
    features: ['basic_access', 'advanced_reports', 'priority_support'],
  },
  {
    name: 'enterprise',
    price: 199,
    billingCycle: 'monthly',
    features: [
      'basic_access',
      'advanced_reports',
      'priority_support',
      'team_collaboration',
      'custom_integrations',
    ],
  },
];

async function seedPlans() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/YOUR_DB_NAME'); // replace DB

    for (const plan of PLANS) {
      const existing = await Plan.findOne({ name: plan.name });

      if (!existing) {
        await Plan.create(plan);
        console.log(`Plan created: ${plan.name}`);
      } else {
        console.log(`Plan already exists: ${plan.name}`);
      }
    }

    console.log('✅ Plan seeding completed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Plan seeding failed:', err);
    process.exit(1);
  }
}

seedPlans();
