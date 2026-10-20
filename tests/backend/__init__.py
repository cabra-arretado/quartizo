import os

# Workspace roots must not be group/world-writable (backend/workspace.py).
# Pin the umask so temp trees made by the tests are 0755 even when the
# developer's umask is 002.
os.umask(0o022)
