# grunt-carnaby

![grunt-carnaby](https://raw.github.com/elgrancalavera/grunt-carnaby/master/img/carnaby.png)

> This project is like, seriously alpha.

There's no complete documentation yet, and the API will continue changing aggressively. Feel free to look around, but don't expect things to work all the time.

##Available tasks
```
                  carnaby:ls  [:property] Lists properties in
                              ".carnaby/project.json". Defaults to list all the
                              project's properties.
                              -------------------------------
                               :required [:optional] (:flag)
                              -------------------------------

          carnaby:new-target  :name:path[:description] Generates a deployment
                              target.
                              :path is relative to <% carnaby.targetDir %>.
                              -------------------------------
                               :required [:optional] (:flag)
                              -------------------------------

       carnaby:delete-target  :name(:dry-run) Deletes an existing deployment
                              target.
                              :dry-run Outputs the results of this operation
                              without actually deleting anything.
                              -------------------------------
                               :required [:optional] (:flag)
                              -------------------------------

  carnaby:vendor-cherry-pick  :vendor:file[:file_n](:force) Cherry picks vendor
                              files from
                              "<%= carnaby.bowerDir %>" and copies them to
                              "<%= carnaby.appDir %>/core/common", which is kept
                              under version control. This is intended to
                              provide an easy way to incorporate third party
                              code into the project.
                              -------------------------------
                               :required [:optional] (:flag)
                              -------------------------------

       carnaby:update-client  [:client][:target] Updates a client's generated
                              files for a given target. Defaults to
                              ":mobile:local".
                              -------------------------------
                               :required [:optional] (:flag)
                              -------------------------------

   carnaby:update-client:all  [:target] Updates all clients for a given
                              deployment target. Defaults to ":local".
                              -------------------------------
                               :required [:optional] (:flag)
                              -------------------------------

       carnaby:update-config  Updates "grunt.config()" with all the entries
                              from ".carnaby/project.json"
                              -------------------------------
                               :required [:optional] (:flag)
                              -------------------------------

        carnaby:update-index  Updates "<%= carnaby.appDir %>/index.html".
                              -------------------------------
                               :required [:optional] (:flag)
                              -------------------------------

          carnaby:write-main  [:client][:target] Writes a client's main.js file
                              for a given target. Defaults to ":mobile:local".
                              -------------------------------
                               :required [:optional] (:flag)
                              -------------------------------

            carnaby:template  :name:path Writes a file with the specified
                              carnaby template to ":path". ":path" is realtive
                              to "<%= carnaby.appDir %>.

                              Most of these templates are used internally by
                              carnaby to generate client and project files, and
                              it makes little to no sense to use them directly
                              in a project, but some of them can be useful, for
                              instance "amd"

                              Usage example:

                              grunt
                              carnaby:template:amd:mobile/scripts/sugar.js

                              Will write the following file using the values
                              from "package.json":

                              /*
                               * grunt-carnaby
                               * mobile/scripts/sugar.js
                               * git://github.com/elgrancalavera/grunt-carnaby.git
                               * Copyright (c) 2013 M&C Saatchi
                               * mcsaatchi.com
                               */
                              define(function (require, exports, module) {
                                'use strict';
                                return exports;
                              });

                              Available template names by category:

                              JSON (.json)
                              ------------
                              requirebase
                              requiretarget
                              project

                              Handlebars (.hbs)
                              -----------------
                              hbs
                              hbssidebar
                              hbsclient

                              JS (.js)
                              --------
                              def
                              amd
                              sugar
                              mainapp
                              app
                              appcontroller
                              main
                              itemview
                              handlebars-loader

                              HTML (.html)
                              ------------
                              html
                              index
                              projectindex

                              SASS (.scss)
                              ------------
                              commonstylesheet
                              clientstylesheet
                              blankstylesheet

                              -------------------------------
                               :required [:optional] (:flag)
                              -------------------------------

          carnaby:new-client  [:name][:description](:force) Generates a carnaby
                              client application. Defaults to ":mobile".
                              -------------------------------
                               :required [:optional] (:flag)
                              -------------------------------

         carnaby:new-project  (:force) Generates a new carnaby project,
                              including a default mobile client.
                              -------------------------------
                               :required [:optional] (:flag)
                              -------------------------------

               carnaby:build  [:client][:target] Builds a client for a given
                              deployment target. Defaults to ":mobile:local".
                              -------------------------------
                               :required [:optional] (:flag)
                              -------------------------------

           carnaby:build:all  Builds all clients for all targets.
                              -------------------------------
                               :required [:optional] (:flag)
                              -------------------------------

        carnaby:clean-target  [:target] Cleans all artifacts for a build
                              target. Leaves the target directory in place but
                              deletes its contents, allowing GitHub Pages
                              (http://pages.github.com) style deployments.
                              Defaults to ":local".
                              -------------------------------
                               :required [:optional] (:flag)
                              -------------------------------

        carnaby:clean-client  [:client] Cleans all the artifacts for a client.
                              Defaults to ":mobile".
                              -------------------------------
                               :required [:optional] (:flag)
                              -------------------------------

               carnaby:clean  Cleans all artifacts for all clients and all
                              targets.
                              -------------------------------
                               :required [:optional] (:flag)
                              -------------------------------

        carnaby:update-tasks  [:client] Updates the tasks for a client.
                              Defaults to ":mobile".
                              -------------------------------
                               :required [:optional] (:flag)
                              -------------------------------

    carnaby:udpate-tasks:all  Updates the tasks for all clients.
                              -------------------------------
                               :required [:optional] (:flag)
                              -------------------------------
```
