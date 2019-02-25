# AWS Lambda Node Internals

Inspection of the available resources to the node runtime within lambda.
Backbone of [https://beta.observablehq.com/d/9fcb156bdf51f9d2](https://beta.observablehq.com/d/9fcb156bdf51f9d2).

## Pre-requisites

- Docker
- Docker Compose
- AWS credentials in ~/.aws or environment variables
  > Environment variables can be defined inside your shell session using `export VAR=value` or setting them in .env file. See `.env.template` for more information.

## Usage

```bash
# create .env file based on .env.example
$ make dotenv DOTENV=.env.example

# test/build lambda package
$ make build

# deploy to aws
$ make deploy

# remove the deployed functions
$ make remove

# clean your folder
$ make _clean
```

## Credits

I drew a large amount of inspiration from the Amaysim Australia team for the project structure.