---
layout: post
title: "Code Examples - Part 2: Docker"
---

Docker is the software makes my "Code Examples" project possible. I do not have the funding to run a small network of distributed virtual machines (VMs). This is the promise of Docker, the ability to run lightweight applications in isolated virtualized environments. Actually, the real killer of idea of Docker is that it adds an easy to use interface to create and run Linux Containers (LXC). Docker is still early in development, but it can be a viable option to securely execute untrusted code once it is clear that the isolated environments can't be broken out of.

Docker's strength is that container uses much less resources, have quick start up times, and environments run in known states with each run. There are some lightweight Linux operating systems, so it's possible to run a VM using 128MB of RAM. Whether that is enough memory to run small Java programs and TestNG has not been tested yet. That's not too bad since Code Examples runs docker containers with 64MB of RAM. The bottleneck with VMs is the start up time and the need to reload snapshots. One option is to run the VM continuously and reload the image periodically, but that can leave the VM in an unknown state or compromised. All of these benefits still depend on Docker development reaching a point where attacks can't break out of the container.

Code Example's current security precautions can be improved, but it's not a high priority yet since the site is not ready to launch yet. Currently the creation of quality exercises and examples is more important and gives more time for Docker to reach version 1.0. Development is moving fast. Even after a three months hiatus to focus on school, Docker's command line interface changed and required updates to get Code Examples running again.

Currently Code Example's uses `docker run` start a container and run a specific command. No other command can be issued and the container is supposed to stop running upon completion. The command is a shell a script and is executed as a non-privileged user for a maximum of 10 seconds. In addition, network access between container and host is disabled. 

One possible attack vector could be the use of a shared folder that contains the code to be compiled and executed. This folder gets deleted immediately and is not accessible from the Internet. It would be preferable to avoid using shared folders, but there does not appear to be an easy way to pass a file into the container.

Currently Java and C++ have been tested with Docker. C++ support is more experimental and not ready for production. More research needs to be done on security options. Luckily there are quite a few examples that can be studied. For example `seccomp-bpf` is used by Chromium for sandboxing. The original `seccomp` is too restrictive since memory can't be allocated. There's also project that I think uses `seccomp2` and reimplements malloc with a stack allocated array. Variations of `seccomp` are not the only options and honestly may be too complicated. Other options include AppArmor, chroot jails, resource limits, etc.

Aside from the security concerns, Docker does have a few quirks.

1. When running  `docker build`, a new image is built each time. This can consume large amounts of hard-drive space. For instance, a Docker image with Ubuntu is approximately 1GB. Now let's assume you're tweaking a Dockerfile and run `docker build` ten times. This can lead to 10GBs of docker images. The workaround is to add the `--rm` option. This will delete or replace the old image.

2. Be aware that running `docker pull` on a repository could pull all the versions of the image. This happened with a repository that contained various versions of Ubuntu on it. In total 16GB worth were downloaded. It seems safer to select a specific image from the repository.

3. `docker run` does not appear to stop the container after the command is run. Running `docker ps` shows that the image is still running in the background. This can be prevented by adding the `--rm` option.

4. Occasionally `docker run` hangs. It's not clear why this happens. But `docker rmi` is not able to kill the container. Restarting the docker service does work though.

5. Occasionally ghost images appear after running `docker build`. This happens even with the `--rm` option. To delete them, run `docker rmi $(docker images | grep "^<none>" | awk {'print $3'})`.

6. To stop docker containers, these two commands can be used `docker stop $(docker ps -a -q)` and `docker rm $(docker ps -a -q)`.