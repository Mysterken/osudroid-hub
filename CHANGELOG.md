# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-06-02

### Added

- **Analytical Dashboard:** Added a comprehensive, client-side analytical dashboard to user profiles. It provides deep insights including Highlights, Grade Spread, Accuracy Breakdown, a Progression Timeline (tracking playcount and performance), Top Mod Combinations, and Favorite Artists/Mappers.
- **First Places Section:** Introduced a dedicated section aggregating all global #1 scores held by a user, unlocked by running a deep profile scan.
- **Loading Skeletons:** Added `AnalyticsDashboardSkeleton` and `FirstPlacesSkeleton` to ensure layout stability and a seamless user experience while profile data is being fetched and processed.
- **Hash-based Leaderboards:** Added the ability to view beatmap leaderboards using only the beatmap's hash.

### Changed

- **Beatmap Modal Resilience:** The `BeatmapModal` now gracefully handles missing or unavailable beatmaps by displaying fallback metadata, showing placeholder images, and restricting the view to just play data when official osu! details aren't found.
- **Search Bar Enhancements:** Upgraded the global search bar to support beatmap hashes and robust parsing of osu! links. It now utilizes SvelteKit's client-side router (`goto`) for significantly faster navigation.
- **Metadata Parsing:** Improved `convertTitleToBeatmapMetadata` for much more robust and accurate song title parsing.
- **Total PP Estimation:** Made overall performance point calculations much more accurate by properly factoring in bonus PP.
- **UI & Codebase Refinements:** Centralized rank coloring utilities (e.g., `getColorFromRank`) for consistency, updated core dependencies (`svelte`, `eslint`, `vitest`), and introduced `layerchart` & `d3-scale` for the new dashboard visualizations.

<br>

<details>
<summary><b>[1.1.0] - 2026-05-17</b></summary>

### Added

- **Beatmap Leaderboards:** Added a dedicated leaderboard page for individual beatmaps (`/leaderboard/beatmapsets/{beatmapsetId}/{beatmapId}`), accessible via the search bar or by clicking a user's play on their profile.
- **Beatmap Search:** Added a new "Beatmap" search mode to the global `SearchBar`. It smartly parses and resolves various formats including raw IDs, beatmapset IDs, shortened links, and full osu! URLs.
- **API Caching:** Implemented a simple in-memory caching system to reduce redundant calls to external APIs and improve overall load times.

### Changed

- **Beatmap Modal Overhaul:** Upgraded the `BeatmapModal` with tabbed navigation. It now defaults to a new "Play Stats" view, alongside the classic "Map Info" view. Audio preview handling and state cleanup on close have also been improved.
- **Generic Leaderboard Components:** Completely refactored the core leaderboard UI (`LeaderboardTable`, `LeaderboardFilters`, `LeaderboardRow`, `LeaderboardCard`, and `LeaderboardPagination`) to be generic. They now accept arbitrary row data and snippets, allowing them to be reused seamlessly across both Global and Beatmap leaderboards.

</details>

<details>
<summary><b>[1.0.0] - 2026-05-12 (The "Hub" Update)</b></summary>

Welcome to the 1.0.0 release! This update marks the milestone where the project transitions from a profile viewer into a larger platform. With new capabilities unlocked from the API, the scope has increased for further features.

### Added

- **Global Leaderboards:** Introduced a brand-new leaderboard page to see how players stack up against each other.
- **Leaderboard Filtering:** Added basic filtering options to the leaderboard, allowing users to sort rankings by **Type** (PP vs. Score) and by **Region/Country**.

### Changed

- **Project Rebrand:** Officially renamed the project from `osudroid-profile` to `osudroid-hub` to better reflect its expanding scope.
- **Documentation & Branding:** Updated all project documentation, readmes, and internal references to align with the new `osudroid-hub` identity.

</details>
