const KoaRouter = require('koa-router');
const jwtgenerator = require('jsonwebtoken');
require('dotenv').config();

const router = new KoaRouter();

async function generateToken(user) {
  return new Promise((resolve, reject) => {
    jwtgenerator.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: 1800 },
      (err, tokenResult) => (err ? reject(err) : resolve(tokenResult)),
    );
  });
}

router.post('api.auth.login', '/', async (ctx) => {
  const { email, password } = ctx.request.body;
  const user = await ctx.orm.user.findOne({ where: { email } });
  if (!user) {
    ctx.throw(404, `No user found with ${email}`);
  }
  const authenticated = await user.checkPassword(password);
  if (!authenticated) {
    ctx.throw(401, 'Invalid password');
  }
  try {
    const token = await generateToken(user);
    const toSendUser = {
      id: user.id, firstName: user.firstName, email,
    };
    ctx.body = {
      ...toSendUser,
      access_token: token,
      token_type: 'Bearer',
    };
  } catch (error) {
    ctx.throw(500);
  }
});

module.exports = router;
