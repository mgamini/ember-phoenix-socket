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
PhoenixSocket();
```

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

## Connecting to Phoenix
For an example of a Phoenix app configured to work with this, check out [Phember](https://github.com/mgamini/phember).