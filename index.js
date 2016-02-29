var SP = require('node-spoauth'),
	httpreq = require('httpreq'),
	consts = require('constants'),
	through = require('through'),
	gutil = require('gulp-util');

var PLUGIN_NAME = 'gulp-spdownload';

module.exports = function(options, urls) {
	var stream = through(function(file, enc, cb) {
		this.push(file);
		cb();
	});

	var files = typeof urls === 'string' ? [urls] : urls;
	var downloadCount = 0;

	function download(url, opts) {
		var filename = url.replace(/^.*[\\\/]/, '');

		httpreq.get(options.siteUrl + url, opts, function(err, res) {
			if (err) return console.log(err);
			
			var file = new gutil.File({ path: filename, contents: new Buffer(res.body) });
			stream.queue(file);
			downloadCount++;

			if (downloadCount != files.length) {
				download(files[downloadCount], opts);
			} else {
				stream.emit('end');
			}

		});
	};

	var client = new SP.RestService(options.siteUrl);
	client.signin(options.username, options.password, function(err, auth) {
		if (err) {
			throw new gutil.PluginError(PLUGIN_NAME, err.message);
			return;
		}

		var opts = {
			cookies: [
				"FedAuth=" + auth.FedAuth,
				"rtFa=" + auth.rtFa
			],
			secureOptions: consts.SSL_OP_NO_TLSv1_2
		};

		download(files[0], opts);
	});

	return stream;
};