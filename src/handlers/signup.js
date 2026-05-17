const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getItem, putItem } = require('../lib/storage');
const { jsonResponse, badRequest } = require('../lib/response');

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return badRequest('email, password, and name are required');
    }

    const userKey = `USER#${email.toLowerCase()}`;
    const existing = await getItem({
      TableName: process.env.TABLE_NAME,
      Key: { PK: userKey, SK: 'PROFILE' }
    });

    if (existing.Item) {
      return badRequest('User already exists');
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const userId = uuidv4();

    await putItem({
      TableName: process.env.TABLE_NAME,
      Item: {
        PK: userKey,
        SK: 'PROFILE',
        userId,
        email: email.toLowerCase(),
        name,
        passwordHash,
        createdAt: new Date().toISOString()
      }
    });

    return jsonResponse(201, { userId, email: email.toLowerCase(), name });
  } catch (error) {
    console.error(error);
    return badRequest('Unable to create user');
  }
};
