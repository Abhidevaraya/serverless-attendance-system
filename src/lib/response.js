function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  };
}

function badRequest(message) {
  return jsonResponse(400, { error: message });
}

function unauthorized(message) {
  return jsonResponse(401, { error: message });
}

module.exports = { jsonResponse, badRequest, unauthorized };
