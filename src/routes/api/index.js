require('dotenv').config();
const KoaRouter = require('koa-router');
const jwt = require('koa-jwt');
const { apiSetCurrentUser } = require('../../middlewares/auth');
const admin = require('./admin');
const users = require('./users');
const auth = require('./auth');
const books = require('./books');
const reviews = require('./reviews');
const userReviews = require('./user_reviews');

const router = new KoaRouter({ prefix: '/api' });

router.use('/users', users.routes());

router.use('/auth', auth.routes());

router.use('/books', books.routes());

router.use('/admin', admin.routes());

router.use('/books/:bookId/reviews', reviews.routes());

router.use('/users/:userId', userReviews.routes());

router.use(jwt({ secret: process.env.JWT_SECRET, key: 'authData' }));

router.use(apiSetCurrentUser);

module.exports = router;
