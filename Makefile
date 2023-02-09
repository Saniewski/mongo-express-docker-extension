IMAGE?=saniewski/mongo-express-docker-extension
TAG?=latest

BUILDER=buildx-multi-arch

INFO_COLOR = \033[0;36m
NO_COLOR   = \033[m

ADDITIONAL_URLS = $(shell cat ./docs/extension-labels/additional-urls.json)
CHANGELOG = $(shell cat ./docs/extension-labels/changelog.html)
DETAILED_DESCRIPTION = $(shell cat ./docs/extension-labels/detailed-description.html)
SCREENSHOTS = $(shell cat ./docs/extension-labels/screenshots.json)

build-extension: ## Build service image to be deployed as a desktop extension
	docker build \
	--tag=$(IMAGE):$(TAG) \
	--label com.docker.extension.additional-urls='$(ADDITIONAL_URLS)' \
	--label com.docker.extension.changelog='$(CHANGELOG)' \
	--label com.docker.extension.detailed-description='$(DETAILED_DESCRIPTION)' \
	--label com.docker.extension.screenshots='$(SCREENSHOTS)' \
	.

install-extension: build-extension ## Install the extension
	docker extension install $(IMAGE):$(TAG)

update-extension: build-extension ## Update the extension
	docker extension update $(IMAGE):$(TAG)

use-devtools: ## Use DevTools inside the Docker Desktop extension
	docker extension dev debug ${IMAGE}

use-local-ui: ## Use local UI files instead of container's files
	docker extension dev ui-source ${IMAGE} http://localhost:3000

reset-dev: ## Resets any development settings changes
	docker extension dev reset ${IMAGE}

prepare-buildx: ## Create buildx builder for multi-arch build, if not exists
	docker buildx inspect $(BUILDER) || docker buildx create --name=$(BUILDER) --driver=docker-container --driver-opt=network=host

push-extension: prepare-buildx ## Build & Upload extension image to hub. Do not push if tag already exists: make push-extension tag=0.1
	docker pull $(IMAGE):$(TAG) && echo "Failure: Tag already exists" || docker buildx build --push --builder=$(BUILDER) --platform=linux/amd64,linux/arm64 --build-arg TAG=$(TAG) --tag=$(IMAGE):$(TAG) .

help: ## Show this help
	@echo Please specify a build target. The choices are:
	@grep -E '^[0-9a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "$(INFO_COLOR)%-30s$(NO_COLOR) %s\n", $$1, $$2}'

.PHONY: help
