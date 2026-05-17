const { queryItems } = require('../lib/storage');
const { jsonResponse, badRequest } = require('../lib/response');

exports.handler = async (event) => {
  try {
    const params = event.queryStringParameters || {};
    const email = params.email;
    if (!email) {
      return badRequest('email is required');
    }

    const startDate = params.startDate ? new Date(params.startDate) : null;
    const endDate = params.endDate ? new Date(params.endDate) : null;

    const query = {
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :attendancePrefix)',
      ExpressionAttributeValues: {
        ':pk': `USER#${email.toLowerCase()}`,
        ':attendancePrefix': 'ATTENDANCE#'
      }
    };

    const result = await queryItems(query);
    let records = result.Items || [];

    if (startDate && !Number.isNaN(startDate.getTime())) {
      records = records.filter((item) => new Date(item.timestamp) >= startDate);
    }
    if (endDate && !Number.isNaN(endDate.getTime())) {
      records = records.filter((item) => new Date(item.timestamp) <= endDate);
    }

    const report = records.reduce(
      (acc, record) => {
        acc.count += 1;
        acc.statuses[record.status] = (acc.statuses[record.status] || 0) + 1;
        return acc;
      },
      { count: 0, statuses: {} }
    );

    return jsonResponse(200, { report, records });
  } catch (error) {
    console.error(error);
    return badRequest('Unable to generate report');
  }
};
