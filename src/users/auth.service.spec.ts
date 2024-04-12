import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  beforeEach(async () => {
    fakeUsersService = {
      find: () => Promise.resolve([]),
      create: (email: string, password: string) =>
        Promise.resolve({ id: 1, email, password }),
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
    fakeUsersService.find = () =>
      Promise.resolve([{ id: 1, email: 'a', password: '1' }]);

    await expect(
      service.signup('test@example.com', 'password'),
    ).rejects.toThrow(BadRequestException);
  });

  test('Throws an error if user attempts to sign in with an unused email', async () => {
    await expect(
      service.signin('test@example.com', 'password'),
    ).rejects.toThrow(NotFoundException);
  });

  test('Throws an error if incorrect password is provided', async () => {
    fakeUsersService.find = () =>
      Promise.resolve([
        { id: 1, email: 'test@example.com', password: 'test1234' },
      ]);

    await expect(service.signin('test@example.com', 'badpw')).rejects.toThrow(
      BadRequestException,
    );
  });

  test.skip('Returns a user if correct password is provided', async () => {
    const password = 'test1234!';
    const email = 'test@example.com';

    fakeUsersService.find = () => Promise.resolve([{ id: 7, email, password }]);

    const user = await service.signin(email, password);

    expect(user).toBeDefined();
  });
});
