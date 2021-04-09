
Preloader = (function() {
  let list = [
   './core/Utilities.main.js',
   './core/Client.draw.js',
   './core/Client.main.js',
   './core/Core.js',
   './core/Engine.js',
   './core/Input.js',
   './core/Triggers.js',
   './core/Events.js',


   './core/GMCPHandler.js', // game-specific, developer to implement

  ]
  let cssList = [
   'core/rules.Main.css',
   'core/rules.Colors.css',
   'core/rules.Panel.css',
  ]
  
  /* Script Preloading */
  let inProgress  = false
  let verbose     = false
  let count       = 0
  let iteration   = []
  let performance = new Date()
  
  let callback = function() {
    if (verbose && $('#output').length) { $('#output').append('<span class="mute"> success.</span>') }
    count++
    reload()
  }
  
  let reload = function() {
    var copy = function(thing) { var out; if (null == thing || 'object' != typeof thing) return thing; if (thing instanceof Date) { out = new Date(); out.setTime(thing.getTime()); return out }; if (thing instanceof Array) { out = []; for (var i=0;i<thing.length;i++) { out[i] = copy(thing[i]) }; return out }; if (thing instanceof Object) { out = {}; for (var attr in thing) { if (out.hasOwnProperty(attr)) { out[attr] = copy(thing[attr]) } }; return out }; throw new Error('Unable to copy thing! Type not supported.'); }
    var load = function(url) { var s = $('<script>', {'type':'text/javascript','src':url,})[0]; document.getElementsByTagName('head')[0].appendChild(s); }
    var rpad = function(str,len,char) { if (typeof str =='number') { str = str.toString() }; if (char == null) { char = ' ' }; var r = len - str.length; if (r < 0) { r = 0 }; return str + char.repeat(r); }

    var head = document.getElementsByTagName('head')[0]
    var vlist = copy(list)
    var o = $('#output')
    var L = o.length
    
    if (!inProgress) {
      inProgress = true
      
      let uri = window.location.protocol + '//' + window.location.host + window.location.pathname
          uri = uri.replace(/\/[^\\\/]+?\.html/,'/core')
      
      var styles  = head.getElementsByTagName('style')
      var scripts = head.getElementsByTagName('script')
      var links = head.getElementsByTagName('link')
      var i;
      // i = styles.length;  while(i--) { styles[i].parentNode.removeChild(styles[i])   } // this will delete fast style loads for ACE and others
      i = links.length;   while(i--) { links[i].parentNode.removeChild(links[i])     }
      i = scripts.length; while(i--) {
        if (scripts[i].src.match(uri)) {
          scripts[i].parentNode.removeChild(scripts[i])
        }
      }
      head.appendChild($('<link>',{'rel':'icon','type':'image/png','href':'./core/resources/icon.png'})[0])
    }
    if (iteration.length === 0) { 
      iteration = copy(vlist)
      performance = new Date()
      if (L) { o.append('<span class="mute">Loading client dependencies ') }
    }
    if (count >= iteration.length) {
      complete()
      inProgress = false
      var t = new Date() - performance
      if (L) { o.append('<span class="mute"> complete. ( <span class="link">' + t + '</span>ms)</span><br >')}
      count = 0
      iteration = []
      return 
    }
    var addr = iteration[count]
    var elem = document.createElement('script')
        elem.src = addr + '?' + Math.random()
        elem.onload = callback
        elem.onerror = function() {
          console.log('Error loading: ' + this.src)
          if (verbose && o.length) { o.append('<span class="darkred"> error.</span>') }
        }
    head.appendChild(elem)
    if (verbose) {
     if (L) { o.append('<br ><span class="mute">Loading core <i>j</i> <span class="normal">' + rpad(addr,30) + '</span></span>') }
    } else {
     if (L) { o.append('<span class="normal">.') }
    }
    if (L) { // !important
      fastdom.measure(function() { var h = document.getElementById('output').scrollHeight;
        fastdom.mutate(function() { o.scrollTop(h) })
      })
    }
  }
  
  /* CSS Preloading */
  let CSSLoad = function(href) {
    var css = $('<link>', {
      'rel'   : 'stylesheet',
      'type'  : 'text/css',
      'href'  : href + '?' + Math.random(),
    })[0]
    document.getElementsByTagName('head')[0].appendChild(css)
  }
  let CSSReload = function() {
    for (var i = (cssList.length - 1); i > -1; i--) {
      CSSLoad(cssList[i])
    }
  }

  let run = function() {
    // It is not strictly necessary to do this, but to release reference to the prior modules may be important in Garbage Collection
    // we do not delete Core, it is written specifically not in a module so that we can pass the _handler
    delete Utilities
    delete Client
    delete Engine
    delete Input
    delete Events
    delete GMCPHandler
    delete Aliases
    delete Triggers
    delete Coding

    $('body').off('gmcp')

    reload()
    CSSReload()
  }

  let ready = false
  let complete = function() {
    if (Core && ready) {
      Core.preloader()
      Core.scroll()
    }
  }
  
  return {
    JSReload : reload,
    CSSReload: CSSReload,
    run      : run,
    ready    : function(v) { ready = v; return v },
    complete : complete,
  }
})()

Preloader.run()
