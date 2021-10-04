/* eslint-disable no-shadow */
const supertest = require('supertest');
// const { format } = require('date-fns');
const app = require('../../app');

const request = supertest(app.callback());

describe('Review API routes', () => {
  let auth;
  let userOrigin;
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
    userOrigin = await app.context.orm.user.create(userFields);
    const authResponse = await request
      .post('/api/auth')
      .set('Content-type', 'application/json')
      .send({ email: userFields.email, password: userFields.password });
    auth = authResponse.body;
  });

  afterAll(async () => {
    await app.context.orm.sequelize.close();
  });

  describe('GET /api/books/:bookId/reviews/:id', () => {
    let review;
    let book;
    let response;
    const reviewData = {
      comment: 'Muy buen libro',
      userId: 1,
      bookId: 1,
    };
    const bookData = {
      title: 'El Principito',
      description: 'Se trata de',
      userId: 1,
      ISBN: '99009938392',
      image: 'culebra.png',
    };

    const authorizedGetReview = (bookId, reviewId) => request
      .get(`/api/books/${bookId}/reviews/${reviewId}`)
      .auth(auth.access_token, { type: 'bearer' });
    const unauthorizedGetReview = (bookId, reviewId) => request.get(`/api/books/${bookId}/reviews/${reviewId}`);

    beforeAll(async () => {
      book = await app.context.orm.book.create(bookData);
      // console.log('BOOK: ', book);
      review = await book.createReview({ reviewData });
      // console.log('REVIEW: ', review);
    });

    describe('when passed id corresponds to an existing review', () => {
      beforeAll(async () => {
        // console.log('REVIEW 2: ', review);
        response = await authorizedGetReview(book.id, review.id);
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

    describe('when passed id does not correspond to any review', () => {
      test('responds with 404 status code', async () => {
        response = await authorizedGetReview(book.id, review.id * -1);
        expect(response.status).toBe(404);
      });
    });

    describe('when request is unauthorized because user is not logged in', () => {
      test('responds with 200 status code', async () => {
        response = await unauthorizedGetReview(book.id, review.id);
        expect(response.status).toBe(200);
      });
    });
  });

  describe('POST /api/books/:bookId/reviews', () => {
    let book;
    let response;
    const reviewData = {
      comment: 'Que malo el libro, estaba fome porque se murió el tipo',
      userId: 1,
      bookId: 2,
    };
    const bookData = {
      title: 'Harry Potter',
      description: 'El del niñito ',
      userId: 1,
      ISBN: '99009938393',
      image: 'culebra.png',
    };
    const authorizedPostReview = (bookId, body) => request
      .post(`/api/books/${bookId}/reviews`)
      .auth(auth.access_token, { type: 'bearer' })
      .set('Content-type', 'application/json')
      .send(body);
    const unauthorizedPostReview = (bookId, body) => request
      .post(`/api/books/${bookId}/reviews`)
      .set('Content-type', 'application/json')
      .send(body);

    beforeAll(async () => {
      book = await app.context.orm.book.create(bookData);
    });

    describe('review data is valid', () => {
    //   let response;

      beforeAll(async () => {
        response = await authorizedPostReview(book.id, reviewData);
      });

      test('responds with 201 (created) status code', () => {
        expect(response.status).toBe(201);
      });

      test('responds with a JSON body type', () => {
        expect(response.type).toEqual('application/json');
      });

      test('response for POST review has an id (review has an id)', () => {
        expect(response.body.data.id).toBeDefined();
      });

      test('response body matches snapshot', () => {
        expect(response.body).toMatchSnapshot();
      });

      test('post request actually created the given review', async () => {
        const review = await app.context.orm.review.findByPk(response.body.data.id);
        const { userId, bookId, comment } = review.dataValues;
        const sanitizedReview = { userId, bookId, comment };
        expect(sanitizedReview).toEqual(reviewData);
      });
    });

    describe('review data is invalid', () => {
      test('responds with 400 status code', async () => {
        const invalidBodies = [
          {},
          { userId: 'John' },
          { bookId: 5 },
        ];
        await Promise.all(invalidBodies.map(authorizedPostReview))
          .then((responses) => {
            responses.forEach((response1) => expect(response1.status).toBe(400));
          });
      });
    });

    describe('review data is valid but request is unauthorized', () => {
      test('responds with 401 status code', async () => {
        response = await unauthorizedPostReview(book.id, reviewData);
        expect(response.status).toBe(401);
      });
    });
  });

  describe('GET /api/books/:bookId/reviews', () => {
    let book;
    let response;
    // let review;
    const reviewData = {
      comment: 'Se pone bueno cuando termina',
      userId: 1,
      bookId: 2,
    };
    const bookData = {
      title: 'Harry Potter',
      description: 'El del niñito ',
      userId: 1,
      ISBN: '99009938393',
      image: 'culebra.png',
    };
    const authorizedGetReviews = (bookId) => request
      .get(`/api/books/${bookId}/reviews`)
      .auth(auth.access_token, { type: 'bearer' });

    beforeAll(async () => {
      book = await app.context.orm.book.create(bookData);
      await book.createReview({ reviewData });
    });

    describe('result corresponds to existing reviews', () => {
      beforeAll(async () => {
        // console.log('REVIEW 2: ', review);
        response = await authorizedGetReviews(book.id);
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

  describe('PATCH /api/books/:bookId/reviews/:id', () => {
    let book;
    let response;
    let review;
    const reviewData = {
      comment: 'Comienza lento pero es bueno',
      userId: 1,
      bookId: 3,
    };
    const bookData = {
      title: 'Inferno',
      description: 'El del tipo que los quiere matar a todos',
      userId: 1,
      ISBN: '99009938393',
      image: 'langdon.png',
    };
    const updatedReview = {
      comment: 'Demasiado bueno, buena temática, pero bastante parecido a los demás del autor',
      userId: 1,
      bookId: 3,
    };

    const unauthorizedPatchReview = (bookId, reviewId, body) => request
      .patch(`/api/books/${bookId}/reviews/${reviewId}`)
      .set('Content-type', 'application/json')
      .send(body);

    const authorizedPatchReviews = (bookId, reviewId, body) => request
      .patch(`/api/books/${bookId}/reviews/${reviewId}`)
      .auth(auth.access_token, { type: 'bearer' })
      .send(body);

    beforeAll(async () => {
      book = await app.context.orm.book.create(bookData);
      reviewData.userId = userOrigin.id;
      reviewData.bookId = book.id;
      review = await book.createReview({ reviewData });
      updatedReview.bookId = book.id;
      updatedReview.userId = userOrigin.id;
    });

    describe('result corresponds to existing reviews', () => {
      beforeAll(async () => {
        // console.log('REVIEW 2: ', review);
        response = await authorizedPatchReviews(book.id, review.id, updatedReview);
      });

      test('responds with 403 status code', () => {
        expect(response.status).toBe(403);
      });

      test('responds with a json body type', () => {
        expect(response.type).toEqual('application/json');
      });

      test('body matches message', () => {
        expect(response.body.status).toEqual('No tienes permiso para editar esta review');
      });
    });

    describe('review data is valid but request is unauthorized', () => {
      test('responds with 401 status code', async () => {
        const response = await unauthorizedPatchReview(book.id, review.id, updatedReview);
        expect(response.status).toBe(401);
      });
    });
  });

  describe('DELETE /api/books/:bookId/reviews/:id', () => {
    let book;
    let response;
    let review;
    const bookData = {
      title: 'Inferno',
      description: 'El del tipo que los quiere matar a todos',
      userId: 1,
      ISBN: '99009938393',
      image: 'langdon.png',
    };
    const reviewData = {
      comment: 'Comienza lento pero es bueno',
      userId: 1,
      bookId: 2,
    };
    const authorizedDeleteReview = (bookId, reviewId) => request
      .delete(`/api/books/${bookId}/reviews/${reviewId}`)
      .auth(auth.access_token, { type: 'bearer' });

    const unauthorizedDeleteReview = (bookId, reviewId) => request
      .delete(`/api/books/${bookId}/reviews/${reviewId}`);

    beforeAll(async () => {
      const user = await app.context.orm.user.findOne({ where: { email: 'test@gmail.com' } });
      book = await app.context.orm.book.create(bookData);
      reviewData.userId = user.id;
      reviewData.bookId = book.id;
      review = await book.createReview({ reviewData });
    });

    describe('result answers with deleted review', () => {
      beforeAll(async () => {
        response = await authorizedDeleteReview(book.id, review.id);
      });
    });

    describe('request is unauthorized', () => {
      test('responds with 401 status code', async () => {
        response = await unauthorizedDeleteReview(book.id, review.id);
        expect(response.status).toBe(401);
      });
    });
  });

  describe('DELETE /api/books/:bookId/reviews/:reviewId/likes', () => {
    let book;
    let response;
    let review;
    // let like;
    const reviewData = {
      comment: 'Comienza lento pero es bueno',
      userId: 1,
      bookId: 3,
    };
    const bookData = {
      title: 'Inferno',
      description: 'El del tipo que los quiere matar a todos',
      userId: 1,
      ISBN: '99009938393',
      image: 'langdon.png',
    };
    // const likeData = {
    //     userId: 1,
    //     reviewId: 6,
    // }

    const authorizedDeleteLike = (bookId, reviewId) => request
      .delete(`/api/books/${bookId}/reviews/${reviewId}/likes`)
      .auth(auth.access_token, { type: 'bearer' });

    const unauthorizedDeleteLike = (bookId, reviewId) => request
      .delete(`/api/books/${bookId}/reviews/${reviewId}/likes`);

    beforeAll(async () => {
      book = await app.context.orm.book.create(bookData);
      review = await book.createReview({ reviewData });
      await review.createLike({ reviewId: review.id, userId: 1 });
    });

    describe('result answers with deleted like', () => {
      beforeAll(async () => {
        response = await authorizedDeleteLike(book.id, review.id);
      });

      test('responds with successful status', () => {
        expect(response.body.status).toEqual('Like eliminado con éxito!');
      });
      test('returns status 200', () => {
        expect(response.status).toBe(200);
      });
    });

    describe('request is unauthorized', () => {
      test('responds with 401 status code', async () => {
        response = await unauthorizedDeleteLike(book.id, review.id);
        expect(response.status).toBe(401);
      });
    });

    describe('when the book does not exists', () => {
      test('responds with not succesful status', async () => {
        response = await authorizedDeleteLike(50, review.id);
        expect(response.status).toBe(404);
      });
    });

    describe('when the review does not exists', () => {
      test('responds with not succesful status', async () => {
        response = await authorizedDeleteLike(book.id, 50);
        expect(response.status).toBe(404);
      });
    });
  });

  describe('POST /api/books/:bookId/reviews/:reviewId/likes', () => {
    let book;
    let response;
    let review;

    const reviewData = {
      comment: 'Comienza lento pero es bueno',
      userId: 1,
      bookId: 3,
    };
    const bookData = {
      title: 'Inferno',
      description: 'El del tipo que los quiere matar a todos',
      userId: 1,
      ISBN: '99009938393',
      image: 'langdon.png',
    };
    const likeData = {
      userId: 1,
      reviewId: 1,
    };

    const authorizedPostLike = (bookId, reviewId, body) => request
      .post(`/api/books/${bookId}/reviews/${reviewId}/likes`)
      .auth(auth.access_token, { type: 'bearer' })
      .set('Content-type', 'application/json')
      .send(body);
    const unauthorizedPostLike = (bookId, reviewId, body) => request
      .post(`/api/books/${bookId}/reviews/${reviewId}/likes`)
      .set('Content-type', 'application/json')
      .send(body);

    beforeAll(async () => {
      book = await app.context.orm.book.create(bookData);
      review = await book.createReview({ reviewData });
    });

    describe('review data is valid', () => {
      //   let response;

      beforeAll(async () => {
        response = await authorizedPostLike(book.id, review.id, likeData);
      });

      test('responds with 201 (created) status code', () => {
        expect(response.status).toBe(201);
      });

      test('body matches snapshot', () => {
        expect(response.body).toMatchSnapshot();
      });
    });

    describe('like data is valid but request is unauthorized', () => {
      test('responds with 401 status code', async () => {
        response = await unauthorizedPostLike(book.id, review.id, likeData);
        expect(response.status).toBe(401);
      });
    });
  });

  describe('POST /api/books/:bookId/reviews/:reviewId/reports', () => {
    let book;
    let response;
    let review;

    const reviewData = {
      comment: 'Comienza lento pero es bueno',
      userId: 1,
      bookId: 1,
    };
    const bookData = {
      title: 'Inferno',
      description: 'El del tipo que los quiere matar a todos',
      userId: 1,
      ISBN: '99009938393',
      image: 'langdon.png',
    };
    const reportData = {
      userId: 1,
      reviewId: 1,
      content: 'no es tan lento',
    };

    const authorizedPostReport = (bookId, reviewId, body) => request
      .post(`/api/books/${bookId}/reviews/${reviewId}/reports`)
      .auth(auth.access_token, { type: 'bearer' })
      .set('Content-type', 'application/json')
      .send(body);
    const unauthorizedPostReport = (bookId, reviewId, body) => request
      .post(`/api/books/${bookId}/reviews/${reviewId}/likes`)
      .set('Content-type', 'application/json')
      .send(body);

    beforeAll(async () => {
      book = await app.context.orm.book.create(bookData);
      review = await book.createReview({ reviewData });
    });

    describe('report data is valid', () => {
      beforeAll(async () => {
        response = await authorizedPostReport(book.id, review.id, reportData);
      });
      test('responds with 201 (created) status code', () => {
        expect(response.status).toBe(201);
      });

      test('body matches snapshot', () => {
        expect(response.body).toMatchSnapshot();
      });
    });

    describe('without permission', () => {
      test('responds with 400 (created) status code', async () => {
        response = await unauthorizedPostReport(book.id, review.id, reportData);
        expect(response.status).toBe(401);
      });
    });
  });

  describe('GET /api/books/:bookId/reviews/:reviewId/reports', () => {
    let book;
    let review;
    let report;
    let response;
    const reportData = {
      userId: 1,
      reviewId: 1,
      content: 'No se pone nunca weno',
    };
    const reviewData = {
      comment: 'Se pone weno cuando empieza',
      userId: 1,
      bookId: 1,
    };
    const bookData = {
      title: 'Las Crónicas de Narnia: El León, La Bruja y el Bulla',
      description: 'Dale León',
      userId: 1,
      ISBN: '3948303830',
      image: 'León.png',
    };
    const notauthorizedGetReports = (bookId, reviewId) => request
      .get(`/api/books/${bookId}/reviews/${reviewId}/reports`)
      .set('Content-type', 'application/json');

    const authorizedGetReports = (bookId, reviewId) => request
      .get(`/api/books/${bookId}/reviews/${reviewId}/reports`)
      .auth(auth.access_token, { type: 'bearer' })
      .set('Content-type', 'application/json');

    beforeAll(async () => {
      book = await app.context.orm.book.create(bookData);
      review = await book.createReview({ reviewData });
      report = await review.createReport({ reportData });
      report.reviewId = review.id;
    });

    describe('report data is valid', () => {
      beforeAll(async () => {
        response = await authorizedGetReports(book.id, review.id);
      });
      test('responds with 403 status code', () => {
        expect(response.status).toBe(403);
      });
    });

    describe('wrong permission', () => {
      test('it doesnt have permission', async () => {
        response = await notauthorizedGetReports(book.id, review.id);
        expect(response.status).toBe(401);
      });
    });
  });
});
