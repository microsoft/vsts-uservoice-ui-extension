module.exports = function (grunt) {
    grunt.initConfig({
        ts: {
            build: {
                src: ["scripts/**/*.ts"],
                tsconfig: true
            },
            options: {
                fast: 'never'
            }
        },
        exec: {
            package: {
                command: "tfx extension create --manifest-globs vss-extension.json",
                stdout: true,
                stderr: true
            },
            publish: {
                command: "tfx extension publish --manifest-globs vss-extension.json --share-with ewaldhofman",
                stdout: true,
                stderr: true
            }
        },
        copy: {
            scripts: {
                files: [{
                    expand: true, 
                    flatten: true, 
                    src: ["node_modules/vss-web-extension-sdk/lib/VSS.SDK.js"], 
                    dest: "scripts",
                    filter: "isFile" 
                }]
            }
        },
        
        'ftp-deploy': {
            build: {
                auth: {
                    host: 'waws-prod-sn1-001.ftp.azurewebsites.windows.net',
                    port: 21,
                    authKey: 'uviz'
                },
                src: '.',
                dest: 'site/wwwroot',
                exclusions: ['img', 'node_modules', "typings", ".ftppass", ".gitignore", "*.vsix", "*.md", "*.json", "gruntfile.js"]
            }
        },
        
        clean: ["scripts/**/*.js", "*.vsix"]
    });
    
    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks("grunt-exec");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-ftp-deploy');

    grunt.registerTask("build", ["ts:build", "copy:scripts"]);
    grunt.registerTask("package", ["build", "exec:package"]);
    grunt.registerTask("publish", ["default", "exec:publish"]);        
    grunt.registerTask("deploy", ["publish", "ftp-deploy"]);
    
    grunt.registerTask("default", ["package"]);
};