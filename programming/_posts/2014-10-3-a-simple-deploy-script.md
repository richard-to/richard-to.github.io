---
layout: post
title: "A simple deploy script"
---

I was introduced to the idea of a "deploy script" in 2010. Before then, I manually dragged updated files onto the server using FTP. This was, needless to say, error prone and tedious. Since then it baffles me whenever I start a freelance gig and learn that the work-flow to update the production server is to drag files over FTP. This is usually where I spread the gospel of the "deploy script", but no one listens.

Late 2010 was the year I began my volunteer career at StudentMentor.org. We were very lucky to have an advisor who was a start up founder and a true nerd who knew which technology trends to follow. He was the one who wrote the initial deploy script. It was a simple Bash script that ran rsync over ssh, but it worked.

At the start up where I'm currently employed, I was tasked with setting up a new server, and one of my top priorities was establishing a deploy process. We're at a scale where one server is all we need, so I figured that a simple deploy script would work fine with some improvements.

The downside of the old deploy script was that we needed to switch to a user account created for the purpose of running the deploy script. This required giving developers at least some sudo privileges. Now it is debatable whether all developers should have full sudo access. But let's assume that not all developers should have the power to do what they want on the server, but that they should have the ability to push code any time they want.

To solve this issue, I decided that the best option would be to proxy commands to the designated deployment user, which would not be too different than the client/server model used by some web applications. A full-blown web server was overkill. Instead I used Pyro4, which basically creates a daemon that listens for and executes commands from a client script. In this case, the daemon would execute the deploy script as the correct user.

**Example of daemon:**

{% highlight python linenos %}
import Pyro4

DEPLOY_SCRIPT_PATH = '/home/deploybot/bin/deploy.sh'
DEFAULT_BRANCH = 'master'
DOC_OPT = '-d'
class CodeDeployer(object):
    def deploy(self, branch=DEFAULT_BRANCH, docs=False):
        cmd = [DEPLOY_SCRIPT_PATH]
        if docs:
            cmd.append(DOC_OPT)
        if branch != DEFAULT_BRANCH:
            cmd.append(branch)
        return check_output(cmd, stderr=STDOUT)

code_deployer = CodeDeployer()

daemon=Pyro4.Daemon()
ns=Pyro4.locateNS()
uri=daemon.register(code_deployer)
ns.register("local.deploybot", uri)

daemon.requestLoop()
{% endhighlight %}

**Example of client:**

{% highlight python linenos %}
#!/usr/bin/env python
import argparse
import Pyro4

parser = argparse.ArgumentParser(description='Deploy Code')
parser.add_argument("-d", "--docs", help="Deploy docs", action="store_true")
args = parser.parse_args()
code_deployer=Pyro4.Proxy("PYRONAME:local.deploybot")
print code_deployer.deploy(docs=args.docs)
{% endhighlight %}

To deploy code to the production server, the developer would just need to ssh into the server and execute the command `deploy`. To skip the ssh step, the Fabric library can be used.

To make sure that the daemon runs on start up, Supervisor is used to manage the daemon and Pyro4 nameserver. The nameserver is used to resolve the daemon using a fixed URI or name. The nameserver requirement caused some problems because Supervisor has no way to start dependent processes first. This can be worked around with a bootstrap script that manually uses supervisorctl to start processes in a specified order.

**Example of Supervisor bootstrap process**

{% highlight bash linenos %}
#!/bin/bash

supervisorctl start pyro4-ns
supervisorctl start deploybotd
{% endhighlight %}

**Example of supervisor configuration**

{% highlight bash linenos %}
[program:deploybot-bootstrap]
command=/usr/local/bin/deploybot-bootstrap.sh
process_name=%(program_name)s
autostart=true
autorestart=false
stopsignal=QUIT
user=root

[program:pyro4-ns]
command=pyro4-ns
process_name=%(program_name)s
autostart=false
autorestart=true
stopsignal=QUIT
user=root

[program:deploybotd]
command=/usr/local/bin/deploybotd.py
process_name=%(program_name)s
autostart=false
autorestart=true
stopsignal=QUIT
user=deploybot
{% endhighlight %}

Before getting to the actual deploy script, it should be mentioned that this server runs CentOS 7 with SELinux, which caused a lot of permission problems.

Specifically, rsync is blocked by default when executed via a daemon and httpd permissions can be locked down via the extended SELinux permissions. For example the entry point for our python web application needed the `httpd_script_exec_t` permission to run, however it kept being reset to `httpd_sys_content_t` and led to 500 errors.

Other issues include, the fact that apache needs to be restarted anytime code is deployed. This involved relaxing privileges slightly to allow the deploy user to run `sudo apachectl restart`.

Lastly, sudo can only be run with a valid tty, which is a problem when executing code via a daemon. This was fixed by commenting out `requiretty` and `!visiblepw` in the sudoers file. Apparently the tty requirement provides minimal security benefits.

Overall, the deploy script turned out to be far from simple. I'm not sure if that is a good thing or not.


**Sudoers file snippet**
{% highlight bash linenos %}
#Defaults    requiretty
#Defaults   !visiblepw

...

deploybot ALL=(ALL) NOPASSWD: /sbin/restorecon /var/rfs/src/webcode.py,/usr/sbin/apachectl restart
{% endhighlight %}


**Deploy script example**

{% highlight bash linenos %}
#!/bin/bash

# Notes:
#
# Parameter parsing with getopts from:
# http://stackoverflow.com/questions/192249/how-do-i-parse-command-line-arguments-in-bash


SRC_DIR=/home/deploybot/codebase/
DOC_DIR=/home/deploybot/codebase/doc/
PROD_DIR=/var/codebase/src/
DOC_OUT_DIR=/var/codebase/doc/

OPTIND=1

docs=false
branch="master"

while getopts "d" opt; do
    case "$opt" in
    d)
        docs=true
        ;;
    esac
done

shift $((OPTIND-1))

[ "$1" = "--" ] && shift

if [[ $# == 1 ]]
    then
        branch="$1"
fi


echo "Deploying to production"

# Step 1
cd $SRC_DIR


# Step 2
echo "--Git checkout $branch ..."
git checkout $branch
if [[ $? = 1 ]]
    then
        git checkout -b $branch
fi

if [[ $? = 0 ]]
    then
        echo "--Git checkout $branch ... DONE"
    else
        echo "--Git checkout $branch ... FAILED";
        exit;
fi


# Step 3
echo "--Git pull $branch ..."
git pull origin $branch;

if [[ $? = 0 ]]
    then
        echo "--Git pull $branch ... DONE"
    else
        echo "--Git pull failed ... FAILED";
        exit;
fi

# Step 4
echo "--Rsync to $PROD_DIR ..."
rsync --checksum --executability --hard-links -rlP ./src/* $PROD_DIR;

if [[ $? = 0 ]]
    then
        echo "--Rsync to $PROD_DIR ... DONE"
    else
        echo "--Rsync to $PROD_DIR ... FAILED";
        exit;
fi


# Step 5
echo "--Ensure webcode.py is executable (SELinux permissions) ..."
sudo restorecon /var/codebase/src/webcode.py
if [[ $? = 0 ]]
    then
        echo "--Ensure webcode.py is executable (SELinux permissions) ... DONE"
    else
        echo "--Ensure webcode.py is executable (SELinux permissions) ... FAILED"
        exit;
fi


# Step 6
echo "--Restart apache ..."
sudo apachectl restart
if [[ $? = 0 ]]
    then
        echo "--Restart apache ... DONE"
    else
        echo "--Restart apache ... FAILED"
        exit;
fi

# Step 7
if [[ $docs = false ]]
    then
        exit;
fi


# Step 8
cd $DOC_DIR
echo "--Generating docs ..."
make html
if [[ $? = 0 ]]
    then
        echo "--Generating docs ... DONE"
    else
        echo "--Generating docs ... FAILED"
        exit;
fi


# Step 9
echo "--Rsync docs to $DOC_OUT_DIR ..."
rsync --checksum --executability --hard-links -rlP ./_build/html/* $DOC_OUT_DIR;
if [[ $? = 0 ]]
    then
        echo "--Rsync docs to $DOC_OUT_DIR ... DONE"
    else
        echo "--Rsync docs to $DOC_OUT_DIR ... FAILED"
        exit;
fi
{% endhighlight %}
