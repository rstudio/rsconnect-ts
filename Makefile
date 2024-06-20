RSC_LICENSE ?=
SHELL := bash
VERSION := $(shell node -e 'console.log(require("$(CURDIR)/package.json").version)')

npm-%:
	npm run $*

.PHONY: all
all: up npm-lint lib/main.js npm-test

.PHONY: publish
publish: lib/main.js
	npm publish

lib/main.js: $(wildcard src/*.ts) src/Version.ts
	npm run build

src/Version.ts: package.json
	@echo '// WARNING: this file is generated' | tee $@ &>/dev/null
	@echo 'export const Version = "$(VERSION)"' | tee -a $@ &>/dev/null

.PHONY: clean
clean:
	rm -rf lib/ src/Version.ts

.PHONY: distclean
distclean: clean
	rm -rf __tests__/data/*

.PHONY: up
up: .require-license
	docker compose port connect 3939 2>/dev/null | if ! grep -q ':23939$$'; then \
		docker compose up -d --wait; \
	fi

.PHONY: down
down:
	docker compose down --remove-orphans

.PHONY: .require-license
.require-license:
ifndef RSC_LICENSE
	$(error Missing required RSC_LICENSE env var)
endif
