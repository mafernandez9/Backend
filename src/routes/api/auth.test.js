const supertest = require('supertest');

const app = require('../../app');

const request = supertest(app.callback());

describe('User Auth validation', () => {
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
  });
  describe('POST correct api/auth', () => {
    const authData = {
      email: 'test@gmail.com',
      password: 'testPassword',
    };
    test('Authenticates succesfully', async () => {
      const authResponse = await request.post('/api/auth').set('Content-type', 'application/json').send({ email: authData.email, password: authData.password });
      expect(authResponse.body.access_token).not.toBeNull();
    });
    test('returns status 200', async () => {
      const authResponse = await request.post('/api/auth').set('Content-type', 'application/json').send({ email: authData.email, password: authData.password });
      expect(authResponse.status).toBe(200);
    });
  });
  describe('POST incorrect api/auth because of email', () => {
    const authData = {
      email: 'test@gmail.ccm',
      password: 'testPassword',
    };
    test('It doesn´t authenticates because the email is wrong', async () => {
      const authResponse = await request.post('/api/auth').set('Content-type', 'application/json').send({ email: authData.email, password: authData.password });
      expect(authResponse.body.access_token).toBe(undefined);
    });
    test('returns status 404', async () => {
      const authResponse = await request.post('/api/auth').set('Content-type', 'application/json').send({ email: authData.email, password: authData.password });
      expect(authResponse.status).toBe(404);
    });
  });
  describe('POST incorrect api/auth because of password', () => {
    const authData = {
      email: 'test@gmail.com',
      password: 'testPasswrd',
    };
    test('It doesn´t authenticates because the password is wrong', async () => {
      const authResponse = await request.post('/api/auth').set('Content-type', 'application/json').send({ email: authData.email, password: authData.password });
      expect(authResponse.body.access_token).toBe(undefined);
    });
    test('returns status 401', async () => {
      const authResponse = await request.post('/api/auth').set('Content-type', 'application/json').send({ email: authData.email, password: authData.password });
      await app.context.orm.sequelize.close();
      expect(authResponse.status).toBe(401);
    });
  });
});
