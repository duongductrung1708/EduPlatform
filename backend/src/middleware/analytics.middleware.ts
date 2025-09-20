import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AnalyticsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Log analytics data for real-time updates
    const originalSend = res.send;
    
    res.send = function(data) {
      // Check if this is a user registration, course creation, or classroom creation
      if (req.method === 'POST') {
        const url = req.url;
        
        if (url.includes('/auth/register')) {
          // User registration - could trigger notification
          console.log('User registration detected for analytics');
        } else if (url.includes('/courses')) {
          // Course creation - could trigger notification
          console.log('Course creation detected for analytics');
        } else if (url.includes('/classrooms')) {
          // Classroom creation - could trigger notification
          console.log('Classroom creation detected for analytics');
        }
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  }
}
