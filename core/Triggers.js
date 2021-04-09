
/* Trigger system */
Triggers = (function() {
  var Quid      = Utilities.uuid
  var instructions = []
  var triggers     = []
  var ignore    = false
  var modify    = false

  var matched   = false // matched a fully in-situ trigger
  var errored   = false // error while running code
  var unmatch   = false // matched only on raw trigger

  var holder    = String.fromCharCode(172)
  var RECode    = /\+do[\s\S]*?\-en/gim
  var REName    = /\+n[\s\S]*?\r?\n/g
  var REPattern = /\+p[\s\S]*?\r?\n/g

  var add = function(alias) { triggers.push(alias) }

  var make = function(pattern, response, name, uuid, notRecurring) {
    var g      = notRecurring || 'g'
    var RE     = new RegExp(pattern, g)
    var uuid   = uuid || Quid()
    add({ pattern: pattern, output: response, RE: RE, name: name, uuid: uuid, active: true })
  }

  var update = function(pattern, response, name, id, notRecurring) {
    var exists = false
    var g      = notRecurring || 'g'
    for (var i = 0; i < triggers.length; i++) {
      if (triggers[i].uuid.match(id)) {
        triggers[i].pattern = pattern
        triggers[i].output  = response
        triggers[i].RE      = new RegExp(pattern, g)
        triggers[i].active  = true 
        exists = true
        break
      }
    }
    if (!exists) { make(pattern, response, name, id, notRecurring) }
  }

  var remove = function(name) {
    for (var i = triggers.length - 1; i > -1; i--) {
      var trigger = triggers[i]
      if (trigger.name == name) {
        triggers.splice(i, 1)
      }
    }
  }

  var deactivate = function(name) {
    for (var i = triggers.length - 1; i > -1; i--) {
      var trigger = triggers[i]
      if (trigger.name == name) {
        triggers[i].active = false
      }
    }
  }

  var activate = function(name) {
    for (var i = triggers.length - 1; i > -1; i--) {
      var trigger = triggers[i]
      if (trigger.name == name) {
        triggers[i].active = true
      }
    }
  }

  var match = function(line, raw, part) {
    var t   = triggers

    if (t.length <= 0) {
      line = line.replaceAll(holder, function() { return part.shift() })
      return line
    }    

    for (var i = 0, len = t.length; i < len; i++) {
      let trigger   = t[i]
      let regex     = t[i].RE
      
      if (!trigger.active) {
        line = line.replaceAll(holder, function() { return part.shift() })
      } else if (regex.test(line)) {
        regex.lastIndex = 0 // reset lastIndex
        matches = []        // reset matches
      
        let tempString = ''
        let n = 0
        let matchedRawOnly = true
        
        let matchesF = line.matchAll(regex)
        for (const match of matchesF) {
          var c = matches.string // save the match from each iteration through matchesF
          matches = match
          matches.prior = n
          if (c) {
            matches.string = c
          } else {
            matches.string = matches.string || tempString
          }
          try { out = eval(trigger.output) } catch(err) {
            errored = true
            console.log('Trigger error: ' + regex)
            console.log(err.message) }
          n = match.index + match[0].length
        }
        if (n < line.length) { tempString = line.substring(n, line.length) }
        if (matches.string && matches.instruction) {
          if (matches.instruction == 'subg') {
            tempString = matches.string + tempString
          } else if (matches.instruction == 'append') {
            tempString = line.substring(0, n) + tempString + matches.string
          }
        } else {
          tempString = line
        }
        regex.lastIndex = 0
        
        // record the match
        if (matched == false) { if (ignore) { ignore = false } else { matched = true } }
        trigger.matched  = trigger.matched || 0
        trigger.matched += 1
        
        line = tempString.replaceAll(holder, function() { return part.shift() })
      } else {
        // var now = new Date().getTime()
        if (raw.match(regex)) {
        // if (regex.test(raw)) {
          unmatch = true
          
          regex.lastIndex = 0
          matches = []        // reset matches
          let arr;
          let tempString = '';
          let n = 0;
          while ((arr = regex.exec(raw)) !== null) {
            var c = matches.string // save the match from each iteration through matchesF
            matches = arr
            matches.prior = n
            if (c) {
              matches.string = c
            } else {
              matches.string = matches.string || tempString
            }
            try {
              out = eval(trigger.output)
            } catch(err) {
              errored = true
              console.log(err.message)
            }
            n = arr.index + arr[0].length
          }

          tempString = line
          if (matches.string && matches.instruction) {
            if (matches.instruction == 'append') {
              tempString = tempString + matches.string
            } else if (matches.instruction == 'subg') {
              tempString = matches.string
            }
          }

          regex.lastIndex = 0
          if (matched == false) { if (ignore) { ignore = false } else { matched = true } }
          trigger.matched  = trigger.matched || 0
          trigger.matched += 1
        
          line = tempString.replaceAll(holder, function() { return part.shift() })

          // trigger.performance = trigger.performance || []
          // trigger.performance.push(new Date().getTime() - now)
        } else {
          line = line.replaceAll(holder, function() { return part.shift() })
        }
      }
    }
   
    return line
  }
  
  var prefix = function(line) {
    var pre = ''
    if (line.match('</PROMPT>')) {
      pre = '<span class="mutrigger">&compfn;</span> '
    } else if (errored) {
      pre = '<span class="errortrig">&compfn;</span> '
    } else if (unmatch) {
      pre = '<span class="unmatchTr">&compfn;</span> '
    } else if (matched) {
      pre = '<span class="triggered">&compfn;</span> '
    } else {
      pre = '<span class="untrigger">&compfn;</span> '
    }
    errored = false
    matched = false
    unmatch = false
    return pre
  }

  var _substitution = function(options) {
    modify = true
    options.method = options.method || 'inline-substitution'
    instructions.push(options)
  }
  
  var _subglobal = function(options) {
    if (typeof matches.input == 'string') {
      var a = matches.input.substring(matches.prior, matches.index)
      if (a.length) {
        matches.string += a + options.output
      } else {
        /** This might need fixing **/
        // matches.string += options.output
        // matches.string  = matches.input
        if (matches.string == '') {
          matches.string = matches.input.replace(options.target, options.output)
        } else {
          matches.string = matches.string.replace(options.target, options.output)
        }
      }
      matches.instruction = 'subg'
    }
  }
  
  var _append = function(options) {
    if (typeof matches.input == 'string') {
      matches.string  = matches.string || ''
      matches.string += options.output
      matches.instruction = 'append'
    }
  }

  var _replace = function(str) {
    modify = true
    var options = {
      method: 'replace',
      output: str,
    }
    instructions.push(options)
  }
  
  var _prettify = function(line) {
    if (!modify) { return line }

    let t = placehold(line)
    let p = t.p
    line = t.line

    modify = false
    while (instructions.length) {
      var instruction = instructions.shift()

let m = instruction.matches

      
      if (instruction.method) {
        switch(instruction.method) {
          case 'inline-substitution':
            line = line.replace(instruction.target, instruction.output)
            break;
          case 'inline-global':
            // line = line.replaceAll(instruction.target, instruction.output)
            break;
          case 'append':
            line = line + instruction.output
            break;
          case 'replace':
            line = instruction.output || ''
            break;
          default:
            break;
        }
      }
    }

    line = unwind(line, p)
    return line
  }

  /*
  // I would prefer a more efficient method,
  //  but we replace any special capture with a placeholder symbol
  //  then re-expand it once we are done
  let capture   = /\<span .+?\>|<\/span\>|\<a href.+?\>|\<\/a>/g
  let holder    = String.fromCharCode(172)
  let holderR   = new RegExp(holder)
  var placehold = function(line) {
    let t = []
    let h = line.matchAll(capture)
    for (const m of h) {
      let n = m[0]
      t.push(n)
      line = line.replace(n, holder)
    }
    return {line: line, p: t}
  }

  var unwind = function(line, p) {
    let h = line.matchAll(holder)
    for (const m of h) {
      line = line.replace(holderR, p.shift())
    }
    return line
  }*/
  
  return {
    list   : triggers,
    make   : make,
    update : update,
    match  : match,
    prefix : prefix,

    remove    : remove,
    deactivate: deactivate,
    activate  : activate,

    ignore : function(v) { if (typeof v != 'undefined') { ignore  = v }; return ignore  },
    matched: function(v) { if (typeof v != 'undefined') { matched = v }; return matched },
    modify : function(v) { if (typeof v != 'undefined') { modify  = v }; return modify  },
    instructions: function(v) { if (typeof v != 'undefined') { instructions = v }; return instructions },

    prettify: _prettify,
    sub     : _substitution,
    subg    : _subglobal,
    append  : _append,
    replace : _replace,
    
    stats   : function() {
      console.log('Matched triggers to placeheld lines: ' + _F)
      console.log('Matched triggers only to raw lines:  ' + _G)
    }
  }
})()


/*
  var _subglobal = function(options) {
    console.log(options)
  
    if (typeof matches.input == 'string') {
      var a = matches.input.substring(matches.prior, matches.index)
      if (a) {
        matches.string += a + options.output
      } else {
        matches.string += options.output
      }
      matches.instruction = 'subg'
    }
  }
 */
