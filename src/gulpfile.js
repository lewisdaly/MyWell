"use strict"

var gulp = require('gulp');
var gutil = require('gulp-util');
var bower = require('bower');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var sh = require('shelljs');
var babel = require("gulp-babel");
var plumber = require("gulp-plumber");
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');

var paths = {
  sass: ['./scss/**/*.scss'],
  es6: ['./www/es6/**/*.js']
};

let plugins = [
  "transform-strict-mode"
];

console.log("ENABLE_LOGS:", process.env.ENABLE_LOGS);
console.log("VERSION_NUMBER", process.env.VERSION_NUMBER);

if (process.env.ENABLE_LOGS === false) {
  plugins.push("transform-remove-console");
}

gulp.task('default', ['babel', 'sass']);

gulp.task('sass', function(done) {
  gulp.src('./scss/ionic.app.scss')
    .pipe(sass({
      errLogToConsole: true
    }))
    .pipe(gulp.dest('./www/css/'))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./www/css/'))
    .on('end', done);
});

gulp.task("babel", function () {
  const handleError = (error) => {
    gutil.log(`\nError running babel: ${error.name}\n${error.message}` );
    // process.exit(1);
  }
  return gulp.src(paths.es6)
    .pipe(plumber())
    .pipe(sourcemaps.init()) // must be before all plugins that change js
    .pipe(babel({
      presets: ['es2015'],
      plugins: plugins
    }))
    .on('error', handleError)
		.pipe(concat('dist.js'))
    .pipe(uglify({
      mangle: false,
      compress: true,
    }))
    .pipe(sourcemaps.write('maps'))
    .pipe(gulp.dest("www/js"))
});

gulp.task('watch', function() {
  gulp.watch(paths.es6, ['babel']);
  gulp.watch(paths.sass, ['sass']);
});

gulp.task('install', ['git-check'], function() {
  return bower.commands.install()
    .on('log', function(data) {
      gutil.log('bower', gutil.colors.cyan(data.id), data.message);
    });
});

gulp.task('git-check', function(done) {
  if (!sh.which('git')) {
    console.log(
      '  ' + gutil.colors.red('Git is not installed.'),
      '\n  Git, the version control system, is required to download Ionic.',
      '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
      '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
    );
    process.exit(1);
  }
  done();
});

// Custom Tasks - Env Variables
var replace = require('gulp-replace-task');
var args    = require('yargs').argv;
var fs      = require('fs');

gulp.task('replace', function () {
  // Get the environment from the command line
  console.log(args.env);
  var env = args.env;

  // Read the settings from the right file
  var filename = env + '.json';
  var settings = JSON.parse(fs.readFileSync('./config/' + filename, 'utf8'));

// Replace each placeholder with the correct value for the variable.
gulp.src('config/constants.js')
  .pipe(replace({
    patterns: [
      { match: 'apiUrl', replacement: settings.apiUrl},
      { match: 'debug', replacement: settings.debug},
      { match: 'version_number', replacement: process.env.VERSION_NUMBER}
    ]
  }))
  .pipe(gulp.dest('www/es6'));
});
