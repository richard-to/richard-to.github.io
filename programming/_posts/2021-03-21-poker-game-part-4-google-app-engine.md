---
layout: post
title: "WebRTC Poker Game - Part 4: Google App Engine"
---

I used Google App Engine to host the poker game for a few reasons.

1. I am used to using Google Cloud Platform (GCP) at work, so it was more familiar than AWS or Azure
2. I did not want to spend time setting up a VM using Google Compute Engine (GCE)
3. I needed SSL for the web sockets, which meant I would need to create a temporary subdomain to host my project and then set up Lets Encrypt
4. I considered Heroku, but their free plan does not include SSL
5. Since I am using this project to experiment, I figured I would try something new

## App Engine Standard

My initial approach was to use [App Engine Standard](https://cloud.google.com/appengine/docs/standard). But it turned out that this version of App Engine does not support web sockets.

The App Engine Standard config (at least the handlers) reminds me a bit of ingress rules in Kubernetes. I like that you can specify different implementations for different URL endpoints. This is really nice when you have a React frontend with an API.

It makes it easy to deploy the API server and the React frontend without bundling the frontend with the server.

Overall, App Engine Standard was easy to use. All I had to do was type `gcloud app deploy` to deploy application.

The only part that caused me problems was figuring out how to specify a main file that was not located at the root directory. This turned out to be fairly simple. I just needed to specify a path to the main file in the `main` parameter.

```yaml
main: ./cmd/game-server

handlers:
  - url: /ws
    redirect_http_response_code: 301
    secure: always
    script: auto

  - url: /
    redirect_http_response_code: 301
    secure: always
    static_files: client/poker-app/build/index.html
    upload: client/poker-app/build/index.html

  - url: /
    redirect_http_response_code: 301
    secure: always
    static_dir: client/poker-app/build
```

## App Engine Flexible

Since App Engine Standard did not support web sockets, I had to use [App Engine Flexible](https://cloud.google.com/appengine/docs/flexible).

One big drawback here is that App Engine Flexible does not have a free tier. This meant I had to make sure to disable the app when I was not using it. I would have preferred to leave it on so people could try it out.

The benefit of App Engine Flexible is that you can create a Docker image that will be built by Google Cloud Build and deployed to App Engine. This approach definitely gives the user a lot more control.

It turns out that App Engine Standard and Flexible have different configuration files. For example, handlers are not supported in Flexible. It would have been nice if handlers were supported since I now had to serve my React frontend from my web socket server. If this were a production app, then I may have created a separate App Engine Standard instance (or tried hosting the static files via Google Cloud Storage) to host the frontend. But since this is just for fun, I bundled the frontend together for simplicity.

Basically I needed to add the following to my `main.go`:

```go
// Serve static react build directory
buildDir := os.Getenv("REACT_CLIENT_BUILD_DIR")
r.StaticFile("/", buildDir+"/index.html")
r.StaticFile("/robots.txt", buildDir+"/robots.txt")
r.Static("/static", buildDir+"/static")
r.Static("/images", buildDir+"/images")
```

Here is my app.yaml file for my App Engine Flexible app. It is very simple. In order to keep costs down, I made sure to limit the scaling and resource usage as much as possible.

To deploy the app, all I need to do is type `gcloud app deploy`.

```yaml
---
runtime: custom
env: flex

# Ensure we use minimal resources
manual_scaling:
  instances: 1

# Ensure we use minimal resources
resources:
  cpu: 1
  memory_gb: 1.4
  disk_size_gb: 10

env_variables:
  POKER_APP_ENV: production
  REACT_CLIENT_BUILD_DIR: /usr/local/lib/poker-app/client
```

## Dockerfile

Most of the configuration in App Engine Flexible resides in the Dockerfile.

Here I use a multi-stage build with three parts:

1. Build React app
2. Build Go game server
3. Move React production build files and Go binary to the final image layer

One drawback with multi-stage builds is that there is no layer caching. Even if I made no changes, it would still rebuild the React app and Go server. This led to long build times.

```docker
# Build react app
FROM node:14.15.4-alpine as client_builder

RUN apk add --no-cache --update git

WORKDIR /opt/poker-app-client
COPY ./client/poker-app/package.json .
COPY ./client/poker-app/yarn.lock .
RUN yarn install

COPY ./client/poker-app .
RUN yarn build

# Build game server
FROM gcr.io/gcp-runtimes/go1-builder:1.15 as server_builder

COPY . /go/src/poker-app

WORKDIR /go/src/poker-app/cmd/poker-app
RUN /usr/local/go/bin/go build

# Application image
FROM gcr.io/distroless/base:latest

COPY --from=server_builder /go/src/poker-app/cmd/poker-app/poker-app /usr/local/bin/poker-app
COPY --from=client_builder /opt/poker-app-client/build /usr/local/lib/poker-app/client

CMD ["/usr/local/bin/poker-app"]
```

Google provides a [distroless image](https://github.com/GoogleContainerTools/distroless) that contains the bare minimum to run an app. One drawback about this is that a shell is not installed. This makes it hard to debug why an image is not working as expected.

The lack of a shell caused problems for me when my app was not working correctly. Intuitively I knew the issue was related to environment variables being incorrectly set. But I needed more information to pinpoint the problem.

Luckily, Google also provides a version of the distroless image that does contain a shell. This image is tagged with `debug`.

Unfortunately for me, I ran into build errors.

```
ERROR: (gcloud.app.deploy) Error Response: [9]
Application startup error! Code: APP_CONTAINER_CRASHED
/usr/local/bin/poker-app: line 1: ELF: not found
/usr/local/bin/poker-app: line 3: syntax error: unexpected "("
```

From a quick Google search, it seems that this error message is saying that the Go app was built against an incompatible architecture. I do not fully understand this. But I imagine it is like building an app for MacOS and trying to run it on Linux or Windows.

I never figured out the problem with this since I eventually figured out why the app was not loading the correct environment variables. It turned out that setting the `REACT_CLIENT_BUILD_DIR` environment variable in the Docker image was not working. I believe this is due to the lack of a shell when using the CMD directive to run the app.

I was able to work around this by specifying my environment variables in the app.yaml file. The correct configuration was now recognized by the app at run time.

```yaml
env_variables:
  POKER_APP_ENV: production
  REACT_CLIENT_BUILD_DIR: /usr/local/lib/poker-app/client
```

## Repository

The Github repository can be found here:

- [https://github.com/richard-to/poker](https://github.com/richard-to/poker)
