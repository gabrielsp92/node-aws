'use strict';

const AWS = require('aws-sdk');
const sharp = require('sharp')
const { basename, extname } = require('path')

const S3 = new AWS.S3()

module.exports.hello = async ({ Records: records }, context) => {
  try {
    await Promise.all(records.map(async record => {
      const { key } = record.s3.object
      const image = await S3.getObject({
        Bucket: process.env.bucket,
        key: key,
      }).promise()

      const optimized = await sharp(image.body)
        .resize(1280, 720, { fit: 'inside', whitoutEnlargement: true })
        .toFormat('jpeg', { progressive: true, quality: 50 })
        .toBuffer()

      await S3.putObject({
        Body: optimized,
        Bucket: process.env.bucket,
        ContentType: 'image/jpeg',
        key: `compressed/${basename(key, extname(key))}`,
      }).promise()
      
    }));
    return {
      statusCode: 301,
      body: {},
    }
  } catch (err) {
    return err;
  }
};
