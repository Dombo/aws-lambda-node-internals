const resourceBands = [{memory: 128, price: "0.000000208"}, // Annoyingly could not find anywhere to query this data
  {memory: 192, price: "0.000000313"},
  {memory: 256, price: "0.000000417"},
  {memory: 320, price: "0.000000521"},
  {memory: 384, price: "0.000000625"},
  {memory: 448, price: "0.000000729"},
  {memory: 512, price: "0.000000834"},
  {memory: 576, price: "0.000000938"},
  {memory: 640, price: "0.000001042"},
  {memory: 704, price: "0.000001146"},
  {memory: 768, price: "0.000001250"},
  {memory: 832, price: "0.000001354"},
  {memory: 896, price: "0.000001459"},
  {memory: 960, price: "0.000001563"},
  {memory: 1024, price: "0.000001667"},
  {memory: 1088, price: "0.000001771"},
  {memory: 1152, price: "0.000001875"},
  {memory: 1216, price: "0.000001980"},
  {memory: 1280, price: "0.000002084"},
  {memory: 1344, price: "0.000002188"},
  {memory: 1408, price: "0.000002292"},
  {memory: 1472, price: "0.000002396"},
  {memory: 1536, price: "0.000002501"},
  {memory: 1600, price: "0.000002605"},
  {memory: 1664, price: "0.000002709"},
  {memory: 1728, price: "0.000002813"},
  {memory: 1792, price: "0.000002917"},
  {memory: 1856, price: "0.000003021"},
  {memory: 1920, price: "0.000003126"},
  {memory: 1984, price: "0.000003230"},
  {memory: 2048, price: "0.000003334"},
  {memory: 2112, price: "0.000003438"},
  {memory: 2176, price: "0.000003542"},
  {memory: 2240, price: "0.000003647"},
  {memory: 2304, price: "0.000003751"},
  {memory: 2368, price: "0.000003855"},
  {memory: 2432, price: "0.000003959"},
  {memory: 2496, price: "0.000004063"},
  {memory: 2560, price: "0.000004168"},
  {memory: 2624, price: "0.000004272"},
  {memory: 2688, price: "0.000004376"},
  {memory: 2752, price: "0.000004480"},
  {memory: 2816, price: "0.000004584"},
  {memory: 2880, price: "0.000004688"},
  {memory: 2944, price: "0.000004793"},
  {memory: 3008, price: "0.000004897"}];

const generateFunctions = (resourceBands) => {
  return resourceBands.reduce((result, band, index, array) => {
    result[`inspect${band.memory}`] = {
      handler: 'src/handler.inspect',
      memorySize: `${band.memory}`,
      environment: {
        memory: band.memory,
        price: band.price
      }
    };
    return result;
  }, {})
};

const invokerFunction = {
  invoker: {
    handler: 'src/handler.invoker',
    memorySize: '256'
  }
};

const queryFunction = {
  query: {
    handler: 'src/handler.query',
    memorySize: '256',
    events: [
      {
        http: {
          path: 'query',
          method: 'GET',
          cors: {
            origin: '*',
            headers: [
              'Content-Type'
            ],
            cacheControl: 'max-age=600, s-maxage=600, proxy-revalidate'
          }
        }
      }
    ]
  }
};

module.exports = {
  service: 'aws-lambda-node-internals',
  package: {
    artifact: 'package/package.zip'
  },
  provider: {
    name: 'aws',
    runtime: 'nodejs8.10',
    variableSyntax: "\\${{([ ~:a-zA-Z0-9._\\'\",\\-\\/\\(\\)]+?)}}",
    region: '${{env:AWS_REGION}}',
    stage: '${{env:ENV}}',
    timeout: '15',
    environment: {
      stackName: '${{self:service}}-${{self:provider.stage}}',
      prefix: 'inspect',
      seperator: '-',
      invokeables: resourceBands.map(band => band.memory).join('-'),
      storageBucket: {
        Ref: 'inspectionResults'
      }
    },
    role: { "Fn::GetAtt": [ 'customRole', 'Arn' ] }
  },
  functions: Object.assign(invokerFunction, queryFunction, generateFunctions(resourceBands)),
  resources: {
    Resources: {
      inspectionResults: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          AccessControl: 'Private'
        }
      },
      customRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
          AssumeRolePolicyDocument: {
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Principal: {
                  Service: "lambda.amazonaws.com"
                },
                Action: "sts:AssumeRole"
              }
            ]
          },
          Policies: [
            {
              PolicyName: "customRolePolicy",
              PolicyDocument: {
                Version: "2012-10-17",
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: [
                      'logs:CreateLogStream'
                    ],
                    Resource: [
                      {"Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/aws-lambda-node-internals-dev-invoker:*"},
                      {"Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/aws-lambda-node-internals-dev-query:*"},
                      {"Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/aws-lambda-node-internals-dev-inspect*:*"},
                    ]
                  },
                  {
                    Effect: 'Allow',
                    Action: [
                      'logs:PutLogEvents'
                    ],
                    Resource: [
                      {"Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/aws-lambda-node-internals-dev-invoker:*:*"},
                      {"Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/aws-lambda-node-internals-dev-query:*:*"},
                      {"Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/aws-lambda-node-internals-dev-inspect*:*:*"}
                    ]
                  },
                  {
                    Effect: 'Allow',
                    Action: [
                      'lambda:InvokeFunction'
                    ],
                    Resource: '*'
                  },
                  {
                    Effect: 'Allow',
                    Action: [
                      's3:*'
                    ],
                    Resource: [
                      {
                        'Fn::GetAtt': [
                          'inspectionResults',
                          'Arn'
                        ]
                      },
                      {
                        'Fn::Join': [
                          '/',
                          [
                            {
                              'Fn::GetAtt': [
                                'inspectionResults',
                                'Arn'
                              ]
                            },
                            '*'
                          ]
                        ]
                      }
                    ]
                  }
                ]
              }
            }
          ]
        }
      }
    }
  }
};
