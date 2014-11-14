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
PhoenixSocket({
// Options go here
});
```

By default, Ember-phoenix-socket is configured to join a channel of 'session' and a topic of 'data', which it attaches to your Ember data store.

## Options
PhoenixSocket takes three options:
```javascript
{
    endpoint: "wss://Whateverhost.com/ws",
    appName: 'App',
    storeName: 'DS'
}
```
Defaults are set to:

```javascript
{
    endpoint: location.protocol.match(/^https/) ? "wss://" + location.host + "/ws" : "ws://" + location.host + "/ws",
    appName: 'App',
    storeName: 'DS'
}
```

## Custom Channels
Adding custom channels is pretty easy. Here's an example of a custom channel being initialized:
```javascript
// adding an "events" channel

Ember.onLoad('Ember.Application', function(Application) {
  Application.initializer({
    name: 'events',
    initialize: function(container, application) {

      application.register('service:events', App.Phoenix.Channel, {singleton: true})
      application.inject('controller', 'service:events', 'service:events');

      container.lookup('service:events').setSocket('session','events');
    }
  })
})

```
Custom channels will adhere to the same API that Ember uses when it queries the store, namely requests being made up of `url, type, params`, and returning a promise. Quick example:
```javascript
container.lookup('service:events').ajax('/events', 'GET', {eventName: "stuff"}).then(function(result) { console.log(result) }))
```

## Connecting to Phoenix
For an example of a Phoenix app configured to work with this, check out [Phember](https://github.com/mgamini/phember).
