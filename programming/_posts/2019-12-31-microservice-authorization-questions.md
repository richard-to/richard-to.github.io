---
layout: post
title: "Questions about microservice authentication and authorization"
---

I have been reading more about microservices to get an idea of the pros and cons of using them. One topic that I have not found a good answer to is managing authorization among microservices.

Authentication with microservices is pretty clear. A global authentication server handles authentication for all microservices. Basically to access MicroserviceA, we would first send a request to AuthenticationServer to get an access token. Then we can use the access token to access MicroServiceA.

Authorization is where I find myself confused. I believe that local authorization is the way to go. This means that each MicroService manages what an authenticated user can do with the API. The high level concept is clear, but the implementation is not. So far I have not found an article that has explained this in sufficient detail.

The rest of this post is an attempt at working out a solution to local authorization.

## FastAPI Oauth2

First let's start with some more concrete details. I based my microservice implementation on the [FastAPI security tutorial](https://fastapi.tiangolo.com/tutorial/security/intro/).

That tutorial implements OAuth2 with password flow for a REST API. When the user logs in with their username and password, they are given a JWT. This JWT can then be used to access protected REST endpoints. Authorization is handled using OAuth2 scopes.

The main drawback with that tutorial is that it is designed for the simple use case authentication and authorization on a single API. So there is no separate authentication server. Authorization is essentially handled at a global level.

The single API use case makes the JWT somewhat irrelevant since the tutorial performs a check to grab user data from the users table. This makes stateless aspect of JWTs less useful.

In terms of authorization, the scopes are connected to the users table.

## Global authentication with FastAPI and Oauth2

Separating the authentication code to its own API was straightforward since no real changes needed to be made. The main thing that needs to be added is the CORS middleware, to allow different domains to access the authentication server.

Now with microserviceA, we just need to have a way to decode the JWT. The Fast API tutorial uses the HS256 algorithm. In this case we just need to configure microserviceA with the same secret key. The safer approach is to use the RS256 algorithm. This option uses private/public key pairs. The authentication server would have the private key and the other servers would have the public key.

That's all that needs to be done to allow global authentication.

One thing that I was not sure about the was use of the password flow. Is that only useful for the single server example? When would the password flow not be sufficient?

## Opaque access tokens and API keys

Another option aside from JWTs is to use opaque access tokens. These are basically tokens without encoded data. This means that opaque access tokens needed to be checked to ensure their validity.

Ideally this means that microserviceA would send a request to the authentication server which would return if the access token was valid. It would also include some user information. One reason to avoid this is the extra HTTP request to the authentication server. Alternatively each API request could go through an "API gateway" in which the token would be checked by the authentication server, then the request would be routed to microserviceA.

Another option could be to connect to a Redis database and check the access token that way. This is problematic since it bypasses encapsulation. Ideally the authentication server should handle it.

The worst option would be to directly access the authentication server's database. I would avoid this at all costs.

API keys have the same problem as opaque access tokens. Usually API keys are for managing bot accounts. This way the user doesn't have to share out their personal account password. There's nothing technically wrong with this approach, but what if they are mixed with JWTs? Then microserviceA would need to manage two different type of tokens.

## Local authorization with FastAPI and Oauth2

I want to iterate that this is the part that I'm confused about. So this section is mostly brainstorming and questions.

1. Can JWTs be fully stateless?

I don't think it's possible to make JWTs fully stateless. The log out use case is one. The best way to manage log out is to keep a token blacklist using Redis.

Another issue is for authorization. We'd need to link the account to resources that it creates and has access to.

Part of this can be accomplished with scopes. For example we could have scopes prefixed with the microservice. E.g. `microservice-a:resource:read`.

That doesn't ruin the usefulness of JWTs though. JWT's can be stateless in that we can be sure that the user is authenticated. This means we don't need to check with the authentication server.

2. Can OAuth2 scopes be used for authorization?

OAuth2 scopes are commonly used for various APIs, such as Github, Slack, Facebook, Twitter, etc. In these cases the application gets access to say te Github API. So we're not dealing with access to multiple APIs.

This makes the scopes more sensible since authentication allows access to one API.

The question is how to expand this to multiple APIs. The best I can think of is to have an application prefix. E.g. `microservice-a:resource:read`.

This makes sense and is not too bad. But one question is where would these permissions be stored. Would they be saved to the authentication server? In this case the authentication server could have a table that registers various microservices and the available permissions. The problem with this is that it centralizes the permissions to the authentication server.

This makes OAuth2 scopes less attractive for managing authorization to many microservices.

3. How do we provide authorization to a microservice?

If authorization is handled locally, then we have a chicken and the egg problem since a user could be authenticated, but then have no access to any microservices.

This is especially true if authorization to a microservice needs to be granted by an admin (i.e. the user cannot register themselves).

One solution is to have a super admin account that could access all microservices. This account would be able to bootstrap the microservices with admin users, which would be able to authorize regular users via the API.

With global or local authorization we would still need to maintain separate user and permissions tables. Ideally the implementation of these would be implemented the same way on all microservices.

4. What about GCP IAMs as a blueprint?

Google Cloud Platform (GCP) Identify and Access Management (IAM) is a very granular permissioning system. The gcloud CLI is able to manage different GCP services with a relatively consistent interface. GCP IAM a bit difficult to manage in practice since there are many services and many roles available.

It is unclear to me if the implementation of the IAMs is global or local managed. It seems like a mix of both since, permissions can be added globally.

The GCP IAMs model seems like overkill for my relatively simple purposes.
