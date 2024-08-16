# Library ![Supported node versions](https://img.shields.io/badge/dynamic/json?color=informational&label=node&query=%24.engines.node&url=https%3A%2F%2Fraw.githubusercontent.com%2Fnytimes%2Flibrary%2Fmain%2Fpackage.json) [![Tests](https://github.com/nytimes/library/actions/workflows/test.yaml/badge.svg)](https://github.com/nytimes/library/actions/workflows/test.yaml)

Documentation frontend for The Conversation, forked from NYTimes' [Library](https://github.com/nytimes/library).

See [the upstream repository](https://github.com/nytimes/library) for full documentation.

## Quick start

1. Clone and `cd` into the repo:

   `git clone git@github.com:conversation/library.git && cd library`

2. Install dependencies:

   `npm install`

3. Create a `.env` file at the project root (sample in 1password).

4. Copy the service account credentials from 1password to `server/.auth.json`.

5. Start the app:

   `npm run watch`

The app should now be running at `localhost:3000`.
