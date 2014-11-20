# Ember-phoenix-socket
Connecting [Phoenix](https://github.com/phoenixframework) to [Ember](http://emberjs.com) (and EmberData) via websockets.

## Getting Started
Install via bower:
```
$ bower install --save ember-phoenix-socket
```
 Initialize the socket adapter:
```javascript
window.App = Ember.Application.create();

var options: {
  endpoint: "wss://Whateverhost.com/ws",
  appName: 'App',
  storeName: 'DS',
  init: {doInit: true, channel: 'data', topic: 'data', params: null}
}

PhoenixSocket(options);
```

By default, Ember-phoenix-socket is configured to join a channel of 'session' and a topic of 'data', which it attaches to your Ember data store.

## Options
PhoenixSocket takes four options (shown with their defaults):
```javascript
{
    endpoint: location.protocol.match(/^https/) ? "wss://" + location.host + "/ws" : "ws://" + location.host + "/ws",
    appName: 'App',
    storeName: 'DS'
    init: {doInit: true, channel: 'data', topic: 'data', params: null}
}
```

If `init.doInit` is set to `true`, PhoenixSocket will immediately attempt to connect to the socket with the given params. If you don't want any channels immediately, set `init: false`. If you want a default channel but don't want it to be joined immediately, set `{doInit: false}` with the rest of your params in the object.

## Custom Channels
Adding custom channels is pretty easy. Here's an example of a custom channel being initialized, and extended with a login method:
```javascript
// adding a "session" channel

App.Phoenix.Session = App.Phoenix.Channel.extend({
  isAuthenticated: false,
  login: function(params) {
    this.get('join')(params)
      .then(function(success) {
        this.set('isAuthenticated', true)
        console.log(success)
      }.bind(this), function(failure) {
        console.log(failure)
      }.bind(this))
  }
})


Ember.onLoad('Ember.Application', function(Application) {
  Application.initializer({
    name: 'session',
    initialize: function(container, application) {

      application.register('service:session', App.Phoenix.Session, {singleton: true})
      application.inject('controller', 'service:session', 'service:session');

      container.lookup('service:session').setSocket('session','session');
    }
  })
})

```

Custom channels will adhere to the same API that Ember uses when it queries the store, namely requests being made up of `url, type, params`, and returning a promise. Quick example:
```javascript
container.lookup('service:events').ajax('/events', 'GET', {eventName: "stuff"}).then(function(result) { console.log(result) }))
```

## Connecting to Phoenix
For an example of a Phoenix app configured to work with this, check out [Phember](https://github.com/mgamini/phember) (currently broken)