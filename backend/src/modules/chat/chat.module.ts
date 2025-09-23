import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatMessage, ChatMessageSchema } from '../../models/chat-message.model';
import { Classroom, ClassroomSchema } from '../../models/classroom.model';
import { Lesson, LessonSchema } from '../../models/lesson.model';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatMessage.name, schema: ChatMessageSchema },
      { name: Classroom.name, schema: ClassroomSchema },
      { name: Lesson.name, schema: LessonSchema },
    ]),
    RealtimeModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}


