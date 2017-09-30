/*global require*/
"use strict";

var gulp = require('gulp'),
  fs = require('fs'),
  path = require('path'),
  pug = require('gulp-pug'),
  prefix = require('gulp-autoprefixer'),
  sass = require('gulp-sass'),
  browserSync = require('browser-sync'),
  sourcemaps = require('gulp-sourcemaps'),
  beeper = require('beeper'),
  plumber = require('gulp-plumber'),
  cleanCSS = require('gulp-clean-css'),
  ghPages = require('gulp-gh-pages'),
  watch = require('gulp-watch'),
  watch = require('gulp-watch'),
  batch = require('gulp-batch');
/*
 * Directories here
 */
var paths = {
  public: './public/',
  images: './src/images/',
  js: './src/js/',
  pug: './src/pug/pages',
  sass: './src/sass/',
  css: './public/css/',
};

function getFolders(dir) {
  return fs.readdirSync(dir)
    .filter(function(file) {
      return fs.statSync(path.join(dir, file)).isDirectory();
    });
}

/**
 * Compile .pug files and pass in data from json file
 * matching file name. index.pug - index.pug.json
 */
var onError = function(err) {
  beeper(2);
  process.stderr.write(err.message + '\n');
  this.emit('end');
};

gulp.task('copy', function() {
  return gulp.src('./src/assets/**/*')
    .pipe(gulp.dest(paths.public + 'assets/'));
})

gulp.task('pug', function() {
  var folders = getFolders(paths.pug);
  if (folders.length > 1) {
    folders[folders.length + 1] = '';
  } else {
    folders[0] = '';
  }
  console.log(folders)
  var task = folders.map(function(folder) {
    return gulp.src(paths.pug + folder + '/*.pug')
      .pipe(plumber({ errorHandler: onError }))
      .pipe(pug())
      .pipe(gulp.dest(paths.public + '/' + folder));
  })
});

gulp.task('deploy', ['build'], function() {
  return gulp.src('./public/**/*')
    .pipe(ghPages());
});

/**
 * Compile .scss files into public css directory With autoprefixer no
 * need for vendor prefixes then live reload the browser.
 */

gulp.task('sass', function() {
  return gulp.src(paths.sass + '*.sass')
    .pipe(plumber({ errorHandler: onError }))
    .pipe(sourcemaps.init())
    .pipe(sass({ indentedSyntax: true }))
    .pipe(prefix(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], {
      cascade: true
    }))
    .pipe(cleanCSS())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(paths.css))
    .pipe(browserSync.reload({
      stream: true
    }));
});

/**
 * Recompile .pug files and live reload the browser
 */
gulp.task('rebuild', ['pug', 'copy'], function() {
  browserSync.reload();
});

/**
 * Wait for pug and sass tasks, then launch the browser-sync Server
 */
gulp.task('browser-sync', ['sass', 'pug', 'copy'], function() {
  browserSync({
    server: {
      baseDir: paths.public
    },
    notify: false
  });
});

gulp.task('watch', function() {
  watch('**/*.pug', batch(function(events, done) {
    gulp.start('rebuild', done);
  }));
  watch('./src/sass/**/*.sass', batch(function(events, done) {
    gulp.start('sass', done);
  }));
  watch('./src/_assets/**/*', batch(function(events, done) {
    gulp.start('rebuild', done);
  }));
});


/**
 * Watch scss files for changes & recompile
 * Watch .pug files run pug-rebuild then reload BrowserSync
 */
// gulp.task('watch', function() {
//   gulp.watch(paths.sass + '**/*.sass', ['sass']);
//   gulp.watch('./src/**/*.pug', ['rebuild']);
//   gulp.watch('./src/_assets/**/*.*', ['rebuild']);
// });

// Build task compile sass and pug.
gulp.task('build', ['sass', 'pug', 'copy']);

/**
 * Default task, running just `gulp` will compile the sass,
 * compile the jekyll site, launch BrowserSync then watch
 * files for changes
 */
gulp.task('default', ['browser-sync', 'watch']);