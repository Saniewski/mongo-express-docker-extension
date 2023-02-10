IMAGE?=saniewski/mongo-express-docker-extension
TAG_LATEST?=latest
TAG_MAJOR?=1
TAG_MINOR?=1.0
TAG_PATCH?=1.0.2

BUILDER=buildx-multi-arch

INFO_COLOR = \033[0;36m
NO_COLOR   = \033[m

ADDITIONAL_URLS = $(shell cat ./docs/extension-labels/additional-urls.json)
CHANGELOG = $(shell cat ./docs/extension-labels/changelog.html)
DETAILED_DESCRIPTION = $(shell cat ./docs/extension-labels/detailed-description.html)
SCREENSHOTS = $(shell cat ./docs/extension-labels/screenshots.json)

build-extension: ## Build service image to be deployed as a desktop extension
	docker build \
		--tag=$(IMAGE):$(TAG_LATEST) \
		--tag=$(IMAGE):$(TAG_MAJOR) \
		--tag=$(IMAGE):$(TAG_MINOR) \
		--tag=$(IMAGE):$(TAG_PATCH) \
		--build-arg ADDITIONAL_URLS='$(ADDITIONAL_URLS)' \
		--build-arg CHANGELOG='$(CHANGELOG)' \
		--build-arg DETAILED_DESCRIPTION='$(DETAILED_DESCRIPTION)' \
		--build-arg SCREENSHOTS='$(SCREENSHOTS)' \
		.

install-extension: build-extension ## Install the extension
	docker extension install $(IMAGE):$(TAG_PATCH)

update-extension: build-extension ## Update the extension
	docker extension update $(IMAGE):$(TAG_PATCH)

use-devtools: ## Use DevTools inside the Docker Desktop extension
	docker extension dev debug ${IMAGE}

use-local-ui: ## Use local UI files instead of container's files
	docker extension dev ui-source ${IMAGE} http://localhost:3000

reset-dev: ## Resets any development settings changes
	docker extension dev reset ${IMAGE}

prepare-buildx: ## Create buildx builder for multi-arch build, if not exists
	docker buildx inspect $(BUILDER) || docker buildx create --name=$(BUILDER) --driver=docker-container --driver-opt=network=host

push-extension: prepare-buildx ## Build & upload extension image to hub.
	docker buildx build --push --builder=$(BUILDER) --platform=linux/amd64,linux/arm64 \
		--tag=$(IMAGE):$(TAG_LATEST) \
		--tag=$(IMAGE):$(TAG_MAJOR) \
		--tag=$(IMAGE):$(TAG_MINOR) \
		--tag=$(IMAGE):$(TAG_PATCH) \
		--build-arg ADDITIONAL_URLS='$(ADDITIONAL_URLS)' \
		--build-arg CHANGELOG='$(CHANGELOG)' \
		--build-arg DETAILED_DESCRIPTION='$(DETAILED_DESCRIPTION)' \
		--build-arg SCREENSHOTS='$(SCREENSHOTS)' \
		.

help: ## Show this help
	@echo Please specify a build target. The choices are:
	@grep -E '^[0-9a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "$(INFO_COLOR)%-30s$(NO_COLOR) %s\n", $$1, $$2}'

.PHONY: help
