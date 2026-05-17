const { v4: uuidv4 } = require('uuid');
const { uploadPhoto, LOCAL_MODE } = require('../lib/storage');
const { jsonResponse, badRequest } = require('../lib/response');

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { email, fileName, imageBase64 } = body;

    if (!email || !fileName || !imageBase64) {
      return badRequest('email, fileName, and imageBase64 are required');
    }

    const buffer = Buffer.from(imageBase64, 'base64');
    const key = `photos/${email.toLowerCase()}/${uuidv4()}-${fileName}`;

    const result = await uploadPhoto({
      Bucket: process.env.PHOTO_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'image/jpeg'
    });

    const photoUrl = LOCAL_MODE
      ? `file://${result.Location}`
      : `https://${process.env.PHOTO_BUCKET}.s3.amazonaws.com/${key}`;
    return jsonResponse(201, { message: 'Photo uploaded', photoUrl });
  } catch (error) {
    console.error(error);
    return badRequest('Unable to upload photo');
  }
};
