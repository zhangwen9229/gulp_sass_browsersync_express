const gulp = require('gulp');
const sass = require('gulp-sass');
const filter = require('gulp-filter');
var postcss = require('gulp-postcss');
var px2rem = require('gulp-px2rem');
var autoprefixer = require('autoprefixer');
var browserSync = require('browser-sync').create();
var reload      = browserSync.reload;
var sourcemaps = require('gulp-sourcemaps');
var minify = require('gulp-clean-css');
var nodemon = require('gulp-nodemon');
var cache = require('gulp-cache');

var uglify = require('gulp-uglify');
var htmlmin = require('gulp-htmlmin');
var imagemin = require('gulp-imagemin');

var path = require('path');

// var livereload = require('gulp-livereload');

var concat = require('gulp-concat');

// var jshint = require('gulp-jshint');

var cssBase64 = require('gulp-base64');
var del = require('del');



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
    map: false,
};

// 静态服务器 + 监听 scss/html 文件
gulp.task('serve', ['sass'], function() {

    browserSync.init({
        // server: "./",
        proxy: "http://127.0.0.1:3000"
    });

    gulp.watch("*.scss", ['sass']);
    gulp.watch("*.html").on('change', reload);
});

// scss编译后的css将注入到浏览器里实现更新
gulp.task('sass', function () {
    var plugins = [
        autoprefixer({browsers: ['> 5%']})
    ];
    const f = filter(['**', '!node_modules/**', '!px2rem.scss']);
    return gulp
        .src('src/sass/*.scss')
        // .pipe(f)
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss(plugins))
        .pipe(px2rem(px2remOptions,postCssOptions))
        .pipe(cssBase64())
        .pipe(minify())
        .pipe(sourcemaps.write('./',{sourceMappingURLPrefix: ''}))
        .pipe(gulp.dest('public/stylesheets/'))
        // .pipe(filter(['**/*.css']))  //防止sourcemap引起全页面刷新（css非注入式刷新） 
        .pipe(reload({stream: true,match: '**/*.css'}));//match: '**/*.css' 防止sourcemap引起全页面刷新（css非注入式刷新） 
});

// 删除文件
gulp.task('clean', function(cb) {
    del(['public/'], cb)
});

// 压缩ejs
gulp.task('ejs', function() {
  return gulp.src('src/views/**/*.ejs')
      .pipe(htmlmin({collapseWhitespace: true}))
      .pipe(gulp.dest('./views/'));
});

// 压缩img
gulp.task('img', function() {  
  return gulp.src('src/images/**/*')        //引入所有需处理的Img
    .pipe(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true }))      //压缩图片
    // 如果想对变动过的文件进行压缩，则使用下面一句代码
    // .pipe(cache(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true }))) 
    .pipe(gulp.dest('public/images/'))
    // .pipe(notify({ message: '图片处理完成' }));
});

// 浏览器同步，用7000端口去代理Express的3008端口
gulp.task('browser-sync', ['nodemon'], function() {
  browserSync.init(null, {
    proxy: "http://localhost:3000",
        files: ["./views/*.*","public/stylesheets/*.*","public/javascripts/*.*","public/images/*.*"],
        browser: "google chrome",
        port: 7000
  });
});

// 开启Express服务
gulp.task('nodemon', function (cb) {
  var started = false;

  return nodemon({
    script: 'bin/www'
  }).on('start', function () {
    // to avoid nodemon being started multiple times
    // thanks @matthisk
    if (!started) {
      cb();
      started = true; 
    } 
  });
}); 

gulp.task('default',['browser-sync'],function(){
  // 将你的默认的任务代码放这

    // 监听所有scss文档
    gulp.watch('src/sass/**/*.scss', ['sass']);

    // 监听所有.js档
    gulp.watch('src/javascripts/**/*.js', ['js']);

    // 监听所有图片档
    gulp.watch('src/images/**/*', ['img']);
    
    // 监听ejs
    gulp.watch('src/views/**/*.ejs', ['ejs']);

    gulp.watch("./views/**/*.ejs").on('change', reload);

//    // 创建实时调整服务器 -- 在项目中未使用注释掉
//   var server = livereload();
//    // 监听 dist/ 目录下所有文档，有更新时强制浏览器刷新（需要浏览器插件配合或按前文介绍在页面增加JS监听代码）
//   gulp.watch(['public/dist/**']).on('change', function(file) {
//     server.changed(file.path);
//   });
});

// gulp.task('default', ['serve']);