const KoaRouter = require('koa-router');

const router = new KoaRouter();

const jwt = require('koa-jwt');

const { apiSetCurrentUser } = require('../../middlewares/auth');

router.delete('api.admin.users.delete', '/users/:id', apiSetCurrentUser, jwt({ secret: process.env.JWT_SECRET, key: 'authData' }), apiSetCurrentUser, async (ctx) => {
  try {
    const { id } = ctx.params;
    if (ctx.state.currentUser.role === 'admin') {
      const res = await ctx.orm.user.destroy({
        where: { id },
      });
      if (res) {
        ctx.body = { status: 'Usuario eliminado con éxito!' };
      }
    } else {
      ctx.throw = (403, 'No tienes permiso para eliminar este usuario');
    }
  } catch (error) {
    ctx.throw(403);
  }
});

router.delete('api.admin.books.delete', '/books/:id', apiSetCurrentUser, jwt({ secret: process.env.JWT_SECRET, key: 'authData' }), apiSetCurrentUser, async (ctx) => {
  try {
    const { id } = ctx.params;
    if (ctx.state.currentUser.role === 'admin') {
      const res = await ctx.orm.book.destroy({
        where: { id },
      });
      if (res) {
        ctx.body = { status: 'Libro eliminado con éxito!' };
      }
    } else {
      ctx.throw = (403, 'No tienes permiso para eliminar este usuario');
    }
  } catch (error) {
    ctx.throw(403);
    ctx.body = { status: 'No se puede realizar esto :(' };
  }
});

router.use(jwt({ secret: process.env.JWT_SECRET, key: 'authData' }));
router.use(apiSetCurrentUser);

module.exports = router;
