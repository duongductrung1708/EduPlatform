import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../modules/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Classroom, ClassroomDocument } from '../models/classroom.model';
import { User, UserDocument } from '../models/user.model';

async function migrate() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const classroomModel = app.get<Model<ClassroomDocument>>(getModelToken(Classroom.name));

  try {
    console.log('🔧 Normalizing legacy classroom fields...');
    const classes = await classroomModel.find({});
    let updated = 0;
    for (const c of classes) {
      let changed = false;
      const update: any = {};

      // teacherId -> teacherIds
      const anyC: any = c as any;
      if (anyC.teacherId && (!Array.isArray(anyC.teacherIds) || anyC.teacherIds.length === 0)) {
        update.teacherIds = [new Types.ObjectId(anyC.teacherId)];
        changed = true;
      }

      // students -> studentIds
      if (Array.isArray(anyC.students) && (!Array.isArray(anyC.studentIds) || anyC.studentIds.length === 0)) {
        update.studentIds = anyC.students.map((id: any) => new Types.ObjectId(id));
        changed = true;
      }

      if (changed) {
        await classroomModel.updateOne({ _id: c._id }, { $set: update, $unset: { teacherId: '', students: '' } });
        updated++;
        console.log(`✅ Updated classroom ${c._id}`);
      }
    }
    console.log(`🎉 Done. Updated ${updated} classroom documents.`);
  } catch (e) {
    console.error('❌ Migration error:', e);
    process.exit(1);
  } finally {
    await app.close();
  }
}

migrate();


