var extname = require('path').extname;

exports.isJs = function(file) {
  return extname(file.path) === '.js';
};

exports.isCSS = function(file) {
  return extname(typeof file == 'string' ?  file : file.path) === '.css';
};

exports.winPath = function(path) {
  return path.replace(/\\/g, '/');
}

exports.hideExt = function(filepath) {
  return extname(filepath) === '.js' ? filepath.replace(/\.js$/, '') : filepath;
}


exports.arr2str = function(arr) {
  return arr.map(function(item) {
    return '"' + item + '"';
  }).join(',');
}

exports.template = function(format, data) {
  if (!format) return '';
  return format.replace(/{{([a-z]*)}}/g, function(all, match) {
    return data[match] || '';
  });
}