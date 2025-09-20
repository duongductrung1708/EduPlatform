import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../models/user.model';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'change_me',
    });
  }

  async validate(payload: any) {
    console.log('JWT Strategy - Payload:', payload);
    const user = await this.userModel.findById(payload.sub);
    console.log('JWT Strategy - User found:', user ? { id: user._id, email: user.email, role: user.role } : 'null');
    if (!user) {
      throw new UnauthorizedException();
    }
    return { id: user._id, email: user.email, role: user.role };
  }
}
