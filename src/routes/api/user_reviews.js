const KoaRouter = require('koa-router');
const JSONAPISerializer = require('jsonapi-serializer').Serializer;

const ReviewSerializer = new JSONAPISerializer('reviews', {
  attributes: ['comment', 'userId', 'bookId'],
  keyForAttribute: 'camelCase',
});

const router = new KoaRouter();

const { getUser } = require('../../middlewares/reviews');

router.get('api.user_reviews.list', '/reviews', getUser, async (ctx) => {
  const { user } = ctx.state;
  const reviews = await ctx.orm.review.findAll({
    where: {
      userId: user.id,
    },
  });
  ctx.body = ReviewSerializer.serialize(reviews);
});

router.get('api.user_reviews.list', '/liked_reviews', getUser, async (ctx) => {
  try {
    const { user } = ctx.state;
    const idReviewsList = await ctx.orm.like.findAll({
      where: {
        userId: user.id,
      },
      attributes: ['reviewId'],
    });
    // sacar ids
    const ids = [];
    idReviewsList.forEach((like) => {
      ids.push(like.reviewId);
    });
    // sacar liked reviews
    const likedReviewsList = await ctx.orm.review.findAll({
      where: {
        id: ids,
      },
    });
    ctx.body = ReviewSerializer.serialize(likedReviewsList);
  } catch (error) {
    ctx.throw(404);
  }
});

module.exports = router;
