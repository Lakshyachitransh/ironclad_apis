import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debug() {
  try {
    const lessonId = '8b428177-3c0c-426e-a23c-d4042629c7ed';
    
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { 
        module: { 
          include: { course: true } 
        }
      }
    });

    if (!lesson) {
      console.log('Lesson not found');
      return;
    }

    console.log('=== LESSON DETAILS ===');
    console.log('Lesson ID:', lesson.id);
    console.log('Title:', lesson.title);
    console.log('Video URL:', lesson.videoUrl);
    console.log('Video File Name:', lesson.videoFileName);
    console.log('Video Duration:', lesson.videoDuration);
    console.log('Module:', lesson.module.title);
    console.log('Course:', lesson.module.course.title);
    
    console.log('\nFull Lesson Object:');
    console.log(JSON.stringify(lesson, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debug();
