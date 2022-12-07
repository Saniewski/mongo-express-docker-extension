# Mongo Express Docker Extension

Docker Extension for creating and running an embedded instance of Mongo Express connected to any accessible MongoDB server.

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
  - [ ] Setup extension's metadata with an icon
  - [ ] Build Golang backend
  - [ ] Build React frontend
  - [ ] Download & build Mongo Express
- [ ] Implement backend features:
  - [ ] Read and write credentials
  - [ ] Run Mongo Express with specified credentials
  - [ ] Check Mongo Express initialization status
- [ ] Implement frontend features:
  - [X] Write short instructions in the header
  - [X] Add Loader wrapper component
  - [X] Handle two ways of specifying credentials (basic auth and connection string)
  - [ ] Add a form to specify the MongoDB server to connect to
  - [ ] Handle remembering credentials
  - [ ] Add a way to reset saved credentials
  - [ ] Use a button to start Mongo Express, hang on loading screen until it's ready, and navigate to it
- [ ] Add screenshots to README.md
- [ ] Add usage instructions to README.md
- [ ] Add changelog to README.md
- [ ] Deploy to Docker Hub
- [ ] Submit to Docker Desktop Extensions marketplace

## Changelog

### Pre-release

- Initial commit
- Add README.md
- Write short instructions in the header
- Add Loader wrapper component
- Handle two ways of specifying credentials (basic auth and connection string)
