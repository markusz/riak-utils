module.exports = {
  metaToIndex: function(meta) {
    var indexes = {};
    var regex = /^x-riak-index-(.*)$/;
    for (var key in meta.headers) {
      if (meta.headers.hasOwnProperty(key)) {
        var matches = key.match(regex);
        if (matches) {

          var splitted = matches[1].split('_');
          var type = splitted[splitted.length - 1];

          var isNumeric = type === 'int';
          var value = meta.headers[key];
          var keyName = splitted.slice(0, splitted.length - 1);

          indexes[keyName] = isNumeric ? parseInt(value, 10) : value;
        }
      }
    }
    return { index: indexes };
  },
  indexToMeta: function(index) {

  }
};
