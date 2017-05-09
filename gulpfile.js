const gulp = require('gulp'),
    browserSync = require('browser-sync').create(),
    reload = browserSync.reload,
    nodemon = require('gulp-nodemon'),
    runSequence = require('run-sequence');

require('./build/tasks').RegisterTasks(gulp, __dirname,reload);

gulp.task('build', function (cb) {
    runSequence('clean', [
        'sass', 'template', 'js', 'img', 'lib'
    ], 'inject', cb);
});

// 浏览器同步，用7000端口去代理Express的3000端口
gulp.task('browser-sync', ['nodemon'], function () {
    browserSync.init(null, {
        proxy: "http://localhost:3000",
        // files: [     "./views/*.*", "public/stylesheets/*.*",
        // "public/javascripts/*.*", "public/images/*.*" ],
        browser: "google chrome",
        port: 7000
    });
});

// 开启Express服务
gulp.task('nodemon', function (cb) {
    var started = false;

    return nodemon({script: 'bin/www'}).on('start', function () {
        // to avoid nodemon being started multiple times thanks @matthisk
        if (!started) {
            cb();
                started = true;
            }
        })
        .on('restart', function () {
            console.log('restarted!');
            setTimeout(function () {
                reload();
            }, 1000);
        });
});


gulp.task('default', function (cb) {
    isDev = true;
    runSequence('build', 'browser-sync', 'dev', cb);
});
