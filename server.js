var cloak = require('cloak');
var _ = require('underscore');

cloak.configure({
  port: 8090,
  roomLife: 1000*60*60*3,

  autoJoinLobby: false,
  minRoomMembers: 1,
  pruneEmptyRooms: 1000,
  reconnectWait: 3000,

  messages: {
    registerUsername: function(arg, user) {
      var users = cloak.getUsers();
      var username = arg.username;
      console.log(username);
      var usernames = _.pluck(users, 'username');
      var success = false;
      if (_.indexOf(usernames, username) === -1) {
        success = true;
        user.name = username;
        console.log('creating user');
      }
      user.message('registerUsernameResponse', success);
    },

    joinLobby: function(arg, user) {
      cloak.getLobby().addMember(user);
      user.message('joinLobbyResponse');
    },

    listUsers: function(arg, user){
    	console.log('sending users to client..');
    	var users = cloak.getUsers();
	    var usernames = _.pluck(users, 'name');
    	user.message('listUsersResponse',{'data' : usernames})
    }
  }
});

cloak.run();
