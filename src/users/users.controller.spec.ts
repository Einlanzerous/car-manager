import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthService } from './auth.service';
import { NotFoundException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let fakeUsersService: Partial<UsersService>;
  let fakeAuthService: Partial<AuthService>;
  const email = 'test@example.com';
  const password = 'test1234!';

  beforeEach(async () => {
    fakeUsersService = {
      findOne: (id: number) => {
        return Promise.resolve({
          id,
          email,
          password,
        });
      },
      find: (email: string) => {
        return Promise.resolve([{ id: 1, email, password }]);
      },
      // remove: () => {},
      // update: () => {},
    };
    fakeAuthService = {
      // signup: () => {},
      signin: (email: string, password: string) => { return Promise.resolve({ id: 1, email, password })},
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: fakeUsersService },
        { provide: AuthService, useValue: fakeAuthService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  test('should be defined', () => {
    expect(controller).toBeDefined();
  });

  test('findUser returns a single user with the given id', async () => {
    const user = await controller.findUser('1');

    expect(user).toBeDefined();
  })

  test('findUser throws an error if user with given id is not found', async () => {
    fakeUsersService.findOne = () => null;

    await expect(controller.findUser('1')).rejects.toThrow(NotFoundException);
  });

  test('findAllUsers returns a list of users with the given e-mail', async () => {
    const users = await controller.findAllUsers(email);

    expect(users.length).toEqual(1);
    expect(users[0].email).toEqual(email);
  });

  test('signin updates session object and returns user', async () => {
    const session = { userId: -1 };
    const user = await controller.signin({ email, password }, session);

    expect(user.id).toEqual(1);
    expect(session.userId).toEqual(1);
  })
});
