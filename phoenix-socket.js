var PhoenixSocket = function(params) {
  window.ENV = window.ENV || {};
  params = params || {};
  ENV.Phoenix = {};

  ENV.Phoenix.endpoint = params.endpoint || location.protocol.match(/^https/) ? "wss://" + location.host + "/ws" : "ws://" + location.host + "/ws";
  ENV.Phoenix.appName = params.appName || 'App';
  ENV.Phoenix.storeName = params.storeName || 'DS';
  ENV.Phoenix.init = params.init || {doInit: true, channel: 'data', topic: 'data', params: null};


var DS = window[ENV.Phoenix.storeName],
   App = window[ENV.Phoenix.appName];

App.Phoenix = {};

App.Phoenix.Socket = Ember.Controller.extend({
  socket: null,
  topics: null,
  init: function() {
    this.set('topics', Ember.Map.create())

    var sock = new Phoenix.Socket(ENV.Phoenix.endpoint);
    sock.onClose = this.get('handleClose').bind(this);
    this.set('socket', sock);
  },
  addTopic: function(channel, topic, message, callback) {
    var topicKey = channel + ":" + topic;

    if (this.get('topics').get(topicKey)) {
      callback(this.get('topics').get(topicKey), true);
    } else {
      this.get('socket').join(channel, topic, message || {}, this.get('handleAddTopic').bind(this, topicKey, callback));
    }
  },
  handleAddTopic: function(topicKey, callback, channel) {
    channel.on("join", function(res) {
      this.get('topics').set(topicKey, channel);
      callback(channel, res)
    }.bind(this))
    channel.on("error", function(res) {
      callback("error", res)
    })
  },
  handleClose: function() {
    console.log('connection closed')
  }
})

App.Phoenix.Channel = DS.PhoenixSocketAdapter = DS.RESTAdapter.extend({
  needs: ['phoenix', 'session'],
  _channel: null,
  _topic: null,
  _initialized: false,
  _transactions: {},
  _socket: null,
  setSocket: function(channel, topic) {
    this.set('_channel', channel);
    this.set('_topic', topic);
  },
  join: function(params) {
    var txn = App.Phoenix.Transaction.create({params: params})
    this.container.lookup('service:phoenix').addTopic(
      this.get('_channel'),
      this.get('_topic'),
      params,
      this.get('onJoin').bind(this, txn)
    )
    return txn.promise;
  },
  onJoin: function(promise, chan, res) {
    if (res.success) {
      chan.on(this.get('_topic'), this.get('onData').bind(this));

      this.set('_socket', chan);
      this.set('_initialized', true);

      this.get('unloadQueue').call(this);

      promise.success(res);
    } else {
      promise.error(res);
    }
    promise.destroy();
  },
  onData: function(data) {
    var caller = this.get('_transactions')[data.uuid];

    if (data.success) {
      caller.success(data.message)
    } else {
      caller.error(data.message)
    }

    caller.destroy();
    delete caller;
  },
  unloadQueue: function() {
    var txns = this.get('_transactions');

    for (var uuid in txns) {
      this.get('_socket').send(this.get('_topic'), txns[uuid].payload());
    }
  },
  ajax: function(url, type, params) {
    var uuid = App.Phoenix.Utils.generateUuid();
    var txn = this.get('_transactions')[uuid] = App.Phoenix.Transaction.create({uuid: uuid, url: url, type: type, params: params})

    if (this.get('_initialized'))
      this.get('_socket').send(this.get('_topic'), txn.payload());
    else
      this.get('join').call(this, {})

    return txn.promise;
  }
})

App.Phoenix.Transaction = Ember.Object.extend({
  uuid: null,
  url: null,
  type: null,
  params: null,
  promise: null,
  success: null,
  error: null,
  init: function() {
    var promise = new Ember.RSVP.Promise(function(resolve, reject) {
      this.set('success', function(json) {
        Ember.run(null, resolve, json);
      });
      this.set('error', function(json) {
        Ember.run(null, reject, json);
      })
    }.bind(this))
    this.set('promise', promise);
  },
  payload: function(url, type, params) {
    return {uuid: this.get('uuid'), type: this.get('type'), params: this.get('params'), path: this.get('derivePath').call(this) }
  },
  derivePath: function() {
    return this.get('url').replace(this.host, "");
  }
})

App.Phoenix.Utils = {
  generateUuid: function() {
    var date = new Date().getTime();
    var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(character) {
      var random = (date + Math.random() * 16) % 16 | 0;
      date = Math.floor(date/16);
      return (character === "x" ? random : (random & 0x7 | 0x8)).toString(16);
    });
    return uuid;
  }
}

Ember.onLoad('Ember.Application', function(Application) {
  Application.initializer({
    name: 'phoenix',
    initialize: function(container, application) {
      application.register('service:phoenix', App.Phoenix.Socket, {singleton: true})

      App.ApplicationAdapter = DS.PhoenixSocketAdapter;

      if (ENV.Phoenix.init.doInit) {
        container.lookup('adapter:application').setSocket(ENV.Phoenix.init.channel, ENV.Phoenix.init.topic);
        container.lookup('adapter:application').join(ENV.Phoenix.init.params)
      }
    }
  })
})

}