require "sinatra"
require "yaml"

CONFIG = YAML.load_file "config.yaml"

configure do
  use Rack::Session::Cookie, secret: CONFIG[:cookie_secret]
  set :bind, "0.0.0.0"
  set :port, 4567
  set :environment, :development
end

helpers do
  include Rack::Utils
  alias_method :h, :escape_html
end

before do
  if session[:access_token]
    @user = nil # TODO
  else
    @user = nil
  end
end

get "/auth/github" do
  # TODO: Github auth stuff
end

get "/auth/github/callback" do
  # TODO: more auth stuff
end

get "/gists" do
  # TODO: Returns a list of gists and their files' names
end

get "/gist/:id" do
  # TODO: Return the content of the gist for the client
end

get "/" do
  redirect to "/home"
end
