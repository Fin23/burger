//Act on change in element size
(function ($) {

$.fn.sizeChanged = function (handleFunction) {
    var element = this;
    var lastWidth = element.width();
    var lastHeight = element.height();

    setInterval(function () {
        if (lastWidth !== element.width() || lastHeight !== element.height()) {
          if (typeof (handleFunction) == 'function') {
              handleFunction({ width: lastWidth, height: lastHeight },
                             { width: element.width(), height: element.height() });
          }
          lastWidth = element.width();
          lastHeight = element.height();
        }
    }, 100);


    return element;
};

}(jQuery));
