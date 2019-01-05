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

  def gh_request(url, method: :get, error: (no_error_val = true; nil), **opts)
    other_headers = opts[:headers] || {}
    opts.delete(:headers)
    response = HTTParty.send method, url, {
      headers: {
        "Authorization" => "token #{session[:access_token]}",
        "Accept" => "application/json",
        "User-Agent" => "Geo1088"
      }.merge(other_headers)
    }.merge(opts)
    p response.body
    halt error if !no_error_val and response.code >= 400
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
  session[:access_token] = response.parsed_response["access_token"] # yeet
  redirect to "/app"
end

get "/logout" do
  session.clear
  redirect to "/"
end

get "/api/me" do
  res = gh_request "https://api.github.com/user", error: [401]
  p res
  res
end

get "/api/gists" do
  gh_request "https://api.github.com/gists", error: [401]
end

get "/api/gist/:id" do
  # TODO: Return the content of the gist for the client
end

patch "/api/gist/:id" do |id|
  gh_request "https://api.github.com/gists/#{id}", {
    method: :patch,
    headers: {
      "Content-Type" => "application/json"
    },
    body: request.body.string,
    error: [401]
  }
end

post "/api/gist" do
  gh_request "https://api.github.com/gists", {
    method: :post,
    headers: {
      "Content-Type" => "application/json"
    },
    body: request.body.string,
    error: [401]
  }
end

delete "/api/gists/:id" do |id|
  gh_request "https://api.github.com/gists/#{id}", {
    method: :delete,
    error: [401]
  }
end

get "/" do
  redirect to "/home.html"
end

get "/app" do
  redirect to "/auth/github" if session[:access_token].nil?
  redirect to "/app/index.html"
end
