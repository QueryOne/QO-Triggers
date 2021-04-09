Client = (function(Client) {
  var input;
  var $body, $outc, $input, $output;
  var _Triggers;
  
  var lpad;

  let cmdHx  = []
  let cmdLim = 12
  let cmdPos = 0

  let _pointerGMCP = 160 // 211
  let _unprinted   = [_pointerGMCP, 239, 249]
  let _HREF   = /\<SEND HREF\=\"(.+?)\" hint\=\".+\"\>/
  let _href   = /\<SEND HREF\=\"(.+?)\">/ 
  let _color  = /\<COLOR (.+?)>/
  let _prompt = /\<PROMPT\>/
  let _promps = /\<\/PROMPT\>/
  let _orphan = /^<\/span><span class="[A-Za-z\s\-]+">$/
  let _unspecial = /[^ -~]+/g

  let _lineCount = 0
  
  let _usePrefix    = true
  let _useTimestamp = true
  
  let _textFormats = {
    0: 'reset',
    1: 'bold',
    4: 'underline',
   30: 'black',
   31: 'red',
   32: 'green',
   33: 'yellow',
   34: 'blue',
   35: 'magenta',
   36: 'cyan',
   37: 'normal',
   40: 'black-bg',
   41: 'red-bg',
   42: 'green-bg',
   43: 'yellow-bg',
   44: 'blue-bg',
   45: 'magenta-bg',
   46: 'cyan-bg',
   47: 'white-bg',
  }

  let ready = function() {
      $body   = $('body')
      $outc   = $('#output-container')
      $input  = $('#input')
      $output = $('#output')
      
      input   = document.getElementById('input')
      inputSelect = function() {
        input.select()
        if (typeof input.selectionStart == 'number') {
          input.selectionStart = input.selectionEnd = input.value.length
        } else if (typeof input.createTextRange != 'undefined') {
          var range = input.createTextRange()
          range.collapse(false)
          range.select()
        }
      }
      
      lpad = Utilities.lpad
      
      if (typeof Triggers != 'undefined') {
        _Triggers = Triggers
      } else {
        Triggers.match = function(e) { return e }
        Triggers.prettify = function(e) { return e }
        Triggers.prefix = function(e) { return '' }
      }
  }

  let interpret = function(userInput) {
    Input.interpret(userInput)
  }
  
  let behaviours = function() {
    // Input focus on clicking without selection
    $outc.off('click').on('click', function(e) {
      // let input = document.getElementById('input')
      if (window.getSelection && window.getSelection().toString().length > 0) {
      } else if (input === document.activeElement) {
      
      } else {
        /* jQuery version */
        // $input.focus()
        /* Pure Javascript version */
        // input.select()
        inputSelect()
      }
    })
    $outc.off('keypress').keypress(function(e) {
      if (e.which !== 13) { return }
      if (false) { // conditions where you wish to bypass ENTER
      
      } else {
        e.preventDefault()
        /* jQuery version */
        // $input.select()
        // let cmd = $input.val()
        /* Pure Javascript version */
        let input = document.getElementById('input')
        let cmd   = input.value
        input.select()

        cmdHx.unshift(cmd)
        if (cmdHx.length > cmdLim) { cmdHx.pop() }
        cmdPos = 0
        interpret(cmd)
      }
    })
    $input.off('keydown').keydown(function(e) {
      let s = ''
      if (e.which === 40) {
        cmdPos -= 1
        if (cmdPos < 1) { cmdPos = 0 } else {
          s = cmdHx[(cmdPos - 1)]
        }
        $input.val(s)
        // $input.select()
        inputSelect()
      } else if (e.which === 38) {
        cmdPos += 1
        if (cmdPos < cmdHx.length + 1) { } else {
          cmdPos = cmdHx.length
        }
        s = cmdHx[(cmdPos - 1)]
        $input.val(s)
        $input.select()
        // inputSelect()
      }
    })
    // Scrollback handling
    $output.off('mousewheel').on('mousewheel', Core._scrollbackHandler )
    $output.off('dblclick'  ).on( 'dblclick', Core._doubleclickHandler )
    // Focus
    $input.select()
  }

  // !important
  let orp = new RegExp('^' + String.fromCharCode(172) + '$')
  let format = function(worksheet) {
    let Tr = _Triggers
    let fg = 'normal'
    let bg = ''
    let t  = worksheet

    let vis  = String.fromCharCode(172)
    // Print Function
    let s    = ''

    for (var i = 0, len = t.length; i < len; i++) {
      let line = t[i]
      let part = []
      let unclosed = 0 // it is kind of stupid that I need to do this
      for (var j = 0, lineLength = line.length; j < lineLength; j++) {
        let C = line[j]
        if (typeof C === "object") {
          if (C.type === 'color') {
            let colors = C.value.split(';')
            colors.forEach(function(colorCode, index) {
              let color = _textFormats[parseInt(colorCode)]
              if (colorCode === '0') { // reset
                fg = 'normal'
                bg = ''
                if (index === colors.length - 1) {
                  line[j] = ''
                }
              } else {
                if (color.match('-bg')) { bg = color } else { 
                  // This probably needs to be more sophisticated but eh
                  if (color == 'bold') {
                    fg = 'bold '
                  } else {
                    if (fg == 'bold ') {
                      fg += color
                    } else {
                      fg = color
                    }
                  }
                }
              }
            })
            // line[j] = '</span><span class="' + fg + ' ' + bg + '">'
            line[j] = vis
            part.push('</span><span class="' + fg + ' ' + bg + '">')
          } else if (C.type === 'mxp') {
            if (C.value.match(_HREF)) {
              let m = _HREF.exec(C.value)
              let n = m[1] || ''
                  n = n.split('|')[0]
                  n = n.replace("'","\\'")
              unclosed = 1
              // line[j] = C.value.replace(_HREF, '<a href="#" onclick="Core.send(\'' + n + '\')">')
              line[j] = vis
              part.push(C.value.replace(_HREF, '<a href="#" onclick="Core.send(\'' + n + '\')">'))
            } else if (C.value.match(_href)) {
              let m = _href.exec(C.value)
              let n = m[1] || ''
                  n = n.split('|')[0]
                  n = n.replace("'","\\'")
              unclosed = 1
              // line[j] = C.value.replace(_href, '<a href="#" onclick="Core.send(\'' + n + '\')">')
              line[j] = vis
              part.push(C.value.replace(_href, '<a href="#" onclick="Core.send(\'' + n + '\')">'))
            } else if (C.value.match('</SEND>')) {
              if (unclosed == 1) { unclosed = 0 }
              // line[j] = '</a>'
              line[j] = vis
              part.push('</a>')
            } else if (C.value.match('<COLOR .+>')) {
              let m = C.value.match('<COLOR (.+)>')
              let n = m[1]
              if (n == '#ffffff') {
                n = 'rgba(201, 201, 201, 1.00)'
              }
              // line[j] = C.value.replace(_color, '<span style="color: ' + n + '">')
              line[j] = vis
              part.push(C.value.replace(_color, '<span style="color: ' + n + '">'))
            } else if (C.value.match('</COLOR>')) {
              // line[j] = '</span>'
              line[j] = vis
              part.push('</span>')
            } else {
              // line[j] = C.value
              line[j] = vis
              part.push(C.value)
              if (C.value === '<PROMPT>') {
              
              }
            }
          }
        } else if (typeof C === "number") {
          if (_unprinted.indexOf(C) == -1) {
            let m = String.fromCharCode(C)
            line[j] = m
          } else {
            // do not print if from _unprinted
            line[j] = ''
          }
        }
      }
      if (unclosed == 1) {
        unclosed = 0
        line.push(vis)
        part.push('</a>')
      }
      let pre = line.join('')
      
      var orphan = (pre.length === 0 && i === 0) || pre.match(orp)
      if (orphan) { } else {
        // pre = '<span class="' + fg + ' ' + bg + '">' + pre + '</span>'
        pre = vis + pre + vis
        part.unshift('<span class="' + fg + ' ' + bg + '">')
        part.push('</span>')
      }

      // pre = pre.replaceAll(vis, function() { var e = part.shift(); return e })
      
      /*
      // Triggers & Formatting block, can be removed if necessary for debugging
      */
      let raw = pre.replaceAll(vis,'')
      pre = Tr.match(pre, raw, part)
      // Modifying output with Triggers.instructions
      // pre = Tr.prettify(pre)
      // pre = pre.replace(_unspecial, '') // Uhm, I don't quite remember what this does

      // Prefix if desired
      if (_usePrefix) {
        let n = Tr.prefix(pre)
        pre = n + pre
      } 
      // Timestamp if desired
      if (_useTimestamp) {
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
      }
      /* Fin */
      
      if (orphan) { // Bloody orphaned lines...
      } else {
        s += '<div class="QO-line">' + pre + '</div>'
        _lineCount++
      }
    }
    return s
  }
  
  Client.ready      = ready
  Client.interpret  = interpret
  Client.behaviours = behaviours
  Client.format     = format
  Client.lineCount  = function(v) { if (v) { _lineCount = v }; return _lineCount }
  Client.usePrefix    = function(v) { if (typeof v != 'undefined') { _usePrefix = v; Client.indent(0); }; return _usePrefix }
  Client.useTimestamp = function(v) { if (typeof v != 'undefined') { _useTimestamp = v; if (v) { Client.indent(12) } else { Client.indent(0) } ; }; return _useTimestamp }
  return Client
})(typeof Client != 'undefined' ? Client : {})
