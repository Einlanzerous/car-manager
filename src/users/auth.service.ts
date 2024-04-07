import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from './users.service';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify<string, string, number, Buffer>(_scrypt);

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async signup(email: string, password: string) {
    const emailInUse = await this.usersService.find(email);

    if (emailInUse.length)
      throw new BadRequestException('Email already in use');

    const salt = randomBytes(8).toString('hex');
    const hash = await scrypt(password, salt, 32);
    const result = salt + '.' + hash.toString('hex');

    const user = await this.usersService.create(email, result);

    return user;
  }

  signin() {}
}
