---
layout: post
title: "How to rename a Vagrant project directory"
---

If you're like me, sometimes you want to rename or move your Vagrant project to a new directory. Maybe you changed the name of your project or decided that the directory structure of your Vagrant projects was suboptimal. There are a lot of cases where changing directories make sense. Unfortunately you can't just do `mv old_directory new_directory`. A subsequent `vagrant up` will nuke your existing VM and create a new one.

Recreating your VM environment is not the worst thing. You've probably lost 15-45 minutes as Puppet or Chef does its magic, but at least you don't have to do it manually. Unless you've gotten lazy and haven't updated your Puppet manifests and instead manually installed new software. The downside of using Puppet with Vagrant is that using Puppet Forge is not integrated well or at all.

In terms of looking for a solution, none of my Google searches led to relevant results. It's one of those weird queries that's ambiguous enough to be associated with other issues. Turns out that the solution is simple and not much digging was needed. Each vagrant project has a `.vagrant` folder. This folder contains some metadata and the actual VM files.

Here is an example folder structure:

    .vagrant
        machines
            default
                virtualbox
                vmware_fusion
                    007cab9c-3243-4957-bf67-4eaf2a52997c
                        Virtual Disk-s001.vmdk
                        ...
                        precise64.vmx
                    action_provision
                    forwarded_ports
                    synced_folders
                    id
                    index_uuid


The folder with random numbers and letters is the location of the VM and we need to make sure that Vagrant knows where the machine is. The fullpath to the VM directory is defined in the `id` file. Vagrant will check the `id` file and if the folder doesn't exist, a new VM will be created.

Another important file is the `action_provision` file, which contains the fullpath to the the `.vmx` file. The `action_provision` appears to manage the VM provisioning step. In newer versions of Vagrant, the provisioning doesn't run every time unless specifically configured to do that in the `Vagrantfile`. If the path does not exist, then the provisioning step will run again.

To recap:

- Make sure to `halt` the VM before moving it
- Change filepath in the `id` file
- Change filepath in the `action_provision` file

One caveat that should be mentioned is that this was only tested using the VMWare Fusion provider and a single VM.