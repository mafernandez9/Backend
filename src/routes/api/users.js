/* eslint-disable prefer-destructuring */
const KoaRouter = require('koa-router');
const JSONAPISerializer = require('jsonapi-serializer').Serializer;

const UserSerializer = new JSONAPISerializer('users', {
  attributes: ['firstName', 'lastName', 'birthDay', 'nickname', 'email', 'image', 'role'],
  keyForAttribute: 'camelCase',
});

const router = new KoaRouter();

const jwt = require('koa-jwt');
const { apiSetCurrentUser } = require('../../middlewares/auth');

router.get('api.users.show', '/me', jwt({ secret: process.env.JWT_SECRET, key: 'authData' }), apiSetCurrentUser, async (ctx) => {
  const user = await ctx.orm.user.findByPk(ctx.state.currentUser.id);
  ctx.body = UserSerializer.serialize(user);
});

router.get('api.users.show', '/:id', async (ctx) => {
  const user = await ctx.orm.user.findByPk(ctx.params.id);
  if (!user) {
    ctx.throw(404, 'El usuario que buscas no existe');
  }
  ctx.body = UserSerializer.serialize(user);
});

router.get('api.users.list', '/', async (ctx) => {
  const users = await ctx.orm.user.findAll();
  ctx.body = UserSerializer.serialize(users);
});

router.post('api.users.create', '/', async (ctx) => {
  try {
    const body = ctx.request.body;
    const existse = await ctx.orm.user.findOne({
      where: {
        email: body.email,
      },
    });
    const existn = await ctx.orm.user.findOne({
      where: {
        nickname: body.nickname,
      },
    });
    if (!existse && !existn) {
      const user = ctx.orm.user.build(ctx.request.body);
      await user.save({ field: ['firstName', 'lastName', 'birthDay', 'nickname', 'email', 'password', 'image', 'role'] });
      ctx.status = 201;
      ctx.body = UserSerializer.serialize(user);
    } else {
      ctx.status = 400;
      ctx.body = { state: 'No puedes realizar esta acción, el usuario ya tiene ese nickname o email en uso' };
    }
  } catch (ValidationError) {
    ctx.throw(400);
  }
});

router.patch('api.users.edit', '/:id', jwt({ secret: process.env.JWT_SECRET, key: 'authData' }), apiSetCurrentUser, async (ctx) => {
  try {
    const user = await ctx.orm.user.findByPk(ctx.params.id);
    const params = ctx.request.body;
    if (ctx.state.currentUser.id === user.id) {
      await user.update({
        firstName: params.firstName,
        lastName: params.lastName,
        birthDay: params.birthDay,
        nickname: params.nickname,
        email: params.email,
        password: params.password,
        image: params.image,
      });
      ctx.status = 201;
      ctx.body = UserSerializer.serialize(user);
    } else {
      ctx.status = 403;
      ctx.body = { state: 'No puedes realizar esta acción, ya que no eres el usuario :(' };
    }
  } catch (ValidationError) {
    ctx.throw(400);
  }
});

router.use(jwt({ secret: process.env.JWT_SECRET, key: 'authData' }));
// router.use(jwt({ secret: process.env.JWT_SECRET, key: 'authData', passthrough: true }));
router.use(apiSetCurrentUser);

module.exports = router;
