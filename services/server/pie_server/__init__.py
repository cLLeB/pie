"""PIE server — exam event ingestion, server-side certificate signing, and verification.

The signing here is byte-compatible with `@pie/integrity-core` (TypeScript) so a
certificate signed by this server verifies in the browser review console, and a
certificate produced in the browser verifies here.
"""

__version__ = "0.0.1"
