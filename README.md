# Mongo Express Docker Extension

Docker Extension for creating and running an embedded instance of Mongo Express
connected to any accessible MongoDB server.

## Features

- Run Mongo Express in Docker Desktop
- Specify the MongoDB server to connect to
- Save credentials for future use

## Screenshots

TODO

## Usage

TODO

## Todo list

- [ ] Setup the extension's Docker container:
  - [X] Setup extension's metadata with an icon
  - [ ] Update labels in Dockerfile
  - [X] Build Golang backend
  - [X] Build React frontend
  - ~~[ ] Download & build Mongo Express~~
- [X] Implement backend features:
  - [X] Read and write credentials
  - ~~[ ] Run Mongo Express with specified credentials~~
  - ~~[ ] Check Mongo Express initialization status~~
- [ ] Implement frontend features:
  - [X] Write short instructions in the header
  - [X] Add Loader wrapper component
  - [X] Handle two ways of specifying credentials (basic auth and connection string)
  - [X] Add a form to specify the MongoDB server to connect to
  - [X] Handle remembering credentials
  - [X] Add a way to reset saved credentials
  - [X] Use a button to start Mongo Express, hang on loading screen until it's ready, and navigate to it
  - [ ] List local Mongo containers to connect to
  - [ ] Connect to a local Mongo container
  - [X] Run Mongo Express with specified credentials
  - [X] Check Mongo Express initialization status
- [ ] Add screenshots to README.md and to Dockerfile
- [ ] Add usage instructions to README.md
- [ ] Add CHANGELOG.md
- [ ] Deploy to Docker Hub
- [ ] Submit to Docker Desktop Extensions marketplace

## Known bugs

- [ ] Mongo Express logo does not render properly in Loader and ServiceUnavailable components
  (or after navigating between pages)
