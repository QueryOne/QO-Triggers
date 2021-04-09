Client = (function(Client) {
  // https://codepen.io/fskirschbaum/pen/MYJNaj

  let _lineClass   = 'QO-line'
  let _offsetCount = 12

  let drawPanel = function() {
    $('#subpanel').empty()
    let d  = '<div id="subpanel-1" onclick="Core.tryConnect(\'\')"><div class="subpanel-display">C</div></div>'
        d += '<div id="subpanel-2"></div>'
        d += '<div id="subpanel-3"><div class="subpanel-display">{}</div></div>'
        d += '<div id="subpanel-ping">0</div>'
        d += '<div id="subpanel-performance">0</div>'
        d += '<div id="subpanel-connection" class="closed"><div id="subpanel-connection-internal" class="internal"></div></div>'
    $('#subpanel').append(d)
  }

  let calculateIndentation = function() {
    let lineClass   = _lineClass
    let offsetCount = _offsetCount // characters
    let F = parseFloat( window.getComputedStyle(document.getElementById('input'), null).getPropertyValue('font-size') )
    let u = {}
    let fn = function(t, f) {
      u.element = document.createElement('canvas')
      u.context = u.element.getContext('2d')
      u.context.font = f
      return {width: u.context.measureText(t).width, height: parseInt(u.context.font)}
    }
    let w = fn('a', $('#output').css('font'))
        w = w.width * offsetCount + 'px'
    $('html > head').append($('<style>.' + lineClass + ' {padding-left: ' + w + '; text-indent: -' + w + ';}</style>'))
  }

  let indent = function(v) {
    if (typeof v !== 'undefined') {
      if (typeof v === 'number') {
        _offsetCount = v
      } else if (typeof v === 'string') {
        _offsetCount = parseInt(v)
      }
      calculateIndentation()
    }
    return _offsetCount;
  }

  let redraw = function() {
    calculateIndentation()
  }

  let prefix = function() {
    var lpad = Utilities.lpad
    var pre = '<span class="mutrigger">&compfn;</span> '

    var currentTime = new Date()
    var tstmp = ''
    var mins  = currentTime.getMinutes()
    var secs  = currentTime.getSeconds()
    var mscs  = currentTime.getMilliseconds()
        mins  = lpad(mins,2,'0')
        secs  = lpad(secs,2,'0')
        mscs  = lpad(mscs,3,'0')
    tstmp = mins + ':' + secs + ':' + mscs + ' '
    pre = '<span class="timestamp">' + tstmp + '</span>' + pre
    return pre
  }

  let connecting = function() {
    let $light = $('#subpanel-connection')
    $light
      .removeClass('closed')
      .removeClass('closing')
      .removeClass('connected')
      .addClass('connecting')
  }

  let connected = function() {
    let $light = $('#subpanel-connection')
    $light
      .removeClass('closed')
      .removeClass('closing')
      .removeClass('connecting')
      .addClass('connected')
    $('#subpanel-1').addClass('connected')
  }

  let existingConnection = function() {
    var pre = prefix()
    Core.printdown(pre + '<span class="darkred">Already connected to <span class="mute">' + Core._handler.url + '</span>. Please disconnect first.</span>')
  }

  let disconnected = function() {
    let $light = $('#subpanel-connection')
    $light
      .removeClass('closing')
      .removeClass('connecting')
      .removeClass('connected')
      .addClass('closed')
    $('#subpanel-1 .subpanel-display').removeClass('connected')
  }

  Client.drawPanel = drawPanel
  Client.redraw    = redraw
  Client.indent    = indent
  Client.prefix    = prefix
  Client.connecting   = connecting
  Client.connected    = connected
  Client.existing     = existingConnection
  Client.disconnected = disconnected
  return Client
})(typeof Client != 'undefined' ? Client : {})
