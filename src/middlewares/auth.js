function checkAuth(ctx, next) {
  const { currentUser } = ctx.state;
  if (!currentUser) ctx.throw(401);
  return next();
}

async function setCurrentUser(ctx, next) {
  if (ctx.session.currentUserId) {
    ctx.state.currentUser = await ctx.orm.user.findByPk(ctx.session.currentUserId);
  }
  return next();
}

async function apiSetCurrentUser(ctx, next) {
  const { authData } = ctx.state;
  if (authData) {
    ctx.state.currentUser = await ctx.orm.user.findByPk(authData.userId);
  }
  return next();
}

module.exports = {
  checkAuth,
  setCurrentUser,
  apiSetCurrentUser,
};
