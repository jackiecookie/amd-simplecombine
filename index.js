var File = require('./fileModules');
var path = require('path');
var join = path.join;
var utils = require('./utils');
var winPath = utils.winPath;
var common = require('./common');
var arr2str = utils.arr2str;
var template = utils.template;
var UglifyJS = require("uglify-js");

var removedefineReg = /^\s*define[(].*?function.*?[)]\s*{?/;
var removefooterTpl = /}[)];*\s*$/

var headerTpl = 'define("{{id}}", [{{deps}}], function(require, exports, module){';
var footerTpl = '});\n';



module.exports.parseAmdModule = function(moduleurls, option, fn) {
	var pkg = initpkg(option),
		bufCache = null;
	//获得File 
	moduleurls.forEach(function(moduleurl) {
		var filePath = winPath(join(pkg.dest, option.modules_path, moduleurl));
		pkg.files.push(filePath);
		var file = requireFile(filePath, pkg);
		file = file.isTransed ? file : transFile(file, filePath);
		if (bufCache) {
			bufCache += file.contents.toString();
		} else {
			bufCache = file.contents.toString();
		}
	});
	if (bufCache) {
		fn(null, new Buffer(bufCache));
	}
}

module.exports.RemoveCache = function(path) {
	var pkg = initpkg()
	if (pkg) pkg.removefile(path);
}



//转换成标准的amd模块
function transFile(file, filePath) {
	var minify = true;
	var code = file.contents.toString();
	//这里的deps只有require中引用的部分,可能会存在css引用
	var deps = common.getFileDeps(code, filePath);
	//获得可能存在的CSS引用 
	common.setFileCssDepsToDeps(code, deps);
	var id = common.transportId(file, pkg);
	//去掉注释避免干扰
	code = code.replace(/(?:^|\n|\r)\s*\/\*[\s\S]*?\*\/\s*(?:\r|\n|$)/g, '\n').replace(/(?:^|\n|\r)\s*\/\/.*(?:\r|\n|$)/g, '\n');
	//如果是标准amd模块去头去尾,重新构建,为了兼容非标准amd模块
	var removedefineRegStr = code.match(removedefineReg)
	if (removedefineRegStr != null) {
		code = code.replace(removedefineRegStr[0], '').replace(removefooterTpl, '');
	}
	//构建标准的amd模块 单个文件构建完毕
	var html = [
		template(headerTpl, {
			id: id,
			deps: arr2str(deps)
		}),
		code, footerTpl
	].join('\n');
	//压缩
	file.contents = new Buffer(minify ? UglifyJS.minify(html, {
		fromString: true
			// ,
			// mangle: false
	}).code : html);
	file.isTransed = true;
	return file;
}



function requireFile(filepath, pkg, relativePath) {
	try {
		return File.require(filepath, pkg);
	} catch (e) {
		if (relativePath) {
			e.message += ' that required by ' + relativePath;
		}
		throw e;
	}
}


function initpkg(option) {
	if (this.pkg) return this.pkg;
	if (!option) return false;
	var pkg = {};
	pkg.dest = option.assets_path;
	pkg._files = {};
	//别名暂时没用 
	//pkg.alias = require(join(pkg.dest, 'rootConfig.js')).alias;
	pkg.files = [];
	this.pkg = pkg;
	pkg.getfile = function(p) {
		return pkg._files[p];
	}
	pkg.removefile = function(p) {
		p = p.replace(/\\/g, '/');
		delete pkg._files[p];
	}
	return pkg;
}