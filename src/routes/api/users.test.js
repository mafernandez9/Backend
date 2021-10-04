const supertest = require('supertest');
// const { format } = require('date-fns');
const app = require('../../app');

const request = supertest(app.callback());

describe('User API routes', () => {
  let auth;
  const userFields = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@gmail.com',
    nickname: 'usertest',
    birthDay: '1994-05-21',
    password: 'testPassword',
    image: 'https://picsum.photos/200',
    role: 'client',
  };

  beforeAll(async () => {
    await app.context.orm.sequelize.sync({ force: true });
    await app.context.orm.user.create(userFields);
    const authResponse = await request
      .post('/api/auth')
      .set('Content-type', 'application/json')
      .send({ email: userFields.email, password: userFields.password });
    auth = authResponse.body;
  });

  afterAll(async () => {
    await app.context.orm.sequelize.close();
  });

  describe('GET /api/users/:id', () => {
    let user;
    let response;
    const userData = {
      firstName: 'Pepe',
      lastName: 'pepito',
      email: 'ppp@gmail.com',
      nickname: 'peptest',
      birthDay: '1994-05-21',
      password: 'pepePassword',
      image: 'https://picsum.photos/200',
      role: 'client',
    };
    const authorizedGetUser = (id) => request
      .get(`/api/users/${id}`)
      .auth(auth.access_token, { type: 'bearer' });

    beforeAll(async () => {
      user = await app.context.orm.user.create(userData);
    });

    describe('when passed id corresponds to an existing user', () => {
      beforeAll(async () => {
        response = await authorizedGetUser(user.id);
      });

      test('responds with 200 status code', () => {
        expect(response.status).toBe(200);
      });

      test('responds with a json body type', () => {
        expect(response.type).toEqual('application/json');
      });
    });

    describe('when passed id does not correspond to any user', () => {
      test('responds with 404 status code', async () => {
        response = await authorizedGetUser(user.id * -1);
        expect(response.status).toBe(404);
      });
    });
  });

  describe('GET /api/users/me', () => {
    let response;

    const authorizedGetUser = () => request
      .get('/api/users/me')
      .auth(auth.access_token, { type: 'bearer' });

    describe('when passed id corresponds to an existing user', () => {
      beforeAll(async () => {
        response = await authorizedGetUser();
      });

      test('responds with 200 status code', () => {
        expect(response.status).toBe(200);
      });

      test('responds with a json body type', () => {
        expect(response.type).toEqual('application/json');
      });
    });
  });

  describe('POST /api/users', () => {
    const userData = {
      firstName: 'Pepe',
      lastName: 'pepito',
      email: 'pppe@gmail.com',
      nickname: 'pepetest',
      birthDay: '1994-05-21',
      password: 'pepePassword',
      image: 'https://picsum.photos/200',
      role: 'client',
    };
    const userData2 = {
      firstName: 'Pepe',
      lastName: 'pepito',
      email: 'pppe@gmail.com',
      nickname: 'peptest',
      birthDay: '1994-05-21',
      password: 'pepePassword',
      image: 'https://picsum.photos/200',
      role: 'client',
    };

    const userData3 = {
      firstName: 'Pepe',
      lastName: 'pepito',
      email: 'ppe@gmail.com',
      nickname: 'pepetest',
      birthDay: '1994-05-21',
      password: 'pepePassword',
      image: 'https://picsum.photos/200',
      role: 'client',
    };

    const unauthorizedPostUser = (body) => request
      .post('/api/users')
      .set('Content-type', 'application/json')
      .send(body);

    describe('user data is valid', () => {
      let response;

      beforeAll(async () => {
        response = await unauthorizedPostUser(userData);
      });

      test('responds with 201 (created) status code', () => {
        expect(response.status).toBe(201);
      });

      test('responds with a JSON body type', () => {
        expect(response.type).toEqual('application/json');
      });

      test('response for POST user has an id (user has an id)', () => {
        expect(response.body.data.id).toBeDefined();
      });
    });

    describe('when the email or nickname already exists', () => {
      let response2;
      let response3;
      beforeAll(async () => {
        response2 = await unauthorizedPostUser(userData2);
        response3 = await unauthorizedPostUser(userData3);
      });
      test('email already exists and responds with 401 status code', () => {
        expect(response2.status).toBe(400);
      });
      test('email already exists and responds with according message', () => {
        expect(response2.body.state).toEqual('No puedes realizar esta acción, el usuario ya tiene ese nickname o email en uso');
      });
      test('password already exists and responds with 401 status code', () => {
        expect(response3.status).toBe(400);
      });
      test('password already exists and responds according message', () => {
        expect(response3.body.state).toEqual('No puedes realizar esta acción, el usuario ya tiene ese nickname o email en uso');
      });
    });
  });

  describe('GET /api/users', () => {
    let response;
    const userData = {
      firstName: 'Pepe',
      lastName: 'pepito',
      email: 'ppp@gmail.com',
      nickname: 'peptest',
      birthDay: '1994-05-21',
      password: 'pepePassword',
      image: 'https://picsum.photos/200',
      role: 'client',
    };

    const authorizedGetUsers = () => request
      .get('/api/users')
      .auth(auth.access_token, { type: 'bearer' });

    beforeAll(async () => {
      await app.context.orm.user.create(userData);
    });

    describe('result corresponds to existing users', () => {
      beforeAll(async () => {
        response = await authorizedGetUsers();
      });

      test('responds with 200 status code', () => {
        expect(response.status).toBe(200);
      });

      test('responds with a json body type', () => {
        expect(response.type).toEqual('application/json');
      });
    });
  });

  describe('PATCH /api/users/:id', () => {
    let user;
    const userData = {
      firstName: 'Pepe',
      lastName: 'pepito',
      email: 'ppp@gmail.com',
      nickname: 'peptest',
      birthDay: '1994-05-21',
      password: 'pepePassword',
      image: 'https://picsum.photos/200',
      role: 'client',
    };
    const updatedUser = {
      firstName: 'Mario',
      lastName: 'pepito',
      email: 'ppp@gmail.com',
      nickname: 'peptest',
      birthDay: '1994-05-21',
      password: 'pepePassword',
      image: 'https://picsum.photos/200',
      role: 'client',
    };

    const unauthorizedPatchUser = (userId, body) => request
      .patch(`/api/users/${userId}`)
      .set('Content-type', 'application/json')
      .send(body);

    const authorizedPatchUser = (userId, body) => request
      .patch(`/api/users/${userId}`)
      .set('Content-type', 'application/json')
      .auth(auth.access_token, { type: 'bearer' })
      .send(body);

    beforeAll(async () => {
      user = await app.context.orm.user.create(userData);
    });

    describe('user data is valid but request is unauthorized', () => {
      test('responds with 401 status code because youre not logged in', async () => {
        const response = await unauthorizedPatchUser(user.id, updatedUser);
        expect(response.status).toBe(401);
      });
      test('responds with 403 status code because you are not the user', async () => {
        const response = await authorizedPatchUser(user.id, updatedUser);
        expect(response.status).toBe(403);
      });
      test('responds with wrong message because youre not the user', async () => {
        const response = await authorizedPatchUser(user.id, updatedUser);
        expect(response.body.state).toEqual('No puedes realizar esta acción, ya que no eres el usuario :(');
      });
    });

    describe('user is authorized', () => {
      test('responds with 200 status code', async () => {
        const response = await authorizedPatchUser(auth.id, updatedUser);
        expect(response.status).toBe(201);
      });
    });
  });
});
