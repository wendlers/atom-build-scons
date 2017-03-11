# Scons build for Atom (via atom-build)

Uses the [atom-build](https://github.com/noseglid/atom-build) package to execute
[scons](http://scons.org/) in the [Atom](https://atom.io/) editor.

![screenshot](https://raw.githubusercontent.com/wendlers/atom-build-scons/master/doc/screen.png)

## Prerequisites

This package requires [atom-build](https://github.com/noseglid/atom-build):

    apm install build

Optionally to display compile errors and warnings nicely, add the
[linter](https://atom.io/packages/linter) package:

    apm install linter

## Install

Install the scons builder from the package sources:

    apm install build-scons

Or install from git:

    cd $HOME/.atom/packages
    git clone https://github.com/wendlers/atom-build-scons.git build-scons

## Usage

See [atom-build](https://github.com/noseglid/atom-build) for available
key-bindings.

In the settings dialog of the `build-scons` package it is possible to configure
the following:

* `silent` Don't print commands
* `jobs` Number of jobs to run in parallel
* `separate build dir` Select for out of tree builds using a separate build dir.
  All the build artifacts will go to : `PROJ_DIR/../PROJ_NAME_build`'.

The builder defines the following default targets:

* `release` build with variables `debug=0`, `release=1`
* `debug` build with variables `debug=1`, `release=0`
* `default` build with no variables set
* `clean` build with `-c` flag

You could provide per project targets by creating the file `targets.ini`
alongside the `sconstruct` script. Each target is defined by `[targetname]`,
followd by varaible assignments of the form `variable=vale`. For example:

    [mytarget]
    foo=bar

    [veryspecial]
    magignum=42
    foo=bar

## Known Issues

* A newly created `targets.ini` is not detected without reloading (e.g. `Shift+Ctrl+F5`). However, changes to an existing `targets.ini` are detected and activated without reload.
