var util = require('./utils');
var isCSS = util.isCSS;
var hideExt = util.hideExt;
var winPath = util.winPath;
var path = require('path');
var join = path.join;
var extname = path.extname;
var requires = require('crequire');
var getCssDepReg = /define[(].*?(['"].+[.]css['"])+/;

//转换ID
function transportId(file, pkg) {
  if (!(file.pkg && file.path)) {
    throwError('should pass file object of father when transportId `%s`', file);
  }


  var filepath = path.relative(pkg.dest, file.path);
  filepath = hideExt(filepath);
  var id = winPath(filepath);
  return id;
}



//获得依赖,不递归 
function getFileDeps(code, fullpath) {
  var ext = extname(fullpath);
  switch (ext) {
    case '.js':
      return requires(code, false).map(transform);
    case '.css':
      return imports(code).map(transform);
    default:
      return [];
  }

  function transform(item) {
    return item.path;
  }
}

function setFileCssDepsToDeps(code, deps) {
  cssdeps = code.match(getCssDepReg);
  
  var configPath = path.resolve(process.cwd(), 'config.js');
  var globalConfig = require(configPath);
  var separator=require(join(globalConfig.assets_path, 'rootConfig.js')).comboSyntax[1];
  
  if (cssdeps != null) {
	//cssdeps[1].split(',').forEach(function(cssdep) {
	cssdeps[1].split(separator).forEach(function(cssdep) {
      //去除两边多余的引号和双引号
      cssdep = cssdep.trim()
      cssdep = cssdep.substring(1, cssdep.length - 1);
      if (isCSS(cssdep)) {
        deps.push(cssdep);
      }
    })
  }
}


exports.transportId = transportId;
exports.getFileDeps = getFileDeps;
exports.setFileCssDepsToDeps = setFileCssDepsToDeps;