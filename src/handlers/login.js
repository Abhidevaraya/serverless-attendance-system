const bcrypt = require('bcryptjs');
const { getItem } = require('../lib/storage');
const { jsonResponse, unauthorized, badRequest } = require('../lib/response');

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { email, password } = body;

    if (!email || !password) {
      return badRequest('email and password are required');
    }

    const userKey = `USER#${email.toLowerCase()}`;
    const result = await getItem({
      TableName: process.env.TABLE_NAME,
      Key: { PK: userKey, SK: 'PROFILE' }
    });

    const user = result.Item;
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return unauthorized('Invalid email or password');
    }

    return jsonResponse(200, {
      userId: user.userId,
      email: user.email,
      name: user.name,
      message: 'Login successful'
    });
  } catch (error) {
    console.error(error);
    return badRequest('Unable to authenticate');
  }
};
