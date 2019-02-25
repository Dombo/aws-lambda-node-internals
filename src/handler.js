'use strict';

const AWS = require('aws-sdk');

const inspection = require('./inspection');

let s3 = new AWS.S3({
  region: process.env.AWS_REGION
});


module.exports.inspect = (event, context, callback) => {
  const info = inspection.main();

  return info
    .then((data) => {
      return s3.putObject({
          Body: JSON.stringify(data),
          ContentType: "application/json",
          Bucket: process.env.storageBucket,
          Key: `${process.env.AWS_REGION}/${process.env.memory}/inspection.json`
        })
        .promise()
        .then((res) => {
          console.info(`Uploaded to S3: ${res}`);
          return data
        })
    })
    .then((data) => {
      const response = {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: data,
      };
      return callback(null, response);
    })
    .catch((err) => {
      return callback(err, null);
    })
};

module.exports.invoker = (event, context, callback) => {
  let lambda = new AWS.Lambda({
    region: process.env.AWS_REGION
  });

  const invokeables = process.env.invokeables.split(process.env.seperator).map((memory) => {
    return lambda.invokeAsync({
        FunctionName: `${process.env.stackName}-${process.env.prefix}${memory}`,
        InvokeArgs: 'null'
      })
      .promise()
      .then(res => res)
      .catch(err => callback(err, null))
  });

  return s3.listObjectsV2({
      Bucket: process.env.storageBucket,
      FetchOwner: false
    })
    .promise()
    .then((res) => {
      if (res.IsTruncated) throw new Error('Pagination of S3 objects required');
      return res
    })
    .then(res => {
      return res.Contents.map((object) => {
        return s3.deleteObject({
            Bucket: process.env.storageBucket,
            Key: object.Key
          })
          .promise()
      })
    })
    .then(removeInspectionsPromises => Promise.all(removeInspectionsPromises))
    .then(() => {
      return Promise.all(invokeables)
        .then(response => callback(null, response))
    })
};

module.exports.query = (event, context, callback) => {
  return s3.listObjectsV2({
      Bucket: process.env.storageBucket,
      FetchOwner: false
    })
    .promise()
    .then((res) => {
      if (res.IsTruncated) throw new Error('Pagination of S3 objects required');
      return res
    })
    .then(res => {
      return res.Contents.map((object) => {
        return s3.getObject({
            Bucket: process.env.storageBucket,
            Key: object.Key
          })
          .promise()
      })
    })
    .then(inspectionPromises => Promise.all(inspectionPromises))
    .then(res => res.map(inspectionResult => JSON.parse(inspectionResult.Body.toString())))
    // .then(res => {
    //   return res.reduce((result, inspectionResult) => {
    //     const memoryAllocation = Object.keys(inspectionResult).shift();
    //     result[memoryAllocation] = inspectionResult[memoryAllocation];
    //     return result;
    //   }, {})
    // })
    .then((res) => {
      const response = {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(res)
      };
      return callback(null, response);
    })
    .catch((err) => {
      callback(err, null)
    });
};