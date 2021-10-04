const KoaRouter = require('koa-router');
const JSONAPISerializer = require('jsonapi-serializer').Serializer;

const ReviewSerializer = new JSONAPISerializer('reviews', {
  attributes: ['comment', 'userId', 'bookId'],
  keyForAttribute: 'camelCase',
});

const LikeSerializer = new JSONAPISerializer('likes', {
  attributes: ['userId', 'reviewId'],
  keyForAttribute: 'camelCase',
});

const ReportSerializer = new JSONAPISerializer('reports', {
  attributes: ['userId', 'reviewId', 'content'],
  keyForAttribute: 'camelCase',
});

const router = new KoaRouter();

const jwt = require('koa-jwt');
const { getBook, getReview } = require('../../middlewares/reviews');

const { apiSetCurrentUser } = require('../../middlewares/auth');

router.get('api.reviews.show', '/:id', async (ctx) => {
  const review = await ctx.orm.review.findOne({
    where: {
      id: ctx.params.id,
    },
  });

  if (!review) {
    ctx.throw(404, 'El review que buscas no existe');
  }
  ctx.body = ReviewSerializer.serialize(review);
});

router.get('api.reviews.list', '/', getBook, async (ctx) => {
  const { book } = ctx.state;
  const reviews = await ctx.orm.review.findAll({
    where: {
      bookId: book.id,
    },
  });
  ctx.body = ReviewSerializer.serialize(reviews);
});

router.post('api.reviews.create', '/', getBook, jwt({ secret: process.env.JWT_SECRET, key: 'authData' }), apiSetCurrentUser, async (ctx) => {
  try {
    const { book } = ctx.state;
    const review = await book.createReview({
      userId: ctx.state.currentUser.id,
      bookId: book.id,
      comment: ctx.request.body.comment,
    });
    ctx.status = 201;
    ctx.body = ReviewSerializer.serialize(review);
  } catch (ValidationError) {
    ctx.throw(400);
  }
});

router.patch('api.reviews.edit', '/:id', jwt({ secret: process.env.JWT_SECRET, key: 'authData' }), apiSetCurrentUser, async (ctx) => {
  try {
    const review = await ctx.orm.review.findByPk(ctx.params.id);
    const params = ctx.request.body;
    if (ctx.state.currentUser.id === review.userId) {
      await review.update({
        comment: params.comment,
      });
      ctx.status = 200;
      ctx.body = ReviewSerializer.serialize(review);
    } else {
      ctx.status = 403;
      ctx.throw = (403, 'No tienes permiso para editar esta review');
      ctx.body = { status: 'No tienes permiso para editar esta review' };
    }
  } catch (ValidationError) {
    ctx.throw(400);
  }
});

router.delete('api.reviews.delete', '/:id', jwt({ secret: process.env.JWT_SECRET, key: 'authData' }), apiSetCurrentUser, async (ctx) => {
  try {
    const review = await ctx.orm.review.findByPk(ctx.params.id);
    if (ctx.state.currentUser.id === review.userId) {
      const res = await ctx.orm.review.destroy({
        where: { id: review.id },
      });
      if (res) {
        ctx.body = { status: 'Review eliminada con éxito!' };
      }
    } else {
      ctx.throw = (403, 'No tienes permiso para eliminar esta reseña');
    }
  } catch (error) {
    // console.log(error);
    ctx.status = 404;
    ctx.body = { status: 'No se ha podido' };
  }
});

router.post('api.likes.create', '/:id/likes', getReview, jwt({ secret: process.env.JWT_SECRET, key: 'authData' }), apiSetCurrentUser, async (ctx) => {
  try {
    const { review } = ctx.state;
    const like = await review.createLike({
      userId: ctx.state.currentUser.id,
      reviewId: review.id,
    });
    ctx.status = 201;
    ctx.body = LikeSerializer.serialize(like);
  } catch (ValidationError) {
    ctx.throw(400);
  }
});

router.delete('api.likes.delete', '/:id/likes', getReview, jwt({ secret: process.env.JWT_SECRET, key: 'authData' }), apiSetCurrentUser, async (ctx) => {
  try {
    const { review } = ctx.state;
    const res = await ctx.orm.like.destroy({
      where: {
        reviewId: review.id,
        userId: ctx.state.currentUser.id,
      },
    });
    if (res) {
      ctx.body = { status: 'Like eliminado con éxito!' };
    }
  } catch (error) {
    ctx.status = 404;
    ctx.body = { status: 'No se ha podido' };
  }
});

router.post('api.reports.create', '/:id/reports', getReview, jwt({ secret: process.env.JWT_SECRET, key: 'authData' }), apiSetCurrentUser, async (ctx) => {
  try {
    const { review } = ctx.state;
    const report = await review.createReport({
      userId: ctx.state.currentUser.id,
      reviewId: review.id,
      content: ctx.request.body.content,
    });
    ctx.status = 201;
    ctx.body = ReportSerializer.serialize(report);
  } catch (ValidationError) {
    ctx.throw(400);
  }
});

router.get('api.reports.list', '/:id/reports', getReview, jwt({ secret: process.env.JWT_SECRET, key: 'authData' }), apiSetCurrentUser, async (ctx) => {
  try {
    if (ctx.state.currentUser.role === 'admin') {
      const reports = await ctx.orm.report.findAll();
      ctx.body = ReportSerializer.serialize(reports);
    } else {
      ctx.status = 403;
      ctx.throw = (403, 'No tienes permiso para realizar esto');
    }
  } catch (ValidationError) {
    ctx.throw(403);
  }
});

module.exports = router;
