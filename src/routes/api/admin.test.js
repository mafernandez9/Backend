const supertest = require('supertest');
// const { format } = require('date-fns');
const app = require('../../app');

const request = supertest(app.callback());

describe('Book API routes', () => {
  let auth;
  const userFields = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@gmail.com',
    nickname: 'usertest',
    birthDay: '1994-05-21',
    password: 'testPassword',
    image: 'https://picsum.photos/200',
    role: 'admin',
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

  describe('DELETE /api/admin/books/:book_id', () => {
    let book;
    let response;
    const bookData = {
      title: 'Inferno',
      description: 'El del tipo que los quiere matar a todos',
      userId: 1,
      ISBN: '99009938393',
      image: 'langdon.png',
    };

    const authorizedDeleteBook = (bookId) => request
      .delete(`/api/admin/books/${bookId}`)
      .auth(auth.access_token, { type: 'bearer' });

    const unauthorizedDeleteBook = (bookId) => request
      .delete(`/api/admin/books/${bookId}`);

    beforeAll(async () => {
      book = await app.context.orm.book.create(bookData);
    });

    describe('result answers with deleted Book', () => {
      beforeAll(async () => {
        response = await authorizedDeleteBook(book.id);
      });
      test('responds with successful status', () => {
        expect(response.body.status).toEqual('Libro eliminado con éxito!');
      });
      test('responds with 200 code', () => {
        expect(response.status).toBe(200);
      });
    });

    describe('request is unauthorized', () => {
      test('responds with 401 status code', async () => {
        response = await unauthorizedDeleteBook(book.id);
        expect(response.status).toBe(401);
      });
    });
  });

  describe('DELETE /api/admin/users/:user_id', () => {
    let user;
    let response;
    const userData = {
      firstName: 'Mario',
      lastName: 'pepito',
      email: 'ppp@gmail.com',
      nickname: 'peptest',
      birthDay: '1994-05-21',
      password: 'pepePassword',
      image: 'https://picsum.photos/200',
      role: 'client',
    };

    const authorizedDeleteUser = (userId) => request
      .delete(`/api/admin/users/${userId}`)
      .auth(auth.access_token, { type: 'bearer' });

    const unauthorizedDeleteUser = (userId) => request
      .delete(`/api/admin/users/${userId}`);

    beforeAll(async () => {
      user = await app.context.orm.user.create(userData);
    });

    describe('result answers with deleted User', () => {
      beforeAll(async () => {
        response = await authorizedDeleteUser(user.id);
      });
      test('responds with successful status', () => {
        expect(response.body.status).toEqual('Usuario eliminado con éxito!');
      });
      test('responds with 200 code', () => {
        expect(response.status).toBe(200);
      });
    });

    describe('request is unauthorized', () => {
      test('responds with 401 status code', async () => {
        response = await unauthorizedDeleteUser(user.id);
        expect(response.status).toBe(401);
      });
      test('it doesnt return anything', () => {
        expect(response.body.status).toBe(undefined);
      });
    });
  });
});
