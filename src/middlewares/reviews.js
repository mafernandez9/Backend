async function getBook(ctx, next) {
  ctx.state.book = await ctx.orm.book.findByPk(ctx.params.bookId);
  if (!ctx.state.book) {
    return ctx.throw(404);
  }
  return next();
}

async function getReview(ctx, next) {
  ctx.state.review = await ctx.orm.review.findByPk(ctx.params.id);
  if (!ctx.state.review) {
    return ctx.throw(404);
  }
  return next();
}

async function getUser(ctx, next) {
  ctx.state.user = await ctx.orm.user.findByPk(ctx.params.userId);
  if (!ctx.state.user) {
    return ctx.throw(404);
  }
  return next();
}

module.exports = {
  getBook,
  getUser,
  getReview,
};
