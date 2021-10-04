const faker = require('faker');
const bcrypt = require('bcrypt');

const PASSWORD_SALT_ROUNDS = 10;

const users = [...Array(10)].map(() => (
  {
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    birthDay: '1994-05-21',
    nickname: faker.name.firstName(),
    email: faker.internet.email(),
    password: bcrypt.hashSync(faker.internet.password(8), PASSWORD_SALT_ROUNDS),
    image: 'https://picsum.photos/200',
    role: 'client',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
));

users.push({
  firstName: 'Jalen',
  lastName: '87',
  birthDay: '1994-05-21',
  nickname: 'Jalencita',
  email: 'Jalen83@gmail.com',
  password: bcrypt.hashSync('KMsnQpv4', PASSWORD_SALT_ROUNDS),
  image: 'https://avatar.fandom.com/es/wiki/Toph_Beifong?file=Toph+Beifong.png',
  role: 'client',
  createdAt: new Date(),
  updatedAt: new Date(),
});

users.push({
  firstName: 'pepe',
  lastName: 'l',
  birthDay: '1994-05-21',
  nickname: 'pepee',
  email: 'pepe@pepe.com',
  password: bcrypt.hashSync('pepe', PASSWORD_SALT_ROUNDS),
  image: 'https://avatar.fandom.com/es/wiki/Toph_Beifong?file=Toph+Beifong.png',
  role: 'admin',
  createdAt: new Date(),
  updatedAt: new Date(),
});

module.exports = {
  up: async (queryInterface) => queryInterface.bulkInsert('users', users, {}),
  down: async (queryInterface) => queryInterface.bulkDelete('users', null, {}),

};

// {
//   "firstName": "mr nimbus",
//   "lastName": "king of the ocean",
//   "birthDay": "1994-05-21",
//   "nickname": "BigMrNimbus",
//   "email": "mrnumbus@uc.cl",
//   "password": "nimbus",
//   "image": "https://avatar.fandom.com/es/wiki/Toph_Beifong?file=Toph+Beifong.png",
//   "role": "client"
// }

// {
//     "title": "Las Cronicas de Narnia, el principe Caspian",
//     "description": "el del leon pero 4",
//     "ISBN": "9789584238764",
//     "image": "leon4.jpg"
// }
