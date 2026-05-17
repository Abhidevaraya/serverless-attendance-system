const fs = require('fs');
const path = require('path');
const { ddbDocClient } = require('./dynamoClient');
const { GetCommand, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { PutObjectCommand, S3Client } = require('@aws-sdk/client-s3');

const LOCAL_MODE =
  process.env.LOCAL_MODE === 'true' || process.env.AWS_SAM_LOCAL === 'true';
const BASE_DIR = LOCAL_MODE
  ? path.resolve('/tmp', 'local-data')
  : path.resolve(process.cwd(), 'local-data');
const DB_FILE = path.join(BASE_DIR, 'db.json');
const PHOTO_DIR = path.join(BASE_DIR, 'photos');

if (LOCAL_MODE) {
  console.log('storage.js running in LOCAL_MODE', {
    LOCAL_MODE: process.env.LOCAL_MODE,
    AWS_SAM_LOCAL: process.env.AWS_SAM_LOCAL,
    BASE_DIR
  });
}

function ensureLocalStorage() {
  if (!fs.existsSync(BASE_DIR)) {
    fs.mkdirSync(BASE_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ items: [] }, null, 2));
  }
  if (!fs.existsSync(PHOTO_DIR)) {
    fs.mkdirSync(PHOTO_DIR, { recursive: true });
  }
}

function readLocalDb() {
  ensureLocalStorage();
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeLocalDb(db) {
  ensureLocalStorage();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

async function getItem(params) {
  if (!LOCAL_MODE) {
    return ddbDocClient.send(new GetCommand(params));
  }

  const db = readLocalDb();
  const item = db.items.find(
    (entry) => entry.PK === params.Key.PK && entry.SK === params.Key.SK
  );
  return { Item: item };
}

async function putItem(params) {
  if (!LOCAL_MODE) {
    return ddbDocClient.send(new PutCommand(params));
  }

  const db = readLocalDb();
  const index = db.items.findIndex(
    (entry) => entry.PK === params.Item.PK && entry.SK === params.Item.SK
  );
  if (index >= 0) {
    db.items[index] = params.Item;
  } else {
    db.items.push(params.Item);
  }
  writeLocalDb(db);
  return { $metadata: {} };
}

async function queryItems(params) {
  if (!LOCAL_MODE) {
    return ddbDocClient.send(new QueryCommand(params));
  }

  const db = readLocalDb();
  const pk = params.ExpressionAttributeValues[':pk'];
  const attendancePrefix = params.ExpressionAttributeValues[':attendancePrefix'];

  const items = db.items.filter(
    (entry) => entry.PK === pk && entry.SK.startsWith(attendancePrefix)
  );

  return { Items: items };
}

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

async function uploadPhoto(params) {
  if (!LOCAL_MODE) {
    return s3Client.send(new PutObjectCommand(params));
  }

  ensureLocalStorage();
  const filePath = path.join(PHOTO_DIR, params.Key);
  const folder = path.dirname(filePath);
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
  fs.writeFileSync(filePath, params.Body);
  return { Location: filePath };
}

module.exports = {
  getItem,
  putItem,
  queryItems,
  uploadPhoto,
  LOCAL_MODE
};
