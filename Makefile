# One entry point for every quality gate. `make check` is what CI runs, in pieces.
# Needs: python3, node 22+/npm, ruff (`pipx install ruff` or `pip install ruff`),
# and `cd ui && npm ci` once. Override the tool with e.g. `make lint RUFF="uvx ruff"`.
RUFF ?= ruff
PYTHON ?= python3

.PHONY: check lint test test-formats build dist-check

check: lint test test-formats dist-check  ## everything

lint:  ## ruff (Python) + tsc strict (UI)
	$(RUFF) check .
	cd ui && npm run typecheck

test:  ## backend unittest (gateway tests skip without env) + UI build and vitest
	$(PYTHON) -m unittest discover -s tests -t . -v
	cd ui && npm test

test-formats:  ## isolated phase 1 spike; install spikes/markdown_tickets/requirements.txt first
	$(PYTHON) -m unittest spikes.markdown_tickets.test_source spikes.markdown_tickets.test_ranks -v

build:  ## rebuild ui/dist/index.mjs (commit it)
	cd ui && npm run build

dist-check: build  ## fail if the committed ui/dist differs from a fresh build
	git diff --exit-code -- ui/dist
	@test -z "$$(git ls-files --others --exclude-standard -- ui/dist)" || (echo "untracked files in ui/dist"; exit 1)
