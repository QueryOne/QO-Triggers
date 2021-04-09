/* Engine */
Engine = (function(){
  /*
     receive(datastream) => interpret(buffer) => parse(datum) => (Client.)format(arr) => print
   */

  // Utility
  let sendServer  = function(arr) { Core._handler.send(new Uint8Array(arr)) }
  let print       = Core.print
  let scroll      = Core.scroll
  let rescind     = Core.buffer
  let format      = Client.format
  let clone       = Utilities.clone

  // Definitions
  let $body       = $('body')
  let _readyGMCP  = 'GMCP-Ready'
  let _heardGMCP  = 'GMCP-Receive'
  let _parsedGMCP = 'GMCP-Parsed'
  // Define a marker for GMCP in the datastream
  let _pointerGMCP = 160 // 211
  
  let _debug       = true
  var _performance = false

  // Handle sub band data
  let _exclusive   = false
  let _subprotocol = false
  let _subdata     = []

  // As using jQuery events increases processing time, unfortunately, we hook up other external functions in ready() but pre-allocate them here
  let handleGMCP;
  let output;

  // Metrics
  let _packets     = 0
  let _lineCount   = 0
  let memory       = []
  
  // Debugging
  let _bug = true
  let _bid = 3 
  let _scr = false
  let _log = function(msg, threshold) {
     if (!_bug) { return }
     let T = threshold || 5
     let B = _bid || 3
     if (T <= B) {
       console.log(msg)
       if (_scr) {
         // cprint('<span class="red">' + msg + '</span><br/>')
         // documentFragment required for Pure Javascript
       }
     }
  }
  
  // Handle some behaviours, definitions further down
  let ready = function() {
    /* jQuery version */
    // $body.on(_readyGMCP, requestGMCP)
    // $body.on(_heardGMCP, parseGMCP)
    /* Pure Javascript version */
    handleGMCP = GMCPHandler.handler
    output = document.getElementById('output')
  }

  // Telnet Protocol Negotiation
  let _oobn = 0
  let _sets = { // Label, Query, Response, Employ
      25: {L:'EOR',   Q:[], R: [], E: true  },
      86: {L:'MCCP2', Q:[], R: [], E: false },
     200: {L:'ATCP',  Q:[], R: [], E: false },
     201: {L:'GMCP',  Q:[], R: [], E: true  },
      24: {L:'TT',    Q:[], R: [], E: false },
    }
  let reset = function() { _oobn = 0 }
  let negotiate = function(controlCharacter, request) {
    // Reject any unknown protocol
    let v = _sets[controlCharacter]
    if (!v) { sendServer([255,254,controlCharacter]); return }

    // Reject any protocol we see for the first time
    // Receive the agreed rejection of any given protocol
    // Request protocols we want only after rejecting the server's request
    
    let r = request || 251 // assume the request was IAC-WILL if not supplied
    let query = v.Q
    if (query.length == 0) {
      let reply = [255, r === 251 ? 254: 252, controlCharacter]
      v.Q = reply
      sendServer(reply)
    } else if (request === 252 && query[1] === 254) {
      v.R = [255,request,controlCharacter]
      if (v.E) {
        let u = [255,253,controlCharacter]
        v.Q = u
        sendServer(v.Q)
      }
    }

    // Except GMCP, most MUDs don't even bother replying with agreed refusal... boooooo

    // Simply because MUDs don't reply to GMCP negotiations (rejections), we will request GMCP only after we reject it once
    // Yes, it's more complicated than it should be but MUDs not implementing the closed loop
    //   weirdly just specifically for GMCP means we cannot simply wipe the slate clean and request everything we want

    // We end up rejecting and proposing GMCP in the same breath.

    // Fucking Achaea/MUDs.

    if (controlCharacter === 201) {
      if (v.Q[1] === 253) {
        _oobn = 1
        /* jQuery events */
        // $body.trigger(_readyGMCP)
        /* Pure Javascript */
        requestGMCP()
      } else if (_oobn === 0) {
        v.Q = [255,253,201]
        sendServer(v.Q)
      }
    }
    _sets[controlCharacter] = v
    _log(_sets)
  }

  // Main Receive() function
  let _buffer = []
  let receive = function(e) {
    let datum = new Uint8Array(e.data)
    var GA = false
    for (var i = 0, len = datum.length; i < len; i++) {
      var C = datum[i]; var C0 = datum[i + 1] || null;
      if (C === 255 && (C0 === 239 || C0 === 249)) {
        output.style.willChange = 'scroll-position, contents'
        interpret(_buffer)
        _buffer.length = 0 // _buffer = []
        scroll()
        output.style.willChange = 'auto'
      } else { _buffer.push(C) }
    }
    _packets++
  }
  let close = function() {
    interpret(_buffer)
    scroll()
    _packets++
  }
  
  let decode  = function(v) { return String.fromCharCode(v) }
  let interpret = function(datum) {
    _log(datum)
    _performance = new Date().getTime()

    let worksheet = []
    let outOfBand = []
    let oobBackup = []
    // let datumLength = datum.length

    let innerState = 0
    for (var i = 0, datumLength = datum.length; i < datumLength; i++) {
      let C = datum[i]
      if (C === 255) {
        innerState = 1
      } else if (innerState === 1) {
        if (C === 249 || C === 239) {
          innerState = 0
        } else if (C === 253) { // IAC-DO
          innerState = 2
        } else if (C === 251) { // IAC-WILL 
          innerState = 3
        } else if (C === 250) { // !important, IAC-SB (Subnegotiation)
          innerState = 4
        } else if (C === 240) { // !important, IAC-SE (End subnegotiation)
          innerState = 5
        } else if (C === 252) { // IAC-WONT
          innerState = 6
        }
      } else if (innerState === 2 || innerState === 3) { // Requests
        innerState = 0
        // var accept = innerState == 2 ? 251 : 253 // reply DO(253) >> WILL(251), WILL(251) >> DO(253)
        // var refuse = innerState == 2 ? 252 : 254 // reply DO(253) >> WONT(252), WILL(251) >> DONT(254)
        _log('~Received request: IAC-' + (innerState == 2 ? 'DO' : 'WILL') + '-' + C, 1)
        negotiate(C, innerState == 2 ? 253 : 251)
      } else if (innerState === 4) {
        outOfBand.push(C)
      } else if (innerState === 5) { // See below, this never gets fired, which is appropriate
      } else if (innerState === 6) {
        innerState = 0
        negotiate(C, 252)
      } else {
        if (!_exclusive) { worksheet.push(C) } // potential errors
        if (_subprotocol) { _subdata.push(C) }
      }
   
      // Fire completion of subprotocol immediately
      if (innerState == 5) {
        innerState = 0
        if (outOfBand[0] === 201) {
          outOfBand.shift()
          let b = outOfBand.map(decode)
          oobBackup.push(b)
          /* jQuery version */
          // $body.trigger(_heardGMCP, [b]) // yes, it's weird, you need to wrap the data in an Array
          /* Pure Javascript version */
          parseGMCP(null, [b])
        }
        // You can handle other Out-Of-Band protocols here if necessary

        // _log(outOfBand.map(function(c) { return {o: c, e: String.fromCharCode(c) }}), 7)
        outOfBand = []
        // We put in a marker to tell us where an Out-Of-Band packet was received in the chronological order; remember to ignore it on print
        worksheet.push(_pointerGMCP)
      }
    }
    let s = parse(worksheet)
        s = format(s)
    // This can be a string or a documentFragment depending on the implementation of format()
    print(s)
    
    rescind()
    if (_performance) {
      $body.trigger('Engine-Performance', [_performance]) // performant()
      _performance = false
    }

    if (_debug) {
      memory.push({raw:datum, printed:s, ws: worksheet, oob: oobBackup})
      if (memory.length > 800) { memory.shift() }
    }
  }

  let parse = function(arr) {
    let state = {
      shown  : true,
      mode   : '',
      current: [],
      stream : [],
      output : [],
    }

    let P;
    for (var i = 0, len = arr.length; i < len; i++) {
      let C = arr[i]
      if (state.shown) {
        if (C === 91 && P === 27) {
          state.shown = false
          state.mode  = '?'
          state.current.pop()
        } else if (C === 10 && P === 13) {
          state.current.pop()
          state.output.push(state.current)
          state.current = []
          _lineCount++
        } else {
          state.current.push(C)
        }
      } else {
        if (state.mode === '?') {
          if (C === 122 && P === 52) {
            state.mode   = 'z'
            state.stream = []
          } else if (C === 109) {
            state.current.push({type:'color', value:state.stream.join('')})
            state.shown  = true
            state.mode   = ''
            state.stream = []
          } else {
            state.stream.push(String.fromCharCode(C))
          }
        } else if (state.mode === 'z') {
          if (C ===  62) {
            state.stream.push(String.fromCharCode(C))
            state.current.push({type:'mxp', value:state.stream.join('')})
            state.shown  = true
            state.mode   = ''
            state.stream = []
          } else {
            state.stream.push(String.fromCharCode(C))
          }
        }
      }
      if (i === arr.length - 1) { state.output.push(state.current) }
      P = C
    }
    _log(state, 12)
    return state.output
  }

  // Handle some regular Out-Of-Band behaviours
  // Requesting desired GMCP modules after confirmation of GMCP support
  let requestGMCP = function() {
    let li  = [
      // 'Core.Hello {"client":"QueryOne","version":"2"}',
      'Core.Hello {"Client":"IRE-ChroMUD", "Version":"2.11pre"}', // we're gaining access to PATH TRACK
    ]
    for (var i = 0; i < li.length; i++) {
      let m = [].concat.apply([255,250,201], li[i].split('').map(function(v) { return v.charCodeAt(0) }))
          m = [].concat.apply(m, [255,240])
      _log('~ Attempting GMCP Request: => ' + li[i] + ' <=', 3)
      sendServer(m) 
    }
    $body.trigger('GMCP-Ready')
  }
  
  // Parse some regular GMCP data, we will only do assignment, let the dev implement Object initiation
  let gmcpCommand = /^(.+?)\s(.*)/
  let parseGMCP = function(e,v) {
    _log(v, 8)

    /* jQuery version */
    // let datum = v.join('')
    /* Pure Javascript version */
    let datum = v[0].join('')

    let match = datum.match(gmcpCommand)
    let command, value;
    if (match) {
      command = match[1]
      value   = match[2]
    } else {
      command = datum
    }
    /* jQuery version */
    // $body.trigger(_parsedGMCP, {key: command, data: value})
    /* Pure Javascript version */
    handleGMCP(null, {key: command, data: value})
  }

  let subprotocol = function(v, exclusive) {
    if (typeof exclusive != 'undefined') { _exclusive = exclusive } // cannot assume [1] exists even if [2] does; subprotocol(undefined, false)
    if (typeof v != 'undefined') {
      _subprotocol = v       
    }
    var u = Utilities.clone(_subdata)
    _subdata = []
    return u
  }

  return {
    ready  : ready,
    receive: receive,
    close  : close,
    reset  : reset,
    debug  : function(v) { if (typeof v != 'undefined') { _debug = v }; return _debug },
    memory : function() { return memory },
    metrics: function() { return [_packets, _lineCount] },

    _band  : subprotocol,
  }
})()
