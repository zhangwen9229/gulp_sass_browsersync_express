const glob = require('glob'),
    path = require('path'),
    config = require('./config'),
    devEnv = require('./dev.env'),
    prodEnv = require('./prod.env');

const sass = require('gulp-sass'),
    filter = require('gulp-filter'),
    postcss = require('gulp-postcss'),
    px2rem = require('gulp-px2rem'),
    autoprefixer = require('autoprefixer'),
    browserSync = require('browser-sync').create(),
    reload = browserSync.reload,
    sourcemaps = require('gulp-sourcemaps'),
    minify = require('gulp-clean-css'),
    nodemon = require('gulp-nodemon'),
    cache = require('gulp-cache'),
    clean = require('gulp-clean'),
    runSequence = require('run-sequence'),
    uglify = require('gulp-uglify'),
    htmlmin = require('gulp-htmlmin'),
    imagemin = require('gulp-imagemin'),
    concat = require('gulp-concat'),
    jshint = require('gulp-jshint'),
    cssBase64 = require('gulp-base64'),
    inject = require('gulp-inject');

const todayTime = new Date().getTime();

class TaskTools {
    constructor(gulp) {
        this.gulp = gulp;
        this.isDev = false; //是否是开发模式
        if (process.env.NODE_ENV == devEnv.NODE_ENV) {
            this.isDev = true;
        }
    }
    compressTemplate(globPath, distPath) {
        console.log(globPath)
        console.log(distPath)
        const self = this;
        return self
            .gulp
            .src(globPath)
            .pipe(htmlmin({collapseWhitespace: true}))
            .pipe(self.gulp.dest(distPath));
    }
    staticInject(filePath, pathObj, cb) {
        const self = this;
        self
            .gulp
            .src(filePath)
            .pipe(inject(self.gulp.src(pathObj.cssFilePath, {read: false}), {
                starttag: '<!-- inject:css -->',
                endtag: '<!-- endinject -->',
                transform: function (filepath, file, i, length) {
                    let scriptStr = "<link rel='stylesheet' href='" + pathObj.cssLinkPath + "' />";
                    return scriptStr;
                }
            }))
            .pipe(inject(self.gulp.src(pathObj.jsFilePath, {read: false}), {
                starttag: '<!-- inject:js -->',
                endtag: '<!-- endinject -->',
                transform: function (filepath, file, i, length) {
                    let scriptStr = "<script src='" + pathObj.jsLinkPath + "?t=" + todayTime + "' ></script>";
                    return scriptStr;
                }
            }))
            .on('error', self.swallowError)
            .pipe(self.gulp.dest(path.dirname(filePath)))
            .on('end', cb);
    }
    cope(globPath, distPath) {
        const self = this;
        return self
            .gulp
            .src(globPath)
            .pipe(self.gulp.dest(distPath));
    }
    CompressJs(globPath) {
        console.log('Run: JsCompress');
        const self = this;
        const distPath = path.join(config.dist, config.javascripts);
        let jsTask = self
            .gulp
            .src(globPath)
            .pipe(jshint())
            .pipe(jshint.reporter('default'));
        if (this.isDev) { //开发时传入的是相对路径
            return jsTask.pipe(self.gulp.dest(distPath));
        } else {
            return jsTask
                .pipe(uglify({mangle: true, compress: true}))
                .pipe(self.gulp.dest(distPath));
        }
    }
    Compresssass(globPath, distPath) {
        console.log('Run: SassCompress');
        const self = this;
        // scss编译后的css将注入到浏览器里实现更新
        self
            .gulp
            .task('sass', function () {
                var plugins = [autoprefixer({browsers: ['> 5%']})];

                let sassTask = self
                    .gulp
                    .src(globPath)
                    .pipe(sourcemaps.init())
                    .pipe(sass().on('error', sass.logError))
                    .pipe(postcss(plugins))
                    .pipe(px2rem(config.px2remOptions, {map: false}))
                    .pipe(cssBase64())
                    .pipe(minify());
                if (this.isDev) {
                    return sassTask
                        .pipe(sourcemaps.write('./'))
                        .pipe(self.gulp.dest(distPath))
                        // .pipe(filter(['**/*.css'])) //防止sourcemap引起全页面刷新（css非注入式刷新）
                        .pipe(reload({stream: true, match: '**/*.css'})); //match: '**/*.css' 防止sourcemap引起全页面刷新（css非注入式刷新）
                } else {
                    return sassTask.pipe(self.gulp.dest(distPath));
                }
            });
    }
    CopeImage(globPath, distPath) {
        const self = this;
        return self
            .gulp
            .src(globPath)
            .pipe(imagemin([
                imagemin.gifsicle({interlaced: true}),
                imagemin.jpegtran({progressive: true}),
                imagemin.optipng({optimizationLevel: 5}),
                imagemin.svgo({
                    plugins: [
                        {
                            removeViewBox: true
                        }
                    ]
                })
            ]))
            .on('error', self.swallowError)
            .pipe(self.gulp.dest(distPath))
    }

    swallowError(error) {
        console.error(error.toString());
        this.emit('end');
    }
}

module.exports.taskTools = function (gulp) {
    return new TaskTools(gulp);
}