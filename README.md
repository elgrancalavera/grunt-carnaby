# grunt-carnaby

![grunt-carnaby](https://raw.github.com/elgrancalavera/grunt-carnaby/master/img/carnaby.png)

> This project is like, seriously alpha.

There's no docuemntation yet, and the API will continue changing aggressively. Feel free to look around, but don't expect things to work all the time.

Available tasks:
```
         carnaby:new-project  Generates a new carnaby project.
          carnaby:new-client  [:cient] Generates a carnaby client application.
                              Defaults to :mobile.
          carnaby:new-target  :name:path[:description] Generates a deployment
                              target. :path is relative to the grunt project
                              root.
       carnaby:delete-target  :name[:dry-run]Deletes an existing deployment
                              target. :dry-run (flag) outputs the results of
                              this operation without actually deleting
                              anything.
  carnaby:vendor-cherry-pick  :vendor:file[:file_n][:force] Cherry picks files
                              from a given vendor within the bower_components
                              directory and makes them part of the common code
                              under version control.
       carnaby:update-client  [:client][:target] Updates a client's generated
                              files for a particular target. Defaults to
                              :mobile:local.
   carnaby:update-client:all  [:target] Updates all clients for a particular
                              deployment target. Defaults to :local.
       carnaby:update-config  Updates grunt.config() with all the entries from
                              .carnby/project.json
        carnaby:update-index  Updates the project index.html file.
          carnaby:write-main  [:client][:target] Writes a client's main.js file
                              for a particular target. Defaults to
                              :mobile:local.
            carnaby:template  :template-name:path Writes a file with the
                              specified carnaby template to the specified path.
                              :path is realtive to carnaby.appDir.
                              Most of these templates are used internally by
                              carnaby to generate clients and projects, and it
                              makes little to no sense to use them directly in
                              a project, but some of them can be useful, for
                              instance "sugar".

                              Available template names by category:

                              JSON
                              ----
                              requirebase
                              requiretarget
                              project

                              Handlebars
                              ----------
                              hbs
                              hbssidebar
                              hbsclient

                              JS
                              --
                              def
                              amd
                              sugar
                              mainapp
                              app
                              appcontroller
                              main
                              itemview
                              handlebars-loader

                              HTML
                              ----
                              html
                              index
                              projectindex

                              SCSS
                              ----
                              commonstylesheet
                              clientstylesheet
                              blankstylesheet

       carnaby:init-template  Custom task.
               carnaby:build  [:client][:target] Builds a client for a
                              particular deployment target. Defaults to
                              :mobile:local.
           carnaby:build:all  Builds all clients for all targets.
        carnaby:clean-target  [:target] Cleans all artifacts for a target,
                              including requirejs .preflight files. Leaves the
                              target directory in place to allow GitHub
                              Pagesstyle deployments (keeping .git in place).
                              Defaults to :local.
        carnaby:clean-client  [:client] Cleans all the artifacts for a client.
                              Defaults to :mobile.
               carnaby:clean  Cleans all artifacts for all clients and all
                              targets.
        carnaby:update-tasks  [:client] Updates the tasks for a client.
                              Defaults to :mobile.
    carnaby:udpate-tasks:all  Updates the tasks for all clients.
```
