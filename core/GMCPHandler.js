gmcp = typeof gmcp != 'undefined' ? gmcp : {}

GMCPHandler = (function() {
  let clone       = Utilities.clone
  let $body       = $('body')
  let _parsedGMCP = 'GMCP-Parsed'
  let sendServer  = function(arr) { Core._handler.send(new Uint8Array(arr)) }
  
  let payload = [];
  let $ping, ping;

  let ready = function() {
    $body.off(_parsedGMCP).on(_parsedGMCP, handleGMCP)
    $ping = $('#subpanel-ping')
     ping = document.getElementById('subpanel-ping')
  }
  
  let handleGMCP = function(e,v) {
    // console.log(v)
    if (Core._ping && v.key == 'Core.Ping') {
      let now = new Date().getTime()
      let delta = now - Core._ping
      fastdom.mutate(function() { ping.textContent = delta })
      Core._ping = false
    }
    // handle some sub-band flags
    if (v.key == 'Comm.Channel.Start') {
      payload = []
      Engine._band(true)
    } else if (v.key == 'Comm.Channel.End') {
      payload = Engine._band(false)
    }

    // custom
    parseGMCP(e,v)
  }
  
  let IRE_list = [
    'Core.Supports.Set [ "Char 1", "Char.Skills 1", "Char.Items 1", "Ping" ]',
    'Core.Supports.Add [ "Comm.Channel 1", "IRE.Rift 1", "Room 1", "IRE.Display 1" ]',
    'Char.Items.Inv',
    'IRE.Rift.Request',
  ]
  
  let requestGMCP_IRE = function() {
    let li = clone(IRE_list)
    for (var i = 0; i < li.length; i++) {
      let m = [].concat.apply([255,250,201], li[i].split('').map(function(v) { return v.charCodeAt(0) }))
          m = [].concat.apply(m, [255,240])
      console.log('~ Attempting GMCP Request: => ' + li[i] + ' <=', 3)
      sendServer(m) 
    }
  }
  
  // Custom Handling
  let gRegex = /^(.*?)\s/
  let cRegex = /.*?\s(.*)/
  let pRegex = /^(.*?)\s/
  let parseGMCP = function(e,v) {
    if (v.key == 'Room.Players')      { gmcp.Room = gmcp.Room || {}; gmcp.Room.Players = {} }
    if (v.key == 'Room.AddPlayer')    { gmcp.Room = gmcp.Room || {}; gmcp.Room.AddPlayer = {} }
    if (v.key == 'Room.RemovePlayer') { gmcp.Room = gmcp.Room || {}; gmcp.Room.RemovePlayer = {} }
    if (v.key == 'IRE.Rift.List')     { gmcp.IRE  = gmcp.IRE  || {}; gmcp.IRE.Rift = {} }
    if (v.key == 'Char.Items.List')   { gmcp.Char = gmcp.Char || {}; gmcp.Char.Items = {} }
    let m    = Utilities.stringToObject(gmcp, v.key)
    let data = v.data ? JSON.parse(v.data) : ''
    for (var k in data) { m[k] = data[k] }
    $body.trigger('gmcp', {key: v.key, data: data})
  }

  return {
    ready  : ready,
    handler: handleGMCP,
    
    requestIRE: requestGMCP_IRE,
    payload: function() { return payload },
  }
})()
