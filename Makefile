RSC_LICENSE ?=

yarn-%:
	yarn $*

.PHONY: all
all: up yarn-lint lib/main.js yarn-test

.PHONY: publish
publish: lib/main.js
	yarn publish

lib/main.js: $(wildcard src/*.ts)
	yarn build

.PHONY: clean
clean:
	rm -rf lib/

.PHONY: distclean
distclean: clean
	rm -rf __tests__/data/*

.PHONY: up
up: .require-license
	docker-compose port connect 3939 2>/dev/null | if ! grep -q ':23939$$'; then \
		docker-compose up -d; \
	fi

.PHONY: down
down:
	docker-compose down --remove-orphans

.PHONY: .require-license
.require-license:
ifndef RSC_LICENSE
	$(error Missing required RSC_LICENSE env var)
endif
