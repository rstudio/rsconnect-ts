CONNECT_LICENSE_FILE ?= rstudio-connect.lic
SHELL := bash
VERSION := $(shell node -e 'console.log(require("$(CURDIR)/package.json").version)')

npm-%:
	npm run $*

.PHONY: all
all: npm-lint lib/main.js test

.PHONY: test
test:
	uvx with-connect --license "$(CONNECT_LICENSE_FILE)" -- npm test

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
	rm -rf .cache/
