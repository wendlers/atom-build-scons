'use babel';

import fs from 'fs';
import path from 'path';
import ini from 'ini';

import {EventEmitter} from 'events';
import {Directory} from 'atom';
import {File} from 'atom';


export const config = {
  silentMode: {
    title: 'silent',
    description: 'Don\'t print commands.',
    type: 'boolean',
    default: true,
    order: 10
  },
  numJobs: {
    title: 'jobs',
    description: 'Number of jobs to run in parallel.',
    type: 'integer',
    default: 1,
    minimum: 1,
    maximum: 32,
    order: 20
  },
  separateBuildDir: {
    title: 'separate build dir',
    description: 'Select for out of tree builds using a separate build dir. ' +
                 'All the build artifacts will go to : `PROJ_DIR/../PROJ_NAME_build`',
    type: 'boolean',
    default: false,
    order: 30
  },
};

export function provideBuilder() {

  const errorMatch = [
    '(?<file>([A-Za-z]:[\\/])?[^:\\n]+):(?<line>\\d+):(?<col>\\d+):\\s*(fatal error|error):\\s*(?<message>.+)',
    '(?<file>([A-Za-z]:[\\/])?[^:\\n]+):(?<line>\\d+):\\s*(fatal error|error):\\s*(?<message>.+)'
  ];
  const warningMatch = [
    '(?<file>([A-Za-z]:[\\/])?[^:\\n]+):(?<line>\\d+):(?<col>\\d+):\\s*(warning):\\s*(?<message>.+)',
    '(?<file>([A-Za-z]:[\\/])?[^:\\n]+):(?<line>\\d+):\\s*(warning):\\s*(?<message>.+)'
  ];

  return class SconsBuildProvider extends EventEmitter {

    constructor(cwd) {
      super();

      this.src = cwd;
      this.build = this.src + "_build";

      console.log("scons src   dir: " + this.src);
      console.log("scons build dir: " + this.build);

      atom.config.observe('build-scons.silentMode', () => this.emit('refresh'));
      atom.config.observe('build-scons.numJobs', () => this.emit('refresh'));
      atom.config.observe('build-scons.separateBuildDir', () => this.emit('refresh'));

      var utfile = new File(path.join(this.src, "targets.ini"));
      utfile.onDidChange(() => this.emit('refresh'));
    }

    destructor() {
        console.log("done");
    }

    getNiceName() {
      return 'Scons';
    }

    isEligible() {
      this.files = ['sconstruct', 'SConstruct']
        .map(f => path.join(this.src, f))
        .filter(fs.existsSync);
      return this.files.length > 0;
    }

    settings() {

      var default_build = this.build;

      pre = function() {

        if(atom.config.get('build-scons.separateBuildDir')){

          var build = default_build;
          var editor = atom.workspace.getActiveTextEditor();

          if(editor) {
            var current = path.dirname(atom.workspace.getActiveTextEditor().getPath());
            var projects = atom.project.getPaths();

            if(projects.length > 1) {
              for(project of projects) {
                if(current.startsWith(project)) {
                  build = project + "_build";
                }
              }
            }
          }

          var d = new Directory(build);
          var p = d.create()

          p.then
          (
            function(created) {
              if(created) {
                atom.notifications.addInfo("created build dir",
                  {detail: build});
              }
            }
          ).catch(
            function() {
              atom.notifications.addInfo("failed to created build dir",
                {detail: build});
            }
          );
        }
      };

      post = function(success) {
          if(success) {
            atom.notifications.addSuccess("scons build successful");
          }
          else {
            atom.notifications.addError("scons build failed");
          }
      };

      var common_args = [];

      if(atom.config.get('build-scons.separateBuildDir')) {
          common_args = ["-C", this.build, "-Y", this.src];
      }

      if(atom.config.get('build-scons.silentMode')) {
        common_args = common_args.concat('-s');
      }

      common_args = common_args.concat(['-j', atom.config.get('build-scons.numJobs')]);

      const releaseTarget = {
        preBuild: pre,
        postBuild: post,
        exec: 'scons',
        name: 'Scons: release',
        args: common_args.concat(['debug=0', 'release=1']),
        sh: false,
        errorMatch: errorMatch,
        warningMatch: warningMatch
      };

      const debugTarget = {
        preBuild: pre,
        postBuild: post,
        exec: 'scons',
        name: 'Scons: debug',
        args: common_args.concat(['debug=1', 'release=0']),
        sh: false,
        errorMatch: errorMatch,
        warningMatch: warningMatch
      };

      const defaultTarget = {
        preBuild: pre,
        postBuild: post,
        exec: 'scons',
        name: 'Scons: default',
        args: common_args,
        sh: false,
        errorMatch: errorMatch,
        warningMatch: warningMatch
      };

      const cleanTarget = {
        preBuild: pre,
        postBuild: post,
        exec: 'scons',
        name: 'Scons: clean',
        args: common_args.concat(['-c']),
        sh: false,
        errorMatch: errorMatch,
        warningMatch: warningMatch
      };

      var targets = [releaseTarget, debugTarget, defaultTarget, cleanTarget];
      var utfile = path.join(this.src, "targets.ini");

      if(fs.existsSync(utfile)) {
        console.log("found user targets");

        var data = String(fs.readFileSync(utfile));
        var conf = ini.parse(data);

        for(t in conf) {
          target = {
            preBuild: pre,
            postBuild: post,
            exec: 'scons',
            name: 'Scons: ' + t + " (user)",
            args: common_args,
            sh: false,
            errorMatch: errorMatch,
            warningMatch: warningMatch
          };

          if(conf[t].targets) {
            target.args = target.args.concat(conf[t].targets.split(" "));
          }
          if(conf[t].params) {
            target.args = target.args.concat(conf[t].params.split(" "));
          }

          targets = targets.concat(target);
        }
      }

      return targets
    }
  };
}
