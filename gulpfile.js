var gulp = require('gulp');
var gutil = require('gulp-util');
var bower = require('bower');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var cleanCSS = require('gulp-clean-css');
var rename = require('gulp-rename');
var sh = require('shelljs');
var args = require('yargs').argv;
var cordovaConfig = require('gulp-cordova-config');
var xeditor = require("gulp-xml-editor");

var paths = {
  sass: ['./scss/**/*.scss']
};

gulp.task('default', ['sass']);

gulp.task('sass', function(done) {
  gulp.src('./scss/ionic.app.scss')
    .pipe(sass())
    .pipe(gulp.dest('./www/css/'))
    .pipe(cleanCSS())
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./www/css/'))
    .on('end', done);
});

gulp.task('watch', function() {
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

gulp.task('config', function () {
  var ver = args&&args.ver || 'standard';
  var appId = 'com.extensivepro.ebike';
  var appName = 'eMaster';
  if(ver!='standard') appId += ver;
  if(ver==='standard') appName = '帮大师Plus';
  if(ver==='simple') appName = '帮大师SE';
  if(ver==='global') appName = '帮大师';
  if(ver==='standardglobal') appName = 'eMaster-I';

  gulp.src('./config/'+ver+'.js')
    .pipe(rename({ basename: 'ver' }))
    .pipe(gulp.dest('./www/js/'))

  var xmls = [
    {path:'.', attr: {id: appId}},
    {path:'//xmlns:platform/xmlns:name', text: appName}
  ]
  gulp.src('./config.xml')
    .pipe(xeditor(xmls,'http://www.w3.org/ns/widgets'))
    .pipe(gulp.dest('./'))
})

gulp.task('serve:before', ['sass', 'watch']);
