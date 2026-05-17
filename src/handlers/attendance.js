const { putItem } = require('../lib/storage');
const { jsonResponse, badRequest } = require('../lib/response');

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { email, status, timestamp, location, notes } = body;

    if (!email || !status) {
      return badRequest('email and status are required');
    }

    const normalizedEmail = email.toLowerCase();
    const date = timestamp ? new Date(timestamp) : new Date();
    if (Number.isNaN(date.getTime())) {
      return badRequest('Invalid timestamp');
    }

    const item = {
      PK: `USER#${normalizedEmail}`,
      SK: `ATTENDANCE#${date.toISOString()}`,
      userEmail: normalizedEmail,
      status,
      timestamp: date.toISOString(),
      location: location || null,
      notes: notes || null,
      updatedAt: new Date().toISOString()
    };

    await putItem({
      TableName: process.env.TABLE_NAME,
      Item: item
    });

    return jsonResponse(201, { message: 'Attendance recorded', attendance: item });
  } catch (error) {
    console.error(error);
    return badRequest('Unable to record attendance');
  }
};
