require "sinatra"
require "yaml"
require "json"
require "securerandom"
require "httparty"

CONFIG = YAML.load_file "config.yaml"

configure do
  use Rack::Session::Cookie, secret: CONFIG[:cookie_secret]
  set :bind, ENV["IP"] || "0.0.0.0"
  set :port, ENV["PORT"] || 4567
  set :environment, :development
end

helpers do
  include Rack::Utils
  alias_method :h, :escape_html

  def gh_request(url)
    response = HTTParty.get url, {
      headers: {
        "Authorization" => "token #{session[:access_token]}",
        "Accept" => "application/json",
        "User-Agent" => "Geo1088"
      }
    }
    content_type "application/json"
    response.body
  end
end

get "/auth/github" do
  state = SecureRandom.urlsafe_base64
  session[:state] = state
  redirect to "https://github.com/login/oauth/authorize?" + URI.encode_www_form(
    client_id: CONFIG[:github][:client_id],
    redirect_uri: CONFIG[:github][:redirect_uri],
    scope: "gist",
    state: state
  )
end
get "/auth/github/callback" do
  halt "invalid params" if !params["state"] || !params["code"]
  response = HTTParty.post "https://github.com/login/oauth/access_token", {
    headers: {
      Accept: "application/json"
    },
    body: {
      client_id: CONFIG[:github][:client_id],
      client_secret: CONFIG[:github][:client_secret],
      code: params["code"],
      resirect_uri: CONFIG[:github][:redirect_uri],
      state: session[:state]
    }
  }
  p response
  session[:access_token] = response.parsed_response["access_token"] # yeet
  halt "access token stored in session"
end

get "/api/me" do
  gh_request "https://api.github.com/user"
end

get "/api/gists" do
  gh_request "https://api.github.com/gists"
end

get "/api/gist/:id" do
  # TODO: Return the content of the gist for the client
end

get "/app" do

end
