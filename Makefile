PACKAGE_DIR=package/package
ARTIFACT_NAME=package.zip
ARTIFACT_PATH=package/$(ARTIFACT_NAME)
SERVERLESS_VERSION = 1.38.0
IMAGE_NAME ?= dhutton/serverless:$(SERVERLESS_VERSION)
TAG = $(SERVERLESS_VERSION)
UID=$(shell id -u)
ifdef DOTENV
	DOTENV_TARGET=dotenv
else
	DOTENV_TARGET=.env
endif
ifdef GO_PIPELINE_NAME
	ENV_RM_REQUIRED?=rm_env
endif
ifdef AWS_ROLE
	ASSUME_REQUIRED?=assumeRole
endif

################
# Entry Points #
################

build: $(DOTENV_TARGET) build-project

build-container:
	docker build --build-arg UID=$(UID) -t $(IMAGE_NAME) .

build-project:
	docker-compose run -u $(UID) --rm serverless make _deps _testUnit _build


deploy: $(ENV_RM_REQUIRED) $(ARTIFACT_PATH) $(DOTENV_TARGET) $(ASSUME_REQUIRED) deploy-project

deploy-project: _buildLite
	docker-compose run -u $(UID) --rm serverless make _deploy


remove: $(DOTENV_TARGET) $(ASSUME_REQUIRED) remove-project

remove-project:
	docker-compose run -u $(UID) --rm serverless make _remove


shell: $(DOTENV_TARGET)
	docker-compose run -u $(UID) --rm serverless bash

shell-container:
	docker run -u $(UID) --rm -it -v $(PWD):/opt/app $(IMAGE_NAME) bash

container-pull:
	docker pull $(IMAGE_NAME)

container-tag:
	-git tag -d $(TAG)
	-git push origin :refs/tags/$(TAG)
	git tag $(TAG)
	git push origin $(TAG)

##########
# Others #
##########

# Create .env based on .env.template if .env does not exist
.env:
	@echo "Create .env with .env.template"
	cp .env.template .env

# Create/Overwrite .env with $(DOTENV)
dotenv:
	@echo "Overwrite .env with $(DOTENV)"
	cp $(DOTENV) .env

rm_env:
	rm -f .env

# _deps installs nodejs modules and babel-cli.
# This is time consuming and if you are developing using a container, best to not exit the container.
_deps:
	# work around due to https://github.com/yarnpkg/yarn/issues/1961
	yarn --no-bin-links
	zip -rq node_modules.zip node_modules/

_testUnit:
#	./node_modules/mocha/bin/mocha --compilers js:babel-register test/unit

# _build transcompiles the src folder using Babel, installs nodejs production modules, and creates a package ready for Serverless Framework.
_build:
	rm -fr package
	mkdir -p $(PACKAGE_DIR)/
	cp package.json $(PACKAGE_DIR)/
	cp yarn.lock $(PACKAGE_DIR)/
	./node_modules/babel-cli/bin/babel.js src -d $(PACKAGE_DIR)/src
	cd $(PACKAGE_DIR) && yarn install --production --no-bin-links
	cd $(PACKAGE_DIR) && zip -rq ../package .

# _buildLite does a pack but does not do the yarn install.
# This speeds up the process if you you have already done _build before and the node_modules production hasn't changed.
_buildLite:
	rm -fr $(PACKAGE_DIR)/src
	./node_modules/babel-cli/bin/babel.js src -d $(PACKAGE_DIR)/src
	cd $(PACKAGE_DIR) && zip -rq ../package .
.PHONY: _buildLite

_deploy:
	mkdir -p node_modules
	unzip -qo -d . node_modules.zip
	rm -fr .serverless
	sls deploy -v

_remove:
	sls remove -v
	rm -fr .serverless

_clean:
	rm -fr node_modules node_modules.zip .serverless package
