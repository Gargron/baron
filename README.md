Baron
=====

Baron is a WebRTC-based web application that allows people to have peer-to-peer text, audio and video conversations with permanent accounts and contact lists.

The back-end is written in JavaScript (Node.js), the signaling channel uses Socket.io. The front-end is written in Ember.js. Authentication is done using Mozilla Persona.

Currently a work in progress.

Contributing
------------

We are using ember-tools to generate Ember modules and compile them into the final JavaScript file. You'll need to install ember-tools:

    npm install -g ember-tools

And whenever you want to make changes to the front-end, you can run this:

    ember build -w

to watch the front-end files for changes and rebuild automatically. See the ember-tools documentation for more information.
