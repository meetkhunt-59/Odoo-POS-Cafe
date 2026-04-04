.PHONY: dev test

dev:
\tpython -m uvicorn app.main:app --reload --port 8000

test:
\tpytest -q

