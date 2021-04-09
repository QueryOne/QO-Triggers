/* Standardise for Scripts */
Scripts = (function() {
  return {
    test: function(script) {
      try {
        eval(script)
      } catch(err) { console.log(err) }
    },
  }
})()

/* Alias system */
Aliases = (function() {
  var print     = Core.print
  var Quid      = Utilities.uuid
  var aliases   = []
  var RECode    = /\+do[\s\S]*?\-en/gim
  var REName    = /\+n[\s\S]*?\r?\n/g
  var REPattern = /\+p[\s\S]*?\r?\n/g

  var add = function(alias) { aliases.push(alias) }

  var batch = function(list) {
    for (var i = 0; i < list.length; i++) {
      var m = list[i]
      for (var j = 0; j < m.patterns.length; j++) { make(m.patterns[j], m.code, m.name) }
    }
  }

  var evaluate = function(str) {
    var out = []
    var t   = str.split('+alias')
        t.shift()
    for (var i = 0; i < t.length; i++) {
      var name     = ''
      var patterns = []
      var code     = ''
      var codeM    = t[i].match(RECode)
      if (codeM) { for (var j = 0; j < codeM.length; j++) { code = codeM[j].replace('+do','').replace('-en','') } }
      var nameM    = t[i].match(REName)
      if (nameM) { for (var j = 0; j < nameM.length; j++) { name = nameM[j].replace('+n ','').replace('\n','') } }
      var pattM    = t[i].match(REPattern)
      if (pattM) { for (var j = 0; j < pattM.length; j++) { patterns.push(pattM[j].replace('\n','').replace('+p ','')) } }
      out.push({name: name, patterns: patterns, code: code })
    }
    return out
  }

  var make = function(pattern, output, name, uuid, nonRecurring) {
    var RE     = new RegExp(pattern)
    var name   = name || 'unnamed'
    var uuid   = uuid || Quid()
    add({ pattern: pattern, output: output, RE: RE, name: name, uuid: uuid, active: true })
  }

  var update = function(pattern, output, name, id, notRecurring) {
    var exists = false
    var g      = notRecurring || 'g'
    for (var i = 0; i < aliases.length; i++) {
      if (aliases[i].uuid.match(id)) {
        aliases[i].pattern = pattern
        aliases[i].output  = output
        aliases[i].RE      = new RegExp(pattern, g)
        aliases[i].active  = true 
        exists = true
        break
      }
    }
    if (!exists) { make(pattern, output, name, id, notRecurring) }
  }

  var process = function(s) {
    var bool = false
    for (var i = 0; i < aliases.length; i++) {
      var RE = aliases[i].RE || {}
      if (typeof RE.exec != 'undefined' && s.match(RE)) { 
        bool = true
        matches = RE.exec(s)
        try { eval(aliases[i].output) } catch(err) { console.log(err) }
        aliases[i].RE.lastIndex = 0; // !important
      }
    }
    return bool
  }

  var show = function(filter) {

  }

  return {
    eval   : evaluate,
    list   : aliases,
    make   : make,
    update : update,
    process: process,
    show   : show,
  }
})()

/* Input Handling */
Input = (function() {
  let parcel           = Core.parcel
  let print            = Core.print
  let printdown        = Core.printdown
  let controlCharacter = '-'
  let controlPattern   = /^-/
  let separator        = /\s+/
  let $body            = $('body')

  let interpret = function(input) {
    let echo = Core._echoInput
    let cmds = input.split(separator)
    let primary = cmds[0]
    if (primary.match(controlPattern)) {
      primary = primary.replace(controlCharacter,'')
      switch(primary) {

        /* Basic Interface */
        case 'c': $body.trigger('Core-connect', cmds); break;

        case 'r': $body.trigger('Core-reload', cmds);  break;

        case 'a': $body.trigger('Aliases-show', cmds); break;

        default:
          printdown('>> <span class="darkred">What is it that you wish to do?</span><br/>')
          break;
      }
    } else {
      if (echo) { print('<span class="echo">' + input + '</span><br>') }
      parcel(input)
    }
  }

  let setControl = function(control) {
    controlCharacter = control
    controlPattern = new RegExp('^' + control)
    printdown('Set control character to <span class="violent">' + controlCharacter + '</span>.')
  }

  return {
    interpret: interpret,
    setControl: setControl,
  }
})()


        
        /*
        let idx = 0
        let wx  = ''
        while (null != (matches = trigger.RE.exec(v.line))) {
          var a = v.line.substring(idx, matches.index)
          wx += a + '<span class="red">' + matches[0] + '</span>'
          idx = trigger.RE.lastIndex
        }
        let wy = v.line.substring(idx, v.line.length)
        wx += wy
        trigger.RE.lastIndex = 0; // !important
        
        line = unwind(wx, p)


        
        let idx = 0
        let wx  = ''
        matchesF = v.line.matchAll(trigger.RE)
        for (const m of matchesF) {
          
          
          
          var a = m.input.substring(idx, m.index)
          wx += a + '<span class="red">' + m[0] + '</span>'
          idx = m.index + m[0].length
        }
        let wy = v.line.substring(idx, v.line.length)
        wx += wy
        trigger.RE.lastIndex = 0;
        
        line = unwind(wx, p)


        */
