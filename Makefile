IMAGE?=saniewski/mongo-express-docker-extension
VERSION?=2.0.0
RELEASE_TAGS?=latest major minor patch

VERSION_MAJOR = $(word 1,$(subst ., ,$(VERSION)))
VERSION_MINOR = $(VERSION_MAJOR).$(word 2,$(subst ., ,$(VERSION)))
IMAGE_TAG_ARGS = $(foreach tag,$(RELEASE_TAGS),--tag=$(IMAGE):$(if $(filter latest,$(tag)),latest,$(if $(filter major,$(tag)),$(VERSION_MAJOR),$(if $(filter minor,$(tag)),$(VERSION_MINOR),$(if $(filter patch,$(tag)),$(VERSION))))))

BUILDER=buildx-multi-arch

INFO_COLOR = \033[0;36m
NO_COLOR   = \033[m

ADDITIONAL_URLS = $(shell cat ./docs/extension-labels/additional-urls.json)
CHANGELOG = $(shell cat ./docs/extension-labels/changelog.html)
DETAILED_DESCRIPTION = $(shell cat ./docs/extension-labels/detailed-description.html)
SCREENSHOTS = $(shell cat ./docs/extension-labels/screenshots.json)

build-extension: ## Build service image to be deployed as a desktop extension
	docker build \
		$(IMAGE_TAG_ARGS) \
		--build-arg ADDITIONAL_URLS='$(ADDITIONAL_URLS)' \
		--build-arg CHANGELOG='$(CHANGELOG)' \
		--build-arg DETAILED_DESCRIPTION='$(DETAILED_DESCRIPTION)' \
		--build-arg SCREENSHOTS='$(SCREENSHOTS)' \
		.

install-extension: build-extension ## Install the extension
	docker extension install $(IMAGE):$(VERSION)

update-extension: build-extension ## Update the extension
	docker extension update $(IMAGE):$(VERSION)

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
		$(IMAGE_TAG_ARGS) \
		--build-arg ADDITIONAL_URLS='$(ADDITIONAL_URLS)' \
		--build-arg CHANGELOG='$(CHANGELOG)' \
		--build-arg DETAILED_DESCRIPTION='$(DETAILED_DESCRIPTION)' \
		--build-arg SCREENSHOTS='$(SCREENSHOTS)' \
		.

help: ## Show this help
	@echo Please specify a build target. The choices are:
	@grep -E '^[0-9a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "$(INFO_COLOR)%-30s$(NO_COLOR) %s\n", $$1, $$2}'

.PHONY: build-extension install-extension update-extension use-devtools use-local-ui reset-dev prepare-buildx push-extension help
