import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { User } from './user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;
  const password = 'test1234!';
  const email = 'test@example.com';

  beforeEach(async () => {
    const users: User[] = [];

    fakeUsersService = {
      find: (email: string) => {
        const filteredUsers = users.filter((user) => user.email === email);
        return Promise.resolve(filteredUsers);
      },
      create: (email: string, password: string) => {
        const user: User = {
          id: Math.floor(Math.random() * 99999),
          email,
          password,
        };
        users.push(user);
        return Promise.resolve(user);
      },
    };
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: fakeUsersService,
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  test('Can create an instance of auth service', async () => {
    expect(service).toBeDefined();
  });

  test('Creates a new user with a salted and hashed password', async () => {
    const pw = 'test1234!';
    const user = await service.signup('test@example.com', pw);

    expect(user.password).not.toEqual(pw);
    const [salt, hash] = user.password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  test('Throws an error if user signs up with an e-mail that is in use', async () => {
    await service.signup(email, password);

    await expect(service.signup(email, password)).rejects.toThrow(
      BadRequestException,
    );
  });

  test('Throws an error if user attempts to sign in with an unused email', async () => {
    await expect(
      service.signin('invalid@notreal.com', 'password'),
    ).rejects.toThrow(NotFoundException);
  });

  test('Throws an error if incorrect password is provided', async () => {
    await service.signup(email, password);
    await expect(service.signin(email, 'badpw')).rejects.toThrow(
      BadRequestException,
    );
  });

  test('Returns correct user if correct password is provided', async () => {
    const createdUser = await service.signup(email, password);
    const user = await service.signin(email, password);

    expect(user).toBeDefined();
    expect(user).toHaveProperty('email', email);
    expect(user).toHaveProperty('id', createdUser.id);
  });
});
