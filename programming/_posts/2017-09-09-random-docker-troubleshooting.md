---
layout: post
title: "Random Docker troubleshooting"
---

I've been working on converting most of my Ansible setup to Docker. I didn't take particularly good notes, but so decided to post a some problems and or questions I ran into along the way.

### Docker + Ansible

I have not tried Docker Machine. I'm still using Ansible for configuring non-container related setup of servers. In this case,  I've created a straightforward role that installs Docker on the servers.

Originally I was also using the Docker module, but it seemed problematic when combined with `docker-compose`. Specifically the Ansible Docker module needs `docker-py` installed via pip on server. However there seems to be a conflict with `docker-compose`.

Specifically, I received this message:

```
WARNING: Dependency conflict: an older version of the 'docker-py' package may be polluting the namespace. If you're experiencing crashes, run the following command to remedy the issue:
pip uninstall docker-py; pip uninstall docker; pip install docker
```

For now, I decided to just run the `docker-compose` commands manually on the server, thus avoiding `docker-py`.

### Configuring Nginx and Lets Encrypt

I use nginx to reverse proxy to uwsgi sockets. The problem I had was how to dynamically generate nginx configurations for each web app. In addition there was the question of using LetsEncrypt to generate SSL certificates.

Initially I was considering mounting a volume and generating the configuration files with Ansible. But this seemed like a poor solution.

Another consideration was generating the configurations and putting them on the image on each build, thereby eliminating the need for mounting a volume. This solution would also require Ansible or a custom build script.

LetsEncrypt added additional problems. What was the best way to integrate LetsEncrypt with the nginx container? Where would the generated certs go? How would auto-renewal work?

After looking at various solutions posted online, I decided to use `jwilder/docker-gen` and `jrcs/letsencrypt-nginx-proxy-companion` along with the `nginx` image. I'm not thrilled about this solution, but it works. It strikes me as being some what hacky. The docker-compose file is relatively complicated to setup.

Luckily there is an example here: [https://github.com/evertramos/docker-compose-letsencrypt-nginx-proxy-companion/blob/master/docker-compose.yml](https://github.com/evertramos/docker-compose-letsencrypt-nginx-proxy-companion/blob/master/docker-compose.yml)

### Docker Compose

Initially I started working with Docker without using Docker Compose. Eventually I ended up using Docker Compose. It makes things much easier.

For beginners, I would recommend people start off using plain Docker, because it will help people understand intuitively what's going on with Docker Compose behind the scenes. Everything that Docker Compose does can be done manually using Docker.

The value of Docker Compose becomes immediately clear when trying to manage two containers that communicate with each other, say a web app that connects to a database.

**Ex 1: Starting the containers:**

```
docker build -t web_app /path/to/dockerfile
docker run --name db --link web_app:web_app -d -v /opt/postgresql/data:/var/lib/postgresql/data -db
docker run --name web_app -d -v /src/code:/var/www -p 5000:5000 web_app
```

**Ex 2: Cleaning up the containers**

```
docker stop web_app
docker stop db
docker rm web_app
docker rm db
```

This you can see is pretty tedious even with only two containers. The next logical step would be to put these steps into some bash or python scripts. But Docker Compose already orchestrates the management of containers on a single server, so might as well use it.

### uWSGI container bug

I had some trouble getting uWSGI to work.

The first issue was that I couldn't install uWSGI via pip with the python alpine image. The solution for this was to install uWSGI via apk (Alpine's version of apt or yum).

The command looks like this in the Dockerfile `RUN apk add --update uwsgi uwsgi-python`.

Notice `uwsgi-python`. This is important. It installs the python plugin for uwsgi. With this plugin, the python configuration flags are not available.

When running the uwsgi command, you will also need to include the these two flags `--plugins-dir", "/usr/lib/uwsgi/` and `--need-plugin python`. I believe these are required because I didn't install uwsgi via pip.

The next issue I ran into was with the `PYTHONPATH`. I kept getting error messages saying that Flask was not found. Turns out I needed to manually specify the location of the modules installed via my requirements.txt file. I ended up adding two pythonpaths:  `--pythonpath /usr/local/lib/python2.7/site-packages` and `--pythonpath /srv/hazel/src`.

### Postgres initialization

For the Postgres db I have multiple databases and roles, so the the environment variables provided with the official Postgres image were not sufficient.

Turns out the Postgres image will look for startup scripts in a certain folder. You can then mount that folder as a volume. For time being I just wrote a simple SQL file that creates the roles, databases and permissions. The folder that the Postgres image will look in is named `/docker-entrypoint-initdb.d/`.

### Setting up Docker images for Dev and Production

One issue I'm still thinking about how is how best to manage development and production images. For the dev images I'm simply mounting my src directory as a volume. This works perfectly fine.

But for production--in my reading so far---it seems the best practice is to build an image with the built source code. I agree with this. For the frontend, I use gulp for building the production javascript code. This would slow down deployment and it would also increase the size of the image since I would need to install node and a bunch of libraries from npm. If the javascript code is already built, then I would not need those dependencies.

I still have a bunch of questions in regards to how to set up this work flow.

**Question 1:**

The images will need to be hosted somewhere. I'm looking into Google Container Registry since I'm using Google Compute Engine. The tutorial makes this process seem fairly simple. And my initially perusal of the pricing seems fair.

**Question 2:**

My other question is how to prepare the production Docker builds. It seems I will need a separate build step.

One solution seems to be "build containers", which I read about in this Medium post from Udacity: [https://engineering.udacity.com/docker-build-containers-6f7152ef0aec](https://engineering.udacity.com/docker-build-containers-6f7152ef0aec)

I'm not totally clear on how the whole pipeline works but the idea makes sense.

**Question 3**

The final question is how to handle passwords and sensitive information. There is Docker Swarm, but I'm not using it in this case. It seems I will end up using Ansible to add the configuration files on the server and then have those folders mounted.

### Using non-root docker users

This is another issues that I have not made a decision on. It seems using non-root user in the container is the way to go. However I read that there are issues with permissions when mounting volumes. There are some workarounds, but they seem convoluted, entailing setting up matching uids and things.

Here is a link that explains the various issues: [https://forums.docker.com/t/root-user-or-non-root-user-inside-container/966/3](https://forums.docker.com/t/root-user-or-non-root-user-inside-container/966/3)
