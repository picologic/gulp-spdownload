# gulp-spdownload
Gulp plugin to download files from SharePoint

----------

# Install: 

`npm install gulp-spdownload`  

# Usage:
```javascript:
var gulp = require('gulp');
var spdownload = require('gulp-spdownload');

// sensitive data
var settings = {
	siteUrl: 'https://mycompany.sharepoint.com',
	username: 'myaccount@mycompany.onmicrosoft.com',
	password: '12345'
};

var masterpages = [
	"/_catalogs/masterpage/seattle.master", 
	"/_catalogs/masterpage/oslo.master"
];

var layouts = [
	"/_catalogs/masterpage/DefaultLayout.aspx"
];

gulp.task('pull', function() {
	spdownload(settings, masterpages).pipe(gulp.dest('./masterpages'));
	spdownload(settings, layouts).pipe(gulp.dest('./layouts'));
});
```