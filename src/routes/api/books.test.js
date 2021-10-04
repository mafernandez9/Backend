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

  describe('GET /api/books/:id', () => {
    let book;
    let response;
    const bookData = {
      title: 'Shrek',
      description: 'los ogros son como las cebollas',
      userId: 1,
      image: 'https://picsum.photos/200',
    };
    const authorizedGetbook = (id) => request
      .get(`/api/books/${id}`)
      .auth(auth.access_token, { type: 'bearer' });

    beforeAll(async () => {
      book = await app.context.orm.book.create(bookData);
    });

    describe('when passed id corresponds to an existing book', () => {
      beforeAll(async () => {
        response = await authorizedGetbook(book.id);
      });

      test('responds with 200 status code', () => {
        expect(response.status).toBe(200);
      });

      test('responds with a json body type', () => {
        expect(response.type).toEqual('application/json');
      });
    });

    describe('when passed id does not correspond to any book', () => {
      test('responds with 404 status code', async () => {
        response = await authorizedGetbook(book.id * -1);
        expect(response.status).toBe(404);
      });
    });
  });

  describe('GET /api/books', () => {
    let response;
    const bookData = {
      title: 'Shrek',
      description: 'los ogros son como las cebollas',
      userId: 1,
      image: 'https://picsum.photos/200',
    };

    const authorizedGetbooks = () => request
      .get('/api/books')
      .auth(auth.access_token, { type: 'bearer' });

    beforeAll(async () => {
      await app.context.orm.book.create(bookData);
    });

    describe('result corresponds to existing books', () => {
      beforeAll(async () => {
        response = await authorizedGetbooks();
      });

      test('responds with 200 status code', () => {
        expect(response.status).toBe(200);
      });

      test('responds with a json body type', () => {
        expect(response.type).toEqual('application/json');
      });
    });
  });

  describe('POST /api/books', () => {
    const bookData = {
      title: 'Shrek 2',
      description: 'los ogros son mas o menos como las cebollas',
      userId: 1,
      ISBN: '2012',
      image: 'https://picsum.photos/200',
    };

    const authorizedPostBook = (body) => request
      .post('/api/books')
      .set('Content-type', 'application/json')
      .auth(auth.access_token, { type: 'bearer' })
      .send(body);

    const unauthorizedPostbook = (body) => request
      .post('/api/books')
      .set('Content-type', 'application/json')
      .send(body);

    describe('it creates a book', () => {
      test('responds with 201 status code', async () => {
        const response = await authorizedPostBook(bookData);
        expect(response.status).toBe(201);
      });
    });

    describe('book data is valid but request is unauthorized', () => {
      test('responds with 401 status code', async () => {
        const response = await unauthorizedPostbook(bookData);
        expect(response.status).toBe(401);
      });
    });
  });

  describe('PATCH /api/books/:id', () => {
    let book;
    const bookData = {
      title: 'Shrek',
      description: 'los ogros son como las cebollas',
      userId: 1,
      image: 'https://picsum.photos/200',
    };
    const updatedBook = {
      title: 'Shrek 2',
      description: 'los ogros son como las cebollas',
      userId: 1,
      image: 'https://picsum.photos/200',
    };

    const authorizedPatchbook = (bookId, body) => request
      .patch(`/api/books/${bookId}`)
      .set('Content-type', 'application/json')
      .auth(auth.access_token, { type: 'bearer' })
      .send(body);

    const unauthorizedPatchbook = (bookId, body) => request
      .patch(`/api/books/${bookId}`)
      .set('Content-type', 'application/json')
      .send(body);

    beforeAll(async () => {
      book = await app.context.orm.book.create(bookData);
    });

    describe('it patches the book', () => {
      test('responds with 200 status code', async () => {
        const response = await authorizedPatchbook(book.id, updatedBook);
        expect(response.status).toBe(200);
      });
    });

    describe('it returns the patched book', () => {
      test('responds with a json', async () => {
        const response = await authorizedPatchbook(book.id, updatedBook);
        expect(response.type).toEqual('application/json');
      });
    });

    describe('book data is valid but request is unauthorized', () => {
      test('responds with 401 status code', async () => {
        const response = await unauthorizedPatchbook(book.id, updatedBook);
        expect(response.status).toBe(401);
      });
    });
  });
});
