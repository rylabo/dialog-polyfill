/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),

    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.map(pkg.licenses, "type").join(", ") %> */\n',
    // Task configuration.
    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true,
        separator: '\n'
      },
      dist: {
        src: ['libs/dom4/build/dom4.max.js', 'src/<%= pkg.name %>.js'],
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    uglify: {
      dist: {
        options: {
          banner: '<%= banner %>',
          screwIE8: false
        },
        files: {
          'dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
        }
      }
    },
    watch: {
      sources: {
        files: 'src/<%= pkg.name %>.js',
        tasks: ['concat', 'uglify']
      }
    },
    karma: {
      options: {
        configFile: 'karma.conf.js',
        files: [
          'node_modules/should/should.js',
          'node_modules/mocha/mocha.js',
          'node_modules/mocha/mocha.css',
          'dist/dialog-polyfill-ie8.css',
          'dist/dialog-polyfill-ie8.js',
          'tests/suite.js',
          'tests/index.html'
        ]
      },
      dev :{
        browsers: ['Chrome', 'Firefox', 'Opera', 'Vivaldi', 'PhantomJS']
      },
      prod:{
        singleRun: true,
        browsers: ['PhantomJS']
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-karma');

  // Default task.
  grunt.registerTask('default', ['concat', 'uglify']);

};
