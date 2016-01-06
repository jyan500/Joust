var gulp = require('gulp');
var ts = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var less = require('gulp-less');

var browserify = require('browserify');
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');

var _ = require('lodash');
var through = require('through2');

var tsProject = ts.createProject('./tsconfig.json');

gulp.task('default', ['watch']);

gulp.task('compile', ['compile:scripts', 'compile:styles', 'html']);

gulp.task('compile:scripts', function () {
	var tsResult = tsProject.src()
		.pipe(sourcemaps.init())
		.pipe(ts(tsProject)).js
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('./dist'));
});

gulp.task('compile:styles', function () {
	gulp.src('./less/**/*.less')
		.pipe(sourcemaps.init())
		.pipe(less({'strictMath': true}))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('./dist'));
});

gulp.task('html', function() {
	gulp.src('./html/**/*.html')
		.pipe(gulp.dest('./dist'));
});

gulp.task('watch', ['watch:scripts', 'watch:styles', 'watch:html']);

gulp.task('watch:scripts', ['compile:scripts'], function () {
	gulp.watch(['ts/**/*.ts', 'ts/**/*.tsx'], ['compile:scripts']);
});

gulp.task('watch:styles', ['compile:styles'], function () {
	gulp.watch(['less/**/*.less'], ['compile:styles']);
});

gulp.task('watch:html', ['html'], function () {
	gulp.watch(['html/**/*.html'], ['html']);
});


gulp.task('browserify', ['compile'], function () {
	var b = browserify({
		entries: './dist/run.js',
		debug: true
	});

	return b.bundle()
		.pipe(source('joust.js'))
		.pipe(buffer())
		.pipe(uglify())
		.pipe(gulp.dest('./dist'));
});

gulp.task('enums', function () {
	gulp.src(process.env.ENUMS_JSON || './enums.json')
		.pipe(through.obj(function (file, encoding, callback) {
			var json = String(file.contents);
			var out = '// this file was automatically generated by `gulp enums`\n';
			out += "'use strict';\n";
			var enums = JSON.parse(json);
			_.each(enums, function (keys, name) {
				out += '\nexport const enum ' + name + ' {\n';
				foo = [];
				_.each(keys, function (value, key) {
					foo.push('\t' + key + ' = ' + value);
				});
				out += foo.join(',\n') + '\n';
				out += '}\n';
			});
			file.path = 'enums.tsx';
			file.contents = new Buffer(out);
			callback(null, file);
		}))
		.pipe(gulp.dest('./ts'));
});
