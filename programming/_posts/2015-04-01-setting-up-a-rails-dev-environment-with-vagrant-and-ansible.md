---
layout: post
title: "Setting up a rails development environment with Vagrant and Ansible"
---

Over the weekend, I started learning Ruby on Rails 4. I've used Ruby on Rails 2 in the past, but only for a community college course and a couple toy projects. One reason for giving Ruby on Rails another shot is simply because of its continued popularity. After working with Rails for a few days now, I can see why. The automation tools, testability, and number of user contributed gems make development go a lot faster. I don't have to rebuild the wheel in regards to automation/scaffolding/migration/etc, and this is a huge win for my increasing "laziness" as a developer.

The first thing I needed to do was set up a rails development environment with Vagrant and Ansible. It took about four hours to get things right, but the reproducibility and environment separation is worth the effort.

## Vagrant Setup

For the Vagrant box, I wanted to use Ubuntu 14 since it is the current LTS edition. One of the troubles with Vagrant boxes is that they are not all set up the same. I considered the following boxes:

- [https://atlas.hashicorp.com/ubuntu/boxes/trusty64](https://atlas.hashicorp.com/ubuntu/boxes/trusty64)
  - No vmware support
- [https://atlas.hashicorp.com/puphpet/boxes/ubuntu1404-x64](https://atlas.hashicorp.com/puphpet/boxes/ubuntu1404-x64)
  - Ansible not able to connect via SSH. I believe this was a conflict with Puppet
- [https://atlas.hashicorp.com/chef/boxes/ubuntu-14.04](https://atlas.hashicorp.com/chef/boxes/ubuntu-14.04)
  - This one worked!

The following is my Vagrantfile:

{% highlight ruby linenos %}
# -*- mode: ruby -*-
# vi: set ft=ruby :

VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|

  config.vm.box = "chef/ubuntu-14.04"

  config.vm.network "forwarded_port", guest: 3000, host: 3000

  config.vm.provider "vmware_fusion" do |vf|
    vf.vmx["memsize"] = "1024"
  end

  config.vm.provision :ansible do |ansible|
    ansible.playbook = "playbook.yml"
  end

end
{% endhighlight %}

The Vagrantfile is straightforward. I forward port 3000 so I can view the development website. I also set the RAM at 1GB. Currently my laptop has 8GB RAM and I usually run Chrome, Evernote, Spotify, Scrivener, Sublime Text 2, and iTerm2 with no problems. I think a smaller amount of RAM can be used in this case, but I highly recommend getting lots of RAM if you plan on developing in VMs. I used to have 16GB RAM installed, but then one of the RAM sticks died.

That's it for the Vagrantfile.

## Ansible Setup

I recently started using Ansible. For the past 2-3 years I have been using Puppet with Vagrant. The downsides were:

1. Managing modules. Somewhat solved with Puppet Librarian. It feels like a convoluted solution though.
2. Needed to find Vagrant boxes with Puppet installed or build my own.
3. The Puppet configuration language is better than BASH, but still not the most pleasant language to work with.

I haven't used any advanced features of Ansible yet, but here's what I like so far.

1. Don't need Ansible installed on the Vagrant box, although this is somewhat negated by obtuse SSH errors that can occur if the Vagrant box is set up in a certain way.

2. I like the integrated Ansible Galaxy that allows "roles" to be downloaded and used. It's cleaner than Puppet Librarian, but there is the issue of needing to automate the installation of roles for other development machines. Ansible probably already has a solution to this. I  just need to look into it.

3. I like the YML configuration. It makes a lot of sense for my relatively basic use cases so far.

Here is my playbook.yml file:

{% raw %}

    ---
    - hosts: all
      sudo: true
      roles:
        - role: znzj.rbenv
          rbenv_ruby_version: 2.2.1
      vars:
        - gem_path: "{{rbenv_root}}/shims/gem"
      tasks:
        - apt_repository: repo=ppa:chris-lea/node.js
        - apt: update_cache=yes
        - apt: name=nodejs
        - apt: name=vim

        - name: Install ruby dependencies
          apt: name={{item}}
          with_items:
            - git-core
            - curl
            - zlib1g-dev
            - build-essential
            - libssl-dev
            - libreadline-dev
            - libyaml-dev
            - libsqlite3-dev
            - sqlite3
            - libxml2-dev
            - libxslt1-dev
            - libcurl4-openssl-dev
            - python-software-properties
            - libffi-dev

        - name: Install Postgres dependencies
          apt: name={{item}}
          with_items:
            - postgresql
            - postgresql-contrib
            - libpq-dev
            - python-dev
            - python-pip
        - pip: name=psycopg2

        - name: Allow vagrant to sudo as postgres
          lineinfile:
            dest: /etc/sudoers
            line: vagrant ALL=(postgres) ALL
            validate: 'visudo -cf %s'

        - name: Create Helloworld user
          postgresql_user: name=helloworld password=helloworld role_attr_flags=CREATEDB,SUPERUSER
          sudo_user: postgres

        - name: Create Critiqual user
          postgresql_user: name=critiqual password=critiqual role_attr_flags=CREATEDB,SUPERUSER
          sudo_user: postgres

        - name: Install rails
          gem:
            name: rails
            version: 4.2.0
            state: present
            user_install: no
            executable: "{{gem_path}}"
{% endraw %}

This setup is somewhat based on the instructions found at [https://gorails.com/setup/ubuntu/14.10](https://gorails.com/setup/ubuntu/14.10).


Here are some of the issues I ran into during setup.

**Gem path issue**

I used a "role" to install `rbenv`. This was the suggested way to install the latest version of ruby. The other option was to use `rvm`. I had a bad experience with `rvm` three or four years ago and have no idea how to remove it from my laptop. This is a big reason why I only do development in virtual machines nowadays.

One issue that I had was that Ansible kept telling me that the `gem` executable did not exist. Apparently the solution is to provide the gem path via the `executable` parameter.

Another thing to be aware of is that by default, the gem will be installed in the root user's home directory. One solution is to probably use `sudo_user: vagrant`. Alternatively you can do a global install with `user_install: no`, which is what I ended up doing. Note that you will need to delete the `.gem` folder from the root user's home directory. For some reason Ansible cannot detect this change.

For reference, here's what that snippet looks like:

{% raw %}
    - name: Install rails
      gem:
        name: rails
        version: 4.2.0
        state: present
        user_install: no
        executable: "{{gem_path}}"
{% endraw %}

**PostgreSQL issue 1: Dependencies**

There were a number of issues with installing PostgreSQL. The first was missing dependencies that prevented Ansible from running its PostgreSQL tasks. Ansible uses python, so it makes sense that I needed to install `psycopg2`, which is a PostgreSQL adapter for python. I installed this via pip, but ran into an error. I also needed to install `libpq-dev` via `apt`. It may have been easier to just do `python-psycopg2` via `apt`. Then it would have handled the dependencies correctly. That's definitely the one drawback of pip, the obscure error messages when a dependency is missing.

**PostgreSQL issue 2: Can't connect to psql**

After resolving the first issue, I was still unable to execute the PostgreSQL tasks to create database users.

Specifically I got this message:

    Sorry, user vagrant is not allowed to execute '/usr/bin/psql' as postgres on vagrant.vm.

Turns out the following command was not working: `sudo -u postgres psql`. This I believe was due to how the vagrant user was set up in this Vagrant box.

My eventual solution was to edit the `sudoers` file and add the correct privileges.

    - name: Allow vagrant to sudo as postgres
      lineinfile:
        dest: /etc/sudoers
        line: vagrant ALL=(postgres) ALL
        validate: 'visudo -cf %s'

Also you need to make sure to add `sudo_user: postgres` to be able to login as the postgres admin/superuser account when running the `postgresql_user` task.

**PostgreSQL issue 3: Rails can't create test, development, production databases**

Initially I created database users without a password, but I was unable to connect to the database via `psql`. It always checked for a password. There seems to be a way to configure PostgreSQL to not check for a password, but the `pg_hba.conf` file needs to be altered.

In the end it was simpler to just use passwords with the database users. This required hardcoding the passwords into `playbook.yml`, which I think this is OK for development. Ansible also has a feature called `lookups` that can keep passwords out the `playbook.yml` file, but I didn't use it here.

**PostgreSQL issue 4: Can't seed test database with fixtures**

I had trouble running the Rails unit tests because the fixtures would not install correctly when multiple related tables were involved. This was due to a foreign key issue, specifically, Rails needs to disable foreign key integrity checks when installing fixtures. In PostgreSQL, this requires the SUPERUSER privilege apparently.

Source: [http://stackoverflow.com/questions/28046415/loading-rails-fixtures-in-a-specific-order-when-testing](http://stackoverflow.com/questions/28046415/loading-rails-fixtures-in-a-specific-order-when-testing)
