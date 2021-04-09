
String.prototype.toProperCase = function () {
  return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

Utilities = (function() {
  // Shorthand for commonly used functions & for ease of maintainence
  let scroll, print;
  let ready = function() {
    scroll = Core.scroll
    print  = Core.print
  }
 
  let _clean = /[^-\d\.]/g
  let clean  = function(n) {
     if (typeof n !== 'string') { return n }
     let x = Number(n.replace(_clean,''))
     return x }

  let clone = function(obj) {
     var copy;
     if (null == obj || 'object' != typeof obj) { return obj }
     if (obj instanceof String) { return (' ' + obj).slice(1) } // https://stackoverflow.com/a/31733628
     if (obj instanceof Date) { 
       copy = new Date()
       copy.setTime(obj.getTime())
       return copy }
     if (obj instanceof Array) {
       copy = []
       for (var i = 0, len = obj.length; i < len; i++) { copy[i] = clone(obj[i]) }
       return copy }
     if (obj instanceof Object) {
       copy = {}
       for (var attr in obj) { if (obj.hasOwnProperty(attr)) { copy[attr] = clone(obj[attr]) } }
       return copy }
     throw new Error('Unable to copy object! Type not supported.') }

  /* https://stackoverflow.com/a/2901298 */
  let _comma = /\B(?=(\d{3})+(?!\d))/g
  let comma  = function(x) {
     let parts = x.toString().split('.')
     parts[0] = parts[0].replace(_comma, ',')
     return parts.join('.') }

  let display = function(a) {
     let r = function(k, v) {
       if (typeof v === 'function') {
         var q = '' + v
             q = q.substring(0, 79)
         return 'FUNCTION >>  ' + q 
       }
       return v }
     let x = JSON.stringify(a, r, 3)
     print('<span class="normal">' + x + '</span><br/>')
     scroll() }

  let interval = function(a,b) {
     if (!a) { return 0 }
     var a = a
     var b = b || new Date()
     if (b > a) { b = [a, a = b][0] } // swap variable contents
     let diff  = a.getTime() - b.getTime()
     let msecs = diff % 1000
     let secs  = Math.floor(diff / 1000)
     let mins  = Math.floor(secs / 60)
         secs  = secs % 60
     let hrs   = Math.floor(mins / 60)
         mins  = mins % 60
     let days  = Math.floor(hrs  / 24)
          hrs  =  hrs % 24
     let s = {}
         s.msecs = msecs
         s.secs  = secs
         s.mins  = mins
         s.hrs   = hrs
         s.days  = days
     return s }

  let key = function(arr, v) {
     for (var prop in arr) {
       if (arr.hasOwnProperty(prop)) {
         if (arr[prop] === v) {
           return prop } } } }

  let lpad = function(str, len, ch) {
     if (typeof str == 'number') { str = str.toString() }
     if (ch == null) { ch = ' ' }
     let r = len - str.length
     if (r < 0) { r = 0 }
     return ch.repeat(r) + str }

  let random = function(ceiling, min) {
     if (min && min > ceiling) { [ceiling, min] = [min, ceiling] }
     let c = ceiling || 1
     let m = min     || 0
     return (c - m) * Math.random() + m }

  let round = function(num, dec) {
     let mult = 10 ^ (dec || 0) 
     return Math.floor(num * mult + 0.5) / mult }

  let round2 = function(num, scale) {
     if (!('' + num).includes('e')) {
       return + (Math.round(num + 'e+' + scale) + 'e-' + scale)
     } else {
       let arr = ('' + num).split('e')
       let sig = ''
       if (+arr[1] + scale > 0) { sig = '+' }
     return + (Math.round(+arr[0] + 'e' + sig + (+arr[1] + scale)) + 'e-' + scale) } }

  let rpad = function(str, len, ch) {
     if (typeof str == 'number') { str = str.toString() }
     if (ch == null) { ch = ' ' }
     let r = len - str.length
     if (r < 0) { r = 0 }
     return str + ch.repeat(r) }

  /* https://stackoverflow.com/a/27645164 */
  let sortBy = function(field, reverse, primer) {
     let key = primer ? 
         function(x) {return primer(x[field]); }:
         function(x) {return x[field] };
     reverse = [-1, 1][+!!reverse];
     return function (a, b) {
         a = key(a);
         b = key(b);
         return a==b ? 0 : reverse * ((a > b) - (b > a)); //^ Return a zero if the two fields are equal!
     } }
  
  let sortChain = function(arr) {
     return function(a, b) {
       for (var i = 0, len = arr.length; i < len; i++) {
         let r = arr[i](a, b)
         if (r != 0) { return r }
       }
       return 0
     } }

  let stringToObject = function(parent, str, type) {
     type = type || "object";  // can pass "function"
     let arr = str.split(".");
     /*
        There should be a better way to do this, perhaps assuming window. is the Global
      */
     let fn = gmcp || {}; //  global
     for (var i = 0, len = arr.length; i < len; i++) {
       fn[arr[i]] = fn[arr[i]] || {}
       fn = fn[arr[i]];
     }
     if (typeof fn !== type) { throw new Error(type +" not found: " + str) }
     return fn }

  /* https://stackoverflow.com/a/29426078 */
  let subarray = function(arr, subarr, from_index) {
     var i = from_index >>> 0, sl = subarr.length, l = arr.length + 1 - sl;
     loop: for (; i<l; i++) {
       for (var j = 0; j < sl; j++) { if (arr[i+j] !== subarr[j]) { continue loop }; return i }
     }
     return -1 }

  let _title = /\w\S*/g
  let title  = function(str) {
    return str.replace(_title, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}); }

  // https://stackoverflow.com/a/1584377
  let uniarray = function(arr) {
     let a = arr.concat()
     for (var i = 0, len = a.length; i < len; ++i) {
       for (var j = i + 1; j < len; ++j) {
         if (a[i] === a[j]) {
           a.splice(j--, 1) } } }
    return a }

  let uuid = function() {
     let d = new Date().getTime()
     if (window.performance && typeof window.performance.now === 'function') {
       d += performance.now() }
     let uid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(v) {
       let r = (d + Math.random() * 16) % 16 | 0
       d = Math.floor(d / 16)
       return (v == 'x' ? r : ( r&0x3|0x8)).toString(16) })
     return uid }

  // https://stackoverflow.com/a/6248722
  let uuidShort = function() {
     let firstPart = (Math.random() * 46656) | 0;
     let secondPart = (Math.random() * 46656) | 0;
     firstPart = ("000" + firstPart.toString(36)).slice(-3);
     secondPart = ("000" + secondPart.toString(36)).slice(-3);
     return 'QO-' + firstPart + secondPart }

  /*
  let receive = Engine.receive
  let prompt  = 
  let wtest = function(str) {
     let t = str.split(/\+n/g)
     for (var k in t) {
       var v = t[k]
           v = v + '\n'
       var a = v.split('')
       for (var i = 0, len = a.length; i < len; i++) { a[i] = a[i].charCodeAt(0) }
       a.push(255)
       a.push(249)
       var f  = []
       f.data = a
       receive(f) }
     prompt() }
  } */
 
  return {
   ready    :  ready, // Don't touch

   clean    :  clean,
   clone    :  clone,
   commaThis:  comma,
   display  :  display,
   interval :  interval,
   key      :  key,
   lpad     :  lpad,
   random   :  random,
   round    :  round,
   round2   :  round2,
   rpad     :  rpad,
   sortBy   :  sortBy,
   sortChain:  sortChain,
   stringToObject:  stringToObject,
   subarray :  subarray,
   title    :  title,
   uniqueA  :  uniarray,
   uuid     :  uuid,
   uuids    :  uuidShort,
  }
})()

clone       = Utilities.clone
// dateSep     = Utilities.interval
display     = Utilities.display
// echoCommand = Utilities.pecho
Qround      = Utilities.round2
uniqueArray = Utilities.uniqueA
subarray    = Utilities.subarray
// uuid        = Utilities.uuid
