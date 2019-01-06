# GistJournal

A web app for editing GitHub Gists in a journal-like interface. Supports markdown editor controls and features an inline tester for Python, Ruby, and Node.js files.

## Usage

```bash
# install dependencies
$ rvm use 2.5
$ bundle install
# configure the auth server
$ cp config_sample.yaml config.yaml
$ $EDITOR config.yaml
# run the server
$ bundle exec ruby server.rb
```

## Architecture

The frontend is entirely static. The main application is served from the `/public/app` directory. It's written with global Vue components and plain-old CSS because who needs maintainability amirite.

The server's only job is to authenticate requests to the GitHub Gist API. It acts as an OAuth client and stores users' access tokens in secure session variables. When the frontend sends an API request, it simply attaches the authentication information and forwards the request to GitHub, then sends the response back. It's written with Sinatra.
