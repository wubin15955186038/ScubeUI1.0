module.exports = function(grunt) {
    require('load-grunt-tasks')(grunt, { scope: 'dependencies' });
    require('time-grunt')(grunt);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        connect: {
            server: {
                options: {
                    port: 3000,
                    base: '.'
                }
            }
        },
        watch: {
            files: '**/*.*'
        }
    });

    grunt.registerTask('default', ['connect', 'watch'])
}