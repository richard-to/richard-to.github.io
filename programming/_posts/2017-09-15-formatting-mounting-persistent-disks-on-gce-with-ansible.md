---
layout: post
title: "Formatting and Mounting Persistent Disks on GCE with Ansible"
---

I was working on using Ansible to format and mount persistent disks on Google Compute Engine (GCE). The question I had was how to determine if the disk needed to be formatted and mounted.

In this case, the solution turned out to be simple, since there are sym-links to "/dev/sdbX" in "/dev/disk/by-id/". The latter folder contains the "disk-name" assigned to the disk when it's attached to the GCE instance. The only caveat is that "google-" is prefixed to the name.

With that knowledge, the same steps provided in the Google Cloud Platform (GCP) documentation can be used: [https://cloud.google.com/compute/docs/disks/add-persistent-disk](https://cloud.google.com/compute/docs/disks/add-persistent-disk). The only change is replacing the paths.

After testing those commands manually, I wrote a simple Ansible role to automate the process.

**mount_disk/tasks/main.yml:**

```
- name: Check if disk exists
  shell: "file -sL /dev/disk/by-id/google-{{ disk_name }}"
  register: disk_exists
- name: Format disk
  shell: "mkfs.ext4 -m 0 -F -E lazy_itable_init=0,lazy_journal_init=0,discard /dev/disk/by-id/google-{{ disk_name }}"
  when: "'UUID=' not in disk_exists.stdout"
- name: Create mount directory
  file: 
    dest: "/mnt/disks/{{ disk_name }}"
    state: directory 
    owner: root 
    group: root 
    mode: 0755
- name: Mount drive
  mount:
    path: "/mnt/disks/{{ disk_name }}"
    src: "/dev/disk/by-id/google-{{ disk_name }}"
    fstype: ext4
    opts: discard,defaults
    state: mounted
 ```   

 **mount_disk/vars/main.yml:**

 ```
 disk_name: disk-name
 ```

 This role will only format and mount a single disk specified via the "disk_name" variable. I felt this was the safest way to approach things. In my use case, I didn't have many disks to attach to my instances.

 The first step in this role is to check if the disk is formatted. This could be more robust if I handled the case where the disk was not attached. 

 Next, if the disk exists, we'll format the disk if it does not contain "UUID=" which appears in "file -sL" when the disk is formatted.

 Finally, the built-in Ansible "file" and "mount" modules can be used for creating a mount directory and then mounting the disk to that location.
