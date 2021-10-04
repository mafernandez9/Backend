const supertest = require('supertest');
// const { format } = require('date-fns');
const app = require('../../app');

const request = supertest(app.callback());

describe('User review API routes', () => {
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

  describe('GET /api/users/:userId/reviews', () => {
    let user;
    // let review;
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

    const reviewData = {
      comment: 'Muy malo, wakala',
      userId: 1,
      bookId: 3,
    };
    const authorizedGetReviews = (userId) => request
      .get(`/api/users/${userId}/reviews`)
      .auth(auth.access_token, { type: 'bearer' });
    const unauthorizedGetReviews = (userId) => request
      .get(`/api/users/${userId}/reviews`);

    beforeAll(async () => {
      user = await app.context.orm.user.create(userData);
      reviewData.userId = user.id;
      await user.createReview({ reviewData });
    });

    describe('result corresponds to existing reviews', () => {
      beforeAll(async () => {
        response = await authorizedGetReviews(user.id);
      });

      test('responds with 200 status code', () => {
        expect(response.status).toBe(200);
      });

      test('responds with a json body type', () => {
        expect(response.type).toEqual('application/json');
      });

      test('body matches snapshot', () => {
        expect(response.body).toMatchSnapshot();
      });
    });

    describe('Doesnt have permission', () => {
      test('when havent logged in', async () => {
        response = await unauthorizedGetReviews(user.id);
        expect(response.status).toBe(401);
      });
    });
  });

  describe('GET /api/users/:userId/liked_reviews', () => {
    let user;
    let response;
    let review;
    // let like;
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
    const reviewData = {
      comment: 'Muy malo, wakala',
      userId: 1,
      bookId: 3,
    };
    const likeData = {
      reviewId: 1,
      userId: 1,
    };
    const authorizedGetLikes = (userId) => request
      .get(`/api/users/${userId}/liked_reviews`)
      .auth(auth.access_token, { type: 'bearer' });

    beforeAll(async () => {
      user = await app.context.orm.user.create(userData);
      reviewData.userId = user.id;
      review = await user.createReview({ reviewData });
      likeData.userId = user.id;
      likeData.reviewId = review.id;
      await review.createLike({ likeData });
    });

    describe('result corresponds to existing likes', () => {
      beforeAll(async () => {
        response = await authorizedGetLikes(user.id);
      });

      test('responds with 200 status code', () => {
        expect(response.status).toBe(200);
      });

      test('responds with a json body type', () => {
        expect(response.type).toEqual('application/json');
      });

      test('body matches snapshot', () => {
        expect(response.body).toMatchSnapshot();
      });
    });
  });
});
