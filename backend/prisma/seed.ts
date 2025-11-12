import { PrismaClient, Difficulty } from '@prisma/client';
import bcrypt from 'bcryptjs';
import logger from '../src/utils/logger';

const prisma = new PrismaClient();

async function main() {
  logger.info('🌱 Starting database seed...');

  // Create levels
  const levels = [
    { number: 1, name: 'Novice Explorer', minXP: 0, maxXP: 499 },
    { number: 2, name: 'Adventurer', minXP: 500, maxXP: 999 },
    { number: 3, name: 'Seeker', minXP: 1000, maxXP: 1999 },
    { number: 4, name: 'Pathfinder', minXP: 2000, maxXP: 2999 },
    { number: 5, name: 'Veteran', minXP: 3000, maxXP: 4499 },
    { number: 6, name: 'Champion', minXP: 4500, maxXP: 6499 },
    { number: 7, name: 'Master', minXP: 6500, maxXP: 8999 },
    { number: 8, name: 'Elite', minXP: 9000, maxXP: 11999 },
    { number: 9, name: 'Legend', minXP: 12000, maxXP: 15999 },
    { number: 10, name: 'Mythic', minXP: 16000, maxXP: null },
  ];

  for (const levelData of levels) {
    const level = await prisma.level.upsert({
      where: { number: levelData.number },
      update: {
        name: levelData.name,
        minXP: levelData.minXP,
        maxXP: levelData.maxXP,
      },
      create: levelData
    });
  logger.info('✅ Level created:', level.name);
  }

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@challengequest.com' },
    update: {},
    create: {
      email: 'admin@challengequest.com',
      username: 'admin',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      isAdmin: true,
      xp: 10000,
      level: 10
    }
  });

  logger.info('✅ Admin user created:', admin.username);

  // Create test users
  const testUsers = [
    {
      email: 'john@example.com',
      username: 'john_doe',
      firstName: 'John',
      lastName: 'Doe',
      xp: 2500,
      level: 3
    },
    {
      email: 'jane@example.com',
      username: 'jane_smith',
      firstName: 'Jane',
      lastName: 'Smith',
      xp: 1800,
      level: 2
    },
    {
      email: 'bob@example.com',
      username: 'bob_wilson',
      firstName: 'Bob',
      lastName: 'Wilson',
      xp: 3200,
      level: 4
    }
  ];

  for (const userData of testUsers) {
    const password = await bcrypt.hash('password123', 12);
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        password
      }
    });
  logger.info('✅ Test user created:', user.username);
  }

  // Create sample challenges
  const challenges = [
    {
      title: 'City Explorer Quest',
      description: 'Navigate through historic landmarks and discover hidden gems in the city center. Complete GPS checkpoints and QR scans.',
      category: 'Urban Adventure',
      difficulty: 'MEDIUM' as Difficulty,
      xpReward: 500,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      maxParticipants: 100,
      stages: [
        {
          title: 'Central Park Discovery',
          description: 'Find the hidden fountain in Central Park',
          order: 1,
          latitude: 40.7829,
          longitude: -73.9654,
          radius: 50
        },
        {
          title: 'Historic Library',
          description: 'Visit the main public library and scan the QR code',
          order: 2,
          latitude: 40.7532,
          longitude: -73.9822,
          radius: 30
        },
        {
          title: 'Art Gallery Tour',
          description: 'Explore the modern art gallery',
          order: 3,
          latitude: 40.7614,
          longitude: -73.9776,
          radius: 40
        },
        {
          title: 'Food Market Adventure',
          description: 'Discover local cuisine at the food market',
          order: 4,
          latitude: 40.7505,
          longitude: -73.9934,
          radius: 60
        },
        {
          title: 'Skyline Viewpoint',
          description: 'Capture the perfect city skyline photo',
          order: 5,
          latitude: 40.7484,
          longitude: -73.9857,
          radius: 80
        },
        {
          title: 'Final Challenge',
          description: 'Complete the grand finale at the city center',
          order: 6,
          latitude: 40.7589,
          longitude: -73.9851,
          radius: 100
        }
      ]
    },
    {
      title: 'Nature Trail Challenge',
      description: 'Explore scenic hiking trails and capture nature\'s beauty. Complete all checkpoints to unlock the final stage.',
      category: 'Outdoor',
      difficulty: 'HARD' as Difficulty,
      xpReward: 750,
      startDate: new Date(),
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      maxParticipants: 50,
      stages: [
        {
          title: 'Trail Head',
          description: 'Start your journey at the trail head',
          order: 1,
          latitude: 40.7505,
          longitude: -73.9934,
          radius: 50
        },
        {
          title: 'Waterfall View',
          description: 'Find the hidden waterfall',
          order: 2,
          latitude: 40.7484,
          longitude: -73.9857,
          radius: 40
        },
        {
          title: 'Summit Peak',
          description: 'Reach the highest point of the trail',
          order: 3,
          latitude: 40.7614,
          longitude: -73.9776,
          radius: 60
        },
        {
          title: 'Wildlife Spotting',
          description: 'Observe local wildlife',
          order: 4,
          latitude: 40.7532,
          longitude: -73.9822,
          radius: 80
        },
        {
          title: 'Sunset Point',
          description: 'Watch the sunset from the best viewpoint',
          order: 5,
          latitude: 40.7829,
          longitude: -73.9654,
          radius: 70
        },
        {
          title: 'Trail Completion',
          description: 'Complete your nature adventure',
          order: 6,
          latitude: 40.7589,
          longitude: -73.9851,
          radius: 50
        }
      ]
    },
    {
      title: 'Tech Hub Scavenger',
      description: 'Visit innovation centers and tech companies. Scan QR codes and answer trivia questions at each location.',
      category: 'Technology',
      difficulty: 'EASY' as Difficulty,
      xpReward: 300,
      startDate: new Date(),
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      maxParticipants: 200,
      stages: [
        {
          title: 'Startup Incubator',
          description: 'Visit the startup incubator',
          order: 1,
          latitude: 40.7505,
          longitude: -73.9934,
          radius: 50
        },
        {
          title: 'Tech Museum',
          description: 'Explore the technology museum',
          order: 2,
          latitude: 40.7484,
          longitude: -73.9857,
          radius: 40
        },
        {
          title: 'Innovation Lab',
          description: 'Check out the innovation laboratory',
          order: 3,
          latitude: 40.7614,
          longitude: -73.9776,
          radius: 60
        },
        {
          title: 'Coding Bootcamp',
          description: 'Visit the coding bootcamp center',
          order: 4,
          latitude: 40.7532,
          longitude: -73.9822,
          radius: 80
        },
        {
          title: 'Tech Conference Center',
          description: 'Explore the tech conference center',
          order: 5,
          latitude: 40.7829,
          longitude: -73.9654,
          radius: 70
        },
        {
          title: 'Final Tech Challenge',
          description: 'Complete the ultimate tech challenge',
          order: 6,
          latitude: 40.7589,
          longitude: -73.9851,
          radius: 50
        }
      ]
    },
    {
      title: 'Foodie Paradise Tour',
      description: 'Discover the best local cuisine spots. Complete taste challenges and photo submissions at each restaurant.',
      category: 'Food & Culture',
      difficulty: 'EASY' as Difficulty,
      xpReward: 350,
      startDate: new Date(),
      endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
      maxParticipants: 150,
      stages: [
        {
          title: 'Local Bakery',
          description: 'Try the famous local bakery',
          order: 1,
          latitude: 40.7505,
          longitude: -73.9934,
          radius: 50
        },
        {
          title: 'Street Food Market',
          description: 'Explore the street food market',
          order: 2,
          latitude: 40.7484,
          longitude: -73.9857,
          radius: 40
        },
        {
          title: 'Fine Dining Restaurant',
          description: 'Experience fine dining',
          order: 3,
          latitude: 40.7614,
          longitude: -73.9776,
          radius: 60
        },
        {
          title: 'Coffee Roastery',
          description: 'Visit the local coffee roastery',
          order: 4,
          latitude: 40.7532,
          longitude: -73.9822,
          radius: 80
        },
        {
          title: 'Food Truck Festival',
          description: 'Enjoy the food truck festival',
          order: 5,
          latitude: 40.7829,
          longitude: -73.9654,
          radius: 70
        },
        {
          title: 'Culinary Finale',
          description: 'Complete your culinary journey',
          order: 6,
          latitude: 40.7589,
          longitude: -73.9851,
          radius: 50
        }
      ]
    }
  ];

  for (const challengeData of challenges) {
    const challenge = await prisma.challenge.create({
      data: {
        title: challengeData.title,
        description: challengeData.description,
        category: challengeData.category,
        difficulty: challengeData.difficulty,
        xpReward: challengeData.xpReward,
        startDate: challengeData.startDate,
        endDate: challengeData.endDate,
        maxParticipants: challengeData.maxParticipants,
        stages: {
          create: challengeData.stages
        }
      }
    });
  logger.info('✅ Challenge created:', challenge.title);
  }

  // Create achievements
  const achievements = [
    {
      name: 'First Steps',
      description: 'Complete your first challenge',
      icon: '🎯',
      xpReward: 100,
      condition: JSON.stringify({ type: 'challenges_completed', count: 1 })
    },
    {
      name: 'Explorer',
      description: 'Complete 5 challenges',
      icon: '🗺️',
      xpReward: 500,
      condition: JSON.stringify({ type: 'challenges_completed', count: 5 })
    },
    {
      name: 'Master',
      description: 'Complete 10 challenges',
      icon: '👑',
      xpReward: 1000,
      condition: JSON.stringify({ type: 'challenges_completed', count: 10 })
    },
    {
      name: 'Speed Demon',
      description: 'Complete a challenge in under 2 hours',
      icon: '⚡',
      xpReward: 300,
      condition: JSON.stringify({ type: 'fast_completion', maxTime: 7200000 })
    },
    {
      name: 'Social Butterfly',
      description: 'Join 3 challenges simultaneously',
      icon: '🦋',
      xpReward: 400,
      condition: JSON.stringify({ type: 'concurrent_challenges', count: 3 })
    }
  ];

  for (const achievementData of achievements) {
    const achievement = await prisma.achievement.upsert({
      where: { name: achievementData.name },
      update: {},
      create: achievementData
    });
  logger.info('✅ Achievement created:', achievement.name);
  }

  // Update user ranks
  const users = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { xp: 'desc' }
  });

  for (let i = 0; i < users.length; i++) {
    await prisma.user.update({
      where: { id: users[i].id },
      data: { rank: i + 1 }
    });
  }

  logger.info('✅ User ranks updated');

  logger.info('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    logger.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
