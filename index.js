var SP = require('node-spoauth'),
	httpreq = require('httpreq'),
	consts = require('constants'),
	through = require('through'),
	gutil = require('gulp-util'),
	binaryextensions = require('binaryextensions');

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
		var downloadUrl = getDownloadUrl(options.siteUrl, url);
		opts.binary = isBinary(filename);

		httpreq.get(downloadUrl, opts, function(err, res) {
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

	function getDownloadUrl(siteUrl, fileUrl) {
		// fix up url to combine
		if (endsWith(siteUrl, '/')) {
			siteUrl = siteUrl.substring(0, siteUrl.length - 1);
		}
		if (!startsWith(fileUrl, '/')) {
			fileUrl = '/' + fileUrl;
		}

		var fullUrl = siteUrl + fileUrl;
		if (fullUrl.toLowerCase().indexOf('_catalogs/masterpage') !== -1) {
			// master page url - use download link
			var root = siteUrl + '/_layouts/15/download.aspx?SourceUrl=';
			var path = getServerRelativePath(fullUrl);
			fullUrl = root + fixedEncodeURIComponent(path);
		}

		return fullUrl;
	};

	function getServerRelativePath(fullUrl) {
		var tmp = fullUrl.substring(fullUrl.indexOf('://') + 3);
		tmp = tmp.substring(tmp.indexOf('/'));
		return tmp;
	};

	function endsWith(str, suffix) {
		return str.indexOf(suffix, str.length - suffix.length) !== -1;
	};

	function startsWith(str, prefix) {
		return str.indexOf(prefix) === 0;
	};

	function fixedEncodeURIComponent(str) {
		return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
			return '%' + c.charCodeAt(0).toString(16);
		});
	};

	function isBinary(filename) {
		var parts = filename.split('.');
		var ext = parts[parts.length-1].toLowerCase();
		return binaryextensions.indexOf(ext) > -1;
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