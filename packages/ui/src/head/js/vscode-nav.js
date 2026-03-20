// Notify parent window (VS Code webview) on SPA navigation.
// Patches pushState/replaceState and listens for popstate.
var op=history.pushState,or=history.replaceState;function n(){window.parent.postMessage({type:'zpress:navigate',path:location.pathname},'*')}history.pushState=function(){op.apply(this,arguments);n()};history.replaceState=function(){or.apply(this,arguments);n()};window.addEventListener('popstate',n);n()
