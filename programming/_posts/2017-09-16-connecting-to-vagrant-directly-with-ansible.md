---
layout: post
title: "Connecting to Vagrant directly with Ansible"
---

Recently I was trying to connect to Vagrant using Ansible. Normally I'd use `vagrant provision`, but
in this case I needed to build some Docker containers. So the question was how do I
connect to Vagrant with using `vagrant ssh`?

Turns out the ssh config connection settings can viewed using `vagrant ssh-config`. This means you
could pipe the output to a file and then use `ssh -F vagrant-ssh default` where `default` is the default
is ssh shortcut name. For example if you were using Vagrant multi-machine, you'd probably have different
names than default.

With that knowledge, I realized that I could modify the inventory file with custom Ansible ssh settings
for the Vagrant host.

```
[vagrant]
default ansible_ssh_common_args="-F .vagrant-ssh" ansible_user=vagrant
```

This is great. Now I can connect to my Vagrant vm using Ansible.

I think this should be enough, but I had some concerns that the vagrant ssh config settings could change, so
I wanted to ensure the `.vagrant-ssh` file would always be the up-to-date.

This turned out to be pretty easy. I just had to run a shell command at the start of the playbook each time
on local ansible connection.

### Inventory
```
[local]
localhost ansible_connection=local

[vagrant]
default ansible_ssh_common_args="-F .vagrant-ssh" ansible_user=vagrant
```

### Example playbook
```
---
- hosts: local
  gather_facts: false
  tasks:
    - name: Ensure the .vagrant-ssh settings are up to date
      shell: vagrant ssh-config > .vagrant-ssh
      args:
        chdir: "{{ playbook_dir }}/.."

- hosts: vagrant
  gather_facts: false
  roles:
    # Add roles here
```
