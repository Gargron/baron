Baron
=====

Baron is a WebRTC-based web application that allows people to have peer-to-peer text, audio and video conversations with permanent accounts and contact lists.

The back-end is written in JavaScript (Node.js), the signaling channel uses Socket.io. The front-end is written in Ember.js. Authentication is done using Mozilla Persona.

Currently a work in progress.

Configuration
-------------

Some configuration is stored in environmental variables. Database-related configuration is stored in the database.json file in the root of the application. Here is an overview:

* `BARON_SECRET` - no default, cookie secret
* `BARON_PORT` - `3000` by default, port under which NodeJS is run
* `BARON_AUDIENCE` - Address of publically accessible website (required for Mozilla Persona verification)
* `BARON_SOCKET_AUDIENCE` - Address of publically accessible socket.io instance, fallback to `BARON_AUDIENCE`
* `BARON_ENV` - database environment to use, default is `dev`

The database.json file ought to look like this:

```json
{
  "dev": {
    "driver": "pg",
    "user": "baron",
    "password": "some-password",
    "host": "127.0.0.1",
    "database": "baron"
  }
}
```

Contributing
------------

We are using ember-tools to generate Ember modules and compile them into the final JavaScript file. You'll need to install ember-tools:

    npm install -g ember-tools

And whenever you want to make changes to the front-end, you can run this:

    ember build -w

to watch the front-end files for changes and rebuild automatically. See the ember-tools documentation for more information.
