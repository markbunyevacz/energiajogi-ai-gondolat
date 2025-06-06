This (dp.md) is a read only file, never modify without permission!


Development Principles
When implementing each phase, CURSOR AI should adhere to these principles to ensure consistency and quality:
1.	Leverage Existing Patterns: Always examine existing code patterns in the codebase before implementing new functionality. The current implementation contains many reusable patterns for database access, API structure, and document processing.
2.	Maintain Backward Compatibility: The existing energy law functionality must continue to work throughout the migration. All database changes should be additive rather than destructive.
3.	Domain Agnosticism: When implementing core platform components, avoid any assumptions specific to energy law. Test implementations by considering how they would work for other legal domains like tax law or labor law.
4.	Performance Consciousness: The system must handle the entire Hungarian legal corpus efficiently. Use database indexing, caching strategies, and batch processing where appropriate.
5.	Type Safety: Leverage TypeScript's type system extensively. All new interfaces and types should be properly defined and documented.
Technical Considerations
Each implementation phase should consider these technical aspects:
1.	Database Performance: With the addition of multiple domains and complex relationships, database queries need careful optimization. Use Supabase's built-in performance features and consider materialized views for complex queries.
2.	Scalability Architecture: The agent-based system should support horizontal scaling. Design agents to be stateless where possible and use message queues for communication.
3.	Error Handling: Implement comprehensive error handling that gracefully degrades functionality rather than causing system-wide failures. Each agent should be able to operate independently.
4.	Security Model: Implement domain-specific access controls to ensure users only access authorized legal domains. Build upon the existing authentication system.
Success Metrics
To validate successful implementation of each phase, CURSOR AI should verify:
1.	Functional Completeness: All existing energy law features continue to work correctly
2.	Domain Independence: Successfully demonstrate the system working with a hypothetical non-energy domain
3.	Performance Benchmarks: Document processing maintains or improves current performance levels
4.	Code Quality: Maintain consistent code style and comprehensive documentation
5.	Test Coverage: Achieve at least 80% test coverage for new components
Conclusion
This implementation guide provides a structured path from the current energy-specific system to a comprehensive Hungarian legal AI platform. By following these phases and using the provided CURSOR AI prompts, the development team can systematically build a flexible, scalable system that serves all areas of Hungarian law while maintaining the specialized functionality already developed for energy law.
The key to success lies in carefully preserving existing functionality while introducing new abstractions that enable multi-domain support. Each phase builds upon the previous one, ensuring a stable and incremental development process that minimizes risk while maximizing the platform's potential to revolutionize Hungarian legal practice.