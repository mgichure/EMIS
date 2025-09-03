import { db, Intake, Program } from './database';

export const seedSampleData = async () => {
  try {
    // Check if data already exists
    const existingIntakes = await db.intakes.count();
    const existingPrograms = await db.programs.count();

    if (existingIntakes === 0) {
      // Seed sample intakes
      const intakes: Omit<Intake, 'id'>[] = [
        {
          name: 'Fall 2024',
          academicYear: '2024-2025',
          startDate: new Date('2024-09-01'),
          endDate: new Date('2025-05-31'),
          applicationDeadline: new Date('2024-08-15'),
          maxCapacity: 500,
          currentEnrollment: 0,
          status: 'open',
          programs: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          synced: false,
        },
        {
          name: 'Spring 2025',
          academicYear: '2024-2025',
          startDate: new Date('2025-01-15'),
          endDate: new Date('2025-08-31'),
          applicationDeadline: new Date('2024-12-15'),
          maxCapacity: 300,
          currentEnrollment: 0,
          status: 'open',
          programs: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          synced: false,
        },
        {
          name: 'Fall 2025',
          academicYear: '2025-2026',
          startDate: new Date('2025-09-01'),
          endDate: new Date('2026-05-31'),
          applicationDeadline: new Date('2025-08-15'),
          maxCapacity: 600,
          currentEnrollment: 0,
          status: 'open',
          programs: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          synced: false,
        },
      ];

      for (const intake of intakes) {
        await db.intakes.add(intake);
      }
      console.log('✅ Sample intakes seeded');
    }

    if (existingPrograms === 0) {
      // Seed sample programs
      const programs: Omit<Program, 'id'>[] = [
        {
          name: 'Bachelor of Computer Science',
          code: 'BCS',
          description: 'A comprehensive program covering computer science fundamentals, software engineering, and modern technologies.',
          duration: '4 years',
          level: 'bachelor',
          requirements: ['High school diploma', 'Mathematics background', 'English proficiency'],
          feeStructure: {
            tuition: 12000,
            registration: 500,
            otherFees: [200, 150, 100],
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          synced: false,
        },
        {
          name: 'Master of Business Administration',
          code: 'MBA',
          description: 'Advanced business administration program focusing on leadership, strategy, and management.',
          duration: '2 years',
          level: 'master',
          requirements: ['Bachelor degree', 'Work experience', 'GMAT score'],
          feeStructure: {
            tuition: 25000,
            registration: 750,
            otherFees: [300, 250, 200],
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          synced: false,
        },
        {
          name: 'Diploma in Engineering Technology',
          code: 'DET',
          description: 'Practical engineering technology program with hands-on training and industry applications.',
          duration: '3 years',
          level: 'diploma',
          requirements: ['High school diploma', 'Science background', 'Technical aptitude'],
          feeStructure: {
            tuition: 8000,
            registration: 400,
            otherFees: [150, 100, 75],
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          synced: false,
        },
        {
          name: 'Certificate in Digital Marketing',
          code: 'CDM',
          description: 'Focused program on digital marketing strategies, social media, and online advertising.',
          duration: '1 year',
          level: 'certificate',
          requirements: ['High school diploma', 'Basic computer skills', 'Creativity'],
          feeStructure: {
            tuition: 5000,
            registration: 250,
            otherFees: [100, 75, 50],
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          synced: false,
        },
      ];

      for (const program of programs) {
        await db.programs.add(program);
      }
      console.log('✅ Sample programs seeded');
    }

    // Update intakes with program references
    if (existingIntakes === 0) {
      const allPrograms = await db.programs.toArray();
      const allIntakes = await db.intakes.toArray();

      for (const intake of allIntakes) {
        await db.intakes.update(intake.id!, {
          programs: allPrograms.map(p => p.id!),
          updatedAt: new Date(),
        });
      }
      console.log('✅ Intake-program relationships updated');
    }

  } catch (error) {
    console.error('❌ Error seeding sample data:', error);
  }
};

export const clearSampleData = async () => {
  try {
    await db.intakes.clear();
    await db.programs.clear();
    console.log('✅ Sample data cleared');
  } catch (error) {
    console.error('❌ Error clearing sample data:', error);
  }
};
