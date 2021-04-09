// Replace these when ready

Events = (function() {
  var reset = function() {
    $('body')
      .off('connect')
      .off('reload')
  }

  var setup = function() {
    /* Basic Interface */
    $('body')
      .off('Core-connect').on('Core-connect', function() {
        Core.tryConnect(arguments)
      })
      .off('Core-reload').on('Core-reload', function() {
        Preloader.run()
      })
      .off('GMCP-Ready').on('GMCP-Ready', function() {
        GMCPHandler.requestIRE()
      })
      .off('disconnected').on('disconnected', function() {
        Core.closedown(arguments[2])
        Engine.reset()
        Client.disconnected()
      })
      .off('Engine-Performance').on('Engine-Performance', function(e,v) {
        let now = new Date().getTime()
        let delta = now - v
        fastdom.mutate(function() { document.getElementById('subpanel-performance').textContent = delta })
      })
      .off('Aliases-show').on('Aliases-show', function() {
        Aliases.show()
      })
      // Pure UI functions
      .off('connecting').on('connecting', function() {
        Client.connecting()
      })
      .off('connected').on('connected', function() {
        Client.connected()
      })
      .off('connection-existing').on('connection-existing', function() {
        Client.existing()
      })

    // UI Incoming
    // UI Outgoing

    /* QO Core Events
    $('body')
      .on('connecting', function() {

      })
      .on('connected', function() {

      })
     */
  }

  return {
    reset: reset,
    setup: setup,
  }
})()
