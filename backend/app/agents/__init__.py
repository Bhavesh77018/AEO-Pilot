"""Agent layer.

MVP ships three working agents wired through a lightweight orchestrator:

  - WebsiteAuditor (crawler)   → fetches & parses pages
  - AEOAnalyzer                → extracts AEO signals from the crawl
  - (scoring lives in services.scoring, called by the analyzer)

The full 25-agent roster (Competitor, EntityGraph, Citation, Publishing,
AIMonitoring, ...) plugs into the same orchestrator contract — see
orchestrator.py and docs/ARCHITECTURE.md.
"""
