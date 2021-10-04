const KoaRouter = require('koa-router');
const JSONAPISerializer = require('jsonapi-serializer').Serializer;

const BookSerializer = new JSONAPISerializer('books', {
  attributes: ['title', 'description', 'userId', 'image', 'ISBN'],
  keyForAttribute: 'camelCase',
});

const router = new KoaRouter();

const jwt = require('koa-jwt');
const { apiSetCurrentUser } = require('../../middlewares/auth');

router.get('api.books.show', '/:id', async (ctx) => {
  const book = await ctx.orm.book.findByPk(ctx.params.id);
  if (!book) {
    ctx.throw(404, 'El libro que buscas no existe');
  }
  ctx.body = BookSerializer.serialize(book);
});

router.get('api.books.list', '/', async (ctx) => {
  const books = await ctx.orm.book.findAll();
  ctx.body = BookSerializer.serialize(books);
});

router.post('api.books.create', '/', jwt({ secret: process.env.JWT_SECRET, key: 'authData' }), apiSetCurrentUser, async (ctx) => {
  try {
    const existsi = await ctx.orm.book.findOne({
      where: {
        ISBN: ctx.request.body.ISBN,
      },
    });
    if (!existsi) {
      const book = ctx.orm.book.build({
        title: ctx.request.body.title,
        description: ctx.request.body.description,
        userId: ctx.state.currentUser.id,
        ISBN: ctx.request.body.ISBN,
        image: ctx.request.body.image,
      });
      await book.save({ field: ['title', 'description', 'userId', 'image', 'ISBN'] });
      ctx.status = 201;
      ctx.body = BookSerializer.serialize(book);
    } else {
      ctx.throw = (400, 'Este ISBN ya existe');
    }
  } catch (ValidationError) {
    ctx.throw(400, 'no se pudo crear');
  }
});

router.patch('api.books.edit', '/:id', jwt({ secret: process.env.JWT_SECRET, key: 'authData' }), apiSetCurrentUser, async (ctx) => {
  try {
    if (ctx.state.currentUser.role === 'admin') {
      const book = await ctx.orm.book.findByPk(ctx.params.id);
      const params = ctx.request.body;
      await book.update({
        title: params.title,
        description: params.description,
        userId: params.userId,
        image: params.image,
        ISBN: params.ISBN,
      });
      ctx.status = 200;
      ctx.body = BookSerializer.serialize(book);
    } else {
      ctx.status = 403;
      ctx.body = { status: 'No tienes permiso para realizar esta acción' };
    }
  } catch (ValidationError) {
    ctx.throw(400);
  }
});

module.exports = router;
