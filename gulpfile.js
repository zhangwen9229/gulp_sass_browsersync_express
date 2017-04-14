const gulp = require('gulp'),
    sass = require('gulp-sass'),
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
    glob = require('glob'),
    path = require('path'),
    inject = require('gulp-inject');

const todayTime = new Date().getTime();

var px2remOptions = {
    rootValue: 750 / 16,
    unitPrecision: 5,
    propWhiteList: [],
    propBlackList: [
        'border-bottom',
        'border-top',
        'border-left',
        'border-right',
        'border',
        'filter'
    ],
    replace: true,
    mediaQuery: false,
    minPx: 1 //需转换rem的最小像素值，超过1px的都转换rem
};
var postCssOptions = {
    map: false
};

// scss编译后的css将注入到浏览器里实现更新
gulp.task('sass', function () {
    var plugins = [autoprefixer({browsers: ['> 5%']})];
    // const f = filter(['**', '!node_modules/**', '!px2rem.scss']);
    return gulp.src('src/stylesheets/*.scss')
    // .pipe(f)
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss(plugins))
        .pipe(px2rem(px2remOptions, postCssOptions))
        .pipe(cssBase64())
        .pipe(minify())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('public/stylesheets/'))
        .pipe(filter(['**/*.css'])) //防止sourcemap引起全页面刷新（css非注入式刷新）
        .pipe(reload({stream: true, match: '**/*.css'})); //match: '**/*.css' 防止sourcemap引起全页面刷新（css非注入式刷新）
});

// 删除文件
gulp.task('clean', function (cb) {
    return gulp.src([
        'public/', 'views/'
    ], {read: false}).pipe(clean());
});

// 压缩ejs
gulp.task('ejs', function () {
    return gulp
        .src('src/views/**/*.ejs')
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest('./views/'));
});

// 拷贝lib
gulp.task('lib', function () {
    return gulp
        .src('src/lib/**/*.js')
        .pipe(gulp.dest('public/lib/'))
});

// 压缩img
gulp.task('img', function () {
    return gulp.src('src/images/**/*') //引入所有需处理的Img
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
    ])) //压缩图片
    // .pipe(imagemin({ optimizationLevel: 5, progressive: true, interlaced: true
    // }))      //压缩图片 如果想对变动过的文件进行压缩，则使用下面一句代码 .pipe(cache(imagemin({
    // optimizationLevel: 3, progressive: true, interlaced: true })))
        .pipe(gulp.dest('public/images/'))
    // .pipe(notify({ message: '图片处理完成' }));
});

// 压缩js
gulp.task('js', function () {
    return gulp
        .src('src/javascripts/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(uglify({mangle: true, compress: true}))
        .pipe(gulp.dest('public/javascripts/'))
});

gulp.task('inject', function (cb) {
    const ejsArr = getEntries('views/**/*.ejs');
    var taskArr = [];
    ejsArr.forEach(function (ejsPath, index) {
        var cssPathObj = getCssPath(ejsPath);
        var taskName = 'inject' + index;
        gulp.task(taskName, function (cb) {
            return gulp
                .src(ejsPath)
                .pipe(inject(gulp.src(cssPathObj.cssFilePath, {read: false}), {
                    starttag: '<!-- inject:css -->',
                    endtag: '<!-- endinject -->',
                    transform: function (filepath, file, i, length) {
                        let scriptStr = "<link rel='stylesheet' href='" + cssPathObj.cssLinkPath + "?t=" + todayTime + "' />";
                        return scriptStr;
                    }
                }))
                .pipe(inject(gulp.src(cssPathObj.jsFilePath, {read: false}), {
                    starttag: '<!-- inject:js -->',
                    endtag: '<!-- endinject -->',
                    transform: function (filepath, file, i, length) {
                        let scriptStr = "<script src='" + cssPathObj.jsLinkPath + "?t=" + todayTime + "' ></script>";
                        return scriptStr;
                    }
                }))
                .pipe(gulp.dest('views/'));
        });
        taskArr.push(taskName);
    })
    console.log(taskArr)
    if (taskArr.length == 0) {
        cb();
        return;
    }
    runSequence(taskArr, cb);
})

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

gulp.task('dev', function () {
    // 将你的默认的任务代码放这 监听所有scss文档
    gulp
        .watch('src/stylesheets/**/*.scss')
        .on('change', function (event) {
            var plugins = [autoprefixer({browsers: ['> 5%']})];
            return gulp.src(path.relative(__dirname, event.path))
                .pipe(sourcemaps.init())
                .pipe(sass().on('error', sass.logError))
                .pipe(postcss(plugins))
                .pipe(px2rem(px2remOptions, postCssOptions))
                .pipe(cssBase64())
                .pipe(minify())
                .pipe(sourcemaps.write('./'))
                .pipe(gulp.dest('public/stylesheets/'))
                // .pipe(filter(['**/*.css'])) //防止sourcemap引起全页面刷新（css非注入式刷新）
                .pipe(reload({stream: true, match: '**/*.css'})); //match: '**/*.css' 防止sourcemap引起全页面刷新（css非注入式刷新）
        });

    // 监听所有.js档
    gulp
        .watch('src/javascripts/**/*.js')
        .on('change', function (event) {
            return gulp
                .src(path.relative(__dirname, event.path))
                .pipe(jshint())
                .pipe(jshint.reporter('default'))
                .pipe(uglify({mangle: true, compress: true}))
                .pipe(gulp.dest('public/javascripts/'))
        })
    gulp
        .watch("public/javascripts/**/*.js")
        .on('change', reload);

    // 监听所有图片档
    gulp
        .watch('src/images/**/*', ['img'])
        .on('change', function (event) {
            return gulp
                .src(path.relative(__dirname, event.path))
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
                .pipe(gulp.dest('public/images/'))
        });
    gulp
        .watch("public/images/**/*")
        .on('change', reload);

    // 监听ejs
    gulp
        .watch('src/views/**/*.ejs')
        .on('change', function (event) {
            return gulp
                .src(event.path)
                .pipe(htmlmin({collapseWhitespace: true}))
                .pipe(gulp.dest('./views/'));
        });
    var watcher = gulp.watch("./views/**/*.ejs");
    watcher.on('change', function (event) {
        console.log('Event type: ' + event.type); // added, changed, or deleted
        console.log('Event path: ' + event.path); // The path of the modified file
        console.log('relative path:' + path.relative(__dirname, event.path));
        const filePath = path.relative(__dirname, event.path);
        const ejsArr = getEntries(filePath);
        const cssPathObj = getCssPath(ejsArr[0]);
        gulp
            .src(filePath)
            .pipe(inject(gulp.src(cssPathObj.cssFilePath, {read: false}), {
                starttag: '<!-- inject:css -->',
                endtag: '<!-- endinject -->',
                transform: function (filepath, file, i, length) {
                    let scriptStr = "<link rel='stylesheet' href='" + cssPathObj.cssLinkPath + "' />";
                    return scriptStr;
                }
            }))
            .pipe(inject(gulp.src(cssPathObj.jsFilePath, {read: false}), {
                starttag: '<!-- inject:js -->',
                endtag: '<!-- endinject -->',
                transform: function (filepath, file, i, length) {
                    let scriptStr = "<script src='" + cssPathObj.jsLinkPath + "?t=" + todayTime + "' ></script>";
                    return scriptStr;
                }
            }))
            .pipe(gulp.dest('views/'))
            .on('end', reload);
    });
})

gulp.task('default', function (cb) {
    runSequence('build', 'browser-sync', 'dev', cb);
});

gulp.task('build', function (cb) {
    runSequence('clean', [
        'sass', 'ejs', 'js', 'img', 'lib'
    ], 'inject', cb);
});

// gulp.task('default', ['serve']);

function getEntries(globPath) {
    var files = [],
        entries = {};
    if (globPath instanceof Array) {
        globPath
            .forEach(function (pattern) {
                // console.log(pattern)
                files = files.concat(glob.sync(pattern))
            })
    } else {
        files = glob.sync(globPath)
    }
    // console.log(files); console.log(files.length)
    return files;
}

function getCssPath(ejsPath) {
    let extname = path.extname(ejsPath);
    let cssname = path.basename(ejsPath, extname);
    let ejsPathArr = ejsPath.split(path.sep);
    ejsPathArr.shift();
    const jsLinkPathArr = [
        'javascripts', ...ejsPathArr
    ];
    jsLinkPathArr[jsLinkPathArr.length - 1] = cssname + '.js';

    const jsPathArr = [
        'public', ...jsLinkPathArr
    ];

    ejsPathArr = [
        'stylesheets', ...ejsPathArr
    ];
    ejsPathArr[ejsPathArr.length - 1] = cssname + '.css';
    const cssPathArr = [
        'public', ...ejsPathArr
    ];
    return {
        cssLinkPath: '/' + ejsPathArr.join('/'),
        cssFilePath: cssPathArr.join('/'),
        jsLinkPath: '/' + jsLinkPathArr.join('/'),
        jsFilePath: jsPathArr.join('/')
    };
}