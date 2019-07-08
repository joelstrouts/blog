// the variable `input` has been passed to
// this code chunk with include data.
// the variable `anchor` is a div where the include
// was called

function append_style(elem, addendum) {
  var style_string = elem.getAttribute('style');
  if (style_string == null) {
    elem.setAttribute('style', addendum);
  } else {
    elem.setAttribute('style', style_string + addendum);
  }
}

function style_setter(div, attribute, value) {
  append_style(div, attribute + ': ' + value + ';');
}

function div_maker(name) {
  var my_div = document.createElement('div');
  my_div.setAttribute('id', name);
  return my_div;
}

function anchor_appender(div) {
  anchor.appendChild(div);
}

function painter(div, color) {
  var color_string = 
    ' background-color: ' + color + ';' +
    'box-sizing: border-box;' +
    'border: 4px solid white;' +
    'float: left'
  append_style(div, color_string);
}

for (var factor of input) {
  var div = div_maker('factor_' + factor);
  style_setter(div, 'width', '4em');
  style_setter(div, 'height', '4em');
  if (factor == 2) {
    painter(div, '#282dff');
  } else if (factor == 3) {
    painter(div, '#cd0028');
  } else if (factor == 5) {
    painter(div, '#f0c364');
  }
  anchor_appender(div);
}

style_setter(anchor, 'width', '8em');
style_setter(anchor, 'height', '8em');
