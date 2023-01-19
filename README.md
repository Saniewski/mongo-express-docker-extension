# Mongo Express Docker Extension

Run Mongo Express in Docker Desktop and connect to any MongoDB server.

Mongo Express Docker Extension allows you to connect to any (local or remote) MongoDB server without having to install Mongo Express locally or manually create a Mongo Express Docker container.

## Features

- Run Mongo Express in Docker Desktop.
- Specify the MongoDB server to connect to.
- Save credentials for future use.

## Screenshots

![Login Page - Basic 1][1]

![Login Page - Basic 2][2]

![Login Page - Connection String][3]

![Loading Mongo Express][4]

![Mongo Express Dashboard][5]

![Service Unavailable][6]

## Usage

To connect to a MongoDB server, you can use the `Basic` authentication method by providing a hostname and a port of the
MongoDB instance. Specifying a username and password is optional, depending on the security of your MongoDB server.
Alternatively, you can use the `Connection String` authentication method by providing a valid MongoDB connection string.
For instructions on how to use MongoDB connection strings, please, refer to [the official MongoDB documentation][7].

[1]: https://raw.githubusercontent.com/Saniewski/mongo-express-docker-extension/main/docs/screenshots/01-login-page-basic-1.png
[2]: https://raw.githubusercontent.com/Saniewski/mongo-express-docker-extension/main/docs/screenshots/01-login-page-basic-1.png
[3]: https://raw.githubusercontent.com/Saniewski/mongo-express-docker-extension/main/docs/screenshots/01-login-page-basic-1.png
[4]: https://raw.githubusercontent.com/Saniewski/mongo-express-docker-extension/main/docs/screenshots/01-login-page-basic-1.png
[5]: https://raw.githubusercontent.com/Saniewski/mongo-express-docker-extension/main/docs/screenshots/01-login-page-basic-1.png
[6]: https://raw.githubusercontent.com/Saniewski/mongo-express-docker-extension/main/docs/screenshots/01-login-page-basic-1.png
[7]: https://www.mongodb.com/docs/manual/reference/connection-string/
